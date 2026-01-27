import { Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { 
  createConsumer, 
  createProducer, 
  TOPICS, 
  parseMessage, 
  produceMessage,
  disconnectKafka 
} from '../../kafka';
import { setWithTTL, getJSON, REDIS_KEYS } from '../../redis';
import { config } from '../../config';
import { createLogger, logMetrics, logEvent } from '../../utils/logger';
import { normalize, normalizeInverse, nowTimestamp, round } from '../../utils/helpers';
import { StationTelemetry, StationFeatures, NormalizedFeatures, GeoLocation } from '../../types';

const logger = createLogger('feature-service');

let consumer: Consumer;
let producer: Producer;

// Feature normalization constants (based on typical ranges)
const NORMALIZATION_RANGES = {
  waitTime: { min: 0, max: 60 },      // 0-60 minutes
  availability: { min: 0, max: 1 },    // 0-100%
  reliability: { min: 0, max: 1 },     // 0-100%
  distance: { min: 0, max: 50 },       // 0-50 km
  energyStability: { min: 0, max: 1 }, // 0-100%
};

/**
 * Calculate effective wait time
 * Formula: queueLength * avgServiceTime
 */
function calculateEffectiveWaitTime(telemetry: StationTelemetry): number {
  return telemetry.queueLength * telemetry.avgServiceTime;
}

/**
 * Calculate station reliability score
 * Formula: 1 - faultRate
 */
function calculateReliabilityScore(telemetry: StationTelemetry): number {
  return 1 - telemetry.faultRate;
}

/**
 * Calculate energy stability index
 * Formula: availablePower / maxCapacity
 */
function calculateEnergyStabilityIndex(telemetry: StationTelemetry): number {
  if (telemetry.maxCapacity === 0) return 0;
  return telemetry.availablePower / telemetry.maxCapacity;
}

/**
 * Calculate charger availability ratio
 * Formula: availableChargers / totalChargers
 */
function calculateChargerAvailabilityRatio(telemetry: StationTelemetry): number {
  if (telemetry.totalChargers === 0) return 0;
  return telemetry.availableChargers / telemetry.totalChargers;
}

/**
 * Calculate distance penalty (simulated with traffic factor)
 * In production, this would use actual ETA from mapping API
 */
function calculateDistancePenalty(eta: number, trafficFactor: number = 1.2): number {
  return eta * trafficFactor;
}

/**
 * Normalize features to 0-1 range
 */
function normalizeFeatures(
  effectiveWaitTime: number,
  chargerAvailabilityRatio: number,
  reliabilityScore: number,
  distancePenalty: number,
  energyStabilityIndex: number
): NormalizedFeatures {
  return {
    // For wait time and distance, lower is better (inverse normalize)
    waitTime: round(normalizeInverse(effectiveWaitTime, NORMALIZATION_RANGES.waitTime.min, NORMALIZATION_RANGES.waitTime.max), 4),
    // For availability, reliability, energy - higher is better
    availability: round(normalize(chargerAvailabilityRatio, NORMALIZATION_RANGES.availability.min, NORMALIZATION_RANGES.availability.max), 4),
    reliability: round(normalize(reliabilityScore, NORMALIZATION_RANGES.reliability.min, NORMALIZATION_RANGES.reliability.max), 4),
    distance: round(normalizeInverse(distancePenalty, NORMALIZATION_RANGES.distance.min, NORMALIZATION_RANGES.distance.max), 4),
    energyStability: round(normalize(energyStabilityIndex, NORMALIZATION_RANGES.energyStability.min, NORMALIZATION_RANGES.energyStability.max), 4),
  };
}

/**
 * Generate context-aware embeddings (simulated)
 * In production, this would use actual embedding models
 */
function generateContextEmbedding(features: NormalizedFeatures): number[] {
  // Simulated 8-dimensional embedding
  return [
    features.waitTime,
    features.availability,
    features.reliability,
    features.distance,
    features.energyStability,
    (features.waitTime + features.availability) / 2,
    (features.reliability + features.energyStability) / 2,
    (features.waitTime * features.reliability + features.availability * features.energyStability) / 2,
  ].map(v => round(v, 4));
}

/**
 * Engineer features from telemetry data
 */
async function engineerFeatures(telemetry: StationTelemetry): Promise<StationFeatures> {
  const startTime = Date.now();

  // Calculate raw features
  const effectiveWaitTime = calculateEffectiveWaitTime(telemetry);
  const stationReliabilityScore = calculateReliabilityScore(telemetry);
  const energyStabilityIndex = calculateEnergyStabilityIndex(telemetry);
  const chargerAvailabilityRatio = calculateChargerAvailabilityRatio(telemetry);
  
  // Simulated distance penalty (would come from user context in real system)
  const distancePenalty = calculateDistancePenalty(10, 1.2); // 10 min ETA with traffic

  // Normalize features
  const normalizedFeatures = normalizeFeatures(
    effectiveWaitTime,
    chargerAvailabilityRatio,
    stationReliabilityScore,
    distancePenalty,
    energyStabilityIndex
  );

  const features: StationFeatures = {
    stationId: telemetry.stationId,
    effectiveWaitTime: round(effectiveWaitTime, 2),
    stationReliabilityScore: round(stationReliabilityScore, 4),
    energyStabilityIndex: round(energyStabilityIndex, 4),
    chargerAvailabilityRatio: round(chargerAvailabilityRatio, 4),
    distancePenalty: round(distancePenalty, 2),
    normalizedFeatures,
    timestamp: nowTimestamp(),
  };

  const duration = Date.now() - startTime;
  logMetrics(logger, 'features.engineering.latency', duration, { stationId: telemetry.stationId });

  return features;
}

/**
 * Process incoming telemetry message
 */
async function processMessage(payload: EachMessagePayload): Promise<void> {
  const { topic, partition, message } = payload;

  try {
    const telemetry = parseMessage<StationTelemetry>(message.value);
    
    if (!telemetry) {
      logger.warn('Failed to parse telemetry message', { topic, partition });
      return;
    }

    logger.debug('Processing telemetry', { stationId: telemetry.stationId });

    // Engineer features
    const features = await engineerFeatures(telemetry);

    // Publish engineered features to Kafka
    await produceMessage(producer, TOPICS.stationFeatures, features.stationId, features);

    // Cache features in Redis
    await setWithTTL(
      REDIS_KEYS.stationFeatures(features.stationId),
      features,
      config.redis.ttl.score
    );

    logEvent(logger, 'features_engineered', { 
      stationId: features.stationId,
      waitTime: features.effectiveWaitTime,
      reliability: features.stationReliabilityScore 
    });

  } catch (error) {
    logger.error('Error processing telemetry', { error, topic, partition });
  }
}

/**
 * Calculate features for a specific user context
 * This adds user-specific context like distance
 */
export async function calculateUserContextFeatures(
  stationId: string,
  userLocation: GeoLocation
): Promise<StationFeatures | null> {
  // Get cached telemetry
  const telemetry = await getJSON<StationTelemetry>(REDIS_KEYS.stationTelemetry(stationId));
  
  if (!telemetry) {
    logger.warn('No telemetry found for station', { stationId });
    return null;
  }

  // In production, calculate actual distance and ETA
  const features = await engineerFeatures(telemetry);
  
  return features;
}

/**
 * Start the feature engineering service
 */
async function start(): Promise<void> {
  try {
    // Initialize Kafka connections
    consumer = await createConsumer('features');
    producer = await createProducer();

    // Subscribe to telemetry topic
    await consumer.subscribe({ 
      topic: TOPICS.stationTelemetry, 
      fromBeginning: false 
    });

    logger.info('Feature service subscribed to topics');

    // Start consuming
    await consumer.run({
      eachMessage: processMessage,
    });

    logger.info('Feature engineering service started');

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down feature service');
      await disconnectKafka(producer, consumer);
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start feature service', { error });
    process.exit(1);
  }
}

// Export for use by other services
export { 
  engineerFeatures, 
  calculateEffectiveWaitTime,
  calculateReliabilityScore,
  calculateEnergyStabilityIndex,
  calculateChargerAvailabilityRatio,
  normalizeFeatures 
};

// Start if run directly
if (require.main === module) {
  start();
}
