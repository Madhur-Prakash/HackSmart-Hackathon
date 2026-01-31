// modelRunner.ts
// Node.js bridge to run Python model inference for .pkl models
// Usage: import and call runModel(modelPath, inputData)

import axios from 'axios';

/**
 * Calls the FastAPI model server for inference
 */
export async function runModel(modelPath: string, inputData: object): Promise<any> {
  try {
    const response = await axios.post('http://localhost:8001/predict', {
      model_path: modelPath,
      input_data: inputData
    });
    if (response.data.error) throw new Error(response.data.error);
    return response.data;
  } catch (err) {
    throw new Error('Model API error: ' + (err instanceof Error ? err.message : String(err)));
  }
}
