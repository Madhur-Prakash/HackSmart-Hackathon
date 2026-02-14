# Frontend Integration Guide

A complete guide for frontend developers integrating with the EV Charging Platform API.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Base URLs](#base-urls)
- [Service Overview](#service-overview)
- [API Endpoints](#api-endpoints)
  - [Health & Status](#1-health--status-endpoints)
  - [Recommendations](#2-recommendation-endpoints)
  - [Station Data](#3-station-data-endpoints)
  - [Admin Dashboard](#4-admin-dashboard-endpoints)
  - [Data Ingestion](#5-data-ingestion-endpoints)
  - [AI Predictions](#6-ai-prediction-endpoints)
- [TypeScript Interfaces](#typescript-interfaces)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

---

## Quick Start

### Installation (Axios example)

```bash
npm install axios
```

### Basic Setup

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get recommendations
const response = await api.get('/recommend', {
  params: {
    userId: 'USR_001',
    lat: 37.7749,
    lon: -122.4194,
    limit: 5,
  },
});

console.log(response.data.data.recommendations);
```

---

## Base URLs

| Service | URL | Used For |
|---------|-----|----------|
| **Unified Backend** | `http://localhost:3000` | All frontend operations |
| **Model API** | `http://localhost:8005` | ML model inference |

> **For Frontend Apps:** Use **port 3000** for all operations. All endpoints are served from a single unified backend.

---

## Service Overview

### What Each Service Does

| Service | Port | Purpose | Frontend Use Case |
|---------|------|---------|-------------------|
| **API Gateway** | 3000 | Main entry point, routes requests | Primary API for all user-facing features |
| **Ingestion Service** | 3001 | Receives IoT/station data | Admin tools for manual data entry |
| **Features Service** | 3002 | Calculates features from telemetry | Background service (no direct frontend use) |
| **Scoring Service** | 3003 | Scores stations based on features | Background service (no direct frontend use) |
| **Optimization Service** | 3004 | Optimizes station rankings | Background service (no direct frontend use) |
| **Recommendation Service** | 3005 | Generates recommendations | Record user selections & feedback |
| **LLM Service** | 3006 | Generates human-readable explanations | Background service (no direct frontend use) |
| **Mock AI Service** | 8081 | Provides AI predictions | Testing/debug only |

---

## API Endpoints

---

## 1. Health & Status Endpoints

### `GET /health` - Check System Health

**Service:** API Gateway (Port 3000)

Verifies the system is operational. Use this for connection status indicators.

#### Request

```javascript
// JavaScript/Fetch
const response = await fetch('http://localhost:3000/health');
const data = await response.json();
```

```typescript
// TypeScript/Axios
const { data } = await axios.get('http://localhost:3000/health');
```

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2026-01-28T10:00:00.000Z",
  "services": {
    "database": "up",
    "api": "up"
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | `"healthy" \| "degraded"` | Overall system status |
| `timestamp` | `string` | ISO 8601 timestamp |
| `services.database` | `"up" \| "down"` | Database connection status |
| `services.api` | `"up" \| "down"` | API service status |

---

### `GET /ready` - Readiness Check

**Service:** API Gateway (Port 3000)

Kubernetes-style readiness probe. Returns 503 if system is not ready.

#### Request

```javascript
const response = await fetch('http://localhost:3000/ready');
```

#### Response (Success - 200)

```json
{
  "ready": true
}
```

#### Response (Not Ready - 503)

```json
{
  "ready": false,
  "reason": "Database not available"
}
```

---

## 2. Recommendation Endpoints

### `GET /recommend` - Get Station Recommendations

**Service:** API Gateway (Port 3000)

⭐ **Primary endpoint for user-facing recommendation features.**

Gets AI-powered charging station recommendations based on user location and preferences.

#### Request

```javascript
// JavaScript/Fetch
const params = new URLSearchParams({
  userId: 'USR_001',
  lat: '37.7749',
  lon: '-122.4194',
  batteryLevel: '25',
  chargerType: 'fast',
  maxWaitTime: '15',
  maxDistance: '10',
  limit: '5'
});

const response = await fetch(`http://localhost:3000/recommend?${params}`);
const data = await response.json();
```

```typescript
// TypeScript/Axios
const { data } = await axios.get('http://localhost:3000/recommend', {
  params: {
    userId: 'USR_001',
    lat: 37.7749,
    lon: -122.4194,
    batteryLevel: 25,
    chargerType: 'fast',
    maxWaitTime: 15,
    maxDistance: 10,
    limit: 5
  }
});
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | ✅ | Unique user identifier |
| `lat` | number | ✅ | User's latitude (-90 to 90) |
| `lon` | number | ✅ | User's longitude (-180 to 180) |
| `vehicleType` | string | ❌ | Vehicle model (e.g., "Tesla Model 3") |
| `batteryLevel` | number | ❌ | Current battery % (0-100) |
| `chargerType` | string | ❌ | `"fast"`, `"standard"`, or `"any"` |
| `maxWaitTime` | number | ❌ | Max acceptable wait (minutes) |
| `maxDistance` | number | ❌ | Max distance (kilometers) |
| `limit` | number | ❌ | Number of results (1-20, default: 5) |

#### Response

```json
{
  "success": true,
  "data": {
    "requestId": "REQ_207e9e22-1526-4765-be1e-1601b631e1c4",
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
        "score": 0.8542,
        "rank": 1,
        "estimatedWaitTime": 5,
        "estimatedDistance": 2.3,
        "availableChargers": 8,
        "chargerTypes": ["CCS", "CHAdeMO", "Type2"],
        "pricePerKwh": 0.30,
        "features": {
          "stationId": "ST_101",
          "effectiveWaitTime": 5.2,
          "stationReliabilityScore": 0.98,
          "energyStabilityIndex": 0.92,
          "chargerAvailabilityRatio": 0.67
        },
        "predictions": {
          "load": {
            "stationId": "ST_101",
            "predictedLoad": 0.65,
            "confidence": 0.85,
            "peakTimeStart": "17:00",
            "peakTimeEnd": "19:00"
          },
          "fault": {
            "stationId": "ST_101",
            "faultProbability": 0.02,
            "riskLevel": "low",
            "confidence": 0.90
          }
        }
      },
      {
        "stationId": "ST_102",
        "stationName": "Westside Charging Station",
        "score": 0.7891,
        "rank": 2,
        "estimatedWaitTime": 8,
        "estimatedDistance": 3.5,
        "availableChargers": 5,
        "chargerTypes": ["CCS", "Type2"],
        "pricePerKwh": 0.28
      }
    ],
    "explanation": "Downtown EV Hub is recommended because it's only 2.3 km away with minimal wait time (5 minutes) and has 8 chargers available. The station has excellent reliability.",
    "generatedAt": "2026-01-28T10:00:00.000Z",
    "expiresAt": "2026-01-28T10:05:00.000Z"
  },
  "meta": {
    "processingTime": 245,
    "cacheHit": false
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether request succeeded |
| `data.requestId` | string | Unique request ID (save for selection/feedback) |
| `data.recommendations[]` | array | Ranked list of stations |
| `data.recommendations[].stationId` | string | Station identifier |
| `data.recommendations[].stationName` | string | Human-readable name |
| `data.recommendations[].score` | number | Ranking score (0-1) |
| `data.recommendations[].rank` | number | Position in results (1-based) |
| `data.recommendations[].estimatedWaitTime` | number | Wait time in minutes |
| `data.recommendations[].estimatedDistance` | number | Distance in kilometers |
| `data.recommendations[].availableChargers` | number | Available charger count |
| `data.recommendations[].chargerTypes` | string[] | Supported charger types |
| `data.recommendations[].pricePerKwh` | number | Price per kWh |
| `data.explanation` | string | LLM-generated explanation |
| `meta.processingTime` | number | Processing time in ms |

---

### `POST /recommend` - Get Recommendations (POST)

**Service:** API Gateway (Port 3000)

Same as GET but accepts JSON body. Better for complex requests.

#### Request

```javascript
const response = await fetch('http://localhost:3000/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'USR_001',
    location: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    vehicleType: 'Tesla Model 3',
    batteryLevel: 25,
    preferredChargerType: 'fast',
    maxWaitTime: 15,
    maxDistance: 10,
    limit: 5
  })
});
```

```typescript
// TypeScript/Axios
const { data } = await axios.post('http://localhost:3000/recommend', {
  userId: 'USR_001',
  location: {
    latitude: 37.7749,
    longitude: -122.4194
  },
  vehicleType: 'Tesla Model 3',
  batteryLevel: 25,
  preferredChargerType: 'fast',
  maxWaitTime: 15,
  maxDistance: 10,
  limit: 5
});
```

#### Request Body

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

#### Response

Same as GET `/recommend` response.

---

### `GET /recommend/{requestId}` - Get Cached Recommendation

**Service:** Recommendation Service (Port 3005) ⚠️

Retrieves a previously generated recommendation. Cache expires after 5 minutes.

#### Request

```javascript
const requestId = 'REQ_207e9e22-1526-4765-be1e-1601b631e1c4';
const response = await fetch(`http://localhost:3000/recommend/${requestId}`);
```

#### Response (Success)

```json
{
  "success": true,
  "data": {
    "requestId": "REQ_207e9e22-1526-4765-be1e-1601b631e1c4",
    "userId": "USR_001",
    "recommendations": [...],
    "explanation": "...",
    "generatedAt": "2026-01-28T10:00:00.000Z",
    "expiresAt": "2026-01-28T10:05:00.000Z"
  },
  "meta": {
    "cacheHit": true
  }
}
```

#### Response (Not Found - 404)

```json
{
  "success": false,
  "error": "Recommendation not found or expired"
}
```

---

### `POST /recommend/{requestId}/select` - Record Station Selection

**Service:** Recommendation Service (Port 3005) ⚠️

Records when user selects a station. Use for analytics and model improvement.

#### Request

```javascript
const requestId = 'REQ_207e9e22-1526-4765-be1e-1601b631e1c4';

const response = await fetch(`http://localhost:3000/recommend/${requestId}/select`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stationId: 'ST_101'
  })
});
```

```typescript
// TypeScript/Axios
await axios.post(`http://localhost:3000/recommend/${requestId}/select`, {
  stationId: 'ST_101'
});
```

#### Request Body

```json
{
  "stationId": "ST_101"
}
```

#### Response

```json
{
  "success": true,
  "message": "Selection recorded"
}
```

---

### `POST /recommend/{requestId}/feedback` - Submit Feedback

**Service:** Recommendation Service (Port 3005) ⚠️

Records user feedback on recommendation quality.

#### Request

```javascript
const requestId = 'REQ_207e9e22-1526-4765-be1e-1601b631e1c4';

const response = await fetch(`http://localhost:3000/recommend/${requestId}/feedback`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rating: 5
  })
});
```

#### Request Body

```json
{
  "rating": 5
}
```

| Field | Type | Description |
|-------|------|-------------|
| `rating` | number | Rating from 1 (poor) to 5 (excellent) |

#### Response

```json
{
  "success": true,
  "message": "Feedback recorded"
}
```

---

## 3. Station Data Endpoints

### `GET /station/{id}/score` - Get Station Score

**Service:** API Gateway (Port 3000)

Gets the real-time calculated score for a station.

#### Request

```javascript
const response = await fetch('http://localhost:3000/station/ST_101/score');
const data = await response.json();
```

#### Response

```json
{
  "success": true,
  "data": {
    "stationId": "ST_101",
    "overallScore": 0.8542,
    "componentScores": {
      "waitTimeScore": 0.85,
      "availabilityScore": 0.90,
      "reliabilityScore": 0.92,
      "distanceScore": 0.78,
      "energyStabilityScore": 0.88
    },
    "rank": 1,
    "confidence": 0.95,
    "timestamp": 1706436000
  },
  "meta": {
    "timestamp": 1706436000,
    "freshness": "cached"
  }
}
```

#### Response (Not Found - 404)

```json
{
  "success": false,
  "error": "Score not found",
  "message": "No score data available for this station"
}
```

---

### `GET /station/{id}/health` - Get Station Health

**Service:** API Gateway (Port 3000)

Gets health status for a station.

> ⚠️ **Note:** Health data must be ingested first via `POST /ingest/health` (port 3001).

#### Request

```javascript
const response = await fetch('http://localhost:3000/station/ST_101/health');
const data = await response.json();
```

#### Response

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

#### Response (Not Found - 404)

```json
{
  "success": false,
  "error": "Health data not found"
}
```

#### Health Status Values

| Status | Description |
|--------|-------------|
| `operational` | Station is fully functional |
| `degraded` | Station has reduced capacity |
| `offline` | Station is not available |
| `maintenance` | Station under maintenance |

---

### `GET /station/{id}/predictions` - Get AI Predictions

**Service:** API Gateway (Port 3000)

Gets AI-generated load forecast and fault predictions.

#### Request

```javascript
const response = await fetch('http://localhost:3000/station/ST_101/predictions');
const data = await response.json();
```

#### Response

```json
{
  "success": true,
  "data": {
    "loadForecast": {
      "stationId": "ST_101",
      "predictedLoad": 0.72,
      "confidence": 0.85,
      "peakTimeStart": "17:00",
      "peakTimeEnd": "19:00",
      "timestamp": 1706436000
    },
    "faultPrediction": {
      "stationId": "ST_101",
      "faultProbability": 0.03,
      "predictedFaultType": null,
      "riskLevel": "low",
      "confidence": 0.92,
      "timestamp": 1706436000
    }
  }
}
```

#### Risk Levels

| Risk Level | Fault Probability | Description |
|------------|-------------------|-------------|
| `low` | 0-5% | Normal operation |
| `medium` | 5-15% | Monitor closely |
| `high` | >15% | May need attention |

---

## 4. Admin Dashboard Endpoints

### `GET /admin/summary` - Get System Summary

**Service:** API Gateway (Port 3000)

Gets system-wide summary with LLM-generated narrative for admin dashboards.

#### Request

```javascript
const response = await fetch('http://localhost:3000/admin/summary');
const data = await response.json();
```

#### Response

```json
{
  "success": true,
  "data": {
    "totalStations": 8,
    "operationalStations": 7,
    "degradedStations": 1,
    "offlineStations": 0,
    "totalActiveUsers": 0,
    "recommendationsToday": 156,
    "avgResponseTime": 245,
    "cacheHitRatio": 0.85,
    "topStations": [
      {
        "stationId": "ST_101",
        "name": "Downtown EV Hub",
        "recommendationCount": 45
      },
      {
        "stationId": "ST_103",
        "name": "Airport Fast Charge",
        "recommendationCount": 38
      }
    ],
    "systemHealth": "healthy"
  },
  "narrative": "Network status is healthy with 87.5% of stations operational. 1 station is in degraded status and may need attention. Top performing station is Downtown EV Hub with a 85.4% efficiency score."
}
```

---

### `GET /admin/metrics` - Get System Metrics

**Service:** API Gateway (Port 3000)

Gets detailed system metrics for monitoring dashboards.

#### Request

```javascript
const response = await fetch('http://localhost:3000/admin/metrics');
const data = await response.json();
```

#### Response

```json
{
  "success": true,
  "data": {
    "kafka": {
      "consumerLag": 0,
      "messagesPerSecond": 12.5,
      "topicStats": {}
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
      "api": {
        "status": "up",
        "lastHeartbeat": "2026-01-28T10:00:00.000Z",
        "uptime": 3600
      },
      "database": {
        "status": "up",
        "lastHeartbeat": "2026-01-28T10:00:00.000Z",
        "uptime": 0
      },
      "externalAI": {
        "status": "up",
        "lastHeartbeat": "2026-01-28T10:00:00.000Z",
        "uptime": 0
      }
    }
  }
}
```

---

### `GET /admin/stations` - List All Stations

**Service:** API Gateway (Port 3000)

Gets list of all registered charging stations.

#### Request

```javascript
const response = await fetch('http://localhost:3000/admin/stations');
const data = await response.json();
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "ST_101",
      "name": "Downtown EV Hub",
      "address": "123 Main Street, Downtown",
      "location": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "totalChargers": 12,
      "chargerTypes": ["CCS", "CHAdeMO", "Type2"],
      "maxCapacity": 500,
      "operatingHours": "24/7",
      "amenities": ["restroom", "cafe", "wifi"],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-28T10:00:00.000Z"
    },
    {
      "id": "ST_102",
      "name": "Westside Charging Station",
      "address": "456 West Avenue",
      "totalChargers": 8,
      "chargerTypes": ["CCS", "Type2"],
      "maxCapacity": 350,
      "operatingHours": "6AM-11PM"
    }
  ],
  "count": 8
}
```

---

### `GET /admin/events` - Get System Events

**Service:** API Gateway (Port 3000)

Gets system event logs with optional filtering.

#### Request

```javascript
// Get last 50 error events
const response = await fetch('http://localhost:3000/admin/events?limit=50&severity=error');
const data = await response.json();
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | ❌ | Max events to return (default: 100) |
| `severity` | string | ❌ | Filter: `info`, `warning`, `error`, `critical` |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "eventType": "system_start",
      "severity": "info",
      "message": "EV Platform backend started",
      "metadata": {
        "version": "1.0.0"
      },
      "createdAt": "2026-01-28T08:00:00.000Z"
    },
    {
      "id": 2,
      "eventType": "recommendation_generated",
      "severity": "info",
      "message": "Recommendation generated for user",
      "metadata": {
        "requestId": "REQ_abc123",
        "userId": "USR_001"
      },
      "createdAt": "2026-01-28T10:00:00.000Z"
    }
  ],
  "count": 2
}
```

---

## 5. Data Ingestion Endpoints

> **Note:** These endpoints are primarily for IoT devices and admin tools. Most frontend apps won't need these directly.

### `POST /ingest/station` - Ingest Station Telemetry

**Service:** Ingestion Service (Port 3001) ⚠️

Ingests real-time telemetry data from charging stations.

#### Request

```javascript
const response = await fetch('http://localhost:3000/ingest/station', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stationId: 'ST_101',
    queueLength: 5,
    avgServiceTime: 6,
    availableChargers: 4,
    totalChargers: 10,
    faultRate: 0.01,
    availablePower: 380,
    maxCapacity: 500
  })
});
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stationId` | string | ✅ | Station identifier |
| `queueLength` | number | ❌ | Current queue length |
| `avgServiceTime` | number | ❌ | Average service time (minutes) |
| `availableChargers` | number | ❌ | Available charger count |
| `totalChargers` | number | ❌ | Total charger count |
| `faultRate` | number | ❌ | Fault rate (0-1) |
| `availablePower` | number | ❌ | Available power (kW) |
| `maxCapacity` | number | ❌ | Maximum capacity (kW) |

#### Response (202 Accepted)

```json
{
  "success": true,
  "message": "Telemetry ingested",
  "stationId": "ST_101"
}
```

---

### `POST /ingest/station/batch` - Batch Ingest Telemetry

**Service:** Ingestion Service (Port 3001) ⚠️

Ingests telemetry for multiple stations at once.

#### Request

```javascript
const response = await fetch('http://localhost:3000/ingest/station/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stations: [
      { stationId: 'ST_101', queueLength: 5, availableChargers: 4 },
      { stationId: 'ST_102', queueLength: 2, availableChargers: 8 }
    ]
  })
});
```

#### Response

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

### `POST /ingest/health` - Ingest Station Health

**Service:** Ingestion Service (Port 3001) ⚠️

Ingests health status for a station. **Must be called before `GET /station/{id}/health` will return data.**

#### Request

```javascript
const response = await fetch('http://localhost:3000/ingest/health', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stationId: 'ST_101',
    status: 'operational',
    lastMaintenanceDate: '2026-01-15',
    uptimePercentage: 99.5,
    activeAlerts: [],
    healthScore: 95,
    timestamp: Math.floor(Date.now() / 1000)
  })
});
```

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stationId` | string | ✅ | Station identifier |
| `status` | string | ✅ | `operational`, `degraded`, `offline`, `maintenance` |
| `lastMaintenanceDate` | string | ✅ | Last maintenance date (YYYY-MM-DD) |
| `uptimePercentage` | number | ✅ | Uptime percentage (0-100) |
| `activeAlerts` | array | ✅ | Array of active alerts |
| `healthScore` | number | ✅ | Health score (0-100) |
| `timestamp` | number | ✅ | Unix timestamp |

