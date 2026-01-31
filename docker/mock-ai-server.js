/**
 * Mock AI Service
 * Simulates external AI prediction endpoints for development and testing
 */


const express = require('express');
const app = express();
const PORT = process.env.PORT || 8081;

app.use(express.json());

// Mock load forecast endpoint
app.get('/ai/load-forecast', (req, res) => {
  const { stationId } = req.query;
  
  if (!stationId) {
    return res.status(400).json({ error: 'stationId required' });
  }

  const hour = new Date().getHours();
  const isPeakHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  
  const forecast = {
    stationId,
    predictedLoad: isPeakHour 
      ? 0.7 + Math.random() * 0.25 
      : 0.3 + Math.random() * 0.3,
    confidence: 0.75 + Math.random() * 0.2,
    peakTimeStart: '17:00',
    peakTimeEnd: '19:00',
    timestamp: Math.floor(Date.now() / 1000),
  };

  console.log(`Load forecast requested for ${stationId}:`, forecast.predictedLoad);
  res.json(forecast);
});

// Mock fault probability endpoint
app.get('/ai/fault-probability', (req, res) => {
  const { stationId } = req.query;
  
  if (!stationId) {
    return res.status(400).json({ error: 'stationId required' });
  }

  const probability = Math.random() * 0.15; // 0-15% fault probability
  
  let riskLevel;
  if (probability < 0.05) {
    riskLevel = 'low';
  } else if (probability < 0.15) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  const prediction = {
    stationId,
    faultProbability: probability,
    predictedFaultType: probability > 0.1 ? 'charger_malfunction' : null,
    riskLevel,
    confidence: 0.8 + Math.random() * 0.15,
    timestamp: Math.floor(Date.now() / 1000),
  };

  console.log(`Fault prediction requested for ${stationId}:`, prediction.riskLevel);
  res.json(prediction);
});

// Batch prediction endpoint
app.post('/ai/batch-predict', (req, res) => {
  const { stationIds } = req.body;
  
  if (!stationIds || !Array.isArray(stationIds)) {
    return res.status(400).json({ error: 'stationIds array required' });
  }

  const predictions = stationIds.map(stationId => ({
    stationId,
    loadForecast: {
      predictedLoad: 0.4 + Math.random() * 0.4,
      confidence: 0.8,
    },
    faultPrediction: {
      faultProbability: Math.random() * 0.1,
      riskLevel: 'low',
      confidence: 0.85,
    },
  }));

  console.log(`Batch prediction for ${stationIds.length} stations`);
  res.json({ predictions });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'mock-ai',
    timestamp: new Date().toISOString() 
  });
});

app.listen(PORT, () => {
  console.log(`🤖 Mock AI Service running on port ${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET  /ai/load-forecast?stationId=XXX`);
  console.log(`   GET  /ai/fault-probability?stationId=XXX`);
  console.log(`   POST /ai/batch-predict`);
  console.log(`   GET  /health`);
});
