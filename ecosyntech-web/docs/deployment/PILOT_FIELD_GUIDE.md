# EcoSynTech FarmOS PRO - PILOT FIELD GUIDE
## Hướng dẫn triển khai thực địa - Pilot Program
## Phiên bản: 5.0.0 | Ngày: 2026-04-20

---

## MỤC LỤC

1. [Chuẩn bị trước Pilot](#1-chuẩn-bị-trước-pilot)
2. [Cài đặt hệ thống](#2-cài-đặt-hệ-thống)
3. [Thiết lập Farm đầu tiên](#3-thiết-lập-farm-đầu-tiên)
4. [Kết nối thiết bị IoT](#4-kết-nối-thiết-bị-iot)
5. [Vận hành hàng ngày](#5-vận-hành-hàng-ngày)
6. [Xử lý sự cố](#6-xử-lý-sự-cố)
7. [Checklist hàng ngày](#7-checklist-hàng-ngày)

---

## 1. CHUẨN BỊ TRƯỚC PILOT

### 1.1 Yêu cầu hệ thống

| Item | Yêu cầu tối thiểu | Khuyến nghị |
|------|-------------------|-------------|
| Server | Ubuntu 20.04+ / Windows Server 2019+ | Ubuntu 22.04 LTS |
| RAM | 2GB | 4GB+ |
| Storage | 20GB SSD | 50GB SSD |
| CPU | 2 cores | 4 cores |
| Network | Internet 10Mbps | Internet 50Mbps+ |

### 1.2 Chuẩn bị trước ngày triển khai

- [ ] Clone repository về server
- [ ] Cài đặt Node.js 18+
- [ ] Cài đặt Docker (nếu dùng container)
- [ ] Cấu hình database folder
- [ ] Chuẩn bị thiết bị IoT:
  - [ ] Sensors (nhiệt, ẩm, đất)
  - [ ] Bơm nước (actuator)
  - [ ] Camera (optional)
- [ ] Chuẩn bị Telegram bot cho alerts

### 1.3 Thông tin cần chuẩn bị

- Tọa độ farm (lat/long)
- Diện tích farm
- Số lượng khu vực (areas)
- Loại cây trồng dự kiến
- Danh sách worker
- Thiết bị IoT sẵn có

---

## 2. CÀI ĐẶT HỆ THỐNG

### 2.1 Cài đặt nhanh (Quick Install)

```bash
# 1. Clone
git clone https://github.com/ecosyntech68vn/Ecosyntech-web.git
cd Ecosyntech-web

# 2. Cài đặt
npm install

# 3. Cấu hình
cp .env.example .env
nano .env  # Chỉnh sửa các biến cần thiết

# 4. Chạy migrations
node run-migrations.js

# 5. Khởi động
npm start
```

### 2.2 Cài đặt với Docker

```bash
# Build và chạy
docker build -t ecosyntech .
docker-compose up -d

# Xem logs
docker logs -f ecosyntech
```

### 2.3 Kiểm tra cài đặt

```bash
# Health check
curl http://localhost:3000/api/health

# Test đăng nhập mặc định
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecosyntech.com","password":"admin123"}'
```

---

## 3. THIẾT LẬP FARM ĐẦU TIÊN

### 3.1 Tạo Organization

```bash
# API: POST /api/organizations
{
  "name": "Nông trại của bạn",
  "email": "farm@example.com",
  "phone": "0123456789",
  "address": "Địa chỉ đầy đủ"
}
```

### 3.2 Tạo Farm

```bash
# API: POST /api/farms
{
  "org_id": "org-xxx",
  "name": "Nông trại ABC",
  "location": "Xã ABC, Huyện XYZ, Tỉnh",
  "area_size": 10,
  "area_unit": "hectare"
}
```

### 3.3 Tạo Areas (Khu vực)

```bash
# API: POST /api/farms/:id/areas
# Tạo các khu vực A1, A2, B1...
{
  "name": "Khu A1",
  "crop_type": "rau_muong"
}
```

### 3.4 Thêm Workers

```bash
# API: POST /api/workers
{
  "name": "Nguyễn Văn A",
  "role": "nhan_vien",
  "phone": "0912345678"
}
```

---

## 4. KẾT NỐI THIẾT BỊ IOT

### 4.1 Đăng ký thiết bị

```bash
# API: POST /api/devices
{
  "name": "Sensor A1-1",
  "type": "sensor", 
  "farm_id": "farm-xxx",
  "area_id": "area-xxx",
  "location": "Góc Đông Bắc"
}
```

### 4.2 Cấu hình MQTT

Cấu hình thiết bị gửi dữ liệu về:

```
Broker: wss://broker.hivemq.com:8884/mqtt
Topic: ecosyntech/{device_id}/telemetry
```

### 4.3 Thiết lập Rules

```bash
# API: POST /api/rules
{
  "name": "Tưới khi đất khô",
  "condition": {"type": "sensor", "sensor_type": "soil", "operator": "lt", "value": 30},
  "action": {"type": "device", "device_id": "pump-001", "action": "on"},
  "cooldown_minutes": 60
}
```

---

## 5. VẬN HÀNH HÀNG NGÀY

### 5.1 Dashboard hàng ngày

1. **Kiểm tra Dashboard** - Xem overview tổng quan
2. **Xem Alerts** - Check cảnh báo cần xử lý
3. **Xem AI Recommendations** - Duyệt/Ignore suggestions
4. **Review Tasks** - Cập nhật tiến độ

### 5.2 Ghi nhật hoạt động

```bash
# Quick log
curl -X POST http://localhost:3000/api/logs \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "area_id": "area-xxx",
    "type": "tuoi_nuoc",
    "description": "Tưới 500L",
    "value": 500
  }'
```

### 5.3 Thu hoạch và tạo Batch

```bash
# API: POST /api/traceability/tb/batches
{
  "farm_id": "farm-xxx",
  "area_id": "area-xxx",
  "product_name": "Rau muống",
  "harvest_date": "2026-04-19",
  "produced_quantity": 500
}
```

---

## 6. XỬ LÝ SỰ CỐ

### 6.1 Thiết bị không kết nối

1. Kiểm tra nguồn điện
2. Kiểm tra wifi/signal
3. Kiểm tra MQTT broker
4. Restart thiết bị

### 6.2 Server không phản hồi

```bash
# Check process
ps aux | grep node

# Check logs
tail -f logs/app.log

# Restart
pm2 restart ecosyntech
```

### 6.3 Database lỗi

```bash
# Backup
cp data/ecosyntech.db data/ecosyntech_backup.db

# Restore từ backup
cp backup/ecosyntech_*.db data/ecosyntech.db

# Re-run migrations nếu cần
node run-migrations.js
```

### 6.4 Thực hiện Rollback

```bash
# Git rollback
git checkout v4.x.x

# Restart
pm2 restart ecosyntech
```

---

## 7. CHECKLIST HÀNG NGÀY

### Buổi sáng (5-10 phút)

- [ ] Check Dashboard overview
- [ ] Xem Alerts chưa đọc
- [ ] Review AI recommendations
- [ ] Check weather forecast

### Trong ngày (Khi cần)

- [ ] Ghi log hoạt động
- [ ] Cập nhật task
- [ ] Xử lý alerts

### Buổi chiều/tối (5 phút)

- [ ] Review ngày làm việc
- [ ] Check tomorrow's tasks
- [ ] Backup database (nếu cần)

---

## CONTACTS HỖ TRỢ

| Role | Contact | SĐT | Email |
|------|---------|-----|-------|
| Tech Support | | 0989516698 | kd.ecosyntech@gmail.com |
| Emergency | | | |

---

**Lưu ý quan trọng:**
1. LUÔN backup trước khi upgrade
2. Ghi log mọi thay đổi quan trọng
3. Test changes trên staging trước
4. Notify users trước khi maintenance

---

**Version: 5.0.0 | Updated: 2026-04-19**