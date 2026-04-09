# EcoSynTech IoT Platform

Hệ thống IoT toàn diện cho nông nghiệp thông minh - phiên bản nâng cấp v2.0.

## Tính năng chính

### Backend (Node.js + Express)
- **REST API** đầy đủ với validation và error handling
- **WebSocket** cho cập nhật thời gian thực
- **SQLite Database** với persistence
- **JWT Authentication** và User Management
- **Rate Limiting** và Security (Helmet, CORS)
- **Webhook Integration** với signature verification
- **MQTT Protocol** support
- **Logging** với Winston
- **Structured Architecture** (Controllers, Routes, Middleware)

### Frontend (Vanilla JS)
- **Dark/Light Mode** với system preference detection
- **Real-time Updates** qua WebSocket
- **Push Notifications** cho cảnh báo
- **Toast Notifications** cho UX tốt hơn
- **Responsive Design** cho mobile
- **PWA Support** với Service Worker
- **Local Storage** cho offline data

### DevOps
- **Docker** + **Docker Compose**
- **CI/CD Pipeline** với GitHub Actions
- **Environment Configuration**

## Cài đặt

### Yêu cầu
- Node.js >= 18.0.0
- npm hoặc yarn

### Cài đặt nhanh

```bash
# Clone repository
git clone https://github.com/ecosyntech68vn/Ecosyntech-web.git
cd Ecosyntech-web

# Cài đặt dependencies
npm install

# Chạy server (Development)
npm run dev

# Hoặc chạy production
npm start
```

### Sử dụng Docker

```bash
# Build và chạy với Docker Compose
docker-compose up -d

# Xem logs
docker-compose logs -f

# Stop
docker-compose down
```

## API Endpoints

### Authentication
```
POST /api/auth/register - Đăng ký user mới
POST /api/auth/login    - Đăng nhập
GET  /api/auth/me       - Lấy thông tin user hiện tại
```

### Sensors
```
GET  /api/sensors           - Lấy tất cả sensors
GET  /api/sensors/:type     - Lấy sensor theo type
POST /api/sensors/update    - Cập nhật giá trị sensor
```

### Devices
```
GET    /api/devices              - Lấy tất cả thiết bị
GET    /api/devices/:id          - Lấy thiết bị theo ID
POST   /api/devices              - Tạo thiết bị mới
PUT    /api/devices/:id/config   - Cập nhật cấu hình
POST   /api/devices/:id/command  - Gửi lệnh đến thiết bị
DELETE /api/devices/:id          - Xóa thiết bị
```

### Rules (Automation)
```
GET    /api/rules           - Lấy tất cả rules
POST   /api/rules            - Tạo rule mới
PUT    /api/rules/:id        - Cập nhật rule
DELETE /api/rules/:id        - Xóa rule
POST   /api/rules/:id/toggle - Bật/tắt rule
```

### Schedules
```
GET    /api/schedules           - Lấy tất cả lịch
POST   /api/schedules            - Tạo lịch mới
PUT    /api/schedules/:id        - Cập nhật lịch
DELETE /api/schedules/:id        - Xóa lịch
POST   /api/schedules/:id/toggle - Bật/tắt lịch
```

### Alerts
```
GET    /api/alerts                 - Lấy tất cả alerts
POST   /api/alerts                 - Tạo alert mới
POST   /api/alerts/:id/acknowledge - Xác nhận alert
POST   /api/alerts/acknowledge-all - Xác nhận tất cả alerts
DELETE /api/alerts/:id             - Xóa alert
```

### System
```
GET /api/health    - Health check
GET /api/stats      - System statistics
POST /api/export    - Export all data
POST /api/import    - Import data
```

### Webhooks
```
POST /api/webhooks/sensor-alert   - Sensor alert webhook
POST /api/webhooks/device-status  - Device status webhook
POST /api/webhooks/rule-triggered - Rule triggered webhook
POST /api/webhooks/schedule-run   - Schedule run webhook
```

### WebSocket
```
Endpoint: /ws

Client Messages:
- { type: "auth", token: "jwt-token" }
- { type: "subscribe", topics: ["sensors", "alerts"] }
- { type: "ping" }

Server Messages:
- { type: "sensor-update", data: {...} }
- { type: "alert", action: "created", data: {...} }
- { type: "device-update", data: {...} }
- { type: "rule-triggered", data: {...} }
- { type: "history", action: "added", data: {...} }
```

## Cấu hình

Tạo file `.env` hoặc sử dụng các biến môi trường:

```env
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database
DB_PATH=./data/ecosyntech.db

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# MQTT
MQTT_BROKER_URL=wss://broker.hivemq.com:8884/mqtt

# CORS
CORS_ORIGIN=*

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Webhooks
WEBHOOK_SECRET=your-webhook-secret
```

## Kiến trúc

```
ecosyntech-web/
├── server.js              # Main server entry
├── src/
│   ├── config/           # Configuration
│   │   ├── index.js      # Environment config
│   │   ├── logger.js    # Winston logger
│   │   └── database.js   # SQLite setup
│   ├── middleware/        # Express middleware
│   │   ├── auth.js       # JWT authentication
│   │   ├── errorHandler.js
│   │   └── validation.js  # Joi validation
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── sensors.js
│   │   ├── devices.js
│   │   ├── rules.js
│   │   ├── schedules.js
│   │   ├── history.js
│   │   ├── alerts.js
│   │   ├── webhooks.js
│   │   └── stats.js
│   └── websocket/       # WebSocket handlers
│       └── index.js
├── data/                 # SQLite database
├── logs/                 # Application logs
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

## Phát triển

```bash
# Chạy tests
npm test

# Chạy linter
npm run lint
```

## License

MIT License - EcoSynTech 2026
