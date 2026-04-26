# Bootstrap System - Operations Runbook

This document describes how to operate, configure, and troubleshoot the EcoSynTech AI Bootstrap system. Target audience: DevOps, platform engineering, and customer support.

## System Overview

The Bootstrap system manages on-demand loading of AI/ML models aligned with ISO 27001:2022 A.14 controls.

| Model | ID | Size | Default | Purpose |
|-------|-----|------|---------|---------|
| Plant Disease Detector | model-001 | ~4MB | ON | TensorFlow Lite plant disease classification (38 classes) |
| Irrigation LSTM Predictor | model-002 | ~2GB | OFF | ONNX irrigation prediction model |

## Architecture

```
API Layer (/api/bootstrap/*)     → bootstrap_api.js
Model Loader (modelLoader.js)     → manages state, download, loading
AI Services (services/ai/*)      → tfliteDiseasePredictor, lstmIrrigationPredictor
Model Registry (models/registry.json) → ISO-aligned model inventory
Bootstrap UI (/bootstrap)         → admin dashboard
CLI Tool (bin/bootstrap-ai.js)   → CLI for ops teams
Setup Script (scripts/setup-models.sh) → initial model download
```

## Quick Reference

| Operation | Command |
|-----------|---------|
| Check status | `GET /api/bootstrap/status` or `node bin/bootstrap-ai.js status` |
| Health check | `GET /api/bootstrap/health` |
| View history | `GET /api/bootstrap/history?limit=20` |
| Enable small model | `POST /api/bootstrap/configure` with `{"small":true}` |
| Enable large model | `POST /api/bootstrap/configure` with `{"large":true,"largeUrl":"..."}` |
| Reload models | `POST /api/bootstrap/reload` |
| CLI bootstrap | `node bin/bootstrap-ai.js bootstrap` |
| Setup models | `./scripts/setup-models.sh` |
| Bootstrap UI | Open browser to `/bootstrap` |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| AI_SMALL_MODEL | 1 (ON) | Enable/disable small model (0=off, 1=on) |
| AI_LARGE_MODEL | 0 (OFF) | Enable/disable large model |
| AI_ONNX_URL | empty | URL to download large ONNX model from (supports direct URL or Google Drive link) |
| JWT_SECRET | — | Required for API authentication |
| WEBHOOK_SECRET | — | Required for webhook authentication |

### API Configuration (POST /api/bootstrap/configure)

```json
{
  "small": true,
  "large": true,
  "largeUrl": "https://drive.google.com/file/d/XXXX/view"
}
```

- `small`: boolean, enable/disable plant disease TFLite model
- `large`: boolean, enable/disable irrigation ONNX model
- `largeUrl`: string, URL for large model download (required when enabling large model)

All endpoints require `Authorization: Bearer <jwt_token>` header.

### Google Drive URL Support

Large models can be downloaded from Google Drive links:

```
https://drive.google.com/file/d/1aBcDeFgHiJkLmNoPqRs/view
https://drive.google.com/uc?export=download&id=1aBcDeFgHiJkLmNoPqRs
```

The system automatically extracts the Drive file ID and handles the confirmation cookie flow.

## API Reference

### GET /api/bootstrap/status

Returns current bootstrap state, model loading status, and health check summary.

**Response:**
```json
{
  "ok": true,
  "smallEnabled": true,
  "largeEnabled": false,
  "largeUrl": "",
  "lastBootstrapTs": "2026-04-23T12:00:00.000Z",
  "lightLoaded": true,
  "largeLoaded": false,
  "health": {
    "timestamp": "2026-04-23T12:00:00.000Z",
    "small": { "id": "model-001", "name": "Plant Disease Detector", "exists": true, "sizeMB": "3.90", "loaded": true, "healthy": true },
    "large": { "id": "model-002", "name": "Irrigation LSTM Predictor", "exists": false, "sizeMB": null, "loaded": false, "healthy": false },
    "overall": "healthy",
    "memoryUsageMB": 45
  }
}
```

### GET /api/bootstrap/health

Returns detailed health check with per-model status.

**Response:**
```json
{
  "ok": true,
  "timestamp": "2026-04-23T12:00:00.000Z",
  "small": { "id": "model-001", "name": "Plant Disease Detector", "exists": true, "sizeMB": "3.90", "loaded": true, "healthy": true },
  "large": { "id": "model-002", "name": "Irrigation LSTM Predictor", "exists": false, "sizeMB": null, "loaded": false, "healthy": false },
  "overall": "healthy",
  "memoryUsageMB": 45
}
```

### GET /api/bootstrap/history

Returns ring buffer of bootstrap operations (max 100 entries, auto-cleanup).

**Query params:** `limit` (default 20, max 100)

**Response:**
```json
{
  "ok": true,
  "history": [
    { "ts": "2026-04-23T12:00:00.000Z", "action": "bootstrap_end", "smallLoaded": true, "largeLoaded": false },
    { "ts": "2026-04-23T12:00:00.000Z", "action": "load_small", "status": "loaded", "ms": 245 }
  ]
}
```

### POST /api/bootstrap/configure

