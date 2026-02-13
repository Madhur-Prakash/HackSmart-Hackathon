# EV Charging Platform - Integration Guide

This comprehensive guide covers how to integrate with the EV Charging Platform, including service endpoints, data flows, message formats, and integration patterns.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Service Endpoints](#service-endpoints)
- [Data Flow Pipeline](#data-flow-pipeline)
- [Kafka Integration](#kafka-integration)
- [Redis Integration](#redis-integration)
- [Database Integration](#database-integration)
- [External AI Services](#external-ai-services)
- [API Integration Examples](#api-integration-examples)
- [Webhook & Event Integration](#webhook--event-integration)
- [Error Handling](#error-handling)
- [Authentication & Security](#authentication--security)
- [Rate Limiting](#rate-limiting)
- [Monitoring & Observability](#monitoring--observability)

---

## Architecture Overview

The EV Charging Platform follows a microservices architecture with the following components:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              External Clients                                     │
│                    (Mobile Apps, Web Apps, IoT Devices)                          │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          API Gateway (Port 3000)                                 │
│    • Request routing        • Rate limiting        • Authentication              │
│    • Recommendation API     • Admin Dashboard      • Station Queries             │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Ingestion Svc   │    │ Recommendation   │    │   LLM Service    │
│   (Port 3001)    │    │   (Port 3005)    │    │   (Port 3006)    │
│ • Station data   │    │ • User requests  │    │ • Explanations   │
│ • Health data    │    │ • Selection/FB   │    │ • Admin summary  │
│ • Grid status    │    │ • Caching        │    │ • Groq/Fallback  │
└────────┬─────────┘    └────────┬─────────┘    └──────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Apache Kafka                                          │
│   Topics: station.telemetry | station.health | station.features | station.scores │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Features Svc    │    │  Scoring Svc     │    │ Optimization Svc │
│   (Port 3002)    │    │   (Port 3003)    │    │   (Port 3004)    │
│ • Feature calc   │    │ • Multi-obj score│    │ • Constraint chk │
│ • Normalization  │    │ • AI adjustments │    │ • Top-K ranking  │
│ • Embeddings     │    │ • Confidence     │    │ • User prefs     │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                               Redis Cache                                        │
│  • Station scores    • Features    • Predictions    • Rankings    • Sessions     │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                                                         │
         ▼                                                         ▼
┌──────────────────────┐                              ┌──────────────────────┐
│     PostgreSQL       │                              │   External AI Svc    │
│  • Stations master   │                              │    (Port 8081)       │
│  • User requests     │                              │  • Load forecast     │
│  • Recommendations   │                              │  • Fault prediction  │
│  • System events     │                              │  • Batch predict     │
└──────────────────────┘                              └──────────────────────┘
```

---

## Service Endpoints

### Service Port Mapping

| Service | Port | Base URL | Purpose |
|---------|------|----------|---------|
| API Gateway | 3000 | `http://localhost:3000` | Main entry point for clients |
| Ingestion Service | 3001 | `http://localhost:3001` | Data ingestion from IoT/stations |
| Features Service | 3002 | `http://localhost:3002` | Feature engineering (Kafka consumer) |
| Scoring Service | 3003 | `http://localhost:3003` | Station scoring (Kafka consumer) |
| Optimization Service | 3004 | `http://localhost:3004` | Optimization algorithms |
| Recommendation Service | 3005 | `http://localhost:3005` | Recommendation handling |
| LLM Service | 3006 | `http://localhost:3006` | LLM-powered explanations |
| External AI Service | 8081 | `http://localhost:8081` | AI predictions (mock) |

### Infrastructure Ports

| Service | Port | UI Port | Purpose |
|---------|------|---------|---------|
| Kafka | 9092 | - | Message broker |
| Kafka UI | - | 8082 | Kafka monitoring |
| Redis | 6379 | 8005 | Cache & RedisInsight |
| PostgreSQL | 5432 | - | Primary database |
| pgAdmin | - | 5050 | Database management |
| Zookeeper | 2181 | - | Kafka coordination |

---

## Data Flow Pipeline

### 1. Telemetry Ingestion Flow

```
IoT Device/Station
        │
        ▼ POST /ingest/station (Port 3001)
┌──────────────────┐
│ Ingestion Service│
│   • Validation   │
│   • Timestamp    │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────┐
│ Kafka │  │ Redis │
│Topic: │  │Cache  │
│station│  │30s TTL│
│.telem │  └───────┘
└───┬───┘
    │
    ▼ Subscribe
┌──────────────────┐
│ Features Service │
│   • Wait time    │
│   • Reliability  │
│   • Availability │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────┐
│ Kafka │  │ Redis │
│station│  │Cache  │
│.feats │  │       │
└───┬───┘  └───────┘
    │
    ▼ Subscribe
┌──────────────────┐
│ Scoring Service  │
│   • Multi-obj    │
│   • AI adjust    │
│   • Confidence   │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────┐
│ Kafka │  │ Redis │
│station│  │Sorted │
│.scores│  │Set    │
└───────┘  └───────┘
```

### 2. Recommendation Request Flow

```
Client App
    │
    ▼ GET/POST /recommend (Port 3000)
┌──────────────────┐
│   API Gateway    │
│   • Validation   │
│   • Rate limit   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│Recommendation Svc│◄────── Redis Cache (check)
│   • Context      │
│   • Request log  │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Optimization Svc │◄────── Redis Sorted Set (rankings)
│   • Constraints  │◄────── Redis (features, predictions)
│   • Distance adj │
│   • Top-K select │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   LLM Service    │
│   • Explanation  │
│   • Groq/Local   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Cache & Log     │
│   • Redis 5min   │
│   • PostgreSQL   │
└──────────────────┘
         │
         ▼
    Response to Client
```

---

## Kafka Integration

### Topics

| Topic Name | Publisher | Consumer | Message Type |
|------------|-----------|----------|--------------|
| `station.telemetry` | Ingestion Service | Features Service | StationTelemetry |
| `station.health` | Ingestion Service | - | StationHealth |
| `station.features` | Features Service | Scoring Service | StationFeatures |
| `station.scores` | Scoring Service | - | StationScore |
| `station.predictions` | AI Service | Scoring Service | Predictions |
| `grid.status` | Ingestion Service | - | GridStatus |
| `user.context` | Ingestion Service | - | UserContext |
| `recommendations` | Recommendation Svc | - | Recommendation |

### Message Format

All Kafka messages use JSON serialization with GZIP compression:

```typescript
// Message envelope
{
  key: string;           // Partition key (e.g., stationId)
  value: JSON;           // Serialized payload
  headers: {
    timestamp: string;   // Unix timestamp
    source: string;      // Service identifier
  }
}
```

### Producing Messages

```typescript
import { createProducer, produceMessage, TOPICS } from './kafka';

const producer = await createProducer();

// Single message
await produceMessage(producer, TOPICS.stationTelemetry, stationId, {
  stationId: 'ST_101',
  queueLength: 5,
  avgServiceTime: 6,
  availableChargers: 4,
  totalChargers: 10,
  faultRate: 0.01,
  availablePower: 380,
  maxCapacity: 500,
  timestamp: Date.now() / 1000
});
```

### Consuming Messages

```typescript
import { createConsumer, TOPICS, parseMessage } from './kafka';

const consumer = await createConsumer('my-service');

await consumer.subscribe({ 
  topic: TOPICS.stationTelemetry, 
  fromBeginning: false 
});

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const telemetry = parseMessage<StationTelemetry>(message.value);
    if (telemetry) {
      // Process telemetry
    }
  },
});
```

---

## Redis Integration

### Key Patterns

```typescript
const REDIS_KEYS = {
  // Station data
  stationScore:     'station:score:{stationId}',
  stationFeatures:  'station:features:{stationId}',
  stationTelemetry: 'station:telemetry:{stationId}',
  stationHealth:    'station:health:{stationId}',
  
  // Predictions
  loadForecast:     'prediction:load:{stationId}',
  faultPrediction:  'prediction:fault:{stationId}',
  
  // User data
  userSession:      'user:session:{sessionId}',
  userContext:      'user:context:{userId}',
  
  // Rankings
  stationRanking:   'ranking:stations',  // Sorted set
  
  // Grid data
  gridStatus:       'grid:status:{gridId}',
  
  // Metrics
  metricsCounter:   'metrics:counter:{name}',
  metricsGauge:     'metrics:gauge:{name}',
  
  // Locks
  lock:             'lock:{resource}',
};
```

### TTL Configuration

| Data Type | TTL | Purpose |
|-----------|-----|---------|
| Station Score | 30s | Frequent updates from scoring |
| Station Features | 30s | Calculated from telemetry |
| Predictions | 60s | AI predictions cached |
| User Session | 3600s (1hr) | Session persistence |
| Recommendations | 300s (5min) | Short-lived cache |

### Using Redis Client

```typescript
import { 
  setWithTTL, 
  getJSON, 
  addToSortedSet, 
  getTopFromSortedSet,
  REDIS_KEYS 
} from './redis';

// Cache station score
await setWithTTL(
  REDIS_KEYS.stationScore('ST_101'),
  scoreData,
  30 // TTL in seconds
);

// Retrieve cached data
const score = await getJSON<StationScore>(
  REDIS_KEYS.stationScore('ST_101')
);

// Add to ranking sorted set
await addToSortedSet(
  REDIS_KEYS.stationRanking,
  0.85,  // score
  'ST_101'  // member
);

// Get top 10 stations
const topStations = await getTopFromSortedSet(
  REDIS_KEYS.stationRanking,
  10
);
// Returns: [{ member: 'ST_101', score: 0.85 }, ...]
```

---

## Database Integration

### Schema Overview

```sql
-- Stations master data
CREATE TABLE stations (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  total_chargers INTEGER,
  charger_types TEXT[], -- PostgreSQL array
  max_capacity DECIMAL(10, 2),
  operating_hours VARCHAR(100),
  amenities TEXT[],
  region VARCHAR(100),
  grid_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User recommendation requests
CREATE TABLE user_requests (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  session_id VARCHAR(100),
  request JSONB NOT NULL,
  response JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  processing_time INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recommendation logs
CREATE TABLE recommendation_logs (
  id SERIAL PRIMARY KEY,
  request_id VARCHAR(100) UNIQUE NOT NULL,
  user_id VARCHAR(100) NOT NULL,
  station_ids TEXT[],
  selected_station_id VARCHAR(50),
  feedback_rating INTEGER,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System events
CREATE TABLE system_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  source_service VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Repository Pattern

```typescript
import { stationRepository, userRequestRepository } from './db';

// Find all stations
const stations = await stationRepository.findAll();

// Find by ID
const station = await stationRepository.findById('ST_101');

// Find by region
const regionalStations = await stationRepository.findByRegion('downtown');

// Create user request
const requestId = await userRequestRepository.create({
  userId: 'USR_001',
  sessionId: 'SES_abc123',
  request: recommendationRequest,
});

// Update with response
await userRequestRepository.updateResponse(
  requestId,
  recommendation,
  processingTime
);
```

---

## External AI Services

### Service Endpoints

The platform integrates with external AI services for predictions. In development, a mock service is provided:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ai/load-forecast?stationId=ST_101` | GET | Load prediction for station |
| `/ai/fault-probability?stationId=ST_101` | GET | Fault probability prediction |
| `/ai/batch-predict` | POST | Batch predictions for multiple stations |

### Load Forecast Response

```json
{
  "stationId": "ST_101",
  "predictedLoad": 0.75,
  "confidence": 0.85,
  "peakTimeStart": "17:00",
  "peakTimeEnd": "19:00",
  "timestamp": 1736500000
}
```

### Fault Prediction Response

```json
{
  "stationId": "ST_101",
  "faultProbability": 0.05,
  "predictedFaultType": null,
  "riskLevel": "low",
  "confidence": 0.90,
  "timestamp": 1736500000
}
```

### Circuit Breaker Pattern

The platform uses the Cockatiel library for resilient external calls:

```typescript
import { 
  circuitBreaker, 
  ConsecutiveBreaker, 
  retry,
  wrap 
} from 'cockatiel';

// Circuit breaker: Opens after 5 consecutive failures
const circuitBreakerPolicy = circuitBreaker(handleAll, {
  halfOpenAfter: 30000, // 30 seconds
  breaker: new ConsecutiveBreaker(5),
});

// Retry policy: 3 attempts with exponential backoff
const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({
    initialDelay: 500,
    maxDelay: 5000,
  }),
});

// Combined policy
const resilientPolicy = wrap(retryPolicy, circuitBreakerPolicy);
```

### Fallback Predictions

When external AI services are unavailable, the platform generates simulated predictions:

```typescript
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
```

---

## API Integration Examples

### 1. Ingest Station Telemetry

**Ingestion Service (Port 3001)**

```bash
# Single station
curl -X POST "http://localhost:3001/ingest/station" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "ST_101",
    "queueLength": 5,
    "avgServiceTime": 6,
    "availableChargers": 4,
    "totalChargers": 10,
    "faultRate": 0.01,
    "availablePower": 380,
    "maxCapacity": 500
  }'

# Batch ingestion
curl -X POST "http://localhost:3001/ingest/station/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "stations": [
      {"stationId": "ST_101", "queueLength": 5, ...},
      {"stationId": "ST_102", "queueLength": 2, ...}
    ]
  }'
```

### 2. Ingest Station Health

**Ingestion Service (Port 3001)** - Required before querying health

```bash
curl -X POST "http://localhost:3001/ingest/health" \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "ST_101",
    "status": "operational",
    "lastMaintenanceDate": "2026-01-15",
    "uptimePercentage": 99.5,
    "activeAlerts": [],
    "healthScore": 95,
    "timestamp": 1736500000
  }'
```

### 3. Get Recommendations

**API Gateway (Port 3000)**

```bash
# GET request with query parameters
curl "http://localhost:3000/recommend?userId=USR_001&lat=37.7749&lon=-122.4194&batteryLevel=25&chargerType=fast&maxWaitTime=15&limit=5"

# POST request with body
curl -X POST "http://localhost:3000/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USR_001",
    "location": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "vehicleType": "Tesla Model 3",
    "batteryLevel": 25,
    "preferredChargerType": "fast",
    "maxWaitTime": 15,
    "maxDistance": 10,
    "limit": 5
  }'
```

### 4. Record Selection & Feedback

**Recommendation Service (Port 3005)**

```bash
# Record station selection
curl -X POST "http://localhost:3005/recommend/REQ_abc123/select" \
  -H "Content-Type: application/json" \
  -d '{"stationId": "ST_101"}'

# Submit feedback
curl -X POST "http://localhost:3005/recommend/REQ_abc123/feedback" \
  -H "Content-Type: application/json" \
  -d '{"rating": 5}'
```

### 5. Query Station Data

**API Gateway (Port 3000)**

```bash
# Get station score
curl "http://localhost:3000/station/ST_101/score"

# Get station health (must ingest first)
curl "http://localhost:3000/station/ST_101/health"

# Get AI predictions
curl "http://localhost:3000/station/ST_101/predictions"
```

### 6. Admin Endpoints

**API Gateway (Port 3000)**

```bash
# System summary with LLM narrative
curl "http://localhost:3000/admin/summary"

# System metrics
curl "http://localhost:3000/admin/metrics"

# List all stations
curl "http://localhost:3000/admin/stations"

# Get system events
curl "http://localhost:3000/admin/events?limit=50&severity=error"
```

---

## Webhook & Event Integration

### System Events

The platform logs system events to PostgreSQL for monitoring:

```typescript
// Event types
type EventType = 
  | 'service_start'
  | 'service_stop'
  | 'api_error'
  | 'telemetry_ingested'
  | 'features_engineered'
  | 'station_scored'
  | 'recommendation_generated'
  | 'station_selected'
  | 'feedback_recorded';

// Severity levels
type Severity = 'info' | 'warning' | 'error' | 'critical';
```

### Logging Events

```typescript
import { systemEventRepository } from './db';

await systemEventRepository.create({
  eventType: 'recommendation_generated',
  severity: 'info',
  message: 'Recommendation generated for user',
  metadata: {
    requestId: 'REQ_abc123',
    userId: 'USR_001',
    stationCount: 5,
  },
  sourceService: 'recommendation',
});
```

### Querying Events

```bash
# Get recent events
curl "http://localhost:3000/admin/events?limit=100"

# Filter by severity
curl "http://localhost:3000/admin/events?severity=error"
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error type description",
  "message": "Detailed error message (dev only)",
  "details": [
    {"path": "field", "message": "Validation error"}
  ],
  "timestamp": "2026-01-27T10:00:00Z"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/query |
| 202 | Accepted | Async processing started (ingestion) |
| 400 | Bad Request | Validation failed |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected error |
| 503 | Service Unavailable | System not ready |

### Error Handling Best Practices

```typescript
// Client-side error handling
try {
  const response = await fetch('http://localhost:3000/recommend?...');
  const data = await response.json();
  
  if (!data.success) {
    if (response.status === 400) {
      // Handle validation errors
      console.error('Validation failed:', data.details);
    } else if (response.status === 429) {
      // Handle rate limiting - wait and retry
      await sleep(1000);
      return retry();
    } else if (response.status === 404) {
      // Handle not found
      console.error('Resource not found:', data.error);
    }
  }
} catch (networkError) {
  // Handle network errors
  console.error('Network error:', networkError);
}
```

---

## Authentication & Security

### Current State (Development)

The platform currently operates without authentication for development purposes.

### Production Recommendations

1. **JWT Authentication**
   ```typescript
   // Recommended header
   Authorization: Bearer <jwt-token>
   ```

2. **API Key Authentication** (for IoT devices)
   ```typescript
   // Recommended header
   X-API-Key: <api-key>
   ```

3. **CORS Configuration**
   ```typescript
   // Current (development)
   origin: '*'
   
   // Production
   origin: ['https://your-domain.com']
   ```

4. **Security Headers** (via Helmet.js)
   - Content-Security-Policy
   - X-Content-Type-Options
   - X-Frame-Options
   - X-XSS-Protection

---

## Rate Limiting

### Default Limits

| Limit | Value | Window |
|-------|-------|--------|
| General API | 100 requests | 1 minute |
| Ingestion | 1000 requests | 1 minute |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1736500060
```

### Rate Limit Response

```json
{
  "error": "Too many requests, please try again later"
}
```

---

## Monitoring & Observability

### Health Checks

All services expose health endpoints:

```bash
# Check API Gateway
curl http://localhost:3000/health

# Check Ingestion Service
curl http://localhost:3001/health

# Check readiness
curl http://localhost:3000/ready
```

### Health Response Format

```json
{
  "status": "healthy",
  "timestamp": "2026-01-27T10:00:00Z",
  "services": {
    "database": "up",
    "api": "up"
  }
}
```

### Metrics Endpoint

```bash
curl http://localhost:3000/admin/metrics
```

```json
{
  "success": true,
  "data": {
    "kafka": {
      "consumerLag": 0,
      "messagesPerSecond": 10.5
    },
    "redis": {
      "hitRatio": 0.85,
      "memoryUsage": 1048576,
      "connectedClients": 5
    },
    "api": {
      "requestsPerSecond": 25.3,
      "avgLatency": 45,
      "errorRate": 0.01
    },
    "services": {
      "api": {"status": "up", "uptime": 3600},
      "database": {"status": "up"},
      "externalAI": {"status": "up"}
    }
  }
}
```

### Logging

Logs are JSON-formatted for easy parsing:

```json
{
  "level": "info",
  "message": "Recommendation generated",
  "timestamp": "2026-01-27T10:00:00Z",
  "service": "recommendation",
  "meta": {
    "requestId": "REQ_abc123",
    "userId": "USR_001",
    "processingTime": 150
  }
}
```

### Monitoring UIs

| Service | URL | Purpose |
|---------|-----|---------|
| Kafka UI | http://localhost:8082 | Message broker monitoring |
| RedisInsight | http://localhost:8005 | Redis cache inspection |
| pgAdmin | http://localhost:5050 | Database management |

---

## SDK Integration (Future)

### TypeScript/JavaScript SDK (Planned)

```typescript
import { EVPlatformClient } from '@ev-platform/sdk';

const client = new EVPlatformClient({
  apiUrl: 'http://localhost:3000',
  apiKey: 'your-api-key',
});

// Get recommendations
const recommendations = await client.recommend({
  userId: 'USR_001',
  location: { latitude: 37.7749, longitude: -122.4194 },
  batteryLevel: 25,
});

// Ingest telemetry
await client.ingestTelemetry({
  stationId: 'ST_101',
  queueLength: 5,
  // ...
});
```

---

## Quick Start Integration Checklist

1. **Start Infrastructure**
   ```bash
   npm run infra:up
   ```

2. **Start Services**
   ```bash
   npm run dev
   ```

3. **Seed Test Data**
   ```bash
   npm run db:seed
   ```

4. **Ingest Sample Telemetry**
   ```bash
   curl -X POST "http://localhost:3001/ingest/station" \
     -H "Content-Type: application/json" \
     -d '{"stationId": "ST_101", "queueLength": 3, "avgServiceTime": 5, "availableChargers": 8, "totalChargers": 10, "faultRate": 0.01, "availablePower": 400, "maxCapacity": 500}'
   ```

5. **Get Recommendations**
   ```bash
   curl "http://localhost:3000/recommend?userId=USR_001&lat=37.7749&lon=-122.4194&limit=3"
   ```

6. **Check System Health**
   ```bash
   curl "http://localhost:3000/admin/summary"
   ```

---

## Support & Resources

- **API Reference**: See [API_REFERENCE.md](./API_REFERENCE.md)
- **OpenAPI Spec**: See [openspec.yml](../openspec.yml)
- **Implementation Details**: See [IMPLEMENTATION.md](./IMPLEMENTATION.md)
- **Workflow Guide**: See [WORKFLOW.md](./WORKFLOW.md)
