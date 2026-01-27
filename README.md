# 🔋 EV Charging Platform - Real-Time Recommendation Backend

A **production-grade, real-time backend system** for AI-powered EV charging station recommendations.

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#️-architecture)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Services](#-services)
- [Configuration](#️-configuration)
- [Deployment](#-deployment)
- [Development](#-development)
- [Documentation](#-documentation)

---

## 🎯 Overview

This backend powers an intelligent EV charging recommendation platform that:

- **Ingests real-time data** from IoT devices and external APIs
- **Engineers features** on-the-fly for scoring
- **Scores stations** using multi-objective optimization
- **Optimizes recommendations** with constraint handling
- **Explains decisions** using LLM integration
- **Serves mobile apps** and admin dashboards via REST APIs

### Key Features

✅ Real-time streaming with Kafka  
✅ In-memory caching with Redis  
✅ PostgreSQL for persistence  
✅ Multi-objective scoring engine  
✅ LLM-powered explanations  
✅ Circuit breakers for resilience  
✅ Docker-ready deployment  
✅ Comprehensive monitoring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EV Charging Platform                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │   IoT    │───▶│    Kafka     │───▶│    Ingestion Service     │  │
│  │ Devices  │    │   Broker     │    │                          │  │
│  └──────────┘    └──────────────┘    └────────────┬─────────────┘  │
│                         │                          │                 │
│  ┌──────────┐          │                          ▼                 │
│  │ External │          │            ┌──────────────────────────┐   │
│  │   APIs   │──────────┴───────────▶│  Feature Engineering     │   │
│  └──────────┘                       │      Service             │   │
│                                     └────────────┬─────────────┘   │
│                                                  │                  │
│                                                  ▼                  │
│  ┌──────────┐              ┌──────────────────────────────────┐    │
│  │  Redis   │◀────────────▶│    Real-Time Scoring Engine      │    │
│  │  Cache   │              └────────────┬─────────────────────┘    │
│  └──────────┘                           │                          │
│                                         ▼                          │
│  ┌──────────┐              ┌──────────────────────────────────┐    │
│  │PostgreSQL│◀────────────▶│    Optimization Engine           │    │
│  │    DB    │              └────────────┬─────────────────────┘    │
│  └──────────┘                           │                          │
│                                         ▼                          │
│                            ┌──────────────────────────────────┐    │
│                            │   Recommendation Service         │    │
│                            └────────────┬─────────────────────┘    │
│                                         │                          │
│  ┌──────────┐                          ▼                          │
│  │  OpenAI  │◀─────────────┌──────────────────────────────────┐   │
│  │   LLM    │              │    LLM Explanation Layer          │   │
│  └──────────┘              └────────────┬─────────────────────┘   │
│                                         │                          │
│                                         ▼                          │
│                            ┌──────────────────────────────────┐    │
│                            │       REST API Gateway           │    │
│                            │   (Public + Admin Endpoints)     │    │
│                            └──────────────────────────────────┘    │
│                                         │                          │
└─────────────────────────────────────────┼──────────────────────────┘
                                          │
                                          ▼
                            ┌──────────────────────────┐
                            │   Mobile Apps / Web UI    │
                            │     Admin Dashboard       │
                            └──────────────────────────┘
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5.x |
| Web Framework | Express.js |
| Message Queue | Apache Kafka |
| Cache | Redis 7 |
| Database | PostgreSQL 15 |
| LLM | OpenAI GPT-4 |
| Containerization | Docker + Docker Compose |
| Resilience | Cockatiel (Circuit Breakers) |
| Validation | Zod |
| Logging | Winston |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone & Install

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Infrastructure

```bash
docker-compose up -d zookeeper kafka redis postgres
```

### 4. Run Migrations

```bash
npm run migrate
npm run seed
```

### 5. Create Kafka Topics

```bash
npm run kafka:topics
```

### 6. Start the Application

```bash
# Development mode
npm run dev

# Or start individual services
npm run dev:api
npm run dev:ingestion
npm run dev:features
npm run dev:scoring
```

### 7. Test the API

```bash
# Health check
curl http://localhost:3000/health

# Get recommendations
curl "http://localhost:3000/recommend?userId=test&lat=37.7749&lon=-122.4194"
```

---

## 📡 API Documentation

### Public Endpoints

#### POST `/ingest/station`
Ingest station telemetry data.

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

**Response:** `202 Accepted`

---

#### POST `/ingest/user-context`
Ingest user context for personalized recommendations.

```json
{
  "userId": "USR_001",
  "sessionId": "SES_123",
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

---

#### GET `/recommend`
Get station recommendations.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User identifier |
| `lat` | number | Yes | Latitude |
| `lon` | number | Yes | Longitude |
| `vehicleType` | string | No | Vehicle type |
| `batteryLevel` | number | No | Battery % (0-100) |
| `chargerType` | string | No | fast/standard/any |
| `maxWaitTime` | number | No | Max wait in minutes |
| `maxDistance` | number | No | Max distance in km |
| `limit` | number | No | Results count (default: 5) |

**Example:**
```bash
curl "http://localhost:3000/recommend?userId=USR_001&lat=37.7749&lon=-122.4194&limit=5"
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
        "location": { "latitude": 37.7749, "longitude": -122.4194 },
        "address": "123 Main Street",
        "score": 0.87,
        "rank": 1,
        "estimatedWaitTime": 5,
        "estimatedDistance": 2.3,
        "availableChargers": 8,
        "chargerTypes": ["CCS", "CHAdeMO", "Type2"],
        "pricePerKwh": 0.30
      }
    ],
    "explanation": "Downtown EV Hub is recommended because it's only 2.3 km away with minimal wait time (5 minutes) and has 8 chargers available.",
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

### Admin Endpoints

#### GET `/station/:id/score`
Get real-time score for a station.

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
  }
}
```

---

#### GET `/station/:id/health`
Get station health status.

---

#### GET `/admin/summary`
Get system-wide admin summary with LLM narrative.

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
    "systemHealth": "healthy"
  },
  "narrative": "Network status is healthy with 90% of stations operational..."
}
```

