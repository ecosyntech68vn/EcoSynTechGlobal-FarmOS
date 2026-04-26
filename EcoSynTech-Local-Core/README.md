**EcoSynTech Local Core V3.0** - Smart Agriculture Platform

---

## 🚀 QUICK START (5 phút)

```bash
# 1. Clone
git clone https://github.com/ecosyntech68vn/EcoSynTech-Local-Core.git

# 2. Run
cd EcoSynTech-Local-Core
./install.sh

# 3. Truy cập
# http://localhost:3000
# Login: admin / admin123
```

Xem `QUICKSTART.md` để biết thêm chi tiết.

---

## 📋 OVERVIEW

### System Stats
- **Total AI Skills:** 228
- **AI for Managers:** 115
- **TinyML Models:** 4 (Plant Disease, Weed, Pest, Quality)
- **AI Providers:** 4 (DeepSeek, Ollama, OpenAI, Gemini)

### Quick Commands

| Command | Description |
|---------|-------------|
| `./install.sh` | 1-click install |
| `npm start` | Run production |
| `npm run dev` | Development mode |
| `npm run audit` | System audit |
| `npm run backup` | Backup data |
| `docker-compose up -d` | Run with Docker |

### Quick Setup

```bash
# Docker (recommended)
docker-compose up -d

# Lite version (Raspberry Pi)
docker-compose -f docker-compose.lite.yml up -d

# Native
npm install
npm start
```

### System Requirements

| Component | Lite | Pro |
|-----------|------|-----|
| **RAM** | 512MB | 2GB |
| **Disk** | 500MB | 1GB |
| **Node.js** | 18.x | 18.x |
| **Devices** | 100 | 500+ |

### Architecture

```
src/
├── core/           # Business domains (farm, iot, supply-chain, inventory, finance)
├── intelligence/   # AI & ML (228 skills)
├── ops/           # Operations (automation, scheduler, alerts, maintenance)
├── security/      # Security ISO 27001 (auth, compliance, defense)
├── external/      # External integrations (telegram, zalo, messenger)
├── routes/        # API endpoints
└── services/     # Business logic
```

### 5S Implementation
- **Sort**: Loại bỏ files không cần thiết
- **Set in Order**: Sắp xếp theo domain
- **Shine**: Làm sạch code, giảm complexity
- **Standardize**: Chuẩn hóa naming conventions
- **Sustain**: Duy trì qua PDCA cycle

---

## 💰 Pricing / Bảng giá

| Gói | Giá | Thiết bị | Users |
|-----|------|----------|-------|
| **BASE** | Miễn phí ⚡ | 50 | 10 |
| **PRO** | 500K/năm | 200 | 50 |
| **PREMIUM** | 2M/năm | Unlimited | Unlimited |

Xem `PRICING.md` để biết chi tiết.

---

## 🏢 COMPANY / CÔNG TY

| Info | Details |
|------|----------|
| **Company Name** | CÔNG TY TNHH CÔNG NGHỆ ECOSYNTECH GLOBAL |
| **Founder** | Tạ Quang Thuận - CEO and FOUNDER |
| **Phone** | 0989516698 |
| **Email** | kd.ecosyntech@gmail.com |
| **Website** | https://ecosyntechglobal.com |
| **Founded** | 2026 |
| **Certification** | ISO 27001:2022 (9.5/10) |

---

## 🏗️ NEW DOMAIN STRUCTURE

