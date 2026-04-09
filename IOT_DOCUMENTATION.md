# EcoSynTech IoT System

Hệ thống IoT cho nông nghiệp thông minh với dashboard giám sát, điều khiển tự động và tích hợp backend.

## Cấu trúc dự án

```
ecosyntech-web/
├── index.html          # Giao diện chính với IoT Dashboard
├── app.js              # Frontend JavaScript (IoT System, MQTT, Webhooks)
├── styles.css          # Styling cho dashboard và các thành phần UI
├── server.js           # Backend REST API server
├── package.json        # Dependencies cho backend
├── products.json       # Danh mục sản phẩm IoT
├── manifest.json       # PWA manifest
├── sw.js               # Service Worker cho offline support
└── README.md           # Tài liệu này
```

## Tính năng IoT đã hoàn thiện

### 1. IoT Dashboard
- **8 loại cảm biến**: Nhiệt độ, Độ ẩm không khí, Độ ẩm đất, Ánh sáng, pH, CO₂, EC, Mực nước
- **Biểu đồ thời gian thực**: 12 bars cho mỗi cảm biến với animation
- **Cảnh báo ngưỡng**: Warning (vàng) và Danger (đỏ) dựa trên ngưỡng cấu hình
- **Lựa chọn Farm/Zone**: Hỗ trợ nhiều vùng canh tác
- **Trạng thái kết nối**: Online/Offline indicator

### 2. Smart Control (Rules Engine)
- **Tạo/Edit/Delete Rules** với điều kiện IF-THEN
- **Toán tử so sánh**: <, >, <=, >=, ==
- **8 loại action**: Mở/đóng van, Bật/tắt bơm, quạt, đèn, Gửi cảnh báo
- **Điều kiện thời gian**: Khoảng thời gian hoạt động
- **Cài đặt nâng cao**: Cooldown, thông báo, yêu cầu xác nhận
- **Lưu trữ localStorage**: Persistence qua trình duyệt

### 3. Schedule Management (Lịch tưới - bón)
- **CRUD đầy đủ**: Tạo, sửa, xóa lịch
- **Cấu hình**: Thời gian, thời lượng, zones, ngày trong tuần
- **Toggle bật/tắt**: Kích hoạt/tạm dừng lịch
- **Persistence localStorage**

### 4. Device Management
- **Danh sách thiết bị**: 6 thiết bị mẫu (cảm biến, bơm, van, đèn)
- **Trạng thái real-time**: Online/Offline/Running/Idle
- **Điều khiển**: Bật/tắt thiết bị
- **Configuration Modal**: Cấu hình ngưỡng, zone, interval

### 5. MQTT Integration
- **Kết nối MQTT Broker**: Hỗ trợ HiveMQ và broker tương thích
- **Auto-reconnect**: Tự động kết nối lại khi mất kết nối
- **Subscribe topics**: sensors, commands, alerts
- **Fallback REST API**: Chế độ polling khi MQTT không khả dụng

### 6. Webhook System
- **4 webhook endpoints**:
  - `/webhooks/sensor-alert`: Cảnh báo cảm biến
  - `/webhooks/device-status`: Trạng thái thiết bị
  - `/webhooks/rule-triggered`: Rule được kích hoạt
  - `/webhooks/schedule-run`: Lịch chạy
- **Signature verification**: X-EcoSynTech-Signature header

### 7. Push Notifications
- **Browser Notifications API**: Thông báo khi có cảnh báo
- **Quyền request**: Tự động xin phép người dùng
- **3 loại thông báo**: Sensor alert, Rule triggered, Schedule complete

### 8. Backend REST API
- **Các endpoints**:
  - `GET /api/sensors` - Lấy dữ liệu tất cả cảm biến
  - `GET /api/devices` - Danh sách thiết bị
  - `POST /api/devices/:id/command` - Gửi lệnh điều khiển
  - `GET/POST/PUT/DELETE /api/rules` - CRUD rules
  - `GET/POST/PUT/DELETE /api/schedules` - CRUD schedules
  - `GET /api/history` - Lịch sử hoạt động
  - `GET/POST /api/alerts` - Quản lý cảnh báo
  - `GET /api/stats` - Thống kê hệ thống
  - `POST /api/export` - Export dữ liệu JSON
- **Simulated sensor updates**: Tự động cập nhật giá trị cảm biến mỗi 5s
- **Rule evaluation**: Tự động kiểm tra và kích hoạt rules

## Chạy hệ thống

### Frontend (Static)
```bash
# Mở file index.html trong trình duyệt
# Hoặc sử dụng simple server
npx serve .
```

### Backend Server
```bash
# Cài đặt dependencies
npm install

# Chạy server
npm start

# Hoặc chế độ development với hot-reload
npm run dev
```

Server sẽ chạy tại `http://localhost:3000`

## Tích hợp MQTT

### Với HiveMQ Cloud (Miễn phí)
1. Đăng ký tài khoản tại hivemq.com/cloud
2. Lấy cluster URL và credentials
3. Cập nhật `brokerUrl` trong `app.js`

### Với Mosquitto (Local)
```bash
# Cài đặt
sudo apt install mosquitto mosquitto-clients

# Chạy broker
mosquitto -p 1883

# Subscribe test
mosquitto_sub -t "ecosyn/#"

# Publish test
mosquitto_pub -t "ecosyn/sensors/temperature" -m '{"value": 28.5}'
```

## API Documentation

### Sensors
```bash
# Get all sensors
curl http://localhost:3000/api/sensors

# Get single sensor
curl http://localhost:3000/api/sensors/temperature
```

### Devices
```bash
# Get all devices
curl http://localhost:3000/api/devices

# Send command
curl -X POST http://localhost:3000/api/devices/device-003/command \
  -H "Content-Type: application/json" \
  -d '{"command": "start"}'

# Configure device
curl -X POST http://localhost:3000/api/devices/device-001/config \
  -H "Content-Type: application/json" \
  -d '{"thresholdLow": 35, "thresholdCritical": 25}'
```

### Rules
```bash
# Get all rules
curl http://localhost:3000/api/rules

# Create rule
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tưới khi khô",
    "enabled": true,
    "condition": {"sensor": "soil", "operator": "<", "value": 40},
    "action": {"type": "valve_open", "target": "zone1"}
  }'

# Update rule
curl -X PUT http://localhost:3000/api/rules/rule-1 \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Delete rule
curl -X DELETE http://localhost:3000/api/rules/rule-1
```

### Webhooks
```bash
# Sensor alert webhook
curl -X POST http://localhost:3000/api/webhooks/sensor-alert \
  -H "Content-Type: application/json" \
  -H "X-EcoSynTech-Signature: sha256=abc123" \
  -d '{
    "sensor": "temperature",
    "value": 35,
    "severity": "danger"
  }'
```

## Data Persistence

- **localStorage**: Rules, schedules, history (frontend)
- **In-memory**: Backend server (devices, sensors, alerts)

Để persistence thực sự, cần tích hợp database như MongoDB hoặc PostgreSQL.

## Bảo mật

- Webhook signature verification được implement nhưng cần cải thiện với HMAC thực sự
- API hiện tại không có authentication - cần thêm JWT hoặc API key
- CORS được enable cho development - restrict trong production

## Tương lai phát triển

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Authentication & Authorization
- [ ] Multi-tenant support
- [ ] Real-time WebSocket thay thế polling
- [ ] Mobile app (React Native)
- [ ] AI/ML predictions
- [ ] ERP integration
- [ ] Email/SMS notifications
- [ ] Export PDF reports
- [ ] Map visualization

## License

MIT - EcoSynTech 2026
