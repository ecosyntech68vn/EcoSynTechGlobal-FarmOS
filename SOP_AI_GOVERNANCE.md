# SOP_AI_GOVERNANCE.md
# SOP-E Series: AI Governance & Operations for EcoSynTech FarmOS
# Version: 6.0.0 | Date: 2026-04-23 | Owner: AI Ops Lead

---

## Version Notes
- v6.0: Added AI Bootstrap (SOP-E-04), AI Decision Logging (SOP-E-05), AI Incident Response (SOP-E-06)
- Aligned with ISO 27001:2022 A.14 AI/ML Operations controls

---

# SOP-E-01: Quản lý SmartAutomationEngine

## 1. Purpose
Define the process for managing, deploying, and monitoring the SmartAutomationEngine that orchestrates AI agents.

## 2. Scope
- SmartAutomationEngine lifecycle (init, process, stats)
- AI agent registry and skill orchestration
- Contextual learning and predictive alerting

## 3. Roles
- **AI Ops Lead**: Overall ownership, deployment approval
- **Developers**: Implement agents, skills, orchestration logic
- **QA**: Validate agent outputs and fallbacks

## 4. Process

### 4.1 Engine Initialization
1. Load default skill mappings (irrigation, soil, climate, pest, energy, system health)
2. Initialize ContextualLearning with threshold history
3. Set optimization mode (balanced/performance/heuristic_only) based on RAM
4. Log engine start event to audit trail

### 4.2 Agent Orchestration
1. Collect sensor telemetry (temperature, humidity, soil moisture, rainfall, etc.)
2. Run all agents in parallel via SkillOrchestrator
3. Aggregate insights with thinkForAll()
4. Apply auto-execution for critical alerts (confidence > 0.8)
5. Log all decisions with timestamp, agent, input, output, confidence

### 4.3 Monitoring
- Health check interval: adaptive (10/30/60 min based on RAM)
- Performance metrics tracked: agent execution time, decision confidence
- Alerts triggered: Telegram + dashboard

## 5. References
- src/services/smartAutomationEngine.js
- src/services/skillOrchestrator.js
- src/services/contextualLearning.js

---

# SOP-E-02: Giám sát AI Agents

## 1. Purpose
Define monitoring requirements for all AI agents to ensure reliability, performance, and compliance.

## 2. Agent Inventory

| Agent | Purpose | Input | Output | Fallback |
|-------|---------|-------|--------|----------|
| IrrigationAgent | Predict water needs | sensors + weather | water_mm | 5mm heuristic |
| SoilHealthAgent | Soil quality assessment | soil moisture, pH, EC | health score | threshold-based |
| ClimateAgent | Climate adaptation | temperature, humidity forecast | recommendations | static rules |
| PestControlAgent | Pest risk assessment | temp/humidity patterns | risk level | seasonal baseline |
| EnergyAgent | Energy optimization | device power usage | saving tips | load average |
| SystemHealthAgent | System monitoring | CPU, RAM, memory | status | OK always |

## 3. Monitoring Intervals

| Mode | RAM | Interval |
|------|-----|---------|
| Performance | >=2GB | 10 min |
| Balanced | 1-2GB | 30 min |
| Heuristic Only | <1GB | 60 min |

## 4. Alert Thresholds
- Confidence < 0.5 → Warning log
- Agent execution time > 5000ms → Performance warning
- All agents returning fallback → System health check

## 5. Logging
- Every agent execution logged: agent name, inputs, outputs, confidence, mode
- Format: JSON with timestamp, agent_id, telemetry_snapshot, decision, confidence

---

# SOP-E-03: Xử lý Predictive Alerts

## 1. Purpose
Define process for handling AI-generated predictive alerts before they become incidents.

## 2. Alert Lifecycle

```
Sensor Anomaly Detected
       ↓
PredictiveAlerting.zScoreCheck()
       ↓
Alert Created (warning/critical)
       ↓
Auto-Execute if confidence > 0.8
       ↓
Escalate if not resolved in 15 min
       ↓
Incident Service (INCIDENT_RESPONSE_SOP.md)
```

## 3. Z-Score Thresholds
- |z| > 2 → Warning alert
- |z| > 3 → Critical alert, auto-execute if available
- Insufficient data (<10 readings) → Skip, log insufficient_data

## 4. Response Actions
| Alert Level | Action | SLA |
|------------|--------|-----|
| Warning | Log + notify (Telegram) | 15 min |
| Critical | Log + auto-execute + notify | 5 min |
| Insufficient data | Skip + log | N/A |

