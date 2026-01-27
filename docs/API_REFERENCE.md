# API Reference

Complete API documentation for the EV Charging Platform.

## Base URL

```
Development: http://localhost:3000
Production:  https://api.ev-platform.com
```

## Authentication

Currently, the API is open. For production, implement JWT/OAuth2:

```http
Authorization: Bearer <token>
```

---

## Public Endpoints

### Station Data Ingestion

#### POST `/ingest/station`

Ingest real-time station telemetry data.

**Request Body:**

```json
{
  "stationId": "ST_101",
  "queueLength": 5,
  "avgServiceTime": 6,
  "availableChargers": 4,
  "totalChargers": 10,
  "faultRate": 0.01,
  "availablePower": 380,
  "maxCapacity": 500
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| stationId | string | Yes | Unique station identifier |
| queueLength | number | No | Current queue length |
| avgServiceTime | number | No | Average service time (minutes) |
| availableChargers | number | No | Available chargers count |
| totalChargers | number | No | Total chargers at station |
| faultRate | number | No | Fault rate (0-1) |
| availablePower | number | No | Available power (kW) |
| maxCapacity | number | No | Maximum capacity (kW) |

**Response:**

```json
{
  "success": true,
  "message": "Telemetry ingested",
  "stationId": "ST_101"
}
```

**Status Codes:**
- `202 Accepted` - Data accepted for processing
- `400 Bad Request` - Validation failed
- `500 Internal Server Error` - Processing failed

---

#### POST `/ingest/station/batch`

Ingest multiple station telemetry records at once.

**Request Body:**

```json
{
  "stations": [
    {
      "stationId": "ST_101",
      "queueLength": 5,
      "availableChargers": 4
    },
    {
      "stationId": "ST_102",
      "queueLength": 2,
      "availableChargers": 8
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Batch ingested",
  "stats": {
    "succeeded": 2,
    "failed": 0,
    "total": 2
  }
}
```

---

#### POST `/ingest/user-context`

Ingest user context for personalized recommendations.

**Request Body:**

```json
{
  "userId": "USR_001",
  "sessionId": "SES_abc123",
  "currentLocation": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "vehicleType": "Tesla Model 3",
  "batteryLevel": 25,
  "preferredChargerType": "fast",
  "maxWaitTime": 15,
  "maxDistance": 10,
  "timestamp": 1736500000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | Yes | User identifier |
| sessionId | string | Yes | Session identifier |
| currentLocation | object | Yes | {latitude, longitude} |
| vehicleType | string | Yes | Vehicle model |
| batteryLevel | number | Yes | Battery percentage (0-100) |
| preferredChargerType | string | Yes | "fast", "standard", or "any" |
| maxWaitTime | number | Yes | Max acceptable wait (minutes) |
| maxDistance | number | Yes | Max acceptable distance (km) |
| timestamp | number | Yes | Unix timestamp |

**Response:**

```json
{
  "success": true,
  "message": "User context ingested",
  "userId": "USR_001"
}
```

---

### Recommendations

#### GET `/recommend`

Get charging station recommendations.

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| userId | string | Yes | - | User identifier |
| lat | number | Yes | - | User latitude |
| lon | number | Yes | - | User longitude |
| vehicleType | string | No | - | Vehicle type |
| batteryLevel | number | No | - | Battery % (0-100) |
| chargerType | string | No | "any" | "fast", "standard", "any" |
| maxWaitTime | number | No | - | Max wait time (minutes) |
| maxDistance | number | No | - | Max distance (km) |
| limit | number | No | 5 | Number of results (1-20) |

**Example Request:**

```bash
curl "http://localhost:3000/recommend?userId=USR_001&lat=37.7749&lon=-122.4194&limit=3"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "requestId": "REQ_abc123",
    "userId": "USR_001",
    "recommendations": [
      {
        "stationId": "ST_101",
        "stationName": "Downtown EV Hub",
        "location": {
          "latitude": 37.7749,
          "longitude": -122.4194
        },
        "address": "123 Main Street, Downtown",
        "score": 0.87,
        "rank": 1,
        "estimatedWaitTime": 5,
        "estimatedDistance": 2.3,
        "availableChargers": 8,
        "chargerTypes": ["CCS", "CHAdeMO", "Type2"],
        "pricePerKwh": 0.30,
        "features": {
          "effectiveWaitTime": 5,
          "stationReliabilityScore": 0.99,
          "energyStabilityIndex": 0.92,
          "chargerAvailabilityRatio": 0.67
        },
        "predictions": {
          "load": {
            "predictedLoad": 0.65,
            "confidence": 0.85
          },
          "fault": {
            "faultProbability": 0.02,
            "riskLevel": "low"
          }
        }
      }
    ],
    "explanation": "Downtown EV Hub is recommended because it's only 2.3 km away with a 5 minute wait time and has 8 chargers available. The station has excellent reliability.",
    "generatedAt": "2026-01-27T10:00:00Z",
    "expiresAt": "2026-01-27T10:05:00Z"
  },
  "meta": {
    "processingTime": 145,
    "cacheHit": false
  }
}
```

---

#### POST `/recommend`

Get recommendations via POST (same as GET but with body).

**Request Body:**

```json
{
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
}
```

---

#### GET `/recommend/:requestId`

Retrieve a cached recommendation by request ID.

**Example:**

```bash
curl http://localhost:3000/recommend/REQ_abc123
```

**Response:**

Same format as recommendation response, with `cacheHit: true`.

---

#### POST `/recommend/:requestId/select`

Record when user selects a station from recommendations.

**Request Body:**

```json
{
  "stationId": "ST_101"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Selection recorded"
}
```

---

#### POST `/recommend/:requestId/feedback`

Submit feedback on recommendation quality.

**Request Body:**

```json
{
  "rating": 5
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| rating | number | Yes | Rating 1-5 |

**Response:**

```json
{
  "success": true,
  "message": "Feedback recorded"
}
```

---

## Admin Endpoints

### Station Information

#### GET `/station/:id/score`

Get real-time score for a specific station.

**Example:**

```bash
curl http://localhost:3000/station/ST_101/score
```

**Response:**

```json
{
  "success": true,
  "data": {
    "stationId": "ST_101",
    "overallScore": 0.87,
    "componentScores": {
      "waitTimeScore": 0.92,
      "availabilityScore": 0.85,
      "reliabilityScore": 0.95,
      "distanceScore": 0.78,
      "energyStabilityScore": 0.88
    },
    "rank": 1,
    "confidence": 0.95,
    "timestamp": 1736500000
  },
  "meta": {
    "timestamp": 1736500100,
    "freshness": "cached"
  }
}
```

---

#### GET `/station/:id/health`

Get health status for a station.

**Response:**

```json
{
  "success": true,
  "data": {
    "stationId": "ST_101",
    "status": "operational",
    "lastMaintenanceDate": "2026-01-15",
    "uptimePercentage": 99.5,
    "activeAlerts": [],
    "healthScore": 95,
    "timestamp": 1736500000
  }
}
```

---

#### GET `/station/:id/predictions`

Get AI predictions for a station.

**Response:**

```json
{
  "success": true,
  "data": {
    "loadForecast": {
      "stationId": "ST_101",
      "predictedLoad": 0.65,
      "confidence": 0.85,
      "peakTimeStart": "17:00",
      "peakTimeEnd": "19:00",
      "timestamp": 1736500000
    },
    "faultPrediction": {
      "stationId": "ST_101",
      "faultProbability": 0.02,
      "predictedFaultType": null,
      "riskLevel": "low",
      "confidence": 0.9,
      "timestamp": 1736500000
    }
  }
}
```

---

### Admin Dashboard

#### GET `/admin/summary`

Get system-wide summary for admin dashboard.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalStations": 50,
    "operationalStations": 45,
    "degradedStations": 4,
    "offlineStations": 1,
    "totalActiveUsers": 1250,
    "recommendationsToday": 3420,
    "avgResponseTime": 145,
    "cacheHitRatio": 0.85,
    "topStations": [
      {
        "stationId": "ST_101",
        "name": "Downtown EV Hub",
        "recommendationCount": 450
      }
    ],
    "systemHealth": "healthy"
  },
  "narrative": "Network status is healthy with 90% of stations operational. 4 stations are in degraded status and may need attention. Top performing station is Downtown EV Hub with a 87% efficiency score."
}
```

---

#### GET `/admin/metrics`

Get detailed system metrics.

**Response:**

```json
{
  "success": true,
  "data": {
    "kafka": {
      "consumerLag": 0,
      "messagesPerSecond": 150,
      "topicStats": {
        "station.telemetry": { "messages": 5000, "lag": 0 },
        "station.features": { "messages": 5000, "lag": 5 }
      }
    },
    "redis": {
      "hitRatio": 0.85,
      "memoryUsage": 52428800,
      "connectedClients": 10
    },
    "api": {
      "requestsPerSecond": 50,
      "avgLatency": 145,
      "errorRate": 0.01
    },
    "services": {
      "api": { "status": "up", "lastHeartbeat": "2026-01-27T10:00:00Z", "uptime": 86400 },
      "database": { "status": "up", "lastHeartbeat": "2026-01-27T10:00:00Z", "uptime": 86400 },
      "externalAI": { "status": "up", "lastHeartbeat": "2026-01-27T10:00:00Z", "uptime": 86400 }
    }
  }
}
```

---

#### GET `/admin/stations`

List all stations.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "ST_101",
      "name": "Downtown EV Hub",
      "address": "123 Main Street",
      "location": { "latitude": 37.7749, "longitude": -122.4194 },
      "totalChargers": 12,
      "chargerTypes": ["CCS", "CHAdeMO", "Type2"],
      "maxCapacity": 500,
      "operatingHours": "24/7",
      "amenities": ["restroom", "cafe", "wifi"]
    }
  ],
  "count": 50
}
```

---

#### GET `/admin/events`

Get system events log.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | number | No | Max results (default: 100) |
| severity | string | No | Filter by severity |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "eventType": "system_start",
      "severity": "info",
      "message": "EV Platform backend started",
      "metadata": { "version": "1.0.0" },
      "createdAt": "2026-01-27T08:00:00Z"
    }
  ],
  "count": 100
}
```

---

## Health Endpoints

#### GET `/health`

Basic health check.

**Response:**

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

---

#### GET `/ready`

Readiness check (for Kubernetes).

**Response (200):**

```json
{
  "ready": true
}
```

**Response (503):**

```json
{
  "ready": false,
  "reason": "Database not available"
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": [
    { "path": "field.name", "message": "Validation error" }
  ],
  "timestamp": "2026-01-27T10:00:00Z"
}
```

### Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 202 | Accepted (async processing) |
| 400 | Bad Request (validation failed) |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

Default limits:
- 100 requests per minute per IP
- Configurable per endpoint

Headers returned:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1736500060
```

---

## CORS

Development: All origins allowed
Production: Configure allowed origins in environment

```
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```