#### Response

```json
{
  "success": true,
  "message": "Health data ingested"
}
```

---

### `POST /ingest/user-context` - Ingest User Context

**Service:** Ingestion Service (Port 3001) or API Gateway (Port 3000)

Ingests user context for personalized recommendations.

#### Request

```javascript
const response = await fetch('http://localhost:3000/ingest/user-context', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'USR_001',
    sessionId: 'SES_abc123',
    currentLocation: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    vehicleType: 'Tesla Model 3',
    batteryLevel: 25,
    preferredChargerType: 'fast',
    maxWaitTime: 15,
    maxDistance: 10,
    timestamp: Math.floor(Date.now() / 1000)
  })
});
```

#### Response

```json
{
  "success": true,
  "message": "User context ingested",
  "userId": "USR_001"
}
```

---

### `POST /ingest/grid` - Ingest Grid Status

**Service:** Ingestion Service (Port 3001) ⚠️

Ingests power grid status data.

#### Request

```javascript
const response = await fetch('http://localhost:3000/ingest/grid', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    gridId: 'GRID_001',
    region: 'Bay Area',
    currentLoad: 450,
    maxCapacity: 600,
    loadPercentage: 75,
    peakHours: false,
    pricePerKwh: 0.25,
    timestamp: Math.floor(Date.now() / 1000)
  })
});
```