| Domain | Modules | Description |
|--------|---------|-------------|
| **core/** | 25 files | farm, iot, supply-chain, inventory, finance, worker, traceability, admin, batch, roi |
| **intelligence/** | 32 files | ai-skills, analytics, analysis, diagnosis, dashboard, drift, ml, decision |
| **ops/** | 40 files | automation, scheduler, alerts, notifications, communication, maintenance, recovery, deployment, selfheal |
| **security/** | 16 files | auth, compliance, defense, rbac |
| **external/** | 14 files | telegram, zalo, messenger, blockchain, weather, weblocal, sales, payment |
| **skills/** | 138 files | Autonomous agents |
| **routes/** | 66 files | API endpoints |
| **services/** | 49 files | Business logic |

---

## 📋 OVERVIEW / TỔNG QUAN HỆ THỐNG

### Tính năng cốt lõi

| Module | Mô tả | API Endpoints |
|--------|-------|-------------|
| **Quản lý Farm** | Đa nông trại, theo dõi thiết bị theo vùng | `/api/farms` |
| **Thiết bị IoT** | Cảm biến, actuator, MQTT | `/api/devices`, `/api/sensors` |
| **Tự động hóa** | Rules, Schedules | `/api/rules`, `/api/schedules` |
| **Nhân sự** | Quản lý công nhân, chấm công | `/api/workers` |
| **Chuỗi cung ứng** | Thu hoạch → Vận chuyển → Giao hàng | `/api/supply-chain` |
| **Kho/Vật tư** | Quản lý tồn kho, cảnh báo | `/api/inventory` |
| **Tài chính** | Thu/Chi, Báo cáo ROI | `/api/finance` |
| **Thời tiết** | Dự báo 5 ngày (Open-Meteo) | `/api/dashboard/weather` |
| **Tưới tiêu thông minh** | ET0, tự động tưới | Water Optimization Service |
| **Giám sát sức khỏe** | Health report WebLocal | `/api/health-report` |
| **Truy xuất nguồn gốc** | QR Code, Blockchain (Aptos) | `/api/traceability` |
| **AI Agents** | Phát hiện bệnh cây (TFLite, 91%), Dự báo tưới (ONNX) | `/api/ai/disease/predict`, `/api/ai/irrigation/predict` |
| **AI Skills** | 9 intelligent autonomous agents | See Skills section below |
| **Fuzzy Logic** | Mamdani controller + Genetic Algorithm auto-tuning | Water Optimization with self-learning |
| **Bảo mật** | RBAC, Audit Trail, Rate Limit | `/api/security` |
| **Alerts** | Cảnh báo Telegram | `/api/alerts` |
| **Dashboard** | Tổng quan nông nghiệp | `/api/dashboard/overview` |

---

## 🚀 SETUP / CÀI ĐẶT

### Requirements / Yêu cầu hệ thống

- Node.js 18+ (recommended) or >=12.0.0 (minimum)
- 512MB RAM minimum (recommended 1GB)
- Windows 7+ or Linux

### Installation / Các bước cài đặt

```bash
# 1. Clone the project
git clone https://github.com/ecosyntech68vn/EcoSynTech-Local-Core

# 2. Navigate to directory
cd EcoSynTech-Local-Core

# 3. Install dependencies
npm install

# 4. Configure environment
cp .env.example .env
# ⚠️ IMPORTANT: Change JWT_SECRET in .env before production!

# 5. Bootstrap AI models (optional)
- Script bootstrap for AI models is available to download lightweight and optional large models on demand.
- By default, the bootstrap loads the lightweight plant disease model (4MB). You can enable loading the heavy ONNX model via environment variables.
- To bootstrap:
- export AI_SMALL_MODEL=1
- export AI_LARGE_MODEL=0
- npm run setup-models
- If you want to load the large ONNX model, set:
- export AI_LARGE_MODEL=1
- export AI_ONNX_URL="https://path/to/irrigation_lstm.onnx" (or Drive URL supported)
- npm run setup-models

- After bootstrap, start server as usual:
-
```bash
- npm start
-```
npm start
```

Server runs at / Server chạy tại: `http://localhost:3000`

---

## ⚙️ ENVIRONMENT CONFIGURATION / CẤU HÌNH MÔI TRƯỜNG

```env
# ====================
# SERVER
# ====================
PORT=3000
NODE_ENV=development
JWT_SECRET=CHANGE_ME_IN_PRODUCTION
JWT_EXPIRES_IN=7d

# ====================
# DATABASE
# ====================
DB_PATH=./data/ecosyntech.db

# ====================
# TELEGRAM (Cảnh báo)
# ====================
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# ====================
# MQTT (IoT)
# ====================
MQTT_BROKER_URL=
MQTT_USERNAME=
MQTT_PASSWORD=

# ====================
# HEALTH REPORT (WebLocal)
# ====================
WEBLOCAL_WEBAPP_URL=
WEBLOCAL_API_KEY=
CUSTOMER_ID=
CLIENT_ID=default_client
HEALTH_REPORT_INTERVAL_MIN=30
WEBLOCAL_USE_HTTPS=false

# ====================
# WATER OPTIMIZATION
# ====================
WATER_OPTIMIZATION_ENABLED=false
WATER_MIN_MOISTURE=30
WATER_MAX_MOISTURE=70

# ====================
# WEATHER (Open-Meteo)
# ====================
FARM_LAT=10.7769
FARM_LON=106.7009

# ====================
# BLOCKCHAIN (Aptos)
# ====================
BLOCKCHAIN_ENABLED=false
APTOS_NETWORK=testnet

# ====================
# AI (Machine Learning / AI Agents)
# ====================
AI_SMALL_MODEL=1       # Enable TFLite disease detection (default: 1)
AI_LARGE_MODEL=0       # Enable ONNX irrigation prediction (default: 0, requires ~2GB RAM)
AI_ONNX_URL=           # URL to ONNX model (optional, supports Google Drive URLs)
DEEPSEEK_API_KEY=
```

---

## 📜 SCRIPTS

```bash
npm start          # Chạy server production
npm run dev       # Chạy development với hot reload
npm run test      # Chạy tests
npm run lint     # ESLint
```

---

## 🤖 AI SKILLS / KỸ NĂNG AI (138 Skills)

Hệ thống bao gồm **138 intelligent skills** tự động hóa vận hành nông nghiệp:

### 📊 Skills by Category
| Category | Count | Description |
|----------|-------|-------------|
| diagnosis | 16 | Anomaly detection, alert aggregation, root cause analysis |
| selfheal | 12 | Auto recovery, device reset, retry jobs |
| maintenance | 12 | Predictive maintenance, energy optimization, cleanup |
| automation | 12 | Rules engine, schedules, command routing |
| ai-skills | 12 | AI conversation, inference, RAG, weather prediction |
| communication | 10 | Telegram, voice assistant, report generation |
| iot | 8 | Device provisioning, multi-farm management |
| analysis | 8 | Health scoring, anomaly prediction, backup |
| governance | 7 | Compliance, audit trail, rate limiting |
| compliance | 7 | ISO 27001 compliance monitoring |
| traceability | 6 | Blockchain, QR codes, certificate management |
| ai | 6 | Conversation, inference, RAG, cost & ROI calculation |
| security | 4 | Security audit, vulnerability scanning |
| drift | 4 | Config drift, version drift monitoring |
| deployment | 4 | OTA orchestration, release management |
| defense | 2 | Intrusion detection |
| dashboard | 2 | Mobile dashboard |
| network | 2 | MQTT watch, WebSocket heartbeat |
| recovery | 2 | Auto restore |
| sync | 1 | Hybrid sync |
| supply-chain | 1 | Supply chain sync |

### 🌱 Agriculture Skills
| Skill | Mô tả | Tính năng |
|-------|-------|-----------|
| **WeatherIntelligence** | Quyết định dựa trên thời tiết | Dự báo 7 ngày, tư vấn tưới tiêu, đánh giá rủi ro |

### 🔧 Maintenance Skills
| Skill | Mô tả | Tính năng |
|-------|-------|-----------|
| **PredictiveMaintenance** | Dự đoán hỏng thiết bị | Health score, failure probability, lịch bảo trì |
| **EnergyOptimization** | Quản lý năng lượng | Phân tích tiêu thụ, tối ưu schedule, tính chi phí |

### 🔍 Diagnosis Skills
| Skill | Mô tả | Tính năng |
|-------|-------|-----------|
| **AnomalyDetection** | Phát hiện bất thường | Statistical, moving average, exponential smoothing |
| **AlertAggregation** | Gom nhóm cảnh báo | Correlation, prioritization, giảm noise |

### 💾 Data Skills
| Skill | Mô tả | Tính năng |
|-------|-------|-----------|
| **DataQuality** | Kiểm tra chất lượng dữ liệu | Freshness, accuracy, consistency, validity checks |

### 📡 IoT Skills
| Skill | Mô tả | Tính năng |
|-------|-------|-----------|
| **DeviceProvisioning** | Tự động cấu hình thiết bị | ESP32 auto-registration, firmware management |

### 🏛️ Governance Skills
| Skill | Mô tả | Tính năng |
|-------|-------|-----------|
| **ComplianceMonitor** | ISO 27001 compliance | Continuous monitoring, gap analysis |

### 🔐 Security Skills
 | Skill | Mô tả | Tính năng |
 |-------|-------|-----------|
 | **SecurityAudit** | Giám sát bảo mật liên tục | Threat detection, vulnerability scanning |

### 🧬 Fuzzy Logic + GA
| Component | Mô tả |
|-----------|-------|
| **IrrigationFuzzyController** | Bộ điều khiển Mamdani với 25 luật |
| **GeneticOptimizer** | Thuật toán di truyền tự động tối ưu tham số |
| **AutoTuningService** | Chạy tối ưu hóa hàng ngày lúc 3 AM |

---

### 🩺 Health & Maintenace (New)
- Đã bổ sung endpoint kiểm tra sức khỏe ML: /api/ml/health (có auth) để theo dõi tình trạng các mô hình và hệ thống ML (LightGBM, AutoML, Federated, Aurora).
- Điều chỉnh nhằm tăng tính tin cậy trong vận hành và phát hiện sớm các vấn đề mô hình.

## 🔌 API ENDPOINTS

### 🏡 Quản lý Farm

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/farms` | Danh sách farm |
| POST | `/api/farms` | Tạo farm mới |
| GET | `/api/farms/:id` | Chi tiết farm |
| PUT | `/api/farms/:id` | Cập nhật farm |
| DELETE | `/api/farms/:id` | Xóa farm |
| GET | `/api/farms/:id/stats` | Thống kê farm |

### 👥 Nhân sự (Workers)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/workers` | Danh sách công nhân |
| POST | `/api/workers` | Thêm công nhân |
| POST | `/api/workers/:id/checkin` | Check-in chấm công |
| POST | `/api/workers/:id/checkout` | Check-out |
| GET | `/api/workers/:id/stats` | Thống kê công việc |

### 📦 Chuỗi cung ứng (Supply Chain)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/supply-chain` | Danh sách lô hàng |
| POST | `/api/supply-chain` | Tạo lô hàng |
| POST | `/api/supply-chain/:id/harvest` | Ghi nhận thu hoạch |
| POST | `/api/supply-chain/:id/ship` | Ghi nhận vận chuyển |
| POST | `/api/supply-chain/:id/deliver` | Ghi nhận giao hàng |
| GET | `/api/supply-chain/stats/summary` | Thống kê |

### 📊 Kho/Vật tư (Inventory)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/inventory` | Danh sách vật tư |
| POST | `/api/inventory` | Thêm vật tư |
| PUT | `/api/inventory/:id` | Cập nhật vật tư |
| POST | `/api/inventory/:id/adjust` | Điều chỉnh tồn kho |
| GET | `/api/inventory/stats/summary` | Thống kê kho |

### 💰 Tài chính (Finance)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/finance` | Danh sách giao dịch |
| POST | `/api/finance` | Thêm giao dịch |
| GET | `/api/finance/report` | Báo cáo tháng |
| GET | `/api/finance/summary` | Tổng hợp năm |

### 🌤️ Thời tiết (Weather)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/dashboard/weather` | Dự báo 5 ngày |
| GET | `/api/dashboard/overview` | Tổng quan hệ thống |

### 🏥 Health Report

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health-report/settings` | Xem cài đặt |
| PUT | `/api/health-report/settings` | Cập nhật cài đặt |
| POST | `/api/health-report/test` | Gửi test report |
| GET | `/api/health-report/queue` | Xem hàng đợi retry |

### 📱 Hệ thống

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/health` | Health check |
| GET | `/api/version` | Version API |
| GET | `/api/stats` | Thống kê |
| GET | `/api/alerts` | Cảnh báo |
| GET | `/api/docs` | Swagger docs |

### 🔐 Authentication

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |

---

## 🌾 LUỒNG NÔNG NGHIỆP

```
1. Tạo Farm → Thêm thiết bị cảm biến
         ↓
2. Gieo trồng → Tạo batch traceability
         ↓
3. Giám sát → Rules tự động bật tưới
         ↓
4. Thu hoạch → Supply chain harvest
         ↓
5. Kiểm tra chất lượng → Quality check
         ↓
6. Vận chuyển → Supply chain ship
         ↓
7. Giao hàng → Supply chain deliver
         ↓
8. Bán hàng → Finance income
         ↓
9. Tính ROI → Finance report
```

---

## 🌊 LUỒNG TƯỚI TIÊU THÔNG MINH

```
1. Đọc cảm biến độ ẩm đất
         ↓
2. Lấy dự báo thời tiết (Open-Meteo)
         ↓
3. Tính ET0 (Evapotranspiration)
         ↓
4. Khuyến nghị tưới:
   - Đất khô + không mưa → Tưới
   - Đất đủ ẩm → Không tưới
   - Sắp mưa → Bỏ qua
         ↓
5. Tự động kích hoạt pump (nếu autoMode=true)
```

---

## 🤖 AI AGENTS (Machine Learning) - Multiple Models

### 1. Plant Disease Detection (TFLite - 4MB)
- **Model**: MobileNetV2 fine-tuned on PlantVillage (38 classes)
- **Accuracy**: 91% on test set
- **Size**: 4MB (lightweight, runs on CPU)
- **Endpoint**: `POST /api/ai/disease/predict`

### 2. Irrigation Prediction (LightGBM/ONNX)
- **Models**: LightGBM, sklearn, LSTM for time-series
- **Training**: Federated learning supported
- **Endpoint**: `POST /api/ai/irrigation/predict`

### 3. AI Conversation & Inference
- **Skills**: ai-conversation, ai-inference, ai-rag.skill.js
- **Features**: RAG (Retrieval Augmented Generation), cost calculator, ROI calculator

```bash
# Enable (default ON)
AI_SMALL_MODEL=1

# Test API
curl -X POST -F "image=@leaf.jpg" http://localhost:3000/api/ai/disease/predict
```

### 4. Federated Learning
- **Server**: ml/federated_server.py
- **Clients**: Aurora service for multi-party training

### ML Models Location
```bash
models/
├── plant_disease.tflite      # 4MB TFLite model
├── registry.json             # Model registry
└── create_lstm_model.py     # LSTM creator

ml/
├── train_lightgbm.py        # LightGBM training
├── train_sklearn.py         # sklearn training
├── train_irrigation.py       # Irrigation prediction
├── federated_server.py     # Federated learning
└── aurora_service.py       # Aurora multi-party
```

---

## ⛓️ BLOCKCHAIN (TÙY CHỌN)

```bash
# Bật blockchain (Aptos)
BLOCKCHAIN_ENABLED=true
APTOS_NETWORK=testnet
```

Khi bật, các sự kiện sau được ghi hash lên blockchain:
- `traceability.harvest` - Khi thu hoạch
- `traceability.export` - Khi xuất bán
- `traceability.certify` - Khi chứng nhận

---

## ⚡ TỐI ƯU HIỆU NĂNG

Tự động điều chỉnh theo RAM:

| RAM | Scheduler Interval | Usage |
|-----|----------------|-------|
| >= 2GB | 10 phút | Development |
| 1-2GB | 30 phút | Production nhỏ |
| < 1GB | 60 phút | Low-end device |

Health Report tự động điều chỉnh:
- CPU > 80% hoặc RAM > 85% → Interval 60p
- CPU < 40% và RAM < 60% → Interval 10p
- Bình thường → Interval 30p

---

## 🐳 DOCKER

```bash
# Build
docker build -t ecosyntech .

# Run
docker run -p 3000:3000 -v ./data:/app/data ecosyntech
```

---

## 🧪 TESTING

```bash
# Test hệ thống
node manage.js status

# Test API
curl http://localhost:3000/api/health
```

---

## 📄 LICENSE

MIT License - EcoSynTech Global 2026

---

## 📞 LIÊN HỆ

| | |
|---|---|
| **Công ty** | CÔNG TY TNHH CÔNG NGHỆ ECOSYNTECH GLOBAL |
| **Người đại diện** | Tạ Quang Thuận - CEO and FOUNDER |
| **Điện thoại** | 0989516698 |
| **Email** | kd.ecosyntech@gmail.com |
| **Website** | https://ecosyntech.com |
| **GitHub** | https://github.com/ecosyntech68vn/EcoSynTech-Local-Core |

---

## 📊 PROJECT STATS

| Metric | Value |
|--------|-------|
| Total Files | 647 |
| Source Files | 369 |
| Skills | 138 |
| AI Models | 9+ |
| API Endpoints | 66+ |
| ISO 27001 | ✅ Compliant |

---

**ECOSYNTECH FARM OS - LOCAL CORE**  
*"Nông nghiệp thông minh - Enterprise Grade"*
