# ⚡ NavSwap - EV Charging Platform

> **Real-Time AI-Powered EV Charging Station Recommendation System with Secure Authentication**

A production-grade platform for intelligent EV charging recommendations with real-time data processing, multi-objective optimization, LLM-powered explanations, and comprehensive user management.

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
</p>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
  - [Option 1: Local Development](#option-1-local-development-recommended)
  - [Option 2: Full Docker](#option-2-full-docker-deployment)
- [🔌 Services & Ports](#-services--ports)
- [📡 API Reference](#-api-reference)
- [🛠️ Development](#️-development)
- [⚙️ Configuration](#️-configuration)
- [📊 Monitoring & Tools](#-monitoring--tools)
- [📚 Documentation](#-documentation)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Secure Authentication** | JWT-based auth with role-based access control (RBAC) |
| 👥 **Multi-User System** | Support for Regional Admins, Companies, Customers, Staff, Transporters |
| 📧 **Email Notifications** | Automated welcome emails and password delivery |
| ☁️ **Cloud Storage** | Cloudinary integration for profile pictures and documents |
| 🔄 **Token Refresh** | Automatic token rotation for enhanced security |
| 🧠 **AI-Powered Scoring** | Multi-objective optimization with ML predictions |
| 💬 **LLM Explanations** | Groq-powered natural language explanations |
| 🐳 **Docker Native** | Full containerization with docker-compose |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          EV CHARGING PLATFORM                               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   📱 Mobile App / 🖥️ Web Dashboard                                         │
│              │                                                              │
│              ▼                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                  🚀 Unified Backend (Port 3000)                      │  │
│   │   /recommend │ /ingest/* │ /queue/* │ /admin/* │ /delivery/* │ ...  │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│              │                                                              │
│   ┌──────────┴──────────────────────────────────────────────────────────┐  │
│   │                    Integrated Components                             │  │
│   │                                                                      │  │
│   │  ┌──────────────────────────────────────────────────────────────┐   │  │
│   │  │  API Server + Ingestion + Recommendation + Queue + Delivery  │   │  │
│   │  └──────────────────────────────────────────────────────────────┘   │  │
│   │                           │                                          │  │
│   │              ┌────────────┴────────────┐                            │  │
│   │              ▼                         ▼                            │  │
│   │  ┌─────────────────────┐    ┌─────────────────────┐                │  │
│   │  │ Features Consumer   │    │  Scoring Consumer   │                │  │
│   │  │  (Kafka Consumer)   │    │  (Kafka Consumer)   │                │  │
│   │  └─────────────────────┘    └─────────────────────┘                │  │
│   │                                                                      │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                       Infrastructure                                 │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│   │  │   Kafka     │  │   Redis     │  │ PostgreSQL  │  │  Model API  │ │  │
│   │  │   :9092     │  │   :6379     │  │   :5432     │  │   :8005     │ │  │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

---

### Option 1: Local Development (Recommended)

Run infrastructure in Docker, the unified app locally for hot-reload development.

```bash
# 1️⃣ Install dependencies
npm install

# 2️⃣ Copy environment file
cp .env.example .env

# 3️⃣ Start infrastructure (Kafka, Redis, PostgreSQL)
npm run infra:up

# 4️⃣ Wait for infrastructure to be ready (~30 seconds)
#    Check status: docker ps

# 5️⃣ Start the unified app with hot-reload
npm run dev
```

**What starts:**

| Component | Port | Description |
|-----------|------|-------------|
| Unified API | 3000 | All endpoints: /recommend, /ingest/*, /queue/*, /admin/*, etc. |
| Features Consumer | (internal) | Kafka consumer for telemetry → features |
| Scoring Consumer | (internal) | Kafka consumer for features → scores |

**Stop everything:**

```bash
# Stop Node.js app: Ctrl+C
# Stop infrastructure:
npm run infra:down
```

---

### Option 2: Full Docker Deployment

Run everything in Docker containers.

```bash
# 1️⃣ Start all services
docker-compose up -d

# 2️⃣ View logs
docker-compose logs -f

# 3️⃣ Stop everything
docker-compose down
```

---

### 🧪 Verify Installation

```bash
# Health check
curl http://localhost:3000/health

# Get recommendations
curl "http://localhost:3000/recommend?userId=test&lat=37.7749&lon=-122.4194"
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "recommendations": [...],
    "explanation": "Station X is recommended because..."
  }
}
```

---

## 🔌 Services & Ports

### Application Services

| Component | Port | Description |
|---------|------|-------------|
| **Auth API** | `8000` | Authentication & user management |
| **Python ML API** | `8001` | ML model inference & predictions |
| **Mock AI Server** | `8081` | Development AI endpoint |

### Database Services

| Service | Port | Description |
|---------|------|-------------|
| **MongoDB** | `27017` | User data & authentication |
| **PostgreSQL** | `5432` | Station data & analytics |
| **Redis** | `6379` | Caching & sessions |

### Management Tools

| Tool | URL | Description |
|------|-----|-------------|
| **MongoDB Compass** | `mongodb://localhost:27017` | Database management |
| **Cloudinary** | https://cloudinary.com | Media storage |

---

## 📡 API Reference

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/customer/register` | Register new customer |
| `POST` | `/api/v1/customer/login` | Customer login |
| `POST` | `/api/v1/customer/logout` | Customer logout |
| `GET` | `/api/v1/customer/current-user` | Get current user |
| `POST` | `/api/v1/customer/refresh-token` | Refresh access token |
| `PATCH` | `/api/v1/customer/update-profile` | Update profile |
| `POST` | `/api/v1/customer/upload-avatar` | Upload profile picture |

### Company Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/company/register` | Register new company |
| `POST` | `/api/v1/company/login` | Company login |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/regional-admin/register` | Register admin |
| `POST` | `/api/v1/regional-admin/login` | Admin login |

**For complete API documentation, see [AUTH_API_REFERENCE.md](docs/AUTH_API_REFERENCE.md)**

---

### 🎯 Get Recommendations

```http
GET /recommend?userId={userId}&lat={latitude}&lon={longitude}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `userId` | string | ✅ | Company identifier |
| `lat` | number | ✅ | Latitude (-90 to 90) |
| `lon` | number | ✅ | Longitude (-180 to 180) |
| `vehicleType` | string | ❌ | e.g., "Tesla Model 3" |
| `batteryLevel` | number | ❌ | Current battery % (0-100) |
| `chargerType` | string | ❌ | `fast` / `standard` / `any` |
| `maxWaitTime` | number | ❌ | Max wait in minutes |
| `maxDistance` | number | ❌ | Max distance in km |
| `limit` | number | ❌ | Results count (default: 5) |

**Example:**

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
        "score": 0.87,
        "rank": 1,
        "estimatedWaitTime": 5,
        "estimatedDistance": 2.3,
        "availableChargers": 8,
        "chargerTypes": ["CCS", "CHAdeMO"],
        "pricePerKwh": 0.30
      }
    ],
    "explanation": "Downtown EV Hub is recommended because it's closest with minimal wait time.",
    "generatedAt": "2026-01-28T10:00:00Z"
  },
  "meta": {
    "processingTime": 145,
    "cacheHit": false
  }
}
```

---

### 📤 Ingest Station Telemetry

```http
POST /ingest/station
Content-Type: application/json
```

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
  "maxCapacity": 500
}
```

**Response:** `202 Accepted`

---

### 📤 Batch Ingest

Batch ingest multiple stations at once.

```http
POST http://localhost:3000/ingest/station/batch
Content-Type: application/json
```

**Request Body:**

```json
{
  "stations": [
    { "stationId": "ST_101", "queueLength": 3, "..." : "..." },
    { "stationId": "ST_102", "queueLength": 5, "..." : "..." }
  ]
}
```

---

### 👤 Ingest Company Context

```http
POST /ingest/user-context
Content-Type: application/json
```

**Request Body:**

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
  "maxDistance": 10
}
```

---

### 📊 Admin Endpoints

#### Get System Summary

```bash
curl http://localhost:3000/admin/summary
```

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
  "narrative": "Network operating normally with 90% stations online..."
}
```

#### Get Station Score

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
    "confidence": 0.95
  }
}
```

---

## 🛠️ Development

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | 🚀 Start unified app with hot-reload |
| `npm run dev:with-mock-ai` | Start app + Mock AI Server |
| `npm run dev:mock-ai` | Start Mock AI Server only |
| `npm run infra:up` | 🐳 Start infrastructure in Docker |
| `npm run infra:down` | 🛑 Stop infrastructure |
| `npm run infra:logs` | 📋 View infrastructure logs |
| `npm run build` | 🔨 Compile TypeScript |
| `npm run migrate` | 📦 Run database migrations |
| `npm run seed` | 🌱 Seed database with sample data |
| `npm run kafka:ensure` | 📫 Ensure Kafka topics exist |
| `npm run kafka:topics` | 📫 Create Kafka topics |
| `npm test` | 🧪 Run tests |
| `npm run lint` | 🔍 Run ESLint |

---

### Project Structure

```
📦 ev-charging-platform/
│
├── 📁 src/
│   ├── 📁 config/              # ⚙️ Environment configuration
│   │   └── index.ts
│   │
│   ├── 📁 db/                  # 🗄️ Database layer
│   │   ├── client.ts           # PostgreSQL client
│   │   ├── migrations.ts       # Schema migrations
│   │   ├── repositories.ts     # Data access layer
│   │   └── seed.ts             # Sample data
│   │
│   ├── 📁 kafka/               # 📫 Message broker
│   │   ├── client.ts           # Kafka producer/consumer
│   │   └── createTopics.ts     # Topic management
│   │
│   ├── 📁 redis/               # ⚡ Caching layer
│   │   └── client.ts           # Redis client
│   │
│   ├── 📁 services/            # 🔧 Microservices
│   │   ├── 📁 api/             # REST API Gateway
│   │   ├── 📁 ingestion/       # Data Ingestion
│   │   ├── 📁 features/        # Feature Engineering
│   │   ├── 📁 scoring/         # Scoring Engine
│   │   ├── 📁 optimization/    # Optimization Engine
│   │   ├── 📁 recommendation/  # Recommendation Service
│   │   └── 📁 llm/             # LLM Explanations
│   │
│   ├── 📁 types/               # 📝 TypeScript interfaces
│   ├── 📁 utils/               # 🔨 Helpers & utilities
│   └── index.ts                # 🚀 Main entry point
│
├── 📁 docker/                  # 🐳 Docker configurations
│   ├── Dockerfile.*            # Service Dockerfiles
│   ├── init-db.sql             # Database initialization
│   └── mock-ai-server.js       # Mock AI for development
│
├── 📁 docs/                    # 📚 Documentation
│   ├── API_REFERENCE.md
│   ├── IMPLEMENTATION.md
│   └── WORKFLOW.md
│
├── docker-compose.yml          # Full stack deployment
├── docker-compose.infra.yml    # Infrastructure only (local dev)
├── openspec.yml                # OpenAPI 3.0 specification
├── package.json
└── tsconfig.json
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# ═══════════════════════════════════════════════════════════════
# 🖥️ SERVER CONFIGURATION
# ═══════════════════════════════════════════════════════════════
NODE_ENV=development
API_PORT=3000

# ═══════════════════════════════════════════════════════════════
# 📫 KAFKA CONFIGURATION
# ═══════════════════════════════════════════════════════════════
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=ev-platform

# ═══════════════════════════════════════════════════════════════
# ⚡ REDIS CONFIGURATION
# ═══════════════════════════════════════════════════════════════
REDIS_HOST=localhost
REDIS_PORT=6379

# ═══════════════════════════════════════════════════════════════
# 🗄️ POSTGRESQL CONFIGURATION
# ═══════════════════════════════════════════════════════════════
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=evplatform
POSTGRES_PASSWORD=evplatform123
POSTGRES_DB=evplatform

# ═══════════════════════════════════════════════════════════════
# 🤖 AI SERVICES CONFIGURATION
# ═══════════════════════════════════════════════════════════════
# For development (uses mock-ai-server.js)
AI_PREDICTION_URL=http://localhost:8081/predict
AI_DEMAND_URL=http://localhost:8081/demand

# For production (use Groq)
GROQ_API_KEY=your-api-key-here

# ═══════════════════════════════════════════════════════════════
# ⚖️ SCORING WEIGHTS (must sum to 1.0)
# ═══════════════════════════════════════════════════════════════
WEIGHT_WAIT_TIME=0.25
WEIGHT_AVAILABILITY=0.20
WEIGHT_RELIABILITY=0.20
WEIGHT_DISTANCE=0.20
WEIGHT_ENERGY_STABILITY=0.15
```

---

## 📊 Monitoring & Tools

### RedisInsight (Port 8001)

Browse Redis data, monitor keys, run commands.

```
http://localhost:8001
```

### Kafka UI (Port 8082)

Monitor topics, consumers, messages.

```
http://localhost:8082
```

### pgAdmin (Port 5050)

Manage PostgreSQL database.

```
http://localhost:5050
Email: admin@gmail.com
Password: admin123
```

**Connect to database:**

| Property | Value |
|----------|-------|
| Host | `postgres` (in Docker) or `localhost` (from host) |
| Port | `5432` |
| Database | `evplatform` |
| Username | `evplatform` |
| Password | `evplatform123` |

---

## 📚 Documentation

### Core Documentation

| Document | Description |
|----------|-------------|
| [AUTH_API_REFERENCE.md](docs/AUTH_API_REFERENCE.md) | 🔐 **Complete Authentication API documentation** |
| [INTEGRATION_GUIDE.md](docs/INTEGRATION_GUIDE.md) | 🔗 **Integration guide with code examples** |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | 📡 Recommendation API documentation |
| [FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md) | 💻 Frontend developer guide |

### Technical Documentation

| Document | Description |
|----------|-------------|
| [IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | 🔧 Technical implementation details |
| [WORKFLOW.md](docs/WORKFLOW.md) | 📊 Data flow & sequence diagrams |
| [INTEGRATION.md](docs/INTEGRATION.md) | 🔌 Backend integration guide |
| [openspec.yml](openspec.yml) | 📝 OpenAPI 3.0 specification |

---

## 🐛 Troubleshooting

<details>
<summary><b>❌ Port already in use</b></summary>

```bash
# Find process using the port (Windows)
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

</details>

<details>
<summary><b>❌ Kafka connection refused</b></summary>

1. Ensure infrastructure is running: `docker ps`
2. Wait 30 seconds for Kafka to initialize
3. Check logs: `npm run infra:logs`

</details>

<details>
<summary><b>❌ Database tables empty</b></summary>

Database auto-seeds on startup. If still empty:

```bash
npm run seed
```

</details>

<details>
<summary><b>❌ Redis connection error</b></summary>

1. Check Redis is running: `docker ps | grep redis`
2. Test connection: `docker exec -it ev-redis redis-cli ping`

</details>

<details>
<summary><b>❌ "Group coordinator is not available" errors</b></summary>

These Kafka warnings during startup are normal. Wait a few seconds for the Kafka cluster to fully initialize.

</details>

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📜 License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <b>Built with ⚡ for the electric future</b>
</p>