#### Response

```json
{
  "success": true,
  "message": "Grid status ingested"
}
```

---

## 6. AI Prediction Endpoints

> **Note:** These are typically called internally. Frontend can use them for debugging or advanced features.

### `GET /ai/load-forecast` - Get Load Forecast

**Service:** External AI (Port 8081) ⚠️

Gets AI load prediction for a station.

#### Request

```javascript
const response = await fetch('http://localhost:8081/ai/load-forecast?stationId=ST_101');
const data = await response.json();
```

#### Response

```json
{
  "stationId": "ST_101",
  "predictedLoad": 0.72,
  "confidence": 0.85,
  "peakTimeStart": "17:00",
  "peakTimeEnd": "19:00",
  "timestamp": 1706436000
}
```

---

### `GET /ai/fault-probability` - Get Fault Prediction

**Service:** External AI (Port 8081) ⚠️

Gets AI fault probability prediction.

#### Request

```javascript
const response = await fetch('http://localhost:8081/ai/fault-probability?stationId=ST_101');
const data = await response.json();
```

#### Response

```json
{
  "stationId": "ST_101",
  "faultProbability": 0.03,
  "predictedFaultType": null,
  "riskLevel": "low",
  "confidence": 0.92,
  "timestamp": 1706436000
}
```

---

