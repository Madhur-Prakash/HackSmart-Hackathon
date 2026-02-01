# run_model_api.py
# FastAPI server to serve model inference requests
# Usage: POST /predict with JSON {"model_path": ..., "input_data": {...}}

from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
import pickle
import joblib
import uvicorn
import os
import numpy as np
import pandas as pd
from datetime import datetime

app = FastAPI()

class PredictRequest(BaseModel):
    model_path: str
    input_data: Dict[str, Any]

def preprocess_features(data: Dict[str, Any], model_type: str = "standard") -> np.ndarray:
    """
    Preprocess input data to match the feature format expected by ML models.
    This mirrors the preprocessing done in Hacksmart_Nexora_Navswap_AI/app/utils/preprocessing.py
    
    Args:
        data: Input data dictionary
        model_type: One of "standard" (23 features), "fault" (25 features)
    """
    # Extract timestamp info
    timestamp_str = data.get('timestamp', datetime.now().isoformat())
    try:
        timestamp = pd.to_datetime(timestamp_str)
    except:
        timestamp = datetime.now()
    
    hour_of_day = timestamp.hour
    day_of_week = timestamp.weekday()
    is_weekend = timestamp.weekday() >= 5
    
    # Get values from input data with defaults (support both snake_case and camelCase)
    current_queue = data.get('current_queue', data.get('currentQueue', data.get('queue_length', 5)))
    battery_level = data.get('battery_level', data.get('batteryLevel', 50))
    energy_demand = data.get('energy_demand', data.get('energyDemand', 100))
    weather_temp = data.get('weather_temp', data.get('weatherTemp', 25))
    station_reliability = data.get('station_reliability', data.get('stationReliability', 
                                   data.get('station_reliability_score', 0.9)))
    energy_stability = data.get('energy_stability', data.get('energyStability',
                                data.get('energy_stability_index', 0.9)))
    station_id = data.get('station_id', data.get('stationId', 'STATION_000'))
    avg_wait_time = data.get('avg_wait_time', data.get('avgWaitTime', current_queue * 3))
    
    # Available/total values
    available_batteries = data.get('available_batteries', data.get('availableBatteries', current_queue * 2))
    total_batteries = data.get('total_batteries', data.get('totalBatteries', 50))
    available_chargers = data.get('available_chargers', data.get('availableChargers', 10))
    total_chargers = data.get('total_chargers', data.get('totalChargers', 15))
    power_usage_kw = data.get('power_usage_kw', data.get('powerUsageKw', energy_demand))
    power_capacity_kw = data.get('power_capacity_kw', data.get('powerCapacityKw', 200))
    
    # Handle weather condition mapping
    weather_condition = data.get('weather_condition', data.get('weatherCondition', 'Clear'))
    weather_clear = 0
    weather_fog = 0
    weather_rain = 0
    
    if weather_condition == 'Fog' or weather_temp < 10:
        weather_fog = 1
    elif weather_condition == 'Rain' or weather_temp > 35:
        weather_rain = 1
    else:
        weather_clear = 1
    
    # Handle status mapping
    status = data.get('status', 'OPERATIONAL').upper()
    status_degraded = 1 if status == 'DEGRADED' else 0
    status_maintenance = 1 if status == 'MAINTENANCE' else 0
    status_operational = 1 if status == 'OPERATIONAL' else 0
    
    # Station ID one-hot encoding (default to STATION_000)
    station_ids = ['STATION_000', 'STATION_001', 'STATION_002', 'STATION_003', 'STATION_004']
    station_one_hot = [1 if station_id == sid else 0 for sid in station_ids]
    # If station_id not recognized, default to STATION_000
    if sum(station_one_hot) == 0:
        station_one_hot[0] = 1
    
    is_peak_hour = 1 if hour_of_day in [8, 9, 17, 18, 19] else 0
    traffic_factor = 1.2 if is_weekend else 1.0
    
    if model_type == "fault":
        # lgbm_fault_tuned_model expects 25 features in this exact order:
        # ['queue_length', 'available_batteries', 'total_batteries', 'available_chargers', 
        #  'total_chargers', 'avg_wait_time', 'power_usage_kw', 'power_capacity_kw', 
        #  'hour_of_day', 'day_of_week', 'is_peak_hour', 'traffic_factor', 
        #  'station_reliability_score', 'energy_stability_index', 
        #  'weather_condition_Clear', 'weather_condition_Fog', 'weather_condition_Rain', 
        #  'status_DEGRADED', 'status_MAINTENANCE', 'status_OPERATIONAL', 
        #  'station_id_STATION_000', 'station_id_STATION_001', 'station_id_STATION_002', 
        #  'station_id_STATION_003', 'station_id_STATION_004']
        feature_vector = [
            float(current_queue),           # queue_length
            float(available_batteries),     # available_batteries
            float(total_batteries),         # total_batteries
            float(available_chargers),      # available_chargers
            float(total_chargers),          # total_chargers
            float(avg_wait_time),           # avg_wait_time
            float(power_usage_kw),          # power_usage_kw
            float(power_capacity_kw),       # power_capacity_kw
            float(hour_of_day),             # hour_of_day
            float(day_of_week),             # day_of_week
            float(is_peak_hour),            # is_peak_hour
            float(traffic_factor),          # traffic_factor
            float(station_reliability),     # station_reliability_score
            float(energy_stability),        # energy_stability_index
            float(weather_clear),           # weather_condition_Clear
            float(weather_fog),             # weather_condition_Fog
            float(weather_rain),            # weather_condition_Rain
            float(status_degraded),         # status_DEGRADED
            float(status_maintenance),      # status_MAINTENANCE
            float(status_operational),      # status_OPERATIONAL
            float(station_one_hot[0]),      # station_id_STATION_000
            float(station_one_hot[1]),      # station_id_STATION_001
            float(station_one_hot[2]),      # station_id_STATION_002
            float(station_one_hot[3]),      # station_id_STATION_003
            float(station_one_hot[4]),      # station_id_STATION_004
        ]
    else:
        # Standard models (xgb_queue, xgb_wait, etc.) expect 23 features:
        # ['available_batteries', 'total_batteries', 'available_chargers', 'total_chargers',
        #  'power_usage_kw', 'power_capacity_kw', 'hour_of_day', 'day_of_week',
        #  'is_peak_hour', 'traffic_factor', 'station_reliability_score', 'energy_stability_index',
        #  'weather_condition_Clear', 'weather_condition_Fog', 'weather_condition_Rain',
        #  'status_DEGRADED', 'status_MAINTENANCE', 'status_OPERATIONAL',
        #  'station_id_STATION_000', 'station_id_STATION_001', 'station_id_STATION_002',
        #  'station_id_STATION_003', 'station_id_STATION_004']
        feature_vector = [
            float(available_batteries),     # available_batteries
            float(total_batteries),         # total_batteries
            float(available_chargers),      # available_chargers
            float(total_chargers),          # total_chargers
            float(power_usage_kw),          # power_usage_kw
            float(power_capacity_kw),       # power_capacity_kw
            float(hour_of_day),             # hour_of_day
            float(day_of_week),             # day_of_week
            float(is_peak_hour),            # is_peak_hour
            float(traffic_factor),          # traffic_factor
            float(station_reliability),     # station_reliability_score
            float(energy_stability),        # energy_stability_index
            float(weather_clear),           # weather_condition_Clear
            float(weather_fog),             # weather_condition_Fog
            float(weather_rain),            # weather_condition_Rain
            float(status_degraded),         # status_DEGRADED
            float(status_maintenance),      # status_MAINTENANCE
            float(status_operational),      # status_OPERATIONAL
            float(station_one_hot[0]),      # station_id_STATION_000
            float(station_one_hot[1]),      # station_id_STATION_001
            float(station_one_hot[2]),      # station_id_STATION_002
            float(station_one_hot[3]),      # station_id_STATION_003
            float(station_one_hot[4]),      # station_id_STATION_004
        ]
    
    return np.array([feature_vector])

