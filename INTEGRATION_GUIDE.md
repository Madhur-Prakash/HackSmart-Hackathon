# 🔌 EV Charging Platform - Integration Guide

> **Complete API Reference for Frontend & Backend Integration**

---

## 📋 Table of Contents

- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [Core APIs](#core-apis)
  - [Recommendation APIs](#recommendation-apis)
  - [Ingestion APIs](#ingestion-apis)
  - [Queue Management APIs](#queue-management-apis)
  - [Delivery Management APIs](#delivery-management-apis)
  - [Fault Management APIs](#fault-management-apis)
  - [Admin APIs](#admin-apis)
- [Response Formats](#response-formats)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)

---

## 🌐 Base URLs

| Environment | Base URL | Description |
|-------------|----------|-------------|
| **Development** | `http://localhost:3000` | API Gateway |
| **Ingestion Service** | `http://localhost:3001` | Direct ingestion endpoint |
| **Recommendation Service** | `http://localhost:3005` | Direct recommendation endpoint |
| **Production** | `https://api.yourplatform.com` | Production API Gateway |

---

## 🔐 Authentication

Currently, the platform operates without authentication for development. For production:

```http
Authorization: Bearer YOUR_API_KEY
```

---

## 🎯 Core APIs

### Recommendation APIs

#### 1. Get Station Recommendations (GET)

**Endpoint:** `GET /recommend`

**Description:** Get personalized EV charging station recommendations based on user location and preferences.

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `userId` | string | ✅ | User identifier | `USR_001` |
| `lat` | number | ✅ | Latitude (-90 to 90) | `28.6139` |
| `lon` | number | ✅ | Longitude (-180 to 180) | `77.2090` |
| `vehicleType` | string | ❌ | Vehicle model | `Tesla Model 3` |
| `batteryLevel` | number | ❌ | Current battery % (0-100) | `25` |
| `chargerType` | string | ❌ | `fast`, `standard`, `any` | `fast` |
| `maxWaitTime` | number | ❌ | Max wait in minutes | `15` |
| `maxDistance` | number | ❌ | Max distance in km | `10` |
| `limit` | number | ❌ | Number of results (default: 5) | `3` |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/recommend?userId=USR_001&lat=28.6139&lon=77.2090&batteryLevel=25&chargerType=fast&limit=5"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "requestId": "REQ_abc123xyz",
    "userId": "USR_001",
    "recommendations": [
      {
        "stationId": "ST_101",
        "stationName": "Connaught Place Hub",
        "score": 0.87,
        "rank": 1,
        "estimatedWaitTime": 5,
        "estimatedDistance": 2.3,
        "availableChargers": 8,
        "totalChargers": 12,
        "chargerTypes": ["CCS", "CHAdeMO"],
        "pricePerKwh": 0.30,
        "location": {
          "latitude": 28.6315,
          "longitude": 77.2167
        },
        "address": "Connaught Place, New Delhi",
        "operatingHours": "24/7",
        "amenities": ["WiFi", "Restroom", "Cafe"]
      }
    ],
    "explanation": "Connaught Place Hub is recommended because it's closest with minimal wait time and has fast chargers available.",
    "generatedAt": "2024-01-28T10:00:00Z",
    "expiresAt": "2024-01-28T10:05:00Z"
  },
  "meta": {
    "processingTime": 145,
    "cacheHit": false
  }
}
```

---

#### 2. Get Station Recommendations (POST)

**Endpoint:** `POST /recommend`

**Description:** Same as GET but with request body for complex queries.

**Request Body:**

```json
{
  "userId": "USR_001",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "vehicleType": "Tesla Model 3",
  "batteryLevel": 25,
  "preferredChargerType": "fast",
  "maxWaitTime": 15,
  "maxDistance": 10,
  "limit": 5
}
```

**Success Response:** Same as GET endpoint

---

#### 3. Get Cached Recommendation

**Endpoint:** `GET /recommend/:requestId`

**Description:** Retrieve a previously generated recommendation using its request ID.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requestId` | string | ✅ | Request identifier from previous recommendation |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/recommend/REQ_abc123xyz"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "requestId": "REQ_abc123xyz",
    "userId": "USR_001",
    "recommendations": [...],
    "explanation": "...",
    "generatedAt": "2024-01-28T10:00:00Z"
  },
  "meta": {
    "cacheHit": true
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": "Recommendation not found or expired"
}
```

---

#### 4. Record Station Selection

**Endpoint:** `POST /recommend/:requestId/select`

**Description:** Record which station the user selected from recommendations.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `requestId` | string | ✅ | Request identifier |

**Request Body:**

```json
{
  "stationId": "ST_101"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Selection recorded"
}
```

---

#### 5. Submit Feedback

**Endpoint:** `POST /recommend/:requestId/feedback`

**Description:** Submit user feedback on recommendation quality.

**Request Body:**

```json
{
  "rating": 5
}
```

**Validation:** `rating` must be between 1 and 5.

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Feedback recorded"
}
```

---

### Ingestion APIs

#### 6. Ingest Station Telemetry

**Endpoint:** `POST /ingest/station`

**Description:** Submit real-time telemetry data from charging stations.

**Request Body:**

```json
{
  "stationId": "ST_101",
  "queueLength": 3,
  "avgServiceTime": 5,
  "availableChargers": 8,
  "totalChargers": 12,
  "faultRate": 0.01,
  "availablePower": 450,
  "maxCapacity": 500,
  "timestamp": 1706438400
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stationId` | string | ✅ | Station identifier |
| `queueLength` | number | ✅ | Current queue length |
| `avgServiceTime` | number | ✅ | Average service time (minutes) |
| `availableChargers` | number | ✅ | Number of available chargers |
| `totalChargers` | number | ✅ | Total chargers at station |
| `faultRate` | number | ✅ | Fault rate (0-1) |
| `availablePower` | number | ✅ | Available power (kW) |
| `maxCapacity` | number | ✅ | Maximum capacity (kW) |
| `timestamp` | number | ❌ | Unix timestamp (auto-generated if omitted) |

**Success Response (202 Accepted):**

```json
{
  "success": true,
  "message": "Telemetry ingested",
  "stationId": "ST_101"
}
```

---

#### 7. Batch Ingest Station Telemetry

**Endpoint:** `POST http://localhost:3001/ingest/station/batch`

**⚠️ Note:** This endpoint is ONLY available on the Ingestion Service (port 3001), not the API Gateway.

**Description:** Batch upload telemetry for multiple stations.

**Request Body:**

```json
{
  "stations": [
    {
      "stationId": "ST_101",
      "queueLength": 3,
      "avgServiceTime": 5,
      "availableChargers": 8,
      "totalChargers": 12,
      "faultRate": 0.01,
      "availablePower": 450,
      "maxCapacity": 500
    },
    {
      "stationId": "ST_102",
      "queueLength": 5,
      "avgServiceTime": 7,
      "availableChargers": 6,
      "totalChargers": 10,
      "faultRate": 0.02,
      "availablePower": 380,
      "maxCapacity": 450
    }
  ]
}
```

**Success Response (202 Accepted):**

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

#### 8. Ingest User Context

**Endpoint:** `POST /ingest/user-context`

**Description:** Submit user session and preference data.

**Request Body:**

```json
{
  "userId": "USR_001",
  "sessionId": "SES_xyz789",
  "currentLocation": {
    "latitude": 28.6139,
    "longitude": 77.2090
  },
  "vehicleType": "Tesla Model 3",
  "batteryLevel": 25,
  "preferredChargerType": "fast",
  "maxWaitTime": 15,
  "maxDistance": 10
}
```

**Success Response (202 Accepted):**

```json
{
  "success": true,
  "message": "User context ingested",
  "userId": "USR_001"
}
```

---

### Queue Management APIs

#### 9. Join Queue (Generate QR Code)

**Endpoint:** `POST /queue/join`

**Description:** User confirms arrival at station and receives QR code for queue.

**Request Body:**

```json
{
  "stationId": "ST_101",
  "userId": "USR_001"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "qrCode": "QR_abc123xyz",
  "entry": {
    "id": "QUEUE_xyz789",
    "stationId": "ST_101",
    "userId": "USR_001",
    "qrCode": "QR_abc123xyz",
    "status": "waiting",
    "joinedAt": "2024-01-28T10:00:00Z"
  }
}
```

---

#### 10. Verify QR Code

**Endpoint:** `POST /queue/verify`

**Description:** Station staff verifies user's QR code and updates live queue.

**Request Body:**

```json
{
  "qrCode": "QR_abc123xyz"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "entry": {
    "id": "QUEUE_xyz789",
    "stationId": "ST_101",
    "userId": "USR_001",
    "qrCode": "QR_abc123xyz",
    "status": "verified",
    "joinedAt": "2024-01-28T10:00:00Z"
  },
  "busyCount": 3,
  "queue": [...]
}
```

**Error Response (404 Not Found):**

```json
{
  "success": false,
  "error": "QR code not found"
}
```

---

#### 11. Complete Battery Swap

**Endpoint:** `POST /queue/swap`

**Description:** Mark battery swap as complete and dequeue user.

**Request Body:**

```json
{
  "qrCode": "QR_abc123xyz"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "entry": {
    "id": "QUEUE_xyz789",
    "status": "swapped"
  },
  "busyCount": 2,
  "queue": [...]
}
```

---

### Delivery Management APIs

#### 12. Alert Drivers for Battery Delivery

**Endpoint:** `POST /delivery/alert`

**Description:** Create delivery job and notify nearby drivers.

**Request Body:**

```json
{
  "batteryId": "BAT_001",
  "fromShopId": "SHOP_001",
  "toStationId": "ST_101"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "delivery": {
    "id": "DELIV_xyz789",
    "batteryId": "BAT_001",
    "fromShopId": "SHOP_001",
    "toStationId": "ST_101",
    "status": "pending",
    "requestedAt": "2024-01-28T10:00:00Z"
  },
  "message": "Delivery alert sent to drivers."
}
```

---

#### 13. Driver Accepts Delivery

**Endpoint:** `POST /delivery/accept`

**Description:** Driver accepts a delivery job.

**Request Body:**

```json
{
  "deliveryId": "DELIV_xyz789",
  "driverId": "DRV_001"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "delivery": {
    "id": "DELIV_xyz789",
    "assignedDriverId": "DRV_001",
    "status": "accepted",
    "acceptedAt": "2024-01-28T10:05:00Z"
  },
  "message": "Delivery accepted and admin notified."
}
```

---

#### 14. Confirm Delivery Completion

**Endpoint:** `POST /delivery/confirm`

**Description:** Admin confirms delivery completion.

**Request Body:**

```json
{
  "deliveryId": "DELIV_xyz789"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "delivery": {
    "id": "DELIV_xyz789",
    "status": "delivered",
    "deliveredAt": "2024-01-28T10:30:00Z"
  },
  "message": "Delivery confirmed and driver notified."
}
```

---

#### 15. Get Driver Deliveries

**Endpoint:** `GET /driver/:driverId/deliveries`

**Description:** Get all deliveries assigned to a driver.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `driverId` | string | ✅ | Driver identifier |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/driver/DRV_001/deliveries"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "deliveries": [
    {
      "id": "DELIV_xyz789",
      "batteryId": "BAT_001",
      "fromShopId": "SHOP_001",
      "toStationId": "ST_101",
      "status": "accepted",
      "assignedDriverId": "DRV_001",
      "requestedAt": "2024-01-28T10:00:00Z",
      "acceptedAt": "2024-01-28T10:05:00Z"
    }
  ]
}
```

---

#### 16. Get All Deliveries (Admin)

**Endpoint:** `GET /admin/deliveries`

**Description:** Get all deliveries in the system.

**Success Response (200 OK):**

```json
{
  "success": true,
  "deliveries": [...]
}
```

---

### Fault Management APIs

#### 17. Report Station Fault

**Endpoint:** `POST /fault/report`

**Description:** Report a fault at a charging station. Critical faults automatically create tickets.

**Request Body:**

```json
{
  "stationId": "ST_101",
  "reportedBy": "USR_001",
  "faultLevel": "critical",
  "description": "Charger not responding, display shows error code E502"
}
```

**Field Descriptions:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `stationId` | string | ✅ | Station identifier |
| `reportedBy` | string | ✅ | User/staff ID reporting the fault |
| `faultLevel` | string | ✅ | `low`, `medium`, `high`, `critical` |
| `description` | string | ✅ | Detailed fault description |

**Success Response (200 OK):**

```json
{
  "success": true,
  "ticketCreated": true,
  "ticket": {
    "id": "TICKET_xyz789",
    "stationId": "ST_101",
    "reportedBy": "USR_001",
    "faultLevel": "critical",
    "description": "Charger not responding, display shows error code E502",
    "status": "open",
    "createdAt": "2024-01-28T10:00:00Z",
    "updatedAt": "2024-01-28T10:00:00Z"
  },
  "message": "Critical fault, ticket raised and admin notified."
}
```

---

#### 18. Manually Raise Fault Ticket

**Endpoint:** `POST /ticket/manual`

**Description:** Manually create a fault ticket (admin/staff use).

**Request Body:**

```json
{
  "stationId": "ST_101",
  "reportedBy": "STAFF_001",
  "faultLevel": "high",
  "description": "Preventive maintenance required for charger unit 3"
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "ticket": {
    "id": "TICKET_abc456",
    "stationId": "ST_101",
    "reportedBy": "STAFF_001",
    "faultLevel": "high",
    "description": "Preventive maintenance required for charger unit 3",
    "status": "open",
    "createdAt": "2024-01-28T10:00:00Z",
    "updatedAt": "2024-01-28T10:00:00Z"
  },
  "message": "Ticket raised and admin notified."
}
```

---

#### 19. Get All Fault Tickets (Admin)

**Endpoint:** `GET /admin/tickets`

**Description:** Retrieve all fault tickets in the system.

**Success Response (200 OK):**

```json
{
  "success": true,
  "tickets": [
    {
      "id": "TICKET_xyz789",
      "stationId": "ST_101",
      "reportedBy": "USR_001",
      "faultLevel": "critical",
      "description": "Charger not responding",
      "status": "open",
      "createdAt": "2024-01-28T10:00:00Z",
      "updatedAt": "2024-01-28T10:00:00Z"
    }
  ]
}
```

---

### Admin APIs

#### 20. Get System Summary

**Endpoint:** `GET /admin/summary`

**Description:** Get high-level system summary with AI-generated narrative.

**Success Response (200 OK):**

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
        "name": "Connaught Place Hub",
        "recommendationCount": 450
      }
    ],
    "systemHealth": "healthy"
  },
  "narrative": "Network operating normally with 90% stations online. Connaught Place Hub is the most recommended station today with 450 recommendations. Average response time is excellent at 145ms."
}
```

---

#### 21. Get System Metrics

**Endpoint:** `GET /admin/metrics`

**Description:** Get detailed system performance metrics.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "kafka": {
      "consumerLag": 0,
      "messagesPerSecond": 150,
      "topicStats": {}
    },
    "redis": {
      "hitRatio": 0.85,
      "memoryUsage": 52428800,
      "connectedClients": 12
    },
    "api": {
      "requestsPerSecond": 45,
      "avgLatency": 145,
      "errorRate": 0.01
    },
    "services": {
      "api": {
        "status": "up",
        "lastHeartbeat": "2024-01-28T10:00:00Z",
        "uptime": 86400
      },
      "database": {
        "status": "up",
        "lastHeartbeat": "2024-01-28T10:00:00Z",
        "uptime": 86400
      }
    }
  }
}
```

---

#### 22. Get Station Score

**Endpoint:** `GET /station/:id/score`

**Description:** Get detailed scoring breakdown for a station.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | ✅ | Station identifier |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/station/ST_101/score"
```

**Success Response (200 OK):**

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
    "lastUpdated": "2024-01-28T10:00:00Z"
  },
  "meta": {
    "timestamp": 1706438400,
    "freshness": "cached"
  }
}
```

---

#### 23. Get Station Health

**Endpoint:** `GET /station/:id/health`

**Description:** Get real-time health status of a station.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "stationId": "ST_101",
    "status": "operational",
    "uptime": 0.98,
    "lastMaintenance": "2024-01-20T08:00:00Z",
    "nextMaintenance": "2024-02-20T08:00:00Z",
    "activeAlerts": [],
    "timestamp": 1706438400
  }
}
```