### `POST /ai/batch-predict` - Batch Predictions

**Service:** External AI (Port 8081) ⚠️

Gets predictions for multiple stations at once.

#### Request

```javascript
const response = await fetch('http://localhost:8081/ai/batch-predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    stationIds: ['ST_101', 'ST_102', 'ST_103']
  })
});
```

#### Response

```json
{
  "predictions": [
    {
      "stationId": "ST_101",
      "loadForecast": {
        "predictedLoad": 0.65,
        "confidence": 0.80
      },
      "faultPrediction": {
        "faultProbability": 0.02,
        "riskLevel": "low",
        "confidence": 0.85
      }
    },
    {
      "stationId": "ST_102",
      "loadForecast": {
        "predictedLoad": 0.45,
        "confidence": 0.80
      },
      "faultPrediction": {
        "faultProbability": 0.05,
        "riskLevel": "low",
        "confidence": 0.85
      }
    }
  ]
}
```

---

## TypeScript Interfaces

Copy these interfaces to your frontend project:

```typescript
// Location
interface GeoLocation {
  latitude: number;
  longitude: number;
}

// Recommendation Request
interface RecommendationRequest {
  userId: string;
  location: GeoLocation;
  vehicleType?: string;
  batteryLevel?: number;
  preferredChargerType?: 'fast' | 'standard' | 'any';
  maxWaitTime?: number;
  maxDistance?: number;
  limit?: number;
}

// Station Recommendation
interface RankedStation {
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
  features?: StationFeatures;
  predictions?: {
    load: LoadForecast;
    fault: FaultPrediction;
  };
}

// Recommendation Response
interface Recommendation {
  requestId: string;
  userId: string;
  recommendations: RankedStation[];
  explanation: string;
  generatedAt: string;
  expiresAt: string;
}

interface RecommendationResponse {
  success: boolean;
  data: Recommendation;
  meta: {
    processingTime: number;
    cacheHit: boolean;
  };
}

// Station Features
interface StationFeatures {
  stationId: string;
  effectiveWaitTime: number;
  stationReliabilityScore: number;
  energyStabilityIndex: number;
  chargerAvailabilityRatio: number;
  distancePenalty: number;
}

// Predictions
interface LoadForecast {
  stationId: string;
  predictedLoad: number;
  confidence: number;
  peakTimeStart?: string;
  peakTimeEnd?: string;
  timestamp: number;
}

interface FaultPrediction {
  stationId: string;
  faultProbability: number;
  predictedFaultType?: string;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  timestamp: number;
}

// Station Health
interface StationHealth {
  stationId: string;
  status: 'operational' | 'degraded' | 'offline' | 'maintenance';
  lastMaintenanceDate: string;
  uptimePercentage: number;
  activeAlerts: Alert[];
  healthScore: number;
  timestamp: number;
}

interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  createdAt: string;
}

// Station Score
interface StationScore {
  stationId: string;
  overallScore: number;
  componentScores: {
    waitTimeScore: number;
    availabilityScore: number;
    reliabilityScore: number;
    distanceScore: number;
    energyStabilityScore: number;
  };
  rank: number;
  confidence: number;
  timestamp: number;
}

// Admin Summary
interface AdminSummary {
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

// API Error
interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: Array<{ path: string; message: string }>;
  timestamp?: string;
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed message (dev only)",
  "details": [
    { "path": "fieldName", "message": "Validation error message" }
  ],
  "timestamp": "2026-01-28T10:00:00.000Z"
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| `200` | Success | Process response |
| `202` | Accepted | Request queued for processing |
| `400` | Bad Request | Check request validation |
| `404` | Not Found | Resource doesn't exist |
| `429` | Rate Limited | Wait and retry (1 min window) |
| `500` | Server Error | Retry with backoff |
| `503` | Service Unavailable | System not ready, retry later |

### Error Handling Example

```typescript
async function getRecommendations(params: RecommendationRequest) {
  try {
    const response = await fetch('http://localhost:3000/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (!response.ok) {
      switch (response.status) {
        case 400:
          throw new Error(`Validation error: ${data.details?.[0]?.message || data.error}`);
        case 429:
          throw new Error('Rate limited. Please wait a moment and try again.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(data.error || 'Unknown error');
      }
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}
```

---

## Best Practices

### 1. Use the Right Port

```typescript
// ✅ Correct - Use API Gateway for recommendations
await fetch('http://localhost:3000/recommend');

// ✅ Correct - Use Recommendation Service for selection
await fetch('http://localhost:3000/recommend/REQ_123/select', { method: 'POST' });

// ❌ Wrong - Selection is not on API Gateway
await fetch('http://localhost:3000/recommend/REQ_123/select', { method: 'POST' });
```

### 2. Save the Request ID

```typescript
// Get recommendations and save requestId
const response = await api.post('/recommend', request);
const { requestId } = response.data.data;

// Store requestId for later use
localStorage.setItem('lastRequestId', requestId);

// Use it when user selects a station
await axios.post(`http://localhost:3000/recommend/${requestId}/select`, {
  stationId: selectedStation.stationId
});
```

### 3. Handle Loading States

```typescript
const [loading, setLoading] = useState(false);
const [recommendations, setRecommendations] = useState([]);
const [error, setError] = useState(null);

async function fetchRecommendations() {
  setLoading(true);
  setError(null);
  
  try {
    const response = await api.get('/recommend', { params: userParams });
    setRecommendations(response.data.data.recommendations);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}
```

### 4. Implement Retry Logic

```typescript
async function fetchWithRetry(url: string, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### 5. Cache Recommendations Client-Side

```typescript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (matches server cache)

function cacheRecommendations(requestId: string, data: Recommendation) {
  const cacheEntry = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(`rec_${requestId}`, JSON.stringify(cacheEntry));
}

function getCachedRecommendations(requestId: string): Recommendation | null {
  const cached = localStorage.getItem(`rec_${requestId}`);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_TTL) {
    localStorage.removeItem(`rec_${requestId}`);
    return null;
  }
  
  return data;
}
```

---

## Quick Reference Card

| Action | Method | Endpoint | Port |
|--------|--------|----------|------|
| Get recommendations | `GET` | `/recommend?userId=...&lat=...&lon=...` | 3000 |
| Get recommendations | `POST` | `/recommend` | 3000 |
| Record selection | `POST` | `/recommend/{requestId}/select` | **3005** |
| Submit feedback | `POST` | `/recommend/{requestId}/feedback` | **3005** |
| Get station score | `GET` | `/station/{id}/score` | 3000 |
| Get station health | `GET` | `/station/{id}/health` | 3000 |
| Get AI predictions | `GET` | `/station/{id}/predictions` | 3000 |
| List all stations | `GET` | `/admin/stations` | 3000 |
| Get system summary | `GET` | `/admin/summary` | 3000 |
| Health check | `GET` | `/health` | 3000 |
