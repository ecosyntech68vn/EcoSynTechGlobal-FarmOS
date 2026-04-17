# EcoSynTech - Hướng Dẫn Vận Hành Chi Tiết

## Mục Lục
1. [Khởi Động Hệ Thống](#1-khởi-động-hệ-thống)
2. [Quản Lý Thiết Bị](#2-quản-lý-thiết-bị)
3. [Quản Lý Sensors](#3-quản-lý-sensors)
4. [Quản Lý Rules](#4-quản-lý-rules)
5. [Quản Lý Schedules](#5-quản-lý-schedules)
6. [QR Code Traceability](#6-qr-code-traceability)
7. [Blockchain](#7-blockchain)
8. [Skills System](#8-skills-system)
9. [i18n Đa Ngôn Ngữ](#9-i18n-đa-ngôn-ngữ)
10. [Monitoring & Alerts](#10-monitoring--alerts)
11. [Maintenance](#11-maintenance)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Khởi Động Hệ Thống

### 1.1 Cài đặt lần đầu
```bash
# Clone và cài đặt dependencies
cd Ecosyntech-web
npm install

# Tạo thư mục data
mkdir -p data logs

# Chạy server
npm start
```

### 1.2 Kiểm tra trạng thái
```bash
# Xem logs
tail -f logs/app.log

# Kiểm tra process
ps aux | grep node

# Test API
curl http://localhost:3000/api/stats
```

### 1.3 Cấu hình môi trường (.env)
```env
PORT=3000                    # Port server
NODE_ENV=production          # development/production
LOG_LEVEL=info               # debug/info/warn/error

# Database
DB_PATH=./data/ecosyntech.db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# MQTT (optional)
MQTT_BROKER_URL=wss://broker.hivemq.com:8884/mqtt

# Blockchain
BLOCKCHAIN_ENABLED=false     # Bật/tắt Aptos
APTOS_NETWORK=testnet

# QR Code
QR_CODE_ENABLED=true
QR_CODE_BASE_URL=https://ecosyntech.com
```

---

## 2. Quản Lý Thiết Bị

### 2.1 Thêm thiết bị mới
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "Sensor Node 01",
    "type": "esp32",
    "zone": "zone-a1",
    "config": {
      "mqtt_topic": "sensors/zone-a1",
      "polling_interval": 5000
    }
  }'
```

### 2.2 Cập nhật trạng thái
```bash
# Online
curl -X PUT http://localhost:3000/api/devices/<device_id> \
  -H "Content-Type: application/json" \
  -d '{"status": "online"}'

# Offline
curl -X PUT http://localhost:3000/api/devices/<device_id> \
  -H "Content-Type: application/json" \
  -d '{"status": "offline"}'
```

### 2.3 Xem danh sách
```bash
curl http://localhost:3000/api/devices
```

---

## 3. Quản Lý Sensors

### 3.1 Xem tất cả sensors
```bash
curl http://localhost:3000/api/sensors
```

### 3.2 Xem sensor cụ thể
```bash
curl http://localhost:3000/api/sensors/temperature
curl http://localhost:3000/api/sensors/humidity
```

### 3.3 Cập nhật giá trị (từ device)
```bash
curl -X POST http://localhost:3000/api/sensors/update \
  -H "Content-Type: application/json" \
  -d '{
    "type": "temperature",
    "value": 28.5,
    "unit": "celsius"
  }'
```

---

## 4. Quản Lý Rules

### 4.1 Tạo rule mới
```bash
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "Bật máy bơm khi độ ẩm thấp",
    "description": "Tự động bật máy bơm khi độ ẩm đất < 30%",
    "enabled": true,
    "condition": "sensors.soil_moisture < 30",
    "action": "devices.pump.on",
    "priority": "high",
    "cooldown_minutes": 15
  }'
```

### 4.2 Bật/tắt rule
```bash
# Bật
curl -X PUT http://localhost:3000/api/rules/<rule_id> \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Tắt
curl -X PUT http://localhost:3000/api/rules/<rule_id> \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

### 4.3 Xem lịch sử trigger
```bash
curl http://localhost:3000/api/rules/<rule_id>/history
```

---

## 5. Quản Lý Schedules

### 5.1 Tạo schedule
```bash
curl -X POST http://localhost:3000/api/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "name": "Tưới nước buổi sáng",
    "time": "06:00",
    "duration": 30,
    "zones": ["zone-a1", "zone-a2"],
    "enabled": true,
    "days": ["mon", "wed", "fri"]
  }'
```

### 5.2 Danh sách schedules
```bash
curl http://localhost:3000/api/schedules
```

---

## 6. QR Code Traceability

### 6.1 Tạo batch mới (tự động tạo QR)
```bash
curl -X POST http://localhost:3000/api/traceability/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "product_name": "Rau muống",
    "product_type": "vegetable",
    "quantity": 100,
    "unit": "kg",
    "farm_name": "EcoFarm Vũng Tàu",
    "zone": "zone-a1",
    "seed_variety": "Rau muống local",
    "planting_date": "2026-01-15",
    "expected_harvest": "2026-04-15"
  }'
```

**Response:**
```json
{
  "success": true,
  "batch": {
    "batch_code": "BATCH-M1X2Y3Z4-ABCD",
    "product_name": "Rau muống"
  },
  "qr_code": "data:image/png;base64,...",
  "trace_url": "https://ecosyntech.com/trace/BATCH-M1X2Y3Z4-ABCD"
}
```

### 6.2 Thêm giai đoạn (stage)
```bash
curl -X POST http://localhost:3000/api/traceability/batch/<batch_code>/stage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "stage_name": "Bón phân đợt 1",
    "stage_type": "growing",
    "description": "Bón phân NPK 20-20-20",
    "performed_by": "Nguyễn Văn A",
    "location": "Khu A1",
    "inputs_used": [
      {"name": "NPK 20-20-20", "quantity": "50kg"}
    ]
  }'
```

**Các stage_type hợp lệ:**
- `preparation` - Chuẩn bị
- `planting` - Gieo trồng
- `growing` - Chăm sóc
- `harvesting` - Thu hoạch
- `processing` - Chế biến
- `packaging` - Đóng gói
- `storage` - Lưu trữ
- `transport` - Vận chuyển

### 6.3 Thu hoạch (tự động ghi blockchain nếu enabled)
```bash
curl -X POST http://localhost:3000/api/traceability/batch/<batch_code>/harvest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "harvest_quantity": 95,
    "harvest_notes": "Thu hoạch đợt 1, chất lượng A"
  }'
```

### 6.4 Xuất bán
```bash
curl -X POST http://localhost:3000/api/traceability/batch/<batch_code>/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "buyer_name": "Coopmart Vũng Tàu",
    "buyer_contact": "028-1234-5678",
    "export_price": 450000,
    "export_unit": "kg",
    "notes": "Giao hàng vào ngày 20/04"
  }'
```

### 6.5 Thêm chứng nhận
```bash
curl -X POST http://localhost:3000/api/traceability/batch/<batch_code>/certify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "certification_name": "VietGAP",
    "certification_body": "Bộ NN & PTNT",
    "certification_date": "2026-04-01",
    "certification_expire": "2028-04-01",
    "certificate_number": "VG-2026-00123"
  }'
```

### 6.6 Lấy QR Code
```bash
# JSON
curl http://localhost:3000/api/traceability/batch/<batch_code>/qr

# SVG
curl http://localhost:3000/api/traceability/batch/<batch_code>/qr?format=svg
```

### 6.7 In nhãn QR
```bash
# JSON
curl http://localhost:3000/api/traceability/batch/<batch_code>/label

# HTML (in được)
curl http://localhost:3000/api/traceability/batch/<batch_code>/label?format=html
```

### 6.8 Scan QR kiểm tra nguồn gốc
```bash
curl -X POST http://localhost:3000/api/traceability/scan \
  -H "Content-Type: application/json" \
  -d '{
    "qr_data": "https://ecosyntech.com/trace/BATCH-M1X2Y3Z4-ABCD"
  }'
```

### 6.9 Verify blockchain hash
```bash
curl http://localhost:3000/api/traceability/verify/<batch_code>
```

### 6.10 Xem timeline đầy đủ
```bash
curl http://localhost:3000/api/traceability/batch/<batch_code>/full
```

### 6.11 Export reports
```bash
# PDF
curl -o report.pdf http://localhost:3000/api/traceability/export/pdf?status=active

# Excel
curl -o report.xlsx http://localhost:3000/api/traceability/export/excel?status=harvested
```

---

## 7. Blockchain

### 7.1 Bật Aptos Blockchain
```bash
# Set environment variable
export BLOCKCHAIN_ENABLED=true

# Hoặc trong .env
BLOCKCHAIN_ENABLED=true
APTOS_NETWORK=testnet  # testnet/mainnet
```

### 7.2 Khi nào blockchain ghi nhận?
- `traceability.harvest` - Khi gọi API harvest
- `traceability.export` - Khi gọi API export  
- `traceability.certify` - Khi gọi API certify

### 7.3 Verify transaction
```bash
curl http://localhost:3000/api/traceability/verify/<batch_code>
```

---

## 8. Skills System

### 8.1 Xem danh sách skills
```bash
node manage.js status
```

### 8.2 Categories

| Category | Skills Count | Mô tả |
|----------|-------------|-------|
| drift | 2 | Monitor version/config drift |
| network | 2 | WebSocket, MQTT health |
| data | 2 | Alert dedup, incident correlation |
| diagnosis | 6 | Chẩn đoán lỗi tự động |
| selfheal | 6 | Tự sửa lỗi |
| orchestration | 6 | Điều phối hệ thống |
| governance | 6 | RBAC, audit, security |
| analysis | 4 | Phân tích, backup |
| recovery | 1 | Auto restore |
| security | 1 | Vulnerability scanner |
| defense | 1 | Intrusion detection |
| communication | 4 | Notifications, reports |
| agriculture | 5 | Nông nghiệp thông minh |
| iot | 3 | IoT device management |
| maintenance | 3 | Cleanup, logs, DB |
| ai | 1 | AI prediction |
| traceability | 3 | QR + Blockchain |

### 8.3 Manual trigger skill
Skills chạy tự động qua:
- Events (`event:type`)
- Cron schedules
- WebSocket triggers

### 8.4 Monitoring skills
```bash
# Xem logs
tail -f logs/ops.log

# Xem metrics
curl http://localhost:3000/api/stats
```

---

## 9. i18n Đa Ngôn Ngữ

### 9.1 Ngôn ngữ hỗ trợ
- `vi` - Tiếng Việt (mặc định)
- `en` - English
- `zh` - 中文

### 9.2 Đổi ngôn ngữ
```bash
# Via header
curl -H "Accept-Language: en" http://localhost:3000/api/...

# Via API
curl -X POST http://localhost:3000/api/settings/language \
  -H "Content-Type: application/json" \
  -d '{"language": "en"}'
```

---

## 10. Monitoring & Alerts

### 10.1 Xem alerts
```bash
# Tất cả
curl http://localhost:3000/api/alerts

# Chưa acknowledged
curl http://localhost:3000/api/alerts?acknowledged=false
```

### 10.2 Acknowledge alert
```bash
curl -X POST http://localhost:3000/api/alerts/<alert_id>/acknowledge \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### 10.3 Xem thống kê
```bash
curl http://localhost:3000/api/stats
```

---

## 11. Maintenance

### 11.1 Backup database
```bash
# Tự động (qua skill auto-backup)
# Hoặc manual
cp data/ecosyntech.db data/backups/ecosyntech-$(date +%Y%m%d).db
```

### 11.2 Cleanup logs
```bash
# Tự động (qua skill log-rotator)
# Hoặc manual
find logs -name "*.log" -mtime +30 -delete
```

### 11.3 Optimize database
```bash
# Tự động (qua skill db-optimizer)
# Hoặc manual
node manage.js optimize
```

### 11.4 Clear cache
```bash
node manage.js clear-cache
```

---

## 12. Troubleshooting

### 12.1 Server không khởi động
```bash
# Kiểm tra logs
tail -f logs/app.log

# Kiểm tra port
lsof -i :3000

# Kiểm tra database
node -e "require('./src/config/database').initDatabase()"
```

### 12.2 Skills không chạy
```bash
# Kiểm tra scheduler
node manage.js status

# Xem logs
tail -f logs/ops.log
```

### 12.3 Blockchain không hoạt động
```bash
# Kiểm tra config
echo $BLOCKCHAIN_ENABLED

# Verify skill
node -e "console.log(require('./src/modules/blockchain-helper').isEnabled())"
```

### 12.4 QR Code không tạo
```bash
# Kiểm tra QR config
node -e "console.log(require('./src/config').qrcode)"
```

### 12.5 Memory cao
```bash
# Xem memory usage
node -e "console.log(require('./src/optimization').getMemoryStatus())"

# Clear cache
node manage.js clear-cache
```

---

## Quick Reference

| Command | Mô tả |
|---------|-------|
| `npm start` | Chạy server |
| `npm run dev` | Dev mode với hot reload |
| `node manage.js status` | Xem trạng thái |
| `node manage.js start` | Bật scheduler |
| `node manage.js stop` | Dừng scheduler |
| `node scripts/test-skills.js` | Test tất cả skills |

---

## API Base URL
```
http://localhost:3000/api
```

## WebSocket
```
ws://localhost:3000
```

## Swagger Documentation
```
http://localhost:3000/api/docs
```

---

**Version: 2.3.2**  
**Last Updated: 2026-04-17**