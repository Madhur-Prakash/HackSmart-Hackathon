# run_model_api.py
# FastAPI server to serve model inference requests
# Usage: POST /predict with JSON {"model_path": ..., "input_data": {...}}

from fastapi import FastAPI, Request
from pydantic import BaseModel
from typing import Any, Dict
import pickle
import uvicorn
import os

app = FastAPI()

class PredictRequest(BaseModel):
    model_path: str
    input_data: Dict[str, Any]

@app.post("/predict")
async def predict(req: PredictRequest):
    model_path = req.model_path
    input_data = req.input_data
    if not os.path.exists(model_path):
        return {"error": f"Model not found: {model_path}"}
    try:
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        # Assume model has a predict method and input_data is a dict
        # You may need to adapt this for your model's API
        result = model.predict([list(input_data.values())])
        return {"prediction": result[0] if len(result) == 1 else result}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