---

#### 24. Get All Stations

**Endpoint:** `GET /admin/stations`

**Description:** List all charging stations in the system.

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "ST_101",
      "name": "Connaught Place Hub",
      "address": "Connaught Place, New Delhi",
      "location": {
        "latitude": 28.6315,
        "longitude": 77.2167
      },
      "totalChargers": 12,
      "chargerTypes": ["CCS", "CHAdeMO"],
      "maxCapacity": 500,
      "operatingHours": "24/7",
      "amenities": ["WiFi", "Restroom", "Cafe"],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-28T10:00:00Z"
    }
  ],
  "count": 50
}
```

---

#### 25. Get System Events

**Endpoint:** `GET /admin/events`

**Description:** Get system events and logs.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | ❌ | Number of events (default: 100) |
| `severity` | string | ❌ | Filter by severity: `info`, `warning`, `error`, `critical` |

**Example Request:**

```bash
curl -X GET "http://localhost:3000/admin/events?severity=error&limit=50"
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "eventType": "api_error",
      "severity": "error",
      "message": "Database connection timeout",
      "metadata": {
        "path": "/recommend",
        "method": "GET"
      },
      "createdAt": "2024-01-28T09:55:00Z"
    }
  ],
  "count": 50
}
```

---

#### 26. Health Check

**Endpoint:** `GET /health`

**Description:** Check API Gateway health status.

**Success Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-28T10:00:00Z",
  "services": {
    "database": "up",
    "api": "up"
  }
}
```

