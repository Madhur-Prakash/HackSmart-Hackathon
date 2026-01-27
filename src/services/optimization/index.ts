import { 
  getTopFromSortedSet, 
  getJSON, 
  getMultiJSON,
  REDIS_KEYS 
} from '../../redis';
import { stationRepository } from '../../db';
import { createLogger, logMetrics, logEvent } from '../../utils/logger';
import { round, calculateDistance } from '../../utils/helpers';
import { 
  StationScore, 
  StationFeatures, 
  StationHealth, 
  Station, 
  RankedStation,
  GeoLocation,
  LoadForecast,
  FaultPrediction,
  RecommendationRequest
} from '../../types';

const logger = createLogger('optimization-service');

// Constraint thresholds
const CONSTRAINTS = {
  minCapacityRatio: 0.1,      // Station must have at least 10% capacity
  maxFaultProbability: 0.3,   // Max 30% fault probability
  minHealthScore: 50,         // Min health score of 50
  maxQueueLength: 10,         // Max queue length
  validStatuses: ['operational', 'degraded'] as const,
};

interface OptimizationContext {
  userLocation: GeoLocation;
  maxDistance?: number;
  maxWaitTime?: number;
  preferredChargerType?: string;
  limit: number;
}

/**
 * Check if a station meets all constraints
 */
async function checkConstraints(
  stationId: string,
  context: OptimizationContext
): Promise<{ passes: boolean; reason?: string }> {
  // Get station health
  const health = await getJSON<StationHealth>(REDIS_KEYS.stationHealth(stationId));
  
  // Check health status
  if (health) {
    if (!CONSTRAINTS.validStatuses.includes(health.status as any)) {
      return { passes: false, reason: `Station status: ${health.status}` };
    }
    
    if (health.healthScore < CONSTRAINTS.minHealthScore) {
      return { passes: false, reason: `Low health score: ${health.healthScore}` };
    }
  }

  // Get fault prediction
  const faultPrediction = await getJSON<FaultPrediction>(REDIS_KEYS.faultPrediction(stationId));
  if (faultPrediction && faultPrediction.faultProbability > CONSTRAINTS.maxFaultProbability) {
    return { passes: false, reason: `High fault probability: ${faultPrediction.faultProbability}` };
  }

  // Get features to check capacity
  const features = await getJSON<StationFeatures>(REDIS_KEYS.stationFeatures(stationId));
  if (features) {
    if (features.chargerAvailabilityRatio < CONSTRAINTS.minCapacityRatio) {
      return { passes: false, reason: 'Insufficient capacity' };
    }
    
    if (context.maxWaitTime && features.effectiveWaitTime > context.maxWaitTime) {
      return { passes: false, reason: `Wait time exceeds limit: ${features.effectiveWaitTime} min` };
    }
  }

  return { passes: true };
}

/**
 * Calculate distance-adjusted score
 */
function calculateDistanceAdjustedScore(
  baseScore: number,
  distance: number,
  maxDistance: number = 50
): number {
  // Apply exponential decay for distance
  const distancePenalty = Math.exp(-distance / (maxDistance / 3));
  return baseScore * distancePenalty;
}

/**
 * Get Top-K stations with ranking
 */
