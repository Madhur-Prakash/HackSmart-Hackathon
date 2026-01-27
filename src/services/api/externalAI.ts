import axios, { AxiosInstance } from 'axios';
import { 
  circuitBreaker, 
  ConsecutiveBreaker, 
  retry, 
  handleAll, 
  wrap,
  ExponentialBackoff
} from 'cockatiel';
import { config } from '../../config';
import { createLogger, logMetrics, logEvent } from '../../utils/logger';
import { setWithTTL, getJSON, REDIS_KEYS } from '../../redis';
import { LoadForecast, FaultPrediction } from '../../types';

const logger = createLogger('external-ai');

// Create HTTP client with timeout
const httpClient: AxiosInstance = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Circuit breaker for external AI services
const circuitBreakerPolicy = circuitBreaker(handleAll, {
  halfOpenAfter: config.circuitBreaker.timeout,
  breaker: new ConsecutiveBreaker(config.circuitBreaker.threshold),
});

// Retry policy
const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({
    initialDelay: 500,
    maxDelay: 5000,
  }),
});

// Combined policy
const resilientPolicy = wrap(retryPolicy, circuitBreakerPolicy);

/**
 * Fetch load forecast from external AI service
 */
export async function fetchLoadForecast(stationId: string): Promise<LoadForecast | null> {
  const cacheKey = REDIS_KEYS.loadForecast(stationId);
  
  // Check cache first
  const cached = await getJSON<LoadForecast>(cacheKey);
  if (cached) {
    logEvent(logger, 'load_forecast_cache_hit', { stationId });
    return cached;
  }

  const startTime = Date.now();

  try {
    const result = await resilientPolicy.execute(async () => {
      const response = await httpClient.get<LoadForecast>(
        `${config.aiServices.loadForecast}`,
        { params: { stationId } }
      );
      return response.data;
    });

    // Cache the result
    await setWithTTL(cacheKey, result, config.redis.ttl.prediction);

    const duration = Date.now() - startTime;
    logMetrics(logger, 'ai.load_forecast.latency', duration, { stationId });

    return result;

  } catch (error) {
    logger.error('Failed to fetch load forecast', { stationId, error });
    
    // Return simulated prediction as fallback
    return generateSimulatedLoadForecast(stationId);
  }
}

/**
 * Fetch fault probability from external AI service
 */
export async function fetchFaultProbability(stationId: string): Promise<FaultPrediction | null> {
  const cacheKey = REDIS_KEYS.faultPrediction(stationId);
  
  // Check cache first
  const cached = await getJSON<FaultPrediction>(cacheKey);
  if (cached) {
    logEvent(logger, 'fault_prediction_cache_hit', { stationId });
    return cached;
  }

  const startTime = Date.now();

  try {
    const result = await resilientPolicy.execute(async () => {
      const response = await httpClient.get<FaultPrediction>(
        `${config.aiServices.faultProbability}`,
        { params: { stationId } }
      );
      return response.data;
    });

    // Cache the result
    await setWithTTL(cacheKey, result, config.redis.ttl.prediction);

    const duration = Date.now() - startTime;
    logMetrics(logger, 'ai.fault_prediction.latency', duration, { stationId });

    return result;

  } catch (error) {
    logger.error('Failed to fetch fault probability', { stationId, error });
    
    // Return simulated prediction as fallback
    return generateSimulatedFaultPrediction(stationId);
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
    predictedFaultType: probability > 0.1 ? 'charger_malfunction' : undefined,
    riskLevel,
    confidence: 0.8,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

/**
 * Get circuit breaker status
 */
export function getCircuitBreakerStatus(): {
  state: string;
  failures: number;
} {
  return {
    state: String(circuitBreakerPolicy.state),
    failures: 0, // Would need to track this separately
  };
}
