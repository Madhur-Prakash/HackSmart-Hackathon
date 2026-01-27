import Redis from 'ioredis';
import { config } from '../config';
import { createLogger } from '../utils/logger';

const logger = createLogger('redis');

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      db: config.redis.db,
      keyPrefix: config.redis.keyPrefix,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger.warn('Redis connection retry', { attempt: times, delay });
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected', { host: config.redis.host, port: config.redis.port });
    });

    redisClient.on('error', (error) => {
      logger.error('Redis error', { error: error.message });
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting');
    });
  }

  return redisClient;
}

/**
 * Redis key prefixes for different data types
 */
export const REDIS_KEYS = {
  // Station data
  stationScore: (stationId: string) => `station:score:${stationId}`,
  stationFeatures: (stationId: string) => `station:features:${stationId}`,
  stationTelemetry: (stationId: string) => `station:telemetry:${stationId}`,
  stationHealth: (stationId: string) => `station:health:${stationId}`,
  
  // Predictions
  loadForecast: (stationId: string) => `prediction:load:${stationId}`,
  faultPrediction: (stationId: string) => `prediction:fault:${stationId}`,
  
  // User data
  userSession: (sessionId: string) => `user:session:${sessionId}`,
  userContext: (userId: string) => `user:context:${userId}`,
  
  // Rankings
  stationRanking: 'ranking:stations',
  topStations: 'ranking:top',
  
  // Grid data
  gridStatus: (gridId: string) => `grid:status:${gridId}`,
  
  // Metrics
  metricsCounter: (name: string) => `metrics:counter:${name}`,
  metricsGauge: (name: string) => `metrics:gauge:${name}`,
  
  // Locks
  lock: (resource: string) => `lock:${resource}`,
};

/**
 * Set a value with TTL
 */
export async function setWithTTL<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

/**
 * Get a value and parse as JSON
 */
export async function getJSON<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get(key);
  
  if (!value) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('Failed to parse Redis value', { key, error });
    return null;
  }
}

/**
 * Get multiple values
 */
export async function getMultiJSON<T>(keys: string[]): Promise<Map<string, T>> {
  const redis = getRedisClient();
  const values = await redis.mget(...keys);
  const result = new Map<string, T>();
  
  values.forEach((value, index) => {
    if (value) {
      try {
        result.set(keys[index], JSON.parse(value) as T);
      } catch (error) {
        logger.error('Failed to parse Redis value', { key: keys[index], error });
      }
    }
  });
  
  return result;
}

/**
 * Set hash field
 */
export async function setHashField<T>(
  key: string,
  field: string,
  value: T
): Promise<void> {
  const redis = getRedisClient();
  await redis.hset(key, field, JSON.stringify(value));
}

/**
 * Get hash field
 */
export async function getHashField<T>(key: string, field: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.hget(key, field);
  
  if (!value) return null;
  
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('Failed to parse Redis hash value', { key, field, error });
    return null;
  }
}

/**
 * Get all hash fields
 */
export async function getHashAll<T>(key: string): Promise<Record<string, T>> {
  const redis = getRedisClient();
  const hash = await redis.hgetall(key);
  const result: Record<string, T> = {};
  
  for (const [field, value] of Object.entries(hash)) {
    try {
      result[field] = JSON.parse(value) as T;
    } catch (error) {
      logger.error('Failed to parse Redis hash value', { key, field, error });
    }
  }
  
  return result;
}

/**
 * Add to sorted set
 */
export async function addToSortedSet(
  key: string,
  score: number,
  member: string
): Promise<void> {
  const redis = getRedisClient();
  await redis.zadd(key, score, member);
}

/**
 * Get top N from sorted set (highest scores)
 */
export async function getTopFromSortedSet(
  key: string,
  count: number
): Promise<Array<{ member: string; score: number }>> {
  const redis = getRedisClient();
  const results = await redis.zrevrange(key, 0, count - 1, 'WITHSCORES');
  
  const items: Array<{ member: string; score: number }> = [];
  for (let i = 0; i < results.length; i += 2) {
    items.push({
      member: results[i],
      score: parseFloat(results[i + 1]),
    });
  }
  
  return items;
}

/**
 * Increment counter
 */
export async function incrementCounter(key: string, by: number = 1): Promise<number> {
  const redis = getRedisClient();
  return redis.incrby(key, by);
}

/**
 * Set gauge value
 */
export async function setGauge(key: string, value: number): Promise<void> {
  const redis = getRedisClient();
  await redis.set(key, value.toString());
}

/**
 * Acquire distributed lock
 */
export async function acquireLock(
  resource: string,
  ttlMs: number
): Promise<boolean> {
  const redis = getRedisClient();
  const key = REDIS_KEYS.lock(resource);
  const result = await redis.set(key, '1', 'PX', ttlMs, 'NX');
  return result === 'OK';
}

/**
 * Release distributed lock
 */
export async function releaseLock(resource: string): Promise<void> {
  const redis = getRedisClient();
  const key = REDIS_KEYS.lock(resource);
  await redis.del(key);
}

/**
 * Check if key exists
 */
export async function exists(key: string): Promise<boolean> {
  const redis = getRedisClient();
  const result = await redis.exists(key);
  return result === 1;
}

/**
 * Delete key
 */
export async function deleteKey(key: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(key);
}

/**
 * Get TTL of a key
 */
export async function getTTL(key: string): Promise<number> {
  const redis = getRedisClient();
  return redis.ttl(key);
}

/**
 * Flush all keys (use with caution!)
 */
export async function flushAll(): Promise<void> {
  const redis = getRedisClient();
  await redis.flushall();
  logger.warn('Redis flushed all keys');
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

/**
 * Get Redis info for monitoring
 */
export async function getRedisInfo(): Promise<Record<string, string>> {
  const redis = getRedisClient();
  const info = await redis.info();
  const result: Record<string, string> = {};
  
  info.split('\n').forEach(line => {
    const [key, value] = line.split(':');
    if (key && value) {
      result[key.trim()] = value.trim();
    }
  });
  
  return result;
}