Update bootstrap configuration without reloading.

**Request:**
```json
{ "small": true, "large": false, "largeUrl": "" }
```

**Response:** Same as GET /api/bootstrap/status

### POST /api/bootstrap/reload

Trigger full model reload (unload + reinitialize).

**Response:**
```json
{
  "ok": true,
  "result": {
    "light": true,
    "large": false
  }
}
```

## Bootstrap UI

Accessible at `/bootstrap` (requires admin auth).

Features:
- Status dashboard with model health indicators
- Configuration panel (toggle small/large models, set Drive URL)
- History timeline with timestamps and operation results
- Reload button for live reloading
- Real-time status updates via polling

## CLI Tool

```bash
# Bootstrap models
node bin/bootstrap-ai.js bootstrap

# Check status
node bin/bootstrap-ai.js status

# Health check
node bin/bootstrap-ai.js health

# View history
node bin/bootstrap-ai.js history

# Configure models
node bin/bootstrap-ai.js configure --small=1 --large=0 --large-url="..."

# Reload models
node bin/bootstrap-ai.js reload

# Download large model from URL
node bin/bootstrap-ai.js download --url="..."

# Download from Google Drive
node bin/bootstrap-ai.js download --url="https://drive.google.com/file/d/XXXX/view"
```

## Setup Script

```bash
# Download all models (default: small only)
./scripts/setup-models.sh

# Download small model only
AI_SMALL_MODEL=1 AI_LARGE_MODEL=0 ./scripts/setup-models.sh

# Download large model from Drive URL
AI_LARGE_MODEL=1 AI_ONNX_URL="https://drive.google.com/file/d/XXXX/view" ./scripts/setup-models.sh

# Download large model from direct URL
AI_LARGE_MODEL=1 AI_ONNX_URL="https://example.com/model.onnx" ./scripts/setup-models.sh
```

## Model Registry

Located at `models/registry.json`. Tracks model inventory per ISO 27001:2022 A.14.2 requirements.

```json
{
  "version": "1.0.0",
  "lastUpdated": "2026-04-23T00:00:00.000Z",
  "models": [
    {
      "id": "model-001",
      "name": "Plant Disease Detector",
      "type": "tflite",
      "version": "1.0.0",
      "file": "plant_disease.tflite",
      "loaded": true,
      "loadedAt": "2026-04-23T12:00:00.000Z",
      "healthStatus": "healthy"
    },
    {
      "id": "model-002",
      "name": "Irrigation LSTM Predictor",
      "type": "onnx",
      "version": "1.0.0",
      "file": "irrigation_lstm.onnx",
      "loaded": false,
      "loadedAt": null,
      "healthStatus": "not_enabled"
    }
  ]
}
```

## Troubleshooting

### Model fails to load

1. Check file exists: `ls -la models/plant_disease.tflite`
2. Check file size: `du -h models/*.tflite models/*.onnx`
3. Check logs: `grep -i "bootstrap\|model" logs/*.log`
4. Run health check: `node bin/bootstrap-ai.js health`
5. Reload models: `node bin/bootstrap-ai.js reload`

### Large model download fails

1. Verify URL is accessible from server
2. For Google Drive: confirm file is publicly accessible
3. Check disk space: `df -h`
4. Try direct download: `curl -L -o test.onnx "<URL>"`
5. Retry with longer timeout

### API returns 401 Unauthorized

1. Verify JWT_SECRET is set correctly
2. Check Authorization header format: `Bearer <token>`
3. Verify token has not expired
4. Confirm user has admin role

### Bootstrap UI shows stale data

1. Click Reload button to force refresh
2. Check /api/bootstrap/history for recent operations
3. Verify model files are not locked by another process

### Memory usage is high

1. Check health endpoint for memoryUsageMB
2. Reload models: `POST /api/bootstrap/reload` (clears and reinitializes)
3. Verify only intended models are enabled
4. Restart service if memory leak suspected

## Incident Response (ISO 27001:2022 A.14.2.7)

Per SOP_AI_GOVERNANCE.md section 6.0:

1. **Detect**: Health check fails or alert triggered
2. **Contain**: Disable model via `POST /api/bootstrap/configure` with `{"large":false}` (or `{"small":false}`)
3. **Investigate**: Review `/api/bootstrap/history` for root cause
4. **Report**: Document incident in AI_EVIDENCE_PACK.md artifact E-06
5. **Remediate**: Fix issue, re-enable model
6. **Lessons Learned**: Update runbook if procedures change

## Performance Targets

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Small model load time | < 500ms | > 2000ms |
| Large model load time | < 30s | > 120s |
| Health check latency | < 100ms | > 500ms |
| Memory per model instance | < 100MB | > 500MB |

## Audit Artifacts

Bootstrap system generates the following ISO 27001:2022 A.14 audit artifacts:

- E-03: Configuration change log (via /api/bootstrap/history)
- E-04: Model loading/unloading audit trail
- E-05: Health check reports
- E-06: Incident reports
- E-08: System configuration evidence

All history entries are timestamped and retained for minimum 90 days (ring buffer, max 100 entries).