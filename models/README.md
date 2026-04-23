AI bootstrap for models (lightweight by default)

Overview
- Lightweight Plant Disease detection model (TFLite, ~4MB) is included and will be loaded by default if AI_SMALL_MODEL=1.
- Optional heavy model: irrigation predictor (ONNX, ~2GB) is not downloaded automatically. It can be downloaded on demand via bootstrap script.

Bootstrap usage
- Script: npm run setup-models
- Environment variables:
  - AI_SMALL_MODEL (default 1): enable/disable small model
  - AI_LARGE_MODEL (default 0): enable/disable large model
  - AI_ONNX_URL: URL to ONNX irrigation model if AI_LARGE_MODEL=1
  - AI_ONNX_URL_ALT: alternative URL if required
- How to bootstrap:
 1) export AI_SMALL_MODEL=1
 2) export AI_LARGE_MODEL=0 (default)
 3) npm run setup-models
- For large model:
 1) export AI_LARGE_MODEL=1
 2) export AI_ONNX_URL="https://path/to/irrigation_lstm.onnx"
 3) npm run setup-models

Notes
- If you need to host a private large model, you can pass a URL via AI_ONNX_URL.
- Bootstrap respects network constraints and will skip downloading when URL not provided or environment disables large model.
