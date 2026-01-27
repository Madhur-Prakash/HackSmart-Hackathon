// ============================================
// Core Domain Types for EV Charging Platform
// ============================================

// Station Telemetry Data
export interface StationTelemetry {
  stationId: string;
  queueLength: number;
  avgServiceTime: number;
  availableChargers: number;
  totalChargers: number;
  faultRate: number;
  availablePower: number;
  maxCapacity: number;
  timestamp: number;
}

// Station Health Data
export interface StationHealth {
  stationId: string;
  status: 'operational' | 'degraded' | 'offline' | 'maintenance';
  lastMaintenanceDate: string;
  uptimePercentage: number;
  activeAlerts: Alert[];
  healthScore: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: string;
}

// Grid Status Data
export interface GridStatus {
  gridId: string;
  region: string;
  currentLoad: number;
  maxCapacity: number;
  loadPercentage: number;
  peakHours: boolean;
  pricePerKwh: number;
  timestamp: number;
}

// User Context Data
export interface UserContext {
  userId: string;
  sessionId: string;
  currentLocation: GeoLocation;
  vehicleType: string;
  batteryLevel: number;
  preferredChargerType: 'fast' | 'standard' | 'any';
  maxWaitTime: number;
  maxDistance: number;
  timestamp: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

// Engineered Features
export interface StationFeatures {
  stationId: string;
  effectiveWaitTime: number;
  stationReliabilityScore: number;
  energyStabilityIndex: number;
  chargerAvailabilityRatio: number;
  distancePenalty: number;
  normalizedFeatures: NormalizedFeatures;
  timestamp: number;
}

export interface NormalizedFeatures {
  waitTime: number;
  availability: number;
  reliability: number;
  distance: number;
  energyStability: number;
}

// Station Score
export interface StationScore {
  stationId: string;
  overallScore: number;
  componentScores: ComponentScores;
  rank: number;
  confidence: number;
  timestamp: number;
}

export interface ComponentScores {
  waitTimeScore: number;
  availabilityScore: number;
  reliabilityScore: number;
  distanceScore: number;
  energyStabilityScore: number;
}

// AI Predictions
export interface LoadForecast {
  stationId: string;
  predictedLoad: number;
  confidence: number;
  peakTimeStart?: string;
  peakTimeEnd?: string;
  timestamp: number;
}

export interface FaultPrediction {
  stationId: string;
  faultProbability: number;
  predictedFaultType?: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  timestamp: number;
}

// Recommendation
export interface Recommendation {
  requestId: string;
  userId: string;
  recommendations: RankedStation[];
  explanation: string;
  generatedAt: string;
  expiresAt: string;
}

export interface RankedStation {
  stationId: string;
  stationName: string;
  location: GeoLocation;
  address: string;
  score: number;
  rank: number;
  estimatedWaitTime: number;
  estimatedDistance: number;
  availableChargers: number;
  chargerTypes: string[];
  pricePerKwh: number;
  features: StationFeatures;
  predictions: {
    load: LoadForecast;
    fault: FaultPrediction;
  };
}

// Station Master Data
export interface Station {
  id: string;
  name: string;
  address: string;
  location: GeoLocation;
  totalChargers: number;
  chargerTypes: string[];
  maxCapacity: number;
  operatingHours: string;
  amenities: string[];
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface RecommendationRequest {
  userId: string;
  location: GeoLocation;
  vehicleType?: string;
  batteryLevel?: number;
  preferredChargerType?: 'fast' | 'standard' | 'any';
  maxWaitTime?: number;
  maxDistance?: number;
  limit?: number;
}

export interface RecommendationResponse {
  success: boolean;
  data: Recommendation;
  meta: {
    processingTime: number;
    cacheHit: boolean;
  };
}

export interface StationScoreResponse {
  success: boolean;
  data: StationScore;
  meta: {
    timestamp: number;
    freshness: 'live' | 'cached';
  };
}

export interface StationHealthResponse {
  success: boolean;
  data: StationHealth;
}

export interface AdminSummary {
  totalStations: number;
  operationalStations: number;
  degradedStations: number;
  offlineStations: number;
  totalActiveUsers: number;
  recommendationsToday: number;
  avgResponseTime: number;
  cacheHitRatio: number;
  topStations: Array<{
    stationId: string;
    name: string;
    recommendationCount: number;
  }>;
  systemHealth: 'healthy' | 'degraded' | 'critical';
}

export interface SystemMetrics {
  kafka: {
    consumerLag: number;
    messagesPerSecond: number;
    topicStats: Record<string, { messages: number; lag: number }>;
  };
  redis: {
    hitRatio: number;
    memoryUsage: number;
    connectedClients: number;
  };
  api: {
    requestsPerSecond: number;
    avgLatency: number;
    errorRate: number;
  };
  services: Record<string, {
    status: 'up' | 'down' | 'degraded';
    lastHeartbeat: string;
    uptime: number;
  }>;
}

// Kafka Message Types
export interface KafkaMessage<T> {
  key: string;
  value: T;
  headers?: Record<string, string>;
  timestamp: string;
}

// Database Models
export interface StationHistoryRecord {
  id: number;
  stationId: string;
  telemetry: StationTelemetry;
  features: StationFeatures;
  score: number;
  createdAt: string;
}

export interface UserRequestRecord {
  id: number;
  userId: string;
  sessionId: string;
  request: RecommendationRequest;
  response: Recommendation | null;
  processingTime: number;
  createdAt: string;
}

export interface RecommendationLogRecord {
  id: number;
  requestId: string;
  userId: string;
  stationIds: string[];
  selectedStationId: string | null;
  feedback: number | null;
  createdAt: string;
}

export interface SystemEventRecord {
  id: number;
  eventType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Validation Schemas (for Zod)
export type ValidationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  errors: Array<{ path: string; message: string }>;
};