## 5. Feedback Loop
- Positive/negative feedback recorded by ContextualLearning
- Threshold adjustments applied after 100+ readings
- Threshold changes logged for audit

---

# SOP-E-04: AI Bootstrap & Model Management

## 1. Purpose
Define the process for bootstrapping, loading, configuring, and reloading AI models. Aligned with ISO 27001:2022 A.14.2 (AI lifecycle), A.14.4 (security of AI assets), and A.14.6 (drive-hosted model bootstrap).

## 2. Scope
- Lightweight model: TFLite plant disease detector (~4MB, always available)
- Large model: ONNX irrigation predictor (~2GB, optional, on-demand)
- Bootstrap manager: src/bootstrap/modelLoader.js
- Bootstrap API: /api/bootstrap/status, /configure, /reload

## 3. Bootstrap State

| Parameter | Env Var | Default | Description |
|-----------|---------|---------|-------------|
| AI_SMALL_MODEL | AI_SMALL_MODEL | 1 | Enable lightweight model |
| AI_LARGE_MODEL | AI_LARGE_MODEL | 0 | Enable large ONNX model |
| AI_ONNX_URL | AI_ONNX_URL | - | URL to ONNX model (HTTP or Drive) |

## 4. Process

### 4.1 Initial Bootstrap (npm run setup-models)
1. Check AI_SMALL_MODEL flag
2. If 1: copy/verify plant_disease.tflite from models/ to target
3. Check AI_LARGE_MODEL flag
4. If 1: download from AI_ONNX_URL (Drive or direct HTTP) to models/irrigation_lstm.onnx
5. Verify file exists; log result

### 4.2 Runtime Bootstrap (server startup)
1. modelLoader.initialize() called at startup
2. If AI_SMALL_MODEL=1: load TFLite model via tfliteDiseasePredictor
3. If AI_LARGE_MODEL=1: load ONNX via lstmIrrigationPredictor (if available)
4. Fallback heuristics activated if model load fails
5. Bootstrap status logged for audit

### 4.3 On-Demand Reconfiguration (UI or API)
1. POST /api/bootstrap/configure → applyConfig({small, large, largeUrl})
2. POST /api/bootstrap/reload → reloadBootstrap() → reinitialize loaders
3. GET /api/bootstrap/status → current state

### 4.4 Drive URL Download (special case)
1. Extract file ID from Drive URL (/d/... or id=...)
2. Two-step: GET with cookie → confirm token → download
3. Fallback: direct GET if Drive confirmation not required
4. Log download success/failure for audit

