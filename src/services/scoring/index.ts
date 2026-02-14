import { Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { 
  createConsumer, 
  createProducer, 
  TOPICS, 
  parseMessage, 
  produceMessage,
  disconnectKafka 
} from '../../kafka';
import { 
  setWithTTL, 
  getJSON, 
  addToSortedSet, 
  REDIS_KEYS,
  getMultiJSON
} from '../../redis';
// ...existing code...
import { createLogger, logMetrics, logEvent } from '../../utils/logger';
import { weightedSum, round, nowTimestamp } from '../../utils/helpers';
import { runModel } from '../../utils/modelRunner';
import { config } from '../../config';
import { 
  StationFeatures, 
  StationScore, 
  ComponentScores, 
  LoadForecast, 
  FaultPrediction 
} from '../../types';

const logger = createLogger('scoring-service');

let consumer: Consumer;
let producer: Producer;

// Scoring weights from config
const WEIGHTS = config.scoring.weights;

/**
 * Get AI predictions from local models
 */
async function getAIPredictions(stationId: string, features: StationFeatures): Promise<{
  queuePrediction: any;
  waitTimePrediction: any;
  faultPrediction: any;
  actionPrediction: any;
  recommenderPrediction: any;
}> {
  // Prepare input for models
  const inputData = {
    ...features,
  };
  const [queuePrediction, waitTimePrediction, faultPrediction, actionPrediction, recommenderPrediction] = await Promise.all([
    runModel(config.models.xgbQueue, inputData),
    runModel(config.models.xgbWait, inputData),
    runModel(config.models.lgbmFault, inputData),
    runModel(config.models.xgbAction, inputData),
    runModel(config.models.stationRecommender, inputData),
  ]);
  return { queuePrediction, waitTimePrediction, faultPrediction, actionPrediction, recommenderPrediction };
}

/**
 * Apply prediction adjustments to base score
 */
function applyPredictionAdjustments(
  baseScore: number,
  loadForecast: LoadForecast | null,
  faultPrediction: FaultPrediction | null
): number {
  let adjustedScore = baseScore;

  // Adjust for predicted load (if high load predicted, reduce score slightly)
  if (loadForecast && loadForecast.predictedLoad > 0.8) {
    adjustedScore *= (1 - (loadForecast.predictedLoad - 0.8) * 0.5);
  }

  // Adjust for fault probability
  if (faultPrediction) {
    switch (faultPrediction.riskLevel) {
      case 'high':
        adjustedScore *= 0.7;
        break;
      case 'medium':
        adjustedScore *= 0.9;
        break;
      case 'low':
        // No adjustment
        break;
    }
  }

  return Math.max(0, Math.min(1, adjustedScore));
}

/**
 * Calculate component scores from normalized features
 */
function calculateComponentScores(features: StationFeatures): ComponentScores {
  const { normalizedFeatures } = features;

  return {
    waitTimeScore: round(normalizedFeatures.waitTime, 4),
    availabilityScore: round(normalizedFeatures.availability, 4),
    reliabilityScore: round(normalizedFeatures.reliability, 4),
    distanceScore: round(normalizedFeatures.distance, 4),
    energyStabilityScore: round(normalizedFeatures.energyStability, 4),
  };
}

/**
 * Calculate overall station score using multi-objective scoring
 * 
 * Score = w1 * wait_time + w2 * availability + w3 * reliability + w4 * distance + w5 * energy_stability
 */
function calculateOverallScore(componentScores: ComponentScores): number {
  const values = [
    componentScores.waitTimeScore,
    componentScores.availabilityScore,
    componentScores.reliabilityScore,
    componentScores.distanceScore,
    componentScores.energyStabilityScore,
  ];

  const weights = [
    WEIGHTS.waitTime,
    WEIGHTS.availability,
    WEIGHTS.reliability,
    WEIGHTS.distance,
    WEIGHTS.energyStability,
  ];

  return round(weightedSum(values, weights), 4);
}

/**
 * Calculate confidence score based on data freshness and completeness
 */
function calculateConfidence(features: StationFeatures): number {
  const dataAge = nowTimestamp() - features.timestamp;
  const agePenalty = Math.min(dataAge / 300, 1); // Max penalty after 5 minutes
  
  // Check feature completeness
  const featureValues = Object.values(features.normalizedFeatures);
  const hasAllFeatures = featureValues.every(v => v !== undefined && v !== null);
  const completenessScore = hasAllFeatures ? 1 : 0.8;

  return round(Math.max(0, 1 - agePenalty * 0.3) * completenessScore, 4);
}

/**
 * Score a station based on its features and AI predictions
 */
async function scoreStation(features: StationFeatures): Promise<StationScore> {
  const startTime = Date.now();

  // Calculate component scores
  const componentScores = calculateComponentScores(features);

  // Calculate base overall score
  let overallScore = calculateOverallScore(componentScores);

  // Get AI predictions from all models
  const predictions = await getAIPredictions(features.stationId, features);

  // Example: adjust score using queue, wait, fault, action, recommender predictions
  if (predictions.queuePrediction?.prediction?.[0] > 8) {
    overallScore *= 0.8;
  }
  if (predictions.waitTimePrediction?.prediction?.[0] > 20) {
    overallScore *= 0.85;
  }
  if (predictions.faultPrediction?.prediction?.[0] > 0.3) {
    overallScore *= 0.7;
  }
  if (predictions.actionPrediction?.prediction?.[0] === 'MAINTENANCE_ALERT') {
    overallScore *= 0.6;
  }
  if (predictions.recommenderPrediction?.prediction?.[0] < 0.5) {
    overallScore *= 0.9;
  }

  // Calculate confidence
  const confidence = calculateConfidence(features);

  const score: StationScore = {
    stationId: features.stationId,
    overallScore: round(overallScore, 4),
    componentScores,
    rank: 0, // Will be set by optimization engine
    confidence,
    timestamp: nowTimestamp(),
  };

  const duration = Date.now() - startTime;
  logMetrics(logger, 'scoring.latency', duration, { stationId: features.stationId });

  return score;
}

/**
 * Process incoming features message
 */
async function processMessage(payload: EachMessagePayload): Promise<void> {
  const { topic, partition, message } = payload;

  try {
    const features = parseMessage<StationFeatures>(message.value);
    
    if (!features) {
      logger.warn('Failed to parse features message', { topic, partition });
      return;
    }

    logger.debug('Processing features', { stationId: features.stationId });

    // Score the station
    const score = await scoreStation(features);

    // Publish score to Kafka
    await produceMessage(producer, TOPICS.stationScores, score.stationId, score);

    // Cache score in Redis
    await setWithTTL(
      REDIS_KEYS.stationScore(score.stationId),
      score,
      config.redis.ttl.score
    );

    // Add to sorted set for ranking
    await addToSortedSet(
      REDIS_KEYS.stationRanking,
      score.overallScore,
      score.stationId
    );

    logEvent(logger, 'station_scored', { 
      stationId: score.stationId,
      score: score.overallScore,
      confidence: score.confidence
    });

  } catch (error) {
    logger.error('Error processing features', { error, topic, partition });
  }
}

/**
 * Score multiple stations at once
 */
export async function scoreMultipleStations(stationIds: string[]): Promise<Map<string, StationScore>> {
  const featureKeys = stationIds.map(id => REDIS_KEYS.stationFeatures(id));
  const featuresMap = await getMultiJSON<StationFeatures>(featureKeys);
  
  const scores = new Map<string, StationScore>();
  
  await Promise.all(
    Array.from(featuresMap.entries()).map(async ([key, features]) => {
      const score = await scoreStation(features);
      scores.set(features.stationId, score);
    })
  );

  return scores;
}

/**
 * Get cached score for a station
 */
export async function getCachedScore(stationId: string): Promise<StationScore | null> {
  return getJSON<StationScore>(REDIS_KEYS.stationScore(stationId));
}

/**
 * Start the scoring consumer (non-blocking)
 * Returns cleanup function for graceful shutdown
 */
export async function startScoringConsumer(): Promise<() => Promise<void>> {
  try {
    // Initialize Kafka connections
    consumer = await createConsumer('scoring');
    producer = await createProducer();

    // Subscribe to features topic
    await consumer.subscribe({ 
      topic: TOPICS.stationFeatures, 
      fromBeginning: false 
    });

    logger.info('Scoring service subscribed to topics');

    // Start consuming (non-blocking)
    await consumer.run({
      eachMessage: processMessage,
    });

    logger.info('Scoring service started');

    // Return cleanup function
    return async () => {
      logger.info('Shutting down scoring service');
      await disconnectKafka(producer, consumer);
    };

  } catch (error) {
    logger.error('Failed to start scoring service', { error });
    throw error;
  }
}

/**
 * Start the scoring service (standalone mode)
 */
async function start(): Promise<void> {
  try {
    const cleanup = await startScoringConsumer();

    // Graceful shutdown
    const shutdown = async () => {
      await cleanup();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start scoring service', { error });
    process.exit(1);
  }
}

// Export for use by other services
export { scoreStation, calculateComponentScores, calculateOverallScore };

// Start if run directly
if (require.main === module) {
  start();
}
