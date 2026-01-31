# run_model.py
# Python script to load a .pkl model and run inference
import sys
import json
import joblib

if len(sys.argv) < 2:
    print(json.dumps({'error': 'Model path required'}))
    sys.exit(1)

model_path = sys.argv[1]
input_data = json.loads(sys.stdin.read())

try:
    model = joblib.load(model_path)
    # For XGBoost/LightGBM, input_data should be a dict or DataFrame
    import numpy as np
    import pandas as pd
    X = pd.DataFrame([input_data])
    prediction = model.predict(X)
    # If model has predict_proba, include it
    result = {'prediction': prediction.tolist()}
    if hasattr(model, 'predict_proba'):
        result['proba'] = model.predict_proba(X).tolist()
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
    sys.exit(2)
