# 📘 EV Charging Platform - Implementation Guide

Complete technical documentation for the real-time EV charging recommendation system.

> **Navigation:** [README](../README.md) | [Workflow](WORKFLOW.md) | [API Reference](API_REFERENCE.md)

## Table of Contents

1. [System Overview](#system-overview)
2. [Data Flow](#data-flow)
3. [Feature Engineering](#feature-engineering)
4. [Scoring Algorithm](#scoring-algorithm)
5. [Optimization Engine](#optimization-engine)
6. [LLM Integration](#llm-integration)
7. [Caching Strategy](#caching-strategy)
8. [Error Handling](#error-handling)
9. [Scaling Considerations](#scaling-considerations)

---

## System Overview

### Architecture Principles

1. **Event-Driven**: All data flows through Kafka topics
2. **Stateless Services**: Services can be scaled horizontally
3. **Cache-First**: Redis for hot data, PostgreSQL for cold
4. **Resilient**: Circuit breakers for external dependencies
5. **Observable**: Structured logging and metrics

### Service Communication

```
┌─────────────┐     Kafka      ┌─────────────┐
│  Ingestion  │ ──────────────▶│  Features   │
└─────────────┘                └─────────────┘
                                     │
                                     │ Kafka
                                     ▼
                               ┌─────────────┐
                               │   Scoring   │
                               └─────────────┘
                                     │
                                     │ Redis
                                     ▼
┌─────────────┐    HTTP       ┌─────────────┐
│     API     │◀──────────────│Optimization │
└─────────────┘               └─────────────┘
```

---

## Data Flow

### 1. Telemetry Ingestion

**Input**: IoT devices send telemetry via HTTP POST

```json
{
  "stationId": "ST_101",
  "queueLength": 5,
  "avgServiceTime": 6,
  "availableChargers": 4,
  "totalChargers": 10,
  "faultRate": 0.01,
  "availablePower": 380,
  "maxCapacity": 500,
  "timestamp": 1736500000
}
```

**Processing**:
1. Validate schema with Zod
2. Publish to `station.telemetry` Kafka topic
3. Cache in Redis with 30s TTL

### 2. Feature Engineering

**Consumes**: `station.telemetry`  
**Produces**: `station.features`

```typescript
// Feature calculations
const effectiveWaitTime = queueLength * avgServiceTime;
const reliabilityScore = 1 - faultRate;
const energyStabilityIndex = availablePower / maxCapacity;
const chargerAvailabilityRatio = availableChargers / totalChargers;
```

### 3. Scoring

**Consumes**: `station.features`  
**Produces**: Scores to Redis sorted set

### 4. Recommendation

**Triggered by**: API request  
**Flow**:
1. Query optimization engine
2. Fetch Top-K from Redis
3. Apply user preferences
4. Generate LLM explanation
5. Return response

---

## Feature Engineering

### Raw Features to Engineered Features

| Raw Input | Engineered Feature | Formula |
|-----------|-------------------|---------|
| queueLength, avgServiceTime | effectiveWaitTime | `queueLength × avgServiceTime` |
| faultRate | reliabilityScore | `1 - faultRate` |
| availablePower, maxCapacity | energyStabilityIndex | `availablePower / maxCapacity` |
| availableChargers, totalChargers | chargerAvailabilityRatio | `availableChargers / totalChargers` |

### Normalization

All features are normalized to [0, 1] range:

```typescript
// Standard normalization
function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// Inverse normalization (lower is better)
function normalizeInverse(value: number, min: number, max: number): number {
  return 1 - normalize(value, min, max);
}
```

**Normalization Ranges**:

| Feature | Min | Max | Normalization Type |
|---------|-----|-----|-------------------|
| Wait Time | 0 min | 60 min | Inverse (lower is better) |
| Availability | 0% | 100% | Standard |
| Reliability | 0% | 100% | Standard |
| Distance | 0 km | 50 km | Inverse |
| Energy Stability | 0% | 100% | Standard |

---

## Scoring Algorithm

### Multi-Objective Weighted Sum

```typescript
Score = w1 × waitTimeScore 
      + w2 × availabilityScore 
      + w3 × reliabilityScore 
      + w4 × distanceScore 
      + w5 × energyStabilityScore
```

### Default Weights

```typescript
const WEIGHTS = {
  waitTime: 0.25,        // 25% - User experience priority
  availability: 0.20,    // 20% - Service availability
  reliability: 0.20,     // 20% - Station health
  distance: 0.20,        // 20% - Convenience
  energyStability: 0.15, // 15% - Grid health
};
```

### AI Prediction Adjustments

```typescript
// High load prediction penalty
if (predictedLoad > 0.8) {
  score *= (1 - (predictedLoad - 0.8) * 0.5);
}

// Fault risk penalty
switch (riskLevel) {
  case 'high': score *= 0.7; break;
  case 'medium': score *= 0.9; break;
  case 'low': /* no adjustment */ break;
}
```

### Confidence Score

```typescript
const dataAge = currentTime - featureTimestamp;
const agePenalty = Math.min(dataAge / 300, 1); // Max penalty after 5 min
const confidence = Math.max(0, 1 - agePenalty * 0.3);
```

---

## Optimization Engine

### Constraint Handling

```typescript
const CONSTRAINTS = {
  minCapacityRatio: 0.1,      // At least 10% capacity
  maxFaultProbability: 0.3,   // Max 30% fault risk
  minHealthScore: 50,         // Min health of 50/100
  maxQueueLength: 10,         // Max queue
  validStatuses: ['operational', 'degraded'],
};
```

### Top-K Selection Algorithm

```python
# Pseudocode
function getTopK(userLocation, k, constraints):
    candidates = getFromRedisSortedSet(k * 3)  # Get more than needed
    
    results = []
    for station in candidates:
        if not checkConstraints(station, constraints):
            continue
        
        distance = calculateDistance(userLocation, station.location)
        if distance > maxDistance:
            continue
        
        adjustedScore = applyDistanceDecay(station.score, distance)
        results.append({...station, adjustedScore})
        
        if len(results) >= k:
            break
    
    return sortByScore(results)[:k]
```

### Distance Decay Function

```typescript
// Exponential decay for distance
function calculateDistanceAdjustedScore(
  baseScore: number,
  distance: number,
  maxDistance: number = 50
): number {
  const distancePenalty = Math.exp(-distance / (maxDistance / 3));
  return baseScore * distancePenalty;
}
```

---

## LLM Integration

### Explanation Generation Flow

```
┌─────────────────┐
│ Recommendation  │
│    Context      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Prompt    │
│   Template      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     No API Key    ┌──────────────────┐
│   Groq API      │ ─────────────────▶│ Fallback Template│
│   (LLaMA 3.3)   │                   │   Generator      │
└────────┬────────┘                   └────────┬─────────┘
         │                                     │
         └─────────────┬───────────────────────┘
                       ▼
              ┌─────────────────┐
              │ User-Friendly   │
              │  Explanation    │
              └─────────────────┘
```

### Prompt Template Structure

```typescript
const prompt = `
You are an AI assistant helping EV drivers find charging stations.

Based on analysis of ${totalCandidates} stations:

USER REQUEST:
- Location: ${latitude}, ${longitude}
- Battery: ${batteryLevel}%
- Preferred Charger: ${preferredChargerType}

TOP RECOMMENDATION:
- Station: ${topStation.name}
- Score: ${topStation.score * 100}%
- Distance: ${topStation.distance} km
- Wait Time: ${topStation.waitTime} minutes

Generate a 2-3 sentence explanation focusing on practical benefits.
`;
```

### Fallback Explanation Generator

When Groq is unavailable, generates rule-based explanations:

```typescript
function generateFallbackExplanation(context): string {
  const parts = [];
  
  // Distance
  if (topStation.distance < 5) {
    parts.push(`it's only ${distance} km away`);
  }
  
  // Wait time
  if (topStation.waitTime < 5) {
    parts.push(`with minimal wait time`);
  }
  
  // Availability
  if (topStation.availableChargers > 3) {
    parts.push(`has ${count} chargers available`);
  }
  
  return `${topStation.name} is recommended because ${parts.join(' and ')}.`;
}
```

---

## Caching Strategy

### Redis Key Structure

```
ev:station:telemetry:{stationId}   - Latest telemetry (TTL: 30s)
ev:station:features:{stationId}    - Engineered features (TTL: 30s)
ev:station:score:{stationId}       - Calculated score (TTL: 30s)
ev:station:health:{stationId}      - Health status (TTL: 30s)
ev:prediction:load:{stationId}     - Load forecast (TTL: 60s)
ev:prediction:fault:{stationId}    - Fault prediction (TTL: 60s)
ev:user:context:{userId}           - User context (TTL: 3600s)
ev:ranking:stations                - Sorted set of all scores
```

### Cache TTLs

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Telemetry | 30s | Fresh data critical |
| Features | 30s | Derived from telemetry |
| Scores | 30s | Must reflect latest state |
| Predictions | 60s | AI updates less frequently |
| User Context | 1hr | User sessions are longer |
| Rankings | ∞ | Updated by scoring service |

### Cache-Aside Pattern

```typescript
async function getStationScore(stationId: string): Promise<Score> {
  // Try cache first
  const cached = await redis.get(`station:score:${stationId}`);
  if (cached) return JSON.parse(cached);
  
  // Calculate fresh if not cached
  const score = await calculateScore(stationId);
  
  // Cache for next time
  await redis.setex(`station:score:${stationId}`, 30, JSON.stringify(score));
  
  return score;
}
```

---

## Error Handling

### Circuit Breaker Pattern

```typescript
import { CircuitBreakerPolicy, ConsecutiveBreaker } from 'cockatiel';

const circuitBreaker = new CircuitBreakerPolicy(
  handleAll,
  {
    halfOpenAfter: 30000,  // Try again after 30s
    breaker: new ConsecutiveBreaker(5),  // Open after 5 failures
  }
);

// Usage
const result = await circuitBreaker.execute(async () => {
  return await externalAIService.predict(stationId);
});
```

### Retry Strategy

```typescript
const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: {
    type: 'exponential',
    initialDelay: 500,
    maxDelay: 5000,
  },
});
```

### Graceful Degradation

```
External AI Available → Use AI predictions
         │
         │ Circuit Open
         ▼
Use Simulated Predictions → Continue serving requests
```

---

## Scaling Considerations

### Horizontal Scaling

| Service | Scaling Strategy |
|---------|------------------|
| API Gateway | Load balancer + multiple instances |
| Ingestion | Multiple instances, partitioned by stationId |
| Features | Consumer groups, one per partition |
| Scoring | Consumer groups, one per partition |
| Optimization | Stateless, scale freely |

### Kafka Partitioning

```typescript
// Partition by station ID for ordering guarantees
const partition = hash(stationId) % numPartitions;
```

### Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_station_history_station_id ON station_history(station_id);
CREATE INDEX idx_station_history_created_at ON station_history(created_at);
CREATE INDEX idx_user_requests_user_id ON user_requests(user_id);
CREATE INDEX idx_stations_location ON stations(latitude, longitude);
```

### Redis Cluster

For production, use Redis Cluster:

```yaml
# docker-compose.prod.yml
redis:
  image: redis:7-alpine
  command: redis-server --cluster-enabled yes
```

---

## Monitoring

### Key Metrics

| Metric | Type | Alert Threshold |
|--------|------|-----------------|
| `api.request.latency` | Histogram | p99 > 500ms |
| `recommendation.latency` | Histogram | p99 > 300ms |
| `kafka.consumer.lag` | Gauge | > 1000 messages |
| `redis.cache.hit_ratio` | Gauge | < 0.7 |
| `external_ai.circuit.state` | Gauge | open |

### Structured Logging

```typescript
logger.info('recommendation_generated', {
  requestId: 'REQ_123',
  userId: 'USR_001',
  stationCount: 5,
  processingTime: 145,
  topStation: 'ST_101',
});
```

---

## Security Best Practices

1. **Input Validation**: All inputs validated with Zod schemas
2. **Rate Limiting**: 100 requests/minute per client
3. **CORS**: Restricted origins in production
4. **Helmet**: Security headers enabled
5. **Secrets**: Environment variables, not hardcoded
6. **SQL Injection**: Parameterized queries via Knex
7. **Auth**: Add JWT/OAuth for production

---

## Testing Strategy

### Unit Tests
- Feature engineering calculations
- Scoring algorithm
- Normalization functions

### Integration Tests
- Kafka message flow
- Redis caching
- Database operations

### E2E Tests
- Full recommendation flow
- API endpoint testing

### Load Tests
- Simulate 1000 concurrent users
- Measure latency percentiles
- Identify bottlenecks

---

This documentation provides a complete technical reference for understanding, maintaining, and extending the EV Charging Platform backend.

---

> **Navigation:** [Back to README](../README.md) | [Workflow Documentation](WORKFLOW.md) | [API Reference](API_REFERENCE.md)