## 5. Security Controls (A.14.4)
- RBAC: /api/bootstrap/* requires auth (JWT)
- Only admin role can configure/reload bootstrap
- No model content downloaded to public-accessible paths
- Model files excluded from git (large ONNX, via .gitignore)
- Integrity check: verify model file size > threshold before loading

## 6. Roles
- **AI Ops**: Approve model version changes, approve Drive URL additions
- **DevOps**: Execute bootstrap, monitor logs
- **Security**: Review Drive URLs, ensure no tampering

## 7. Logging
- Every bootstrap action logged: action type, model path, status (success/fallback/error), timestamp
- Log path: logs/ai_bootstrap.log (rotated weekly, 52-week retention)

## 8. Rollback
- If bootstrap fails: system continues with fallback heuristics
- Reload previous config via /api/bootstrap/reload with previous state
- No automatic rollback to old models without explicit operator action

## 9. References
- scripts/setup-models.sh
- src/bootstrap/modelLoader.js
- src/bootstrap/bootstrap_api.js
- public/bootstrap.html
- models/registry.json

---

# SOP-E-05: AI Decision Logging & Audit Trail

## 1. Purpose
Define requirements for logging AI decisions and maintaining audit trail for ISO 27001:2022 A.14.1 (AI decision logging) and A.12.4 (event logging).

## 2. What to Log

| Event | Fields | Retention |
|-------|--------|----------|
| Model load | model_name, model_version, source_url, timestamp, status | 12 months |
| Model unload | model_name, timestamp, reason | 12 months |
| AI prediction | model, input_features, output, confidence, method, timestamp | 6 months |
| AI decision | agent, input, output, confidence, mode, timestamp | 6 months |
| Bootstrap action | action, model, url, status, timestamp | 12 months |
| Config change | user, param, old_value, new_value, timestamp | 12 months |
| Fallback activation | model, reason, fallback_method, timestamp | 6 months |

## 3. Log Format (JSON)
```json
{
  "timestamp": "2026-04-23T10:00:00.000Z",
  "event": "ai_prediction",
  "model": "plant_disease.tflite",
  "version": "1.0",
  "method": "tflite",
  "input": { "image_hash": "sha256:..." },
  "output": { "disease": "Tomato___Late_blight", "confidence": "98.23%" },
  "user": "admin@example.com",
  "request_id": "req-uuid"
}
```

## 4. Access Control
- Logs readable by: Security, ISMS Manager, AI Ops
- Logs writable by: system only (append-only)
- Logs exportable via: /api/export (admin only)

## 5. Retention
- AI decision logs: 6 months (sensors are transient data)
- Bootstrap logs: 12 months (security-relevant)
- Incident logs: 24 months (regulatory)

## 6. Tools
- Log aggregation: winston (file + console)
- Format: JSON structured logs
- Rotation: daily, 52-week retention, compressed

---

# SOP-E-06: AI Incident Response

## 1. Purpose
Define process for responding to AI-specific incidents: misclassification, model drift, data leakage, or bootstrap failure. Extends INCIDENT_RESPONSE_SOP.md with AI-specific procedures.

## 2. AI Incident Types

| Type | Description | Severity | SLA |
|------|-------------|----------|-----|
| AI_MISCAL | AI decision causes crop/financial harm | Critical | 15 min |
| AI_DRIFT | Model accuracy degrades >10% | High | 1 hour |
| AI_LEAK | Training/prediction data exposed | Critical | 5 min |
| AI_BOOT_FAIL | Bootstrap fails repeatedly | High | 1 hour |
| AI_FALLBACK | System running on fallback >24h | Medium | 4 hours |

## 3. Response Process

### Step 1: Detection
- Automated: monitoring dashboards, alerting (Telegram)
- Manual: operator report, user complaint

### Step 2: Triage (0-5 min)
- Identify incident type (AI_MISCAL, AI_DRIFT, AI_LEAK, AI_BOOT_FAIL, AI_FALLBACK)
- Assess severity and impact scope
- Notify AI Ops Lead + ISMS Manager

### Step 3: Containment (5-15 min)
- For AI_BOOT_FAIL: disable large model, revert to fallback; check Drive URL
- For AI_MISCAL: disable auto-execute, set confidence threshold to 1.0
- For AI_LEAK: isolate data, stop prediction, notify affected users
- For AI_DRIFT: switch to fallback heuristics

### Step 4: Resolution (15 min - 24h)
- Analyze root cause (model version, data drift, config error)
- Apply fix (retrain, reload, reconfigure)
- Test in staging before production deployment
- Document in incident register

### Step 5: Post-Incident (24h - 1 week)
- Review lessons learned
- Update risk register (RISK_REGISTER.md)
- Update SOP if process gap found
- Notify management of resolution

## 4. Escalation Matrix

| Severity | First Response | Escalation | Management |
|----------|--------------|------------|----------|
| Critical | AI Ops (5 min) | ISMS Manager (15 min) | CEO (1 hour) |
| High | AI Ops (15 min) | ISMS Manager (1 hour) | CEO (4 hours) |
| Medium | AI Ops (1 hour) | ISMS Manager (4 hours) | N/A |
| Low | AI Ops (4 hours) | N/A | N/A |

## 5. AI-Specific Contact List

| Role | Name | Contact |
|------|------|---------|
| AI Ops Lead | Dev Lead | kd.ecosyntech@gmail.com |
| Security Lead | Security | (internal) |
| ISMS Manager | Security Lead | (internal) |

## 6. References
- INCIDENT_RESPONSE_SOP.md
- RISK_REGISTER.md (R-AI-01 through R-AI-07)
- src/services/smartAutomationEngine.js (audit logging)

---

# APPENDIX A: ISO 27001:2022 A.14 Mapping

| Control | Implementation | Evidence |
|---------|---------------|----------|
| A.14.1 AI decision logging | SmartAutomationEngine + audit logs | logs/ai_bootstrap.log + decision logs |
| A.14.2 AI lifecycle management | modelLoader.js + models/registry.json | Version history, model registry |
| A.14.3 Data governance for AI | Sensor data retention, minimization | DATA_RETENTION_POLICY.md |
| A.14.4 Security of AI assets | RBAC + model path protection | Auth middleware + audit trail |
| A.14.5 AI incident response | SOP-E-06 + INCIDENT_RESPONSE_SOP.md | Incident register |
| A.14.6 Drive-hosted model bootstrap | setup-models.sh + Drive download | Bootstrap logs + script |

---

*Document Classification: Internal – Controlled*
*Owner: AI Ops Lead | ISMS Manager Review: 6 months*
*Next Review: 2026-10-23*
*Version: 6.0.0 | 2026-04-23*