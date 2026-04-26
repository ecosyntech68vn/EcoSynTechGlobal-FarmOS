# 🌱 ECOSYNTECH LOCAL CORE - TECHNICAL REPORT

**Ngày tạo:** April 2026  
**Phiên bản:** 2.0 (Domain-based Restructuring)  
**Repo:** https://github.com/ecosyntech68vn/EcoSynTech-Local-Core

---

## 📊 PROJECT METRICS

| Metric | Value |
|--------|-------|
| **Tổng số files** | 647 |
| **Source files** | 369 |
| **Skills** | 138 |
| **AI Models** | 9+ |
| **API Endpoints** | 66+ |
| **Routes** | 41 |
| **Services** | 49 |
| **ISO 27001** | ✅ Compliant |

---

## 🏗️ DOMAIN STRUCTURE (5S/PDCA)

```
src/
├── core/           # Business domains (25 files)
│   ├── farm/      # Farm management
│   ├── iot/      # IoT devices & sensors
│   ├── supply-chain/  # Supply chain tracking
│   ├── inventory/ # Inventory management
│   ├── finance/  # Finance & ROI
│   ├── worker/   # Worker management
│   ├── traceability/ # QR & blockchain
│   ├── admin/    # Admin functions
│   ├── batch/    # Batch processing
│   └── roi/      # ROI calculation
│
├── intelligence/  # AI & ML (32 files)
│   ├── ai-skills/ # 12 AI autonomous agents
│   ├── analytics/# Analytics engine
│   ├── analysis/ # Data analysis
│   ├── diagnosis/# 8 diagnostic skills
│   ├── dashboard/# Dashboard
│   ├── drift/    # 2 drift monitors
│   ├── ml/       # Machine learning
│   └── decision/ # Decision support
│
├── ops/           # Operations (40 files)
│   ├── automation/ # 6 automation skills
│   ├── scheduler/  # Scheduling
│   ├── alerts/     # Alert management
│   ├── notifications/ # Notifications
│   ├── communication/ # 5 communication skills
│   ├── maintenance/  # 6 maintenance skills
│   ├── recovery/     # Auto recovery
│   ├── deployment/   # Deployment
│   └── selfheal/     # 6 self-heal skills
│
├── security/      # Security ISO 27001 (16 files)
│   ├── auth/      # Authentication
│   ├── compliance/ # Compliance monitoring
│   ├── defense/   # Intrusion detection
│   └── rbac/     # Role-based access
│
└── external/     # Integrations (14 files)
    ├── telegram/  # Telegram bot
    ├── zalo/     # Zalo integration
    ├── messenger/ # Facebook messenger
    ├── blockchain/ # Aptos blockchain
    ├── weather/  # Open-Meteo
    ├── weblocal/ # Health report
    ├── sales/    # Sales CRM
    └── payment/  # Payment processing
```

---

## 🤖 138 AI SKILLS TABLE

### By Category

| Category | Count | Key Capabilities |
|----------|-------|----------------|
| **diagnosis** | 16 | anomaly-detection, alert-aggregation, root-cause-analysis, kpi-drift |
| **selfheal** | 12 | auto-acknowledge, reconnect-bridge, reset-device, retry-job, rollback-ota |
| **maintenance** | 12 | predictive-maintenance, energy-optimization, db-optimizer, cleanup-agent |
| **automation** | 12 | rules-engine, schedules-engine, command-router, ota-orchestrator, webhook-dispatch |
| **ai-skills** | 12 | ai-conversation, ai-inference, ai-rag, ai-predict-weather, cost-calculator |
| **communication** | 10 | telegram-notifier, voice-assistant, report-generator, language-switcher |
| **iot** | 8 | device-provisioning, multi-farm-manager, energy-saver |
| **analysis** | 8 | anomaly-predictor, system-health-scorer, auto-backup, root-cause-analyzer |
| **governance** | 7 | compliance-monitor, audit-trail, rbac-guard, rate-limit-guard |
| **compliance** | 7 | iso-27001-compliance, tenant-isolation, secrets-check |
| **traceability** | 6 | aptos-blockchain, qr-traceability, certificate-management |
| **ai** | 6 | inference, rag, conversation, roi-calculator |
| **security** | 4 | security-audit, vuln-scanner |
| **drift** | 4 | config-drift, version-drift |
| **deployment** | 4 | ota-orchestrator, release-management |
| **defense** | 2 | intrusion-detector |
| **dashboard** | 2 | mobile-dashboard |
| **network** | 2 | mqtt-watch, ws-heartbeat |
| **recovery** | 2 | auto-restore |
| **sync** | 1 | hybrid-sync |
| **supply-chain** | 1 | supply-chain-sync |

---

## ⚙️ AUTO SYSTEMS

