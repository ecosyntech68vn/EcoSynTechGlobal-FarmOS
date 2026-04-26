# IoT Data Taxonomy – EcoSynTech FarmOS
# Version: 6.0.0 | Date: 2026-04-23 | Owner: Data Lead + AI Ops

---

## Purpose
This document defines the taxonomy, classification, and governance rules for all IoT data in EcoSynTech FarmOS. Aligned with ISO 27001:2022 A.8.2 (Information classification), A.12.4 (Event logging), and A.14.3 (Data governance for AI).

---

## Data Categories

### 1. Telemetry Data (Sensor Readings)

| Data Type | Source | Format | Retention | Classification | PII |
|-----------|--------|--------|-----------|----------------|-----|
| Temperature | ESP32 sensors | float (°C) | 30 days | Internal | No |
| Humidity | ESP32 sensors | float (%) | 30 days | Internal | No |
| Soil Moisture | ESP32 sensors | float (%) | 30 days | Internal | No |
| Soil pH | ESP32 sensors | float | 30 days | Internal | No |
| Soil EC | ESP32 sensors | float (dS/m) | 30 days | Internal | No |
| Light Intensity | ESP32 sensors | float (lux) | 30 days | Internal | No |
| CO2 | ESP32 sensors | float (ppm) | 30 days | Internal | No |
| Water Flow | Flow meter | float (L/min) | 90 days | Internal | No |
| Power Consumption | Energy monitor | float (W) | 90 days | Internal | No |
| Device Status | ESP32 heartbeat | enum | 90 days | Internal | No |
| GPS/Location | GPS module | lat/lon | 30 days | Confidential | Yes |

### 2. AI Prediction Data

| Data Type | Source | Format | Retention | Classification | PII |
|-----------|--------|--------|-----------|----------------|-----|
| Disease Detection Input | Image upload | base64/image | 7 days | Internal | No |
| Disease Detection Output | TFLite model | disease class + confidence | 6 months | Internal | No |
| Irrigation Prediction Input | Historical sensor data | JSON | 30 days | Internal | No |
| Irrigation Prediction Output | ONNX/LSTM model | water_mm + confidence | 6 months | Internal | No |
| AI Agent Decision | SmartAutomationEngine | JSON | 6 months | Internal | No |
| AI Fallback Activation | modelLoader.js | JSON | 12 months | Internal | No |

### 3. Device Management Data

| Data Type | Source | Format | Retention | Classification | PII |
|-----------|--------|--------|-----------|----------------|-----|
| Device Config | /api/devices | JSON | Until deleted | Confidential | Yes |
| Device Firmware Version | ESP32 | string | Until deleted | Internal | No |
| Device Command History | /api/devices/:id/cmd | JSON | 90 days | Internal | No |
| MQTT Credentials | Device auth | hashed | Until revoked | Confidential | Yes |

### 4. Audit & Security Data

| Data Type | Source | Format | Retention | Classification | PII |
|-----------|--------|--------|-----------|----------------|-----|
| Auth Events (login/logout) | auth.js | JSON | 12 months | Internal | Yes (email) |
| API Access Logs | requestDeduplication.js | JSON | 12 months | Internal | Partial |
| RBAC Access Denials | auth middleware | JSON | 12 months | Internal | Yes |
| Bootstrap Action Logs | modelLoader.js | JSON | 12 months | Internal | No |
| Security Incidents | telegramAlertService.js | JSON | 24 months | Internal | Yes |

---

## Data Flow & Processing

### Telemetry Flow
```
ESP32 Device → MQTT Broker → Telemetry Handler → SQLite DB → AI Engine → Dashboard
     ↓               ↓              ↓               ↓           ↓
[Encryption]    [Auth]       [Validation]   [Retention]   [Audit Log]
```

### AI Prediction Flow
```
Sensor Data / Image → Preprocessing → Model Inference → Postprocessing → Decision Log → Action
     ↓                    ↓                ↓               ↓              ↓            ↓
[Minimize]         [Sanitize]       [Model Load]     [Confidence]   [JSON Log]  [Execute/Ignore]
```

---

## Retention Rules

| Data Category | Retention Period | Archive? | Deletion Method |
|---------------|------------------|----------|----------------|
| Sensor readings (raw) | 30 days rolling | No | Auto-delete on schedule |
| Sensor readings (aggregated) | 1 year | Yes | Monthly aggregation |
| AI predictions | 6 months | Yes | Scheduled purge |
| Bootstrap logs | 12 months | No | Log rotation (52 weeks) |
| Auth logs | 12 months | No | Log rotation |
| Security incidents | 24 months | Yes | Manual review before deletion |
| Device config | Until device deleted | Yes | On device deregistration |
| AI model files | Indefinite (as long as active) | N/A | Version replacement |

---

## Data Minimization & Privacy

### Principles
1. **Collection Minimization**: Only collect data required for system function
2. **Storage Minimization**: Delete data when no longer needed
3. **Access Minimization**: RBAC enforces minimum necessary access
4. **PII Protection**: Location/GPS data encrypted; email hashed in logs

### PII Handling Rules
- Location data: encrypted at rest; only hashed in logs
- Email addresses: never stored in plain text in logs; hashed
- Device IDs: pseudonymous; not linkable to user identity without lookup
- Image uploads (disease detection): not stored permanently; processed and discarded

---

## IoT Device Inventory (Related to Data)

| Device Type | Count | Data Generated | Storage |
|-----------|-------|---------------|---------|
| ESP32 (climate sensor) | 50 | temperature, humidity | 30 days |
| ESP32 (soil sensor) | 30 | soil moisture, pH, EC | 30 days |
| ESP32 (energy monitor) | 20 | power consumption | 90 days |
| Flow meter (water) | 10 | water flow rate | 90 days |
| GPS module | 5 | location | 30 days |
| **Total** | **115** | **~2GB/month** | - |

---

## Data Governance Roles

| Role | Responsibilities |
|------|-----------------|
| Data Owner | Approve data classification changes, retention policy exceptions |
| Data Lead | Manage taxonomy, oversee compliance |
| AI Ops Lead | AI data governance (A.14.3) |
| Security Lead | PII handling, access control review |

---

## References
- DATA_RETENTION_POLICY.md
- ISO_27001_2022_GAP_ANALYSIS.md (A.8.2, A.12.4)
- SOP_AI_GOVERNANCE.md (SOP-E-05: AI Decision Logging)
- ISMS_POLICY.md (A.8.2 Information classification)

---

*Document Classification: Internal – Controlled*
*Owner: Data Lead | Review Cycle: 6 months*
*Next Review: 2026-10-23*