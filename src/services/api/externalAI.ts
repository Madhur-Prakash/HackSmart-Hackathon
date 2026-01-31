import { createLogger, logMetrics, logEvent } from '../../utils/logger';
import { setWithTTL, getJSON, REDIS_KEYS } from '../../redis';
import { LoadForecast, FaultPrediction } from '../../types';
import { config } from '../../config';
import { runModel } from '../../utils/modelRunner';

const logger = createLogger('external-ai');

/**
 * Fetch load forecast using local model
 */
export async function fetchLoadForecast(stationId: string): Promise<LoadForecast | null> {
  const cacheKey = REDIS_KEYS.loadForecast(stationId);
  // Check cache first
  const cached = await getJSON<LoadForecast>(cacheKey);
  if (cached) {
    logEvent(logger, 'load_forecast_cache_hit', { stationId });
    return cached;
  }
  try {
    const inputData = { stationId };
    const result = await runModel(config.models.xgbQueue, inputData);
    await setWithTTL(cacheKey, result, config.redis.ttl.prediction);
    logEvent(logger, 'load_forecast_model_inference', { stationId });
    return result;
  } catch (error) {
    logger.error('Failed to run queue model', { stationId, error });
    return null;
  }
}

/**
 * Fetch fault probability using local model
 */
export async function fetchFaultProbability(stationId: string): Promise<FaultPrediction | null> {
  const cacheKey = REDIS_KEYS.faultPrediction(stationId);
  // Check cache first
  const cached = await getJSON<FaultPrediction>(cacheKey);
  if (cached) {
    logEvent(logger, 'fault_prediction_cache_hit', { stationId });
    return cached;
  }
  try {
    const inputData = { stationId };
    const result = await runModel(config.models.lgbmFault, inputData);
    await setWithTTL(cacheKey, result, config.redis.ttl.prediction);
    logEvent(logger, 'fault_prediction_model_inference', { stationId });
    return result;
  } catch (error) {
    logger.error('Failed to run fault model', { stationId, error });
    return null;
  }
}

/**
 * Fetch all predictions for a station
 */
export async function fetchAllPredictions(stationId: string): Promise<{
  loadForecast: LoadForecast | null;
  faultPrediction: FaultPrediction | null;
}> {
  const [loadForecast, faultPrediction] = await Promise.all([
    fetchLoadForecast(stationId),
    fetchFaultProbability(stationId),
  ]);
  return { loadForecast, faultPrediction };
}

/**
 * Batch fetch predictions for multiple stations
 */
export async function batchFetchPredictions(
  stationIds: string[]
): Promise<Map<string, { loadForecast: LoadForecast | null; faultPrediction: FaultPrediction | null }>> {
  const results = new Map();
  await Promise.all(
    stationIds.map(async (stationId) => {
      const predictions = await fetchAllPredictions(stationId);
      results.set(stationId, predictions);
    })
  );
  return results;
}

/**
 * Generate simulated load forecast for fallback
 */
function generateSimulatedLoadForecast(stationId: string): LoadForecast {
  const hour = new Date().getHours();
  const isPeakHour = hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19;
  
  return {
    stationId,
    predictedLoad: isPeakHour ? 0.7 + Math.random() * 0.25 : 0.3 + Math.random() * 0.3,
    confidence: 0.75,
    peakTimeStart: '17:00',
    peakTimeEnd: '19:00',
    timestamp: Math.floor(Date.now() / 1000),
  };
}

/**
 * Generate simulated fault prediction for fallback
 */
function generateSimulatedFaultPrediction(stationId: string): FaultPrediction {
  const probability = Math.random() * 0.15; // 0-15% fault probability
  
  let riskLevel: 'low' | 'medium' | 'high';
  if (probability < 0.05) {
    riskLevel = 'low';
  } else if (probability < 0.15) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return {
    stationId,
    faultProbability: probability,
    riskLevel,
    confidence: 0.8,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

// Add a stub for getCircuitBreakerStatus if needed by API
export async function getCircuitBreakerStatus(): Promise<{ status: string }> {
  // This is a stub. Replace with real logic if needed.
  return { status: 'ok' };
}
