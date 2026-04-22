# 🚀 ECOSYNTECH FARM OS

## English | Tiếng Việt

**Smart Agriculture 4.0 Platform** with **multi-farm management**, **workforce**, **supply chain**, **inventory**, **finance**, **smart irrigation**, **health monitoring** and **AI-powered automation**.

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
git clone https://github.com/ecosyntech68vn/Ecosyntech-web

# 2. Navigate to directory
cd Ecosyntech-web

# 3. Install dependencies
npm install

# 4. Configure environment
cp .env.example .env
# ⚠️ IMPORTANT: Change JWT_SECRET in .env before production!

# 5. Start server
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
# AI
# ====================
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

---

**ECOSYNTECH FARM OS**  
*"Nông nghiệp thông minh - Cho nông dân, cho mọi người"*

🌱🚀 **"Cắm là chạy!"** 🚀🌱