---

#### GET `/admin/metrics`
Get detailed system metrics.

---

## 🔧 Services

### Ingestion Service
- Receives telemetry from IoT devices
- Validates incoming data
- Publishes to Kafka topics
- Caches latest values in Redis

### Feature Engineering Service
- Consumes telemetry from Kafka
- Calculates derived features:
  - `effective_wait_time = queueLength × avgServiceTime`
  - `reliability_score = 1 - faultRate`
  - `energy_stability = availablePower / maxCapacity`
  - `availability_ratio = availableChargers / totalChargers`
- Normalizes features to 0-1 range
- Publishes engineered features

### Scoring Engine
- Consumes engineered features
- Applies multi-objective scoring:
  ```
  Score = w1×waitTime + w2×availability + w3×reliability + w4×distance + w5×energy
  ```
- Integrates AI predictions
- Caches scores in Redis sorted sets

### Optimization Engine
- Retrieves ranked stations
- Applies constraints (capacity, health, faults)
- Calculates distance-adjusted scores
- Returns Top-K stations

### Recommendation Service
- Orchestrates the recommendation flow
- Calls optimization engine
- Generates LLM explanations
- Logs requests and feedback

### LLM Explanation Layer
- Generates human-readable explanations
- Uses OpenAI GPT-4 (or fallback templates)
- Provides admin summaries
- Applies XAI principles

---

## ⚙️ Configuration

Key environment variables:

```env
# Server
NODE_ENV=development
API_PORT=3000

# Kafka
KAFKA_BROKERS=localhost:9092

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_USER=evplatform
POSTGRES_PASSWORD=evplatform123
POSTGRES_DB=evplatform

# OpenAI (optional)
OPENAI_API_KEY=your-key-here

# Scoring Weights
WEIGHT_WAIT_TIME=0.25
WEIGHT_AVAILABILITY=0.20
WEIGHT_RELIABILITY=0.20
WEIGHT_DISTANCE=0.20
WEIGHT_ENERGY_STABILITY=0.15
```

---

## 🐳 Deployment

### Docker Compose (Full Stack)

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop
docker-compose down
```

### Production Considerations

1. **Scaling**: Each service can be scaled independently
2. **Kafka Partitions**: Increase for higher throughput
3. **Redis Cluster**: Use Redis Cluster for HA
4. **Database**: Use connection pooling (PgBouncer)
5. **Secrets**: Use Kubernetes secrets or Vault
6. **Monitoring**: Add Prometheus + Grafana

---

## 🧪 Development

### Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration
│   ├── db/               # Database (migrations, repositories)
│   ├── kafka/            # Kafka clients and topics
│   ├── redis/            # Redis client and helpers
│   ├── services/
│   │   ├── api/          # REST API Gateway
│   │   ├── features/     # Feature Engineering
│   │   ├── ingestion/    # Data Ingestion
│   │   ├── llm/          # LLM Explanations
│   │   ├── optimization/ # Optimization Engine
│   │   ├── recommendation/ # Recommendation Service
│   │   └── scoring/      # Scoring Engine
│   ├── types/            # TypeScript interfaces
│   ├── utils/            # Helpers (logger, validation)
│   └── index.ts          # Main entry point
├── docker/               # Dockerfiles
├── docker-compose.yml    # Full stack setup
├── package.json
└── tsconfig.json
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

---

## 📊 Sample API Calls

### Ingest Station Data
```bash
curl -X POST http://localhost:3000/ingest/station \
  -H "Content-Type: application/json" \
  -d '{
    "stationId": "ST_101",
    "queueLength": 3,
    "avgServiceTime": 5,
    "availableChargers": 8,
    "totalChargers": 12,
    "faultRate": 0.01,
    "availablePower": 450,
    "maxCapacity": 500
  }'
```

### Get Recommendations
```bash
curl "http://localhost:3000/recommend?userId=demo&lat=37.7749&lon=-122.4194&limit=3"
```

### Admin Summary
```bash
curl http://localhost:3000/admin/summary
```

---

## � Documentation

For more detailed documentation, see:

| Document | Description |
|----------|-------------|
| [Implementation Guide](docs/IMPLEMENTATION.md) | Technical implementation details, algorithms, caching strategies |
| [Workflow Documentation](docs/WORKFLOW.md) | Data flow diagrams, sequence diagrams, error handling |
| [API Reference](docs/API_REFERENCE.md) | Complete REST API documentation with examples |

---

## �📜 License

MIT License - See LICENSE file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

Built with ❤️ for the EV future.