def get_model_type(model_path: str) -> str:
    """Determine model type based on file name"""
    model_name = os.path.basename(model_path).lower()
    
    if 'fault' in model_name:
        return 'fault'
    elif 'recommender' in model_name:
        return 'recommender'
    elif 'gemini' in model_name or 'llm' in model_name:
        return 'llm'
    else:
        return 'standard'

def get_fallback_prediction(model_path: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Return sensible fallback predictions when model loading fails"""
    model_name = os.path.basename(model_path).lower()
    
    # Extract some input data for more realistic fallbacks
    current_queue = input_data.get('current_queue', input_data.get('currentQueue', 5))
    hour_of_day = input_data.get('hour_of_day', 12)
    
    if 'traffic' in model_name:
        # Traffic prediction: 0-1 scale
        base = 0.5 + (0.2 if hour_of_day in [8, 9, 17, 18, 19] else 0)
        return {"prediction": min(0.9, base), "fallback": True}
    elif 'fault' in model_name:
        return {"prediction": 0.15, "probabilities": [0.85, 0.15], "fallback": True}
    elif 'queue' in model_name:
        return {"prediction": float(current_queue), "fallback": True}
    elif 'wait' in model_name:
        return {"prediction": float(current_queue * 3), "fallback": True}
    elif 'demand' in model_name or 'arrival' in model_name:
        return {"prediction": 0.6, "fallback": True}
    elif 'rebalance' in model_name:
        return {"prediction": 0.4, "fallback": True}
    elif 'stock' in model_name or 'order' in model_name:
        return {"prediction": 0.5, "fallback": True}
    elif 'staff' in model_name or 'diversion' in model_name:
        return {"prediction": 0.3, "fallback": True}
    elif 'tieup' in model_name or 'storage' in model_name:
        return {"prediction": 0.4, "fallback": True}
    elif 'action' in model_name:
        return {"prediction": 0, "probabilities": [0.8, 0.15, 0.05], "fallback": True}
    elif 'recommender' in model_name:
        return {"prediction": 0.75, "recommendation_score": 0.75, "fallback": True}
    elif 'gemini' in model_name or 'llm' in model_name:
        return {"explanation": "This station is recommended based on optimal availability, minimal wait time, and reliable service.", "fallback": True}
    else:
        return {"prediction": 0.5, "fallback": True}

@app.post("/predict")
async def predict(req: PredictRequest):
    print(f"📢 Received request for model: {req.model_path}")
    model_path = req.model_path
    input_data = req.input_data
    
    if not os.path.exists(model_path):
        print(f"⚠️ Model not found, using fallback: {model_path}")
        return get_fallback_prediction(model_path, input_data)
    
    model_type = get_model_type(model_path)
    print(f"📊 Model type detected: {model_type}")
    
    try:
        # Load model (support both pickle and joblib)
        try:
            model = joblib.load(model_path)
        except Exception as load_err:
            print(f"⚠️ Failed to load model with joblib: {load_err}")
            try:
                with open(model_path, 'rb') as f:
                    model = pickle.load(f)
            except Exception as pickle_err:
                print(f"⚠️ Failed to load model with pickle: {pickle_err}")
                print(f"⚠️ Using fallback prediction for: {model_path}")
                return get_fallback_prediction(model_path, input_data)
        
        # Handle different model types
        if model_type == 'recommender':
            # Station recommender uses different logic - scoring rules
            stations_data = input_data.get('stations', [input_data])
            user_context = input_data.get('user_context', {})
            
            # Apply basic scoring if model has get_recommendation method
            if hasattr(model, 'get_recommendation'):
                result = model.get_recommendation(stations_data, user_context)
                return {"recommendation": result}
            else:
                # Fallback: just return a score
                return {"prediction": 0.75, "recommendation_score": 0.75}
        
        elif model_type == 'llm':
            # LLM/Gemini model - handle prompt-based input
            prompt = input_data.get('prompt', '')
            context = input_data.get('context', {})
            
            if hasattr(model, 'generate'):
                result = model.generate(prompt)
                return {"explanation": result}
            else:
                # Return a generic explanation
                return {"explanation": "This station is recommended based on optimal availability and minimal wait time."}
        
        else:
            # Standard ML models (traffic, demand, logistics, etc.)
            features = preprocess_features(input_data, model_type)
            print(f"📊 Feature shape: {features.shape}")
            
            # Make prediction
            if hasattr(model, 'predict_proba'):
                # Classification model with probabilities
                proba = model.predict_proba(features)[0]
                prediction = model.predict(features)[0]
                return {
                    "prediction": float(prediction) if isinstance(prediction, (int, float, np.number)) else prediction,
                    "probabilities": [float(p) for p in proba]
                }
            else:
                # Regression model
                result = model.predict(features)
                prediction = float(result[0]) if len(result) == 1 else [float(x) for x in result]
                return {"prediction": prediction}
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"⚠️ Prediction failed, using fallback: {e}")
        return get_fallback_prediction(model_path, input_data)

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/models")
async def list_models():
    """List available models in the models directory"""
    models_dir = "./models"
    if os.path.exists(models_dir):
        models = [f for f in os.listdir(models_dir) if f.endswith('.pkl')]
        return {"models": models}
    return {"models": []}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
