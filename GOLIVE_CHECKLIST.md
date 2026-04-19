# EcoSynTech FarmOS PRO - GOLIVE CHECKLIST
## Phiên bản: 5.0.0 | Ngày: 2026-04-19

---

## PHẦN 1: CHUẨN BỊ TRƯỚC GOLIVE

### 1.1 Infrastructure Checklist

| # | Hạng mục | Status | Ghi chú | Người phụ trách | Ngày hoàn thành |
|---|-----------|--------|---------|-----------------|------------------|
| 1.1.1 | Server/Cloud đã được cấp phát | ☐ | | | |
| 1.1.2 | Domain đã point về server | ☐ | | | |
| 1.1.3 | SSL Certificate đã cài đặt | ☐ | | | |
| 1.1.4 | Docker đã cài đặt | ☐ | | | |
| 1.1.5 | Node.js 18+ đã cài đặt | ☐ | | | |
| 1.1.6 | Redis đã cài đặt và chạy | ☐ | | | |
| 1.1.7 | MQTT Broker đã cài đặt | ☐ | | | |

### 1.2 Database Checklist

| # | Hạng mục | Status | Ghi chú | Người phụ trách | Ngày hoàn thành |
|---|-----------|--------|---------|-----------------|------------------|
| 1.2.1 | Database folder đã tạo | ☐ | ./data/ | | |
| 1.2.2 | Migration scripts đã chạy | ☐ | | | |
| 1.2.3 | Seeders đã chạy | ☐ | | | |
| 1.2.4 | DB backup đã cấu hình | ☐ | | | |
| 1.2.5 | DB restore test đã thực hiện | ☐ | | | |

### 1.3 Environment Variables

| # | Variable | Required | Default | Giá trị đã cấu hình | Status |
|---|----------|----------|---------|---------------------|--------|
| 1.3.1 | PORT | Yes | 3000 | | ☐ |
| 1.3.2 | DB_PATH | Yes | ./data/ecosyntech.db | | ☐ |
| 1.3.3 | JWT_SECRET | Yes | (change-me) | | ☐ |
| 1.3.4 | MQTT_BROKER_URL | Yes | wss://broker.hivemq.com | | ☐ |
| 1.3.5 | TELEGRAM_BOT_TOKEN | No | - | | ☐ |
| 1.3.6 | DEEPSEEK_API_KEY | No | - | | ☐ |
| 1.3.7 | FARM_LAT | No | 10.7769 | | ☐ |
| 1.3.8 | FARM_LON | No | 106.7009 | | ☐ |

---

## PHẦN 2: DEPLOYMENT

### 2.1 Code Deployment

| # | Hạng mục | Status | Ghi chú | Người phụ trách | Ngày hoàn thành |
|---|-----------|--------|---------|-----------------|------------------|
| 2.1.1 | Clone repository | ☐ | | | |
| 2.1.2 | npm install | ☐ | | | |
| 2.1.3 | Chạy migrations | ☐ | node run-migrations.js | | |
| 2.1.4 | Build kiểm tra | ☐ | npm run build | | |
| 2.1.5 | Khởi động server | ☐ | npm start | | |

### 2.2 Docker Deployment

| # | Hạng mục | Status | Ghi chú | Người phụ trách | Ngày hoàn thành |
|---|-----------|--------|---------|-----------------|------------------|
| 2.2.1 | Build Docker image | ☐ | docker build -t ecosyntech . | | |
| 2.2.2 | Chạy container | ☐ | docker-compose up -d | | |
| 2.2.3 | Kiểm tra logs | ☐ | docker logs | | |
| 2.2.4 | Health check | ☐ | curl http://localhost:3000/api/health | | |

---

## PHẦN 3: POST-DEPLOYMENT VERIFICATION

### 3.1 API Health Checks

| # | Endpoint | Expected | Actual | Status | Ghi chú |
|---|----------|----------|--------|--------|---------|
| 3.1.1 | GET /api/health | {status: "ok"} | | ☐ | |
| 3.1.2 | GET /api/stats | 200 OK | | ☐ | |
| 3.1.3 | POST /api/auth/login | 200 or 401 | | ☐ | |
| 3.1.4 | GET /api/farms | 401 (auth required) | | ☐ | |
| 3.1.5 | GET /api/crops | 401 (auth required) | | ☐ | |

### 3.2 Authentication Tests

