import { createLogger, logMetrics, logEvent } from '../../utils/logger';
import { setWithTTL, getJSON, REDIS_KEYS } from '../../redis';
import { LoadForecast, FaultPrediction, StationFeatures } from '../../types';
import { config } from '../../config';
import { runModel } from '../../utils/modelRunner';

const logger = createLogger('external-ai');

/**
 * Build model input from station features or use defaults
 */
async function buildModelInput(stationId: string): Promise<Record<string, unknown>> {
  // Try to get features from Redis
  const features = await getJSON<StationFeatures>(REDIS_KEYS.stationFeatures(stationId));
  
  const now = new Date();
  const hour_of_day = now.getHours();
  const day_of_week = now.getDay();
  
  // Build input with available data or realistic defaults
  return {
    station_id: stationId,
    stationId: stationId,
    
    // Time features
    hour_of_day,
    day_of_week,
    timestamp: now.toISOString(),
    
    // Station features from Redis or defaults
    station_reliability_score: features?.stationReliabilityScore ?? 0.85,
    energy_stability_index: features?.energyStabilityIndex ?? 0.9,
    
    // Queue/wait features
    queue_length: Math.max(1, Math.floor((features?.effectiveWaitTime ?? 15) / 3)),
    avg_wait_time: features?.effectiveWaitTime ?? 15,
    current_queue: Math.max(1, Math.floor((features?.effectiveWaitTime ?? 15) / 3)),
    
    // Battery/charger features (derived from chargerAvailabilityRatio)
    charger_availability_ratio: features?.chargerAvailabilityRatio ?? 0.7,
    available_batteries: Math.floor((features?.chargerAvailabilityRatio ?? 0.7) * 50),
    total_batteries: 50,
    available_chargers: Math.floor((features?.chargerAvailabilityRatio ?? 0.7) * 15),
    total_chargers: 15,
    
    // Power features
    power_usage_kw: 120,
    power_capacity_kw: 200,
    
    // Status
    status: 'OPERATIONAL',
    weather_condition: 'Clear',
    weather_temp: 25,
  };
}

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
    const inputData = await buildModelInput(stationId);
    const result = await runModel(config.models.xgbQueue, inputData);
    
    // Transform model output to LoadForecast format
    const prediction = result.prediction ?? result.predicted_queue ?? 5;
    const hour = new Date().getHours();
    const isPeakHour = hour >= 7 && hour <= 9 || hour >= 17 && hour <= 19;
    
    const loadForecast: LoadForecast = {
      stationId,
      predictedLoad: Math.min(1, Math.max(0, prediction / 15)), // Normalize to 0-1
      confidence: result.confidence ?? 0.85,
      peakTimeStart: isPeakHour ? `${hour}:00` : '17:00',
      peakTimeEnd: isPeakHour ? `${hour + 2}:00` : '19:00',
      timestamp: Math.floor(Date.now() / 1000),
    };
    
    await setWithTTL(cacheKey, loadForecast, config.redis.ttl.prediction);
    logEvent(logger, 'load_forecast_model_inference', { stationId, prediction });
    return loadForecast;
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
    const inputData = await buildModelInput(stationId);
    const result = await runModel(config.models.lgbmFault, inputData);
    
    // Transform model output to FaultPrediction format
    // The model returns prediction (class) and probabilities [P(no fault), P(fault)]
    const faultProbability = result.probabilities 
      ? result.probabilities[1] ?? 0.1 
      : (result.prediction ?? 0.1);
    
    let riskLevel: 'low' | 'medium' | 'high';
    if (faultProbability < 0.3) {
      riskLevel = 'low';
    } else if (faultProbability < 0.7) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }
    
    const faultPrediction: FaultPrediction = {
      stationId,
      faultProbability,
      riskLevel,
      confidence: result.confidence ?? 0.8,
      timestamp: Math.floor(Date.now() / 1000),
    };
    
    await setWithTTL(cacheKey, faultPrediction, config.redis.ttl.prediction);
    logEvent(logger, 'fault_prediction_model_inference', { stationId, faultProbability, riskLevel });
    return faultPrediction;
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
