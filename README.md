# EcoSynTech IoT Platform v2.3.2

Hệ thống IoT toàn diện cho nông nghiệp thông minh với **55+ skills tự động** và **QR Code Traceability** + **Aptos Blockchain**.

## Tính năng nổi bật

### 🎯 Core Features
- **58 Skills tự động** - Quản lý, vận hành, giám sát, sửa lỗi
- **QR Code Traceability** - Truy xuất nguồn gốc từ gieo trồng đến xuất bán
- **Aptos Blockchain** - Ghi nhận hash (có thể bật/tắt)
- **i18n đa ngôn ngữ** - Tiếng Việt, English, 中文
- **Tối ưu RAM thấp** - Chạy được trên 512MB RAM, Win7 compatible

### 📡 Connectivity
- REST API với Swagger documentation
- WebSocket real-time updates
- MQTT integration
- Webhook support

### 🛡️ Security & Governance
- JWT Authentication
- RBAC (Role-Based Access Control)
- Rate Limiting
- Audit Trail
- Secrets checking

## Cài đặt nhanh

```bash
# 1. Clone và cài đặt
cd Ecosyntech-web
npm install

# 2. Cấu hình (optional)
cp .env.example .env
# Chỉnh sửa .env nếu cần

# 3. Chạy server
npm start
```

## Cấu hình môi trường (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./data/ecosyntech.db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# MQTT (optional)
MQTT_BROKER_URL=wss://broker.hivemq.com:8884/mqtt
MQTT_USERNAME=
MQTT_PASSWORD=

# Blockchain (bật/tắt)
BLOCKCHAIN_ENABLED=false
BLOCKCHAIN_TYPE=aptos
APTOS_NETWORK=testnet

# QR Code
QR_CODE_ENABLED=true
QR_CODE_BASE_URL=https://ecosyntech.com

# Scheduler
OPS_SCHEDULER_DISABLED=false
OPS_SCHEDULER_INTERVAL=600000
```

## Scripts

```bash
npm start          # Chạy server production
npm run dev        # Chạy development với hot reload
npm run test       # Chạy tests
npm run lint       # ESLint
```

## API Endpoints chính

### Sensors
- `GET /api/sensors` - Danh sách sensors
- `GET /api/sensors/:type` - Chi tiết sensor

### Devices
- `GET /api/devices` - Danh sách devices
- `POST /api/devices` - Thêm device
- `PUT /api/devices/:id` - Cập nhật device
- `DELETE /api/devices/:id` - Xóa device

### Rules
- `GET /api/rules` - Danh sách rules
- `POST /api/rules` - Tạo rule
- `PUT /api/rules/:id` - Cập nhật rule

### Traceability (QR Code + Blockchain)
- `POST /api/traceability/batch` - Tạo batch + QR code
- `GET /api/traceability/batch/:code` - Truy xuất batch
- `POST /api/traceability/batch/:code/stage` - Thêm giai đoạn
- `POST /api/traceability/batch/:code/harvest` - Thu hoạch
- `POST /api/traceability/batch/:code/export` - Xuất bán
- `POST /api/traceability/batch/:code/certify` - Chứng nhận
- `GET /api/traceability/batch/:code/full` - Timeline đầy đủ
- `GET /api/traceability/batch/:code/qr` - Lấy QR code
- `GET /api/traceability/batch/:code/label` - Label in được
- `POST /api/traceability/scan` - Scan QR check nguồn gốc
- `GET /api/traceability/verify/:code` - Verify blockchain hash
- `GET /api/traceability/export/pdf` - Export PDF report
- `GET /api/traceability/export/excel` - Export Excel report

### System
- `GET /api/stats` - Thống kê hệ thống
- `GET /api/alerts` - Alerts
- `GET /api/docs` - Swagger docs

## Skills System

### Categories

| Category | Skills | Mô tả |
|----------|--------|-------|
| **drift** | version-drift, config-drift | Monitor version/config changes |
| **network** | ws-heartbeat, mqtt-watch | Network connectivity |
| **data** | alert-deduper, incident-correlator | Data processing |
| **diagnosis** | route-mapper, webhook-correlator, anomaly-classifier, device-state-diff, kpi-drift, root-cause-hint | Chẩn đoán lỗi |
| **selfheal** | retry-job, reconnect-bridge, reset-device, clear-cache, rollback-ota, auto-acknowledge | Tự sửa lỗi |
| **orchestration** | rules-engine, schedules-engine, webhook-dispatch, command-router, ota-orchestrator, report-export | Điều phối |
| **governance** | rbac-guard, audit-trail, secrets-check, tenant-isolation, rate-limit-guard, approval-gate-advanced | Quản trị |
| **analysis** | root-cause-analyzer, auto-backup, anomaly-predictor, system-health-scorer | Phân tích |
| **recovery** | auto-restore | Khôi phục |
| **security** | vuln-scanner | Bảo mật |
| **defense** | intrusion-detector | Phòng thủ |
| **communication** | telegram-notifier, report-generator, voice-notifier, language-switcher | Giao tiếp |
| **agriculture** | weather-decision, water-optimization, crop-growth-tracker, pest-alert, fertilizer-scheduler | Nông nghiệp |
| **iot** | energy-saver, predictive-maintenance, multi-farm-manager | IoT devices |
| **maintenance** | cleanup-agent, log-rotator, db-optimizer | Bảo trì |
| **ai** | ai-predict-weather | AI prediction |
| **traceability** | qr-traceability, aptos-blockchain, aptos-integration | QR + Blockchain |

## QR Code Traceability Flow

```
1. Tạo batch → QR Code tự động
       ↓
2. Gieo trồng → Stage 1 (planting)
       ↓
3. Chăm sóc → Stage 2-N (growing)
       ↓
4. Thu hoạch → harvest event → Blockchain hash
       ↓
5. Đóng gói → Stage (processing, packaging)
       ↓
6. Vận chuyển → Stage (transport, storage)
       ↓
7. Xuất bán → export event → Blockchain hash
       ↓
8. Chứng nhận → certify event → Blockchain hash
```

## Blockchain Configuration

```bash
# Bật blockchain (Aptos)
BLOCKCHAIN_ENABLED=true

# Tắt (mặc định)
BLOCKCHAIN_ENABLED=false
```

Khi bật, các events sau sẽ được ghi hash lên blockchain:
- `traceability.harvest` - Khi thu hoạch
- `traceability.export` - Khi xuất bán
- `traceability.certify` - Khi thêm chứng nhận

## i18n - Đa ngôn ngữ

Hỗ trợ: Tiếng Việt (vi), English (en), 中文 (zh)

Đổi ngôn ngữ qua:
- Header `Accept-Language`
- Event `language-change` trigger skill

## Performance Optimization

Tự động điều chỉnh theo RAM:

| RAM | Scheduler Interval | Backup Interval | Heartbeat |
|-----|-------------------|-----------------|-----------|
| >= 2GB | 10 phút | 3 giờ | 60s |
| 1-2GB | 30 phút | 6 giờ | 120s |
| < 1GB | 60 phút | 12 giờ | 300s |

## Docker (optional)

```bash
# Build
docker build -t ecosyntech .

# Run
docker run -p 3000:3000 -v ./data:/app/data ecosyntech
```

## Testing

```bash
# Test all skills
node scripts/test-skills.js

# Test specific feature
node manage.js status
```

## License

MIT License - EcoSynTech 2026