export async function getTopKStations(
  context: OptimizationContext
): Promise<RankedStation[]> {
  const startTime = Date.now();
  
  // Get more candidates than needed to account for filtering
  const candidateMultiplier = 3;
  const candidateCount = context.limit * candidateMultiplier;
  
  // Get top scored stations from Redis sorted set
  const rankedStationIds = await getTopFromSortedSet(
    REDIS_KEYS.stationRanking,
    candidateCount
  );

  logger.debug('Got ranked station candidates', { count: rankedStationIds.length });

  if (rankedStationIds.length === 0) {
    // Fallback to database if no cached rankings
    const allStations = await stationRepository.findAll();
    
    if (allStations.length === 0) {
      return [];
    }
    
    // Return stations sorted by distance as fallback
    return allStations
      .map((station, index) => ({
        stationId: station.id,
        stationName: station.name,
        location: station.location,
        address: station.address,
        score: 0.5, // Default score
        rank: index + 1,
        estimatedWaitTime: 10,
        estimatedDistance: calculateDistance(context.userLocation, station.location),
        availableChargers: station.totalChargers,
        chargerTypes: station.chargerTypes,
        pricePerKwh: 0.30,
        features: {} as StationFeatures,
        predictions: {
          load: {} as LoadForecast,
          fault: {} as FaultPrediction,
        },
      }))
      .sort((a, b) => a.estimatedDistance - b.estimatedDistance)
      .slice(0, context.limit);
  }

  // Process candidates
  const results: RankedStation[] = [];
  
  for (const { member: stationId, score: baseScore } of rankedStationIds) {
    if (results.length >= context.limit) break;

    // Check constraints
    const constraintResult = await checkConstraints(stationId, context);
    if (!constraintResult.passes) {
      logger.debug('Station filtered out', { stationId, reason: constraintResult.reason });
      continue;
    }

    // Get station data
    const station = await stationRepository.findById(stationId);
    if (!station) continue;

    // Calculate distance
    const distance = calculateDistance(context.userLocation, station.location);
    
    // Check distance constraint
    if (context.maxDistance && distance > context.maxDistance) {
      continue;
    }

    // Get features and predictions
    const [features, loadForecast, faultPrediction] = await Promise.all([
      getJSON<StationFeatures>(REDIS_KEYS.stationFeatures(stationId)),
      getJSON<LoadForecast>(REDIS_KEYS.loadForecast(stationId)),
      getJSON<FaultPrediction>(REDIS_KEYS.faultPrediction(stationId)),
    ]);

    // Calculate final distance-adjusted score
    const adjustedScore = calculateDistanceAdjustedScore(baseScore, distance, context.maxDistance);

    results.push({
      stationId,
      stationName: station.name,
      location: station.location,
      address: station.address,
      score: round(adjustedScore, 4),
      rank: results.length + 1,
      estimatedWaitTime: features?.effectiveWaitTime || 0,
      estimatedDistance: round(distance, 2),
      availableChargers: features ? Math.round(features.chargerAvailabilityRatio * station.totalChargers) : 0,
      chargerTypes: station.chargerTypes,
      pricePerKwh: 0.30, // Would come from dynamic pricing service
      features: features || {} as StationFeatures,
      predictions: {
        load: loadForecast || {} as LoadForecast,
        fault: faultPrediction || {} as FaultPrediction,
      },
    });
  }

  // Sort by adjusted score
  results.sort((a, b) => b.score - a.score);

  // Update ranks after sorting
  results.forEach((station, index) => {
    station.rank = index + 1;
  });

  const duration = Date.now() - startTime;
  logMetrics(logger, 'optimization.latency', duration, { resultCount: String(results.length) });
  logEvent(logger, 'optimization_completed', { 
    candidates: rankedStationIds.length,
    results: results.length 
  });

  return results;
}

/**
 * Optimize station selection for a specific user request
 */
export async function optimizeForRequest(
  request: RecommendationRequest
): Promise<RankedStation[]> {
  const context: OptimizationContext = {
    userLocation: request.location,
    maxDistance: request.maxDistance,
    maxWaitTime: request.maxWaitTime,
    preferredChargerType: request.preferredChargerType,
    limit: request.limit || 5,
  };

  return getTopKStations(context);
}

/**
 * Re-rank stations based on user preferences
 */
export function applyUserPreferences(
  stations: RankedStation[],
  preferences: {
    preferFast?: boolean;
    preferNearby?: boolean;
    preferReliable?: boolean;
  }
): RankedStation[] {
  const preferenceWeights = {
    fast: preferences.preferFast ? 1.2 : 1.0,
    nearby: preferences.preferNearby ? 1.2 : 1.0,
    reliable: preferences.preferReliable ? 1.2 : 1.0,
  };

  return stations
    .map(station => {
      let adjustedScore = station.score;

      // Boost for fast chargers
      if (preferences.preferFast && station.chargerTypes.includes('CCS')) {
        adjustedScore *= preferenceWeights.fast;
      }

      // Boost for nearby stations
      if (preferences.preferNearby && station.estimatedDistance < 5) {
        adjustedScore *= preferenceWeights.nearby;
      }

      // Boost for reliable stations (low fault probability)
      if (preferences.preferReliable && station.predictions.fault?.faultProbability < 0.1) {
        adjustedScore *= preferenceWeights.reliable;
      }

      return { ...station, score: round(adjustedScore, 4) };
    })
    .sort((a, b) => b.score - a.score)
    .map((station, index) => ({ ...station, rank: index + 1 }));
}

/**
 * Get optimization metrics
 */
export async function getOptimizationMetrics(): Promise<{
  totalCandidates: number;
  averageScore: number;
  topStationId: string | null;
}> {
  const topStations = await getTopFromSortedSet(REDIS_KEYS.stationRanking, 100);
  
  if (topStations.length === 0) {
    return {
      totalCandidates: 0,
      averageScore: 0,
      topStationId: null,
    };
  }

  const averageScore = topStations.reduce((sum, s) => sum + s.score, 0) / topStations.length;

  return {
    totalCandidates: topStations.length,
    averageScore: round(averageScore, 4),
    topStationId: topStations[0]?.member || null,
  };
}
