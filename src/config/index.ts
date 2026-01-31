import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  
  // Server Ports
  ports: {
    api: parseInt(process.env.API_PORT || '3000', 10),
    ingestion: parseInt(process.env.INGESTION_PORT || '3001', 10),
    recommendation: parseInt(process.env.RECOMMENDATION_PORT || '3002', 10),
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

  // Groq Configuration
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
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

  // Model Paths
  models: {
    dir: process.env.MODEL_DIR || './models',
    xgbQueue: process.env.XGB_QUEUE_MODEL_PATH || './models/xgb_queue_tuned_model.pkl',
    xgbWait: process.env.XGB_WAIT_MODEL_PATH || './models/xgb_wait_tuned_model.pkl',
    lgbmFault: process.env.LGBM_FAULT_MODEL_PATH || './models/lgbm_fault_tuned_model.pkl',
    xgbAction: process.env.XGB_ACTION_MODEL_PATH || './models/xgb_action_tuned_model.pkl',
    trafficForecast: process.env.TRAFFIC_FORECAST_MODEL_PATH || './models/traffic_forecast_model.pkl',
    microTraffic: process.env.MICRO_TRAFFIC_MODEL_PATH || './models/micro_traffic_model_improved.pkl',
    batteryRebalance: process.env.BATTERY_REBALANCE_MODEL_PATH || './models/battery_rebalance_model.pkl',
    stockOrder: process.env.STOCK_ORDER_MODEL_PATH || './models/stock_order_model.pkl',
    staffDiversion: process.env.STAFF_DIVERSION_MODEL_PATH || './models/staff_diversion_model.pkl',
    tieupStorage: process.env.TIEUP_STORAGE_MODEL_PATH || './models/tieup_storage_model.pkl',
    customerArrival: process.env.CUSTOMER_ARRIVAL_MODEL_PATH || './models/customer_arrival_model.pkl',
    batteryDemand: process.env.BATTERY_DEMAND_MODEL_PATH || './models/battery_demand_model.pkl',
    stationRecommender: process.env.STATION_RECOMMENDER_MODEL_PATH || './models/station_recommender.pkl',
    gemini: process.env.GEMINI_MODEL_PATH || './models/gemini_flash_llm.pkl',
  },
} as const;

export type Config = typeof config;
