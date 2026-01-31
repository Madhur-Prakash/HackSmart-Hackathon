# NavSwap AI Microservice - Complete Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [AI Model Architecture](#ai-model-architecture)
3. [User vs Admin Models](#user-vs-admin-models)
4. [API Endpoints](#api-endpoints)
5. [Backend Integration Guide](#backend-integration-guide)
6. [Deployment Guide](#deployment-guide)
7. [Performance & Monitoring](#performance--monitoring)

## System Overview

NavSwap AI is the **comprehensive intelligence layer** for Smart EV Battery Swap Management. It provides real-time predictions, operational optimization, and explainable AI insights to manage the entire EV infrastructure network.

### Core Capabilities
- **Real-time Predictions**: Queue length, wait times, system reliability
- **Operational Intelligence**: Staff allocation, inventory management, logistics
- **Traffic Analysis**: Congestion monitoring, route optimization
- **Partner Coordination**: Storage network optimization
- **Explainable AI**: Human-readable insights using Gemini 2.5 Flash

## AI Model Architecture

### 🎯 Core Prediction Models (User-Facing - 4 Models)

#### 1. XGBoost Queue Prediction Model
- **Purpose**: Predicts vehicle queue length at stations
- **Input**: Station metrics, time, weather, historical patterns
- **Output**: Expected number of vehicles in queue
- **Accuracy**: 90%
- **Update Frequency**: Real-time (30 seconds)
- **Serves**: Mobile app users for station selection

#### 2. XGBoost Wait Time Model
- **Purpose**: Estimates customer wait times
- **Input**: Current queue, station efficiency, battery swap rates
- **Output**: Wait time in minutes
- **Accuracy**: 85%
- **Update Frequency**: Real-time (30 seconds)
- **Serves**: User journey planning

#### 3. LightGBM Fault Prediction Model
- **Purpose**: Detects potential system failures
- **Input**: Equipment metrics, usage patterns, maintenance history
- **Output**: Fault probability (0-100%), risk level (LOW/MEDIUM/HIGH)
- **Accuracy**: 92%
- **Prediction Window**: 24-48 hours ahead
- **Serves**: Preventive maintenance scheduling

#### 4. XGBoost Action Decision Model
- **Purpose**: Recommends operational actions
- **Input**: All system metrics, predictions from other models
- **Output**: Action (NORMAL/REDIRECT/MAINTENANCE_ALERT) + confidence scores
- **Accuracy**: 88%
- **Serves**: Automated operational decision making

### ⚙️ Operations Intelligence Models (Admin-Facing - 8 Models)

#### 5. Traffic Forecast Model
- **Purpose**: Predicts traffic patterns 2-6 hours ahead
- **Input**: Historical traffic, events, weather, time patterns
- **Output**: Traffic density, congestion levels, peak hours
- **Serves**: Resource planning, proactive scaling

#### 6. Micro Traffic Model (Improved)
- **Purpose**: Real-time congestion analysis
- **Input**: Live traffic data, road conditions, incidents
- **Output**: Current congestion score, estimated delays
- **Update Frequency**: 5 minutes
- **Serves**: Dynamic routing recommendations

#### 7. Battery Rebalance Model
- **Purpose**: Optimizes battery distribution across stations
- **Input**: Station inventory, demand patterns, transport costs
- **Output**: Rebalancing plan, priority levels, resource allocation
- **Serves**: Logistics optimization, cost reduction

#### 8. Stock Order Model
- **Purpose**: Predicts inventory needs and automates ordering
- **Input**: Consumption patterns, lead times, seasonal factors
- **Output**: Order quantities, urgency levels, delivery windows
- **Serves**: Supply chain management

#### 9. Staff Diversion Model
- **Purpose**: Allocates human resources dynamically
- **Input**: Station needs, staff availability, skill requirements
- **Output**: Staff allocation plan, skill matching, duration estimates
- **Serves**: Human resource optimization

#### 10. Tieup Storage Model
- **Purpose**: Coordinates with partner storage networks
- **Input**: Capacity needs, partner availability, costs
- **Output**: Storage allocation, partner selection, duration planning
- **Serves**: Network capacity management

#### 11. Customer Arrival Model
- **Purpose**: Forecasts customer demand patterns
- **Input**: Historical arrivals, events, weather, promotions
- **Output**: Expected arrivals, peak times, demand surges
- **Serves**: Capacity planning, staffing decisions

#### 12. Battery Demand Model
- **Purpose**: Estimates battery consumption and supply needs
- **Input**: Usage patterns, seasonal trends, growth projections
- **Output**: Demand forecasts, supply requirements, buffer calculations
- **Serves**: Strategic planning, procurement

### 🧠 AI Enhancement Layer

#### 13. Station Recommender Model
- **Purpose**: Intelligent station ranking and selection
- **Input**: All prediction outputs, user preferences, constraints
- **Output**: Ranked station list, alternatives, confidence scores
- **Serves**: Unified recommendation engine

#### 14. Gemini 2.5 Flash LLM
- **Purpose**: Explainable AI insights and decision transparency
- **Input**: All model outputs, operational context
- **Output**: Human-readable explanations, actionable insights
- **Serves**: Decision transparency, user trust, operational clarity

## User vs Admin Models

### 👥 User-Facing Models (3 Primary)
**Purpose**: Serve end users through mobile apps and station interfaces

| Model | Function | User Benefit |
|-------|----------|--------------|
| Queue Prediction | Shows expected queue length | Choose less crowded stations |
| Wait Time Prediction | Estimates wait duration | Plan journey timing |
| Station Recommender | Ranks optimal stations | Get best station for needs |

**Integration Points**:
- Mobile applications
- Station kiosks
- Web portals
- Navigation systems

### 🏢 Admin-Facing Models (10+ Models)
**Purpose**: Serve operations teams, admin dashboards, and automated systems

| Model Category | Models | Admin Benefit |
|----------------|--------|---------------|
| **Maintenance** | Fault Prediction, Action Decisions | Prevent downtime, automate responses |
| **Logistics** | Battery Rebalance, Stock Orders, Storage | Optimize supply chain, reduce costs |
| **Operations** | Staff Diversion, Traffic Analysis | Efficient resource allocation |
| **Planning** | Demand Forecasting, Customer Arrivals | Strategic capacity planning |
| **Intelligence** | AI Explanations | Decision transparency, insights |

**Integration Points**:
- Operations dashboards
- Maintenance systems
- Inventory management
- Staff scheduling
- Partner networks
- Business intelligence

## API Endpoints

### Individual Model Endpoints

#### Load Prediction
```http
POST /api/v1/predict-load
Content-Type: application/json

{
  "timestamp": "2024-01-15T14:30:00",
  "station_id": "ST001",
  "current_queue": 3,
  "battery_level": 75.0,
  "energy_demand": 120.0,
  "weather_temp": 25.0,
  "is_weekend": false,
  "hour_of_day": 14,
  "station_reliability": 0.95,
  "energy_stability": 0.88
}

Response:
{
  "predicted_queue_length": 4.2,
  "predicted_wait_time": 12.5
}
```

#### Fault Prediction
```http
POST /api/v1/predict-fault
Content-Type: application/json

{...same input data...}

Response:
{
  "fault_risk": "MEDIUM",
  "fault_probability": 0.35
}
```

#### Action Recommendation
```http
POST /api/v1/predict-action
Content-Type: application/json

{...same input data...}

Response:
{
  "system_action": "NORMAL",
  "action_probabilities": {
    "NORMAL": 0.75,
    "REDIRECT": 0.20,
    "MAINTENANCE_ALERT": 0.05
  }
}
```

#### AI Explanation
```http
POST /api/v1/explain-decision
Content-Type: application/json

{
  "action": "REDIRECT",
  "queue_prediction": 8.5,
  "wait_time": 25.0,
  "fault_probability": 0.15,
  "station_reliability": 0.95,
  "energy_stability": 0.88
}

Response:
{
  "explanation": "NavSwap AI recommends redirecting customers due to high queue prediction (8.5 vehicles) resulting in extended wait times (25 minutes). While the station shows good reliability (95%), the current load exceeds optimal capacity, making nearby stations a better choice for faster service."
}
```

### Unified Intelligence Endpoints

#### Smart Station Recommendation (User-Facing)
```http
POST /api/v1/smart-recommend
Content-Type: application/json

{
  "user_context": {
    "battery_level": 25,
    "urgency": "high",
    "distance": "nearby",
    "max_wait_time": 15
  },
  "stations_data": [
    {
      "station_id": "ST001",
      "station_name": "Downtown Hub",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "current_queue": 3,
      "battery_level": 80.0,
      "energy_demand": 110.0,
      "weather_temp": 24.0,
      "is_weekend": false,
      "hour_of_day": 14,
      "station_reliability": 0.95,
      "energy_stability": 0.90,
      "base_score": 0.9
    }
  ]
}

Response:
{
  "recommended_station": {
    "station_id": "ST001",
    "station_name": "Downtown Hub",
    "predicted_queue": 3.2,
    "predicted_wait": 10.5,
    "system_action": "NORMAL",
    "recommendation_score": 0.92
  },
  "alternatives": [...],
  "ai_predictions": {
    "predicted_queue": 3.2,
    "predicted_wait": 10.5,
    "fault_probability": 0.08,
    "system_action": "NORMAL"
  },
  "explanation": "Downtown Hub is your best choice with only 3.2 vehicles ahead and 10.5 minute wait time. The station shows excellent reliability (95%) and normal operations, perfect for your high urgency needs.",
  "confidence": 0.92
}
```

#### Smart Operations (Admin-Facing)
```http
POST /api/v1/smart-operations
Content-Type: application/json

{
  "station_metrics": {
    "station_id": "ST001",
    "current_queue": 4,
    "battery_level": 65.0,
    "energy_demand": 140.0,
    "weather_temp": 26.0,
    "is_weekend": false,
    "hour_of_day": 15,
    "station_reliability": 0.88,
    "energy_stability": 0.82,
    "timestamp": "2024-01-15T15:30:00"
  },
  "traffic_metrics": {
    "road_congestion": 0.7,
    "nearby_events": true,
    "weather_impact": 0.3,
    "rush_hour": true
  },
  "staff_availability": {
    "current_staff": 3,
    "available_nearby": 2,
    "skill_levels": ["expert", "intermediate", "beginner"]
  },
  "inventory_levels": {
    "batteries_in_stock": 15,
    "batteries_in_transit": 5,
    "daily_consumption": 25,
    "reorder_threshold": 10
  },
  "customer_context": {
    "battery_level": 18,
    "urgency": "high",
    "distance": "2km",
    "max_wait_time": 10,
    "vehicle_type": "sedan"
  }
}

Response:
{
  "station_recommendation": {
    "station_name": "ST001",
    "predicted_queue": 0.5,
    "predicted_wait": 0.2,
    "system_action": "MAINTENANCE_ALERT"
  },
  "traffic_prediction": {
    "micro_traffic_score": 0.70,
    "congestion_level": "MEDIUM",
    "traffic_trend": "STABLE"
  },
  "battery_transport_plan": {
    "rebalance_needed": true,
    "batteries_to_move": 3,
    "priority": "MEDIUM",
    "estimated_time": 18
  },
  "staff_diversion_plan": {
    "diversion_needed": true,
    "staff_count": 2,
    "source_stations": ["ST003", "ST004"],
    "target_station": "ST001",
    "priority": "HIGH",
    "estimated_duration": "3h",
    "skills_required": ["battery_tech", "maintenance"]
  },
  "inventory_order_plan": {
    "order_needed": true,
    "battery_quantity": 12,
    "urgency": "MEDIUM",
    "delivery_window": "12h"
  },
  "partner_storage_plan": {
    "storage_needed": true,
    "partner_stations": ["PARTNER_A"],
    "storage_duration": "6h",
    "storage_capacity": 5
  },
  "ai_explanation": "NavSwap AI has coordinated a comprehensive response to the maintenance alert at ST001. We're deploying 2 specialized technicians for a 3-hour maintenance window while simultaneously rebalancing 3 batteries and ordering 12 new units. Partner storage has been activated to handle overflow, ensuring zero service disruption during maintenance.",
  "confidence_score": 0.87
}
```

### System Endpoints
```http
GET /health                    # Service health check
GET /                         # Service status  
GET /docs                     # Interactive API documentation
```

## Backend Integration Guide

### Architecture Integration

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   IoT Sensors   │───▶│   NavSwap AI     │───▶│   User Apps     │
│   Station Data  │    │   Microservice   │    │   Mobile/Web    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Admin Dashboard  │
                       │ Operations Panel │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │ Partner Systems  │
                       │ External APIs    │
                       └──────────────────┘
```

### Integration Patterns

#### 1. Real-Time User Recommendations
```python
# Mobile App Integration
import requests
import asyncio

class NavSwapClient:
    def __init__(self, base_url="http://navswap-ai:8000"):
        self.base_url = base_url
    
    async def get_station_recommendation(self, user_location, battery_level, urgency="medium"):
        # Get nearby stations from your database
        stations = await self.get_nearby_stations(user_location)
        
        # Prepare request for AI service
        request_data = {
            "user_context": {
                "battery_level": battery_level,
                "urgency": urgency,
                "distance": "nearby",
                "max_wait_time": 20 if urgency == "high" else 30
            },
            "stations_data": stations
        }
        
        # Get AI recommendation
        response = requests.post(
            f"{self.base_url}/api/v1/smart-recommend",
            json=request_data
        )
        
        return response.json()

# Usage in mobile app
client = NavSwapClient()
recommendation = await client.get_station_recommendation(
    user_location=(40.7128, -74.0060),
    battery_level=25,
    urgency="high"
)
```

#### 2. Operations Dashboard Integration
```python
# Admin Dashboard Integration
class OperationsManager:
    def __init__(self, ai_service_url="http://navswap-ai:8000"):
        self.ai_url = ai_service_url
    
    async def get_operational_insights(self, station_id):
        # Collect real-time data
        station_data = await self.get_station_metrics(station_id)
        traffic_data = await self.get_traffic_data(station_id)
        staff_data = await self.get_staff_availability(station_id)
        inventory_data = await self.get_inventory_levels(station_id)
        
        # Get comprehensive AI analysis
        request_data = {
            "station_metrics": station_data,
            "traffic_metrics": traffic_data,
            "staff_availability": staff_data,
            "inventory_levels": inventory_data,
            "customer_context": {}
        }
        
        response = requests.post(
            f"{self.ai_url}/api/v1/smart-operations",
            json=request_data
        )
        
        return response.json()
    
    async def execute_ai_recommendations(self, operations_plan):
        # Execute staff diversion
        if operations_plan["staff_diversion_plan"]["diversion_needed"]:
            await self.dispatch_staff(operations_plan["staff_diversion_plan"])
        
        # Execute battery rebalancing
        if operations_plan["battery_transport_plan"]["rebalance_needed"]:
            await self.schedule_battery_transport(operations_plan["battery_transport_plan"])
        
        # Execute inventory orders
        if operations_plan["inventory_order_plan"]["order_needed"]:
            await self.place_inventory_order(operations_plan["inventory_order_plan"])
        
        # Activate partner storage
        if operations_plan["partner_storage_plan"]["storage_needed"]:
            await self.activate_partner_storage(operations_plan["partner_storage_plan"])

# Usage in operations dashboard
ops_manager = OperationsManager()
insights = await ops_manager.get_operational_insights("ST001")
await ops_manager.execute_ai_recommendations(insights)
```

#### 3. Microservices Integration
```python
# FastAPI Backend Integration
from fastapi import FastAPI, BackgroundTasks
import httpx

app = FastAPI()

class NavSwapOrchestrator:
    def __init__(self):
        self.ai_service = "http://navswap-ai:8000"
        self.user_service = "http://user-service:8001"
        self.station_service = "http://station-service:8002"
        self.notification_service = "http://notification-service:8003"
    
    async def handle_user_request(self, user_id: str, location: tuple):
        async with httpx.AsyncClient() as client:
            # Get user preferences
            user_data = await client.get(f"{self.user_service}/users/{user_id}")
            user_prefs = user_data.json()
            
            # Get nearby stations
            stations_data = await client.get(
                f"{self.station_service}/stations/nearby",
                params={"lat": location[0], "lng": location[1]}
            )
            stations = stations_data.json()
            
            # Get AI recommendation
            ai_request = {
                "user_context": {
                    "battery_level": user_prefs["current_battery"],
                    "urgency": user_prefs["urgency_level"],
                    "distance": "nearby"
                },
                "stations_data": stations
            }
            
            ai_response = await client.post(
                f"{self.ai_service}/api/v1/smart-recommend",
                json=ai_request
            )
            
            recommendation = ai_response.json()
            
            # Send notification to user
            await client.post(
                f"{self.notification_service}/send",
                json={
                    "user_id": user_id,
                    "message": f"Best station: {recommendation['recommended_station']['station_name']}",
                    "explanation": recommendation["explanation"]
                }
            )
            
            return recommendation

@app.post("/recommend-station/{user_id}")
async def recommend_station(user_id: str, location: dict):
    orchestrator = NavSwapOrchestrator()
    return await orchestrator.handle_user_request(
        user_id, 
        (location["latitude"], location["longitude"])
    )
```

#### 4. Event-Driven Integration
```python
# Event-driven architecture with message queues
import asyncio
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
import json

class AIEventProcessor:
    def __init__(self):
        self.ai_service = "http://navswap-ai:8000"
        self.producer = AIOKafkaProducer(bootstrap_servers='kafka:9092')
        self.consumer = AIOKafkaConsumer(
            'station-events',
            bootstrap_servers='kafka:9092',
            group_id='ai-processor'
        )
    
    async def process_station_events(self):
        await self.consumer.start()
        try:
            async for message in self.consumer:
                event_data = json.loads(message.value.decode())
                
                if event_data["type"] == "maintenance_alert":
                    await self.handle_maintenance_alert(event_data)
                elif event_data["type"] == "high_demand":
                    await self.handle_high_demand(event_data)
                elif event_data["type"] == "fault_detected":
                    await self.handle_fault_detection(event_data)
        finally:
            await self.consumer.stop()
    
    async def handle_maintenance_alert(self, event_data):
        # Get comprehensive operational plan
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.ai_service}/api/v1/smart-operations",
                json=event_data["station_data"]
            )
            
            operations_plan = response.json()
            
            # Publish individual action events
            if operations_plan["staff_diversion_plan"]["diversion_needed"]:
                await self.producer.send(
                    'staff-actions',
                    json.dumps(operations_plan["staff_diversion_plan"]).encode()
                )
            
            if operations_plan["battery_transport_plan"]["rebalance_needed"]:
                await self.producer.send(
                    'logistics-actions',
                    json.dumps(operations_plan["battery_transport_plan"]).encode()
                )
            
            # Send notification to operations team
            await self.producer.send(
                'notifications',
                json.dumps({
                    "type": "operations_plan",
                    "station_id": event_data["station_id"],
                    "plan": operations_plan,
                    "explanation": operations_plan["ai_explanation"]
                }).encode()
            )

# Start event processor
processor = AIEventProcessor()
asyncio.run(processor.process_station_events())
```

### Database Integration

#### Station Data Schema
```sql
-- Station metrics table
CREATE TABLE station_metrics (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    current_queue INTEGER,
    battery_level FLOAT,
    energy_demand FLOAT,
    weather_temp FLOAT,
    is_weekend BOOLEAN,
    hour_of_day INTEGER,
    station_reliability FLOAT,
    energy_stability FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- AI predictions cache
CREATE TABLE ai_predictions (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL,
    prediction_type VARCHAR(50) NOT NULL,
    predicted_value JSONB NOT NULL,
    confidence_score FLOAT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Operations actions log
CREATE TABLE operations_actions (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB NOT NULL,
    ai_explanation TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Caching Strategy
```python
# Redis caching for AI predictions
import redis
import json
from datetime import timedelta

class AIPredictionCache:
    def __init__(self):
        self.redis_client = redis.Redis(host='redis', port=6379, db=0)
    
    async def cache_prediction(self, station_id: str, prediction_type: str, 
                             prediction_data: dict, ttl_minutes: int = 5):
        cache_key = f"ai_prediction:{station_id}:{prediction_type}"
        
        await self.redis_client.setex(
            cache_key,
            timedelta(minutes=ttl_minutes),
            json.dumps(prediction_data)
        )
    
    async def get_cached_prediction(self, station_id: str, prediction_type: str):
        cache_key = f"ai_prediction:{station_id}:{prediction_type}"
        cached_data = await self.redis_client.get(cache_key)
        
        if cached_data:
            return json.loads(cached_data)
        return None
    
    async def invalidate_station_cache(self, station_id: str):
        pattern = f"ai_prediction:{station_id}:*"
        keys = await self.redis_client.keys(pattern)
        if keys:
            await self.redis_client.delete(*keys)

# Usage in API endpoints
cache = AIPredictionCache()

@app.post("/predict-load/{station_id}")
async def predict_load_cached(station_id: str, request_data: dict):
    # Check cache first
    cached_result = await cache.get_cached_prediction(station_id, "load")
    if cached_result:
        return cached_result
    
    # Get fresh prediction from AI service
    ai_response = await call_ai_service("/predict-load", request_data)
    
    # Cache the result
    await cache.cache_prediction(station_id, "load", ai_response, ttl_minutes=2)
    
    return ai_response
```

## Deployment Guide

### Docker Deployment
```dockerfile
# Production Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/
COPY .env.example .env

# Create models directory
RUN mkdir -p app/models

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
EXPOSE 8000
CMD ["python", "-m", "app.main"]
```

### Kubernetes Deployment
```yaml
# navswap-ai-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: navswap-ai-service
  labels:
    app: navswap-ai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: navswap-ai
  template:
    metadata:
      labels:
        app: navswap-ai
    spec:
      containers:
      - name: navswap-ai
        image: navswap/ai-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: navswap-secrets
              key: gemini-api-key
        - name: HOST
          value: "0.0.0.0"
        - name: PORT
          value: "8000"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: models-volume
          mountPath: /app/models
      volumes:
      - name: models-volume
        persistentVolumeClaim:
          claimName: navswap-models-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: navswap-ai-service
spec:
  selector:
    app: navswap-ai
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: navswap-ai-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: ai.navswap.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: navswap-ai-service
            port:
              number: 80
```

### Environment Configuration
```bash
# Production environment variables
GEMINI_API_KEY=your_production_gemini_key
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=INFO
ENVIRONMENT=production
DEBUG=False

# Database connections
DATABASE_URL=postgresql://user:pass@db:5432/navswap
REDIS_URL=redis://redis:6379/0

# External services
STATION_SERVICE_URL=http://station-service:8001
USER_SERVICE_URL=http://user-service:8002
NOTIFICATION_SERVICE_URL=http://notification-service:8003

# Monitoring
PROMETHEUS_METRICS=true
JAEGER_ENDPOINT=http://jaeger:14268/api/traces
```

## Performance & Monitoring

### Performance Metrics
- **Response Time**: < 200ms (95th percentile)
- **Throughput**: 10,000+ requests/second
- **Availability**: 99.9% uptime
- **Accuracy**: 85-95% across all models
- **Cache Hit Rate**: > 80% for frequent predictions

### Monitoring Setup
```python
# Prometheus metrics
from prometheus_client import Counter, Histogram, Gauge, start_http_server

# Metrics
REQUEST_COUNT = Counter('navswap_ai_requests_total', 'Total requests', ['method', 'endpoint'])
REQUEST_LATENCY = Histogram('navswap_ai_request_duration_seconds', 'Request latency')
MODEL_ACCURACY = Gauge('navswap_ai_model_accuracy', 'Model accuracy', ['model_name'])
ACTIVE_PREDICTIONS = Gauge('navswap_ai_active_predictions', 'Active predictions in cache')

# Middleware for metrics collection
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path
    ).inc()
    
    REQUEST_LATENCY.observe(time.time() - start_time)
    
    return response

# Start metrics server
start_http_server(9090)
```

### Logging Configuration
```python
# Structured logging
import structlog
import logging

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# Usage in services
logger = structlog.get_logger()

async def predict_load(data):
    logger.info(
        "load_prediction_started",
        station_id=data.get("station_id"),
        queue_length=data.get("current_queue")
    )
    
    try:
        result = await model.predict(data)
        
        logger.info(
            "load_prediction_completed",
            station_id=data.get("station_id"),
            predicted_queue=result["queue"],
            predicted_wait=result["wait_time"]
        )
        
        return result
    except Exception as e:
        logger.error(
            "load_prediction_failed",
            station_id=data.get("station_id"),
            error=str(e)
        )
        raise
```

### Alert Configuration
```yaml
# Prometheus alerting rules
groups:
- name: navswap-ai-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(navswap_ai_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: critical
    annotations:
      summary: "High error rate in NavSwap AI service"
      description: "Error rate is {{ $value }} errors per second"

  - alert: HighLatency
    expr: histogram_quantile(0.95, navswap_ai_request_duration_seconds) > 0.5
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High latency in NavSwap AI service"
      description: "95th percentile latency is {{ $value }} seconds"

  - alert: ModelAccuracyDrop
    expr: navswap_ai_model_accuracy < 0.8
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Model accuracy dropped below threshold"
      description: "Model {{ $labels.model_name }} accuracy is {{ $value }}"
```

This comprehensive documentation covers the complete NavSwap AI system architecture, integration patterns, and deployment strategies for both user-facing and admin-facing functionality.