| # | Test Case | Expected | Actual | Status | Ghi chú |
|---|-----------|----------|--------|--------|---------|
| 3.2.1 | Đăng ký user mới | 201 Created | | ☐ | |
| 3.2.2 | Đăng nhập | Token returned | | ☐ | |
| 3.2.3 | Truy cập API với token | 200 OK | | ☐ | |
| 3.2.4 | Truy cập API không token | 401 Unauthorized | | ☐ | |
| 3.2.5 | Token hết hạn | 401 Unauthorized | | ☐ | |

### 3.3 Core Feature Tests

| # | Feature | Test Case | Expected | Status | Ghi chú |
|---|---------|-----------|----------|--------|---------|
| 3.3.1 | Farms | Tạo farm mới | 201 Created | ☐ | |
| 3.3.2 | Farms | Liệt kê farms | Array returned | ☐ | |
| 3.3.3 | Devices | Đăng ký device | 201 Created | ☐ | |
| 3.3.4 | Sensors | Cập nhật sensor | 200 OK | ☐ | |
| 3.3.5 | Workers | Thêm worker | 201 Created | ☐ | |
| 3.3.6 | Tasks | Tạo task | 201 Created | ☐ | |
| 3.3.7 | Inventory | Thêm vật tư | 201 Created | ☐ | |
| 3.3.8 | Finance | Thêm phiếu | 201 Created | ☐ | |

### 3.4 IoT Tests

| # | Test Case | Expected | Status | Ghi chú |
|---|-----------|----------|--------|---------|
| 3.4.1 | MQTT kết nối | Connected | ☐ | |
| 3.4.2 | Telemetry ingestion | Data stored | ☐ | |
| 3.4.3 | Device status update | Status changed | ☐ | |
| 3.4.4 | Rule triggered | Action executed | ☐ | |

### 3.5 AI Engine Tests

| # | Endpoint | Expected | Status | Ghi chú |
|---|----------|----------|--------|---------|
| 3.5.1 | GET /api/ai/irrigation | Recommendation | ☐ | |
| 3.5.2 | GET /api/ai/fertilizer | Recommendation | ☐ | |
| 3.5.3 | GET /api/ai/yield | Forecast | ☐ | |
| 3.5.4 | GET /api/ai/disease | Risk assessment | ☐ | |

### 3.6 Traceability Tests

| # | Test Case | Expected | Status | Ghi chú |
|---|-----------|----------|--------|---------|
| 3.6.1 | Tạo batch | 201 Created | ☐ | |
| 3.6.2 | Thêm event | 201 Created | ☐ | |
| 3.6.3 | Tạo package + QR | QR generated | ☐ | |
| 3.6.4 | Public trace | Data returned | ☐ | |
| 3.6.5 | Shipment creation | 201 Created | ☐ | |

---

## PHẦN 4: SECURITY CHECKS

| # | Hạng mục | Status | Ghi chú |
|---|-----------|--------|---------|
| 4.1 | JWT_SECRET đã thay đổi | ☐ | |
| 4.2 | Rate limiting hoạt động | ☐ | |
| 4.3 | CORS đã cấu hình | ☐ | |
| 4.4 | Helmet security headers | ☐ | |
| 4.5 | SQL injection prevention | ☐ | |
| 4.6 | XSS protection | ☐ | |
| 4.7 | Audit logging hoạt động | ☐ | |

---

## PHẦN 5: MONITORING & ALERTING

| # | Hạng mục | Status | Ghi chú |
|---|-----------|--------|---------|
| 5.1 | Health check endpoint accessible | ☐ | |
| 5.2 | Error logging configured | ☐ | |
| 5.3 | Telegram notification test | ☐ | |
| 5.4 | Backup schedule configured | ☐ | |

---

## PHẦN 6: TRAINING & DOCUMENTATION

| # | Hạng mục | Status | Ghi chú |
|---|-----------|--------|---------|
| 6.1 | User manual đã chuẩn bị | ☐ | |
| 6.2 | Admin guide đã chuẩn bị | ☐ | |
| 6.3 | Training session đã thực hiện | ☐ | |
| 6.4 | Pilot users đã onboarded | ☐ | |

---

## PHẦN 7: SIGN-OFF

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Technical Lead | | | |
| QA Lead | | | |
| Product Owner | | | |
| Operations | | | |

---

**Kết quả Golive:**
- ✅ PASSED: _______________
- ❌ FAILED: _______________

**Ngày Golive thực tế: ________________**

**Issues cần theo dõi:**
1. _________________________________
2. _________________________________
3. _________________________________