---

#### 27. Readiness Check

**Endpoint:** `GET /ready`

**Description:** Check if service is ready to accept requests.

**Success Response (200 OK):**

```json
{
  "ready": true
}
```

**Error Response (503 Service Unavailable):**

```json
{
  "ready": false,
  "reason": "Database not available"
}
```

---

## 📊 Response Formats

### Success Response Structure

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "processingTime": 145,
    "cacheHit": false
  }
}
```

### Error Response Structure

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": { ... },
  "timestamp": "2024-01-28T10:00:00Z"
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `202` | Accepted | Request accepted for processing |
| `400` | Bad Request | Invalid request parameters |
| `404` | Not Found | Resource not found |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |
| `503` | Service Unavailable | Service temporarily unavailable |

### Common Error Responses

#### Validation Error (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "lat": "Must be a number between -90 and 90",
    "lon": "Must be a number between -180 and 180"
  }
}
```

#### Rate Limit Error (429)

```json
{
  "error": "Too many requests, please try again later"
}
```

#### Not Found Error (404)

```json
{
  "success": false,
  "error": "Not found",
  "path": "/invalid-endpoint"
}
```

---

## 🚦 Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| **Public APIs** | 100 requests | 1 minute |
| **Admin APIs** | 200 requests | 1 minute |
| **Ingestion APIs** | 500 requests | 1 minute |

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706438460
```

---

## 🔗 API Documentation

Interactive API documentation is available at:

- **API Gateway:** http://localhost:3000/docs
- **Ingestion Service:** http://localhost:3001/docs
- **Recommendation Service:** http://localhost:3005/docs

---

## 📞 Support

For integration support, contact:
- **Email:** support@evplatform.com
- **Slack:** #api-integration
- **Documentation:** https://docs.evplatform.com

---

**Last Updated:** January 2024  
**API Version:** 1.0.0