### 🛠️ Self-Heal (6 skills)
- `auto-acknowledge` - Tự acknowledge alerts
- `clear-cache` - Xóa cache khi cần
- `reconnect-bridge` - Tự kết nối lại
- `reset-device` - Reset thiết bị từ xa
- `retry-job` - Retry job khi fail
- `rollback-ota` - Rollback khi update lỗi

### ⚡ Automation (6 skills)
- `command-router` - Định tuyến lệnh
- `ota-orchestrator` - Orchestrate OTA updates
- `report-export` - Export báo cáo tự động
- `rules-engine` - Quản lý rules
- `schedules-engine` - Quản lý schedules
- `webhook-dispatch` - Gửi webhooks

### 🔬 Diagnosis (8 skills)
- `anomaly-detection` - Phát hiện bất thường
- `anomaly-classifier` - Phân loại anomaly
- `alert-aggregation` - Gom alerts
- `device-state-diff` - So sánh trạng thái
- `kpi-drift` - Theo dõi KPI drift
- `root-cause-hint` - Gợi ý nguyên nhân
- `route-mapper` - Mapping routes
- `webhook-correlator` - Correlate webhooks

### 🔧 Auto-Tuning
- `AutoTuningService` - Tự động tối ưu parameters
- `AdaptiveThresholds` - Ngưỡng thích ứng
- `GeneticOptimizer` - Thuật toán di truyền tự tối ưu
- `IrrigationFuzzyController` - Fuzzy logic Mamdani

### 💾 Auto-Backup
- `autoBackupScheduler` - Schedule backup tự động
- `backupRestoreService` - Restore khi có sự cố

### 🔒 Security & ISO 27001
- `security-audit` - Audit bảo mật liên tục
- `vuln-scanner` - Quét lỗ hổng
- `intrusion-detector` - Phát hiện xâm nhập
- `compliance-monitor` - Monitor ISO 27001
- `audit-trail` - Audit trail đầy đủ
- `rbac-guard` - Role-based access control

---

## 🤖 AI/ML MODELS

### Local Models
```
models/
├── plant_disease.tflite      # 4MB - Plant disease detection (91% accuracy)
├── registry.json           # Model registry
└── create_lstm_model.py  # LSTM creator

ml/
├── train_lightgbm.py      # LightGBM training
├── train_sklearn.py      # sklearn training
├── train_irrigation.py    # Irrigation prediction
├── federated_server.py    # Federated learning
└── aurora_service.py     # Aurora multi-party
```

### AI Skills
- `ai-conversation` - AI conversation
- `ai-inference` - AI inference
- `ai-rag` - RAG (Retrieval Augmented Generation)
- `ai-predict-weather` - Weather prediction
- `cost-calculator` - Cost calculation
- `roi-calculator` - ROI calculation

---

## 📡 API ENDPOINTS

### Core APIs
- `/api/farms` - Farm management
- `/api/devices` - IoT devices
- `/api/sensors` - Sensors
- `/api/workers` - Worker management
- `/api/supply-chain` - Supply chain
- `/api/inventory` - Inventory
- `/api/finance` - Finance
- `/api/traceability` - Traceability

### AI APIs
- `/api/ai/disease/predict` - Plant disease prediction
- `/api/ai/irrigation/predict` - Irrigation prediction
- `/api/ai/conversation` - AI conversation
- `/api/ai/inference` - AI inference

### System APIs
- `/api/health` - Health check
- `/api/stats` - Statistics
- `/api/alerts` - Alerts
- `/api/docs` - Swagger docs

---

## 🐳 DOCKER SUPPORT

```bash
# Build
docker build -t ecosyntech .

# Run
docker run -p 3000:3000 -v ./data:/app/data ecosyntech
```

---

## 📈 FEATURES HIGHLIGHTS

### For Marketing

1. **138 Autonomous AI Skills** - Self-healing, self-optimizing, self-configuring
2. **ISO 27001 Compliant** - Enterprise security
3. **Domain-based Architecture** - 5S, PDCA methodology
4. **Multi-model AI** - TFLite, LightGBM, sklearn, LSTM
5. **Blockchain Ready** - Aptos integration
6. **Edge Computing** - Runs on 512MB RAM
7. **Self-Healing** - Auto recovery, device reset
8. **Auto-Tuning** - Genetic algorithm optimization
9. **Fuzzy Logic** - Mamdani controller with 25 rules

---

## 📱 DEPLOYMENT

```bash
# Install
npm install

# Configure
cp .env.example .env

# Run
npm start

# Server at: http://localhost:3000
```

---

## 📞 SUPPORT

| | |
|---|---|
| **Company** | CÔNG TY TNHH CÔNG NGHỆ ECOSYNTECH GLOBAL |
| **Founder** | Tạ Quang Thuận |
| **Phone** | 0989516698 |
| **Email** | kd.ecosyntech@gmail.com |
| **GitHub** | https://github.com/ecosyntech68vn/EcoSynTech-Local-Core |

---

*Document generated: April 2026*
*Version: 2.0*