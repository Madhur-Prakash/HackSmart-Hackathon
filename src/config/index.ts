import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  
  // Server Ports
  ports: {
    api: parseInt(process.env.API_PORT || '3000', 10),
    ingestion: parseInt(process.env.INGESTION_PORT || '3001', 10),
    features: parseInt(process.env.FEATURES_PORT || '3002', 10),
    scoring: parseInt(process.env.SCORING_PORT || '3003', 10),
    optimization: parseInt(process.env.OPTIMIZATION_PORT || '3004', 10),
    recommendation: parseInt(process.env.RECOMMENDATION_PORT || '3005', 10),
    llm: parseInt(process.env.LLM_PORT || '3006', 10),
  },

  // Kafka Configuration
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'ev-platform',
    groupId: process.env.KAFKA_GROUP_ID || 'ev-platform-group',
    topics: {
      stationTelemetry: 'station.telemetry',
      stationHealth: 'station.health',
      gridStatus: 'grid.status',
      userContext: 'user.context',
      stationFeatures: 'station.features',
      stationPredictions: 'station.predictions',
      stationScores: 'station.scores',
      recommendations: 'recommendations',
    },
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'ev:',
    ttl: {
      score: parseInt(process.env.SCORE_CACHE_TTL || '30', 10),
      prediction: parseInt(process.env.PREDICTION_CACHE_TTL || '60', 10),
      session: parseInt(process.env.SESSION_CACHE_TTL || '3600', 10),
    },
  },

  // PostgreSQL Configuration
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'evplatform',
    password: process.env.POSTGRES_PASSWORD || 'evplatform123',
    database: process.env.POSTGRES_DB || 'evplatform',
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  },

  // External AI Services
  aiServices: {
    loadForecast: process.env.AI_LOAD_FORECAST_URL || 'http://localhost:8081/ai/load-forecast',
    faultProbability: process.env.AI_FAULT_PROBABILITY_URL || 'http://localhost:8081/ai/fault-probability',
  },

  // Scoring Weights
  scoring: {
    weights: {
      waitTime: parseFloat(process.env.WEIGHT_WAIT_TIME || '0.25'),
      availability: parseFloat(process.env.WEIGHT_AVAILABILITY || '0.20'),
      reliability: parseFloat(process.env.WEIGHT_RELIABILITY || '0.20'),
      distance: parseFloat(process.env.WEIGHT_DISTANCE || '0.20'),
      energyStability: parseFloat(process.env.WEIGHT_ENERGY_STABILITY || '0.15'),
    },
  },

  // Circuit Breaker
  circuitBreaker: {
    threshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10),
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '30000', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
} as const;

export type Config = typeof config;
