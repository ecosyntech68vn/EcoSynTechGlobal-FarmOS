# SOP-B-01: KHỞI ĐỘNG HỆ THỐNG

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20 | **Chu kỳ:** N/A

---

## 1. PHẠM VI

Áp dụng cho việc khởi động EcoSynTech FarmOS sau khi tắt hoặc restart.

## 2. ĐIỀU KIỆN TIÊN QUYẾT

- [ ] Server đã bật và có network
- [ ] Database server (nếu tách biệt) hoạt động
- [ ] Port 3000 (hoặc port đ config) không bị block
- [ ] Đủ disk space (>1GB free)

## 3. QUY TRÌNH KHỞI ĐỘNG

### 3.1 Khởi động thủ công

```
Bước 1: SSH vào server
    ssh admin@<server-ip>
    ↓
Bước 2: Di chuyển thư mục dự án
    cd /root/EcoSynTechClaude-Code
    ↓
Bước 3: Kiểm tra dependencies
    npm install (nếu cần)
    ↓
Bước 4: Kiểm tra .env
    cat .env | grep -E "^(JWT_SECRET|DB_PATH)"
    # Đảm bảo đã config đầy đủ
    ↓
Bước 5: Build/Check syntax
    npm run build
    ↓
Bước 6: Khởi động server
    npm start
    # Hoặc: pm2 start ecosystem.config.js
    ↓
Bước 7: Kiểm tra health
    curl http://localhost:3000/api/health
```

### 3.2 Khởi động với PM2 (khuyến nghị)

```
Bước 1: Kiểm tra PM2 process list
    pm2 list
    ↓
Bước 2: Khởi độngecosyntech
    pm2 start ecosystem.config.js
    # hoặc: pm2 start server.js --name ecosyntech
    ↓
Bước 3: Theo dõi logs
    pm2 logs ecosyntech --lines 20
    ↓
Bước 4: Verify hoạt động
    pm2 monit
    # Kiểm tra màu xanh lá
```

### 3.3 Khởi động tự động (sau reboot)

```
Đảm bảo PM2 startup script:
    pm2 startup
    # Copy lệnh output và chạy

Tạo startup script:
    pm2 save
    # Lưu trạng thái hiện tại

Kiểm tra reboot:
    sudo reboot
    # Server sẽ tự khởi động sau login
```

## 4. KIỂM TRA SAU KHỞI ĐỘNG

### 4.1 Health Checks

| Check | Command | Expected |
|-------|---------|----------|
| API Health | `curl http://localhost:3000/api/health` | `{"status":"ok"}` |
| Version | `curl http://localhost:3000/api/version` | `{...}` |
| Database | `curl http://localhost:3000/api/health` | db connected |
| WebSocket | WS connection | connected |

### 4.2 External Checks

```
□ Truy cập http://<server-ip>:3000/api/health
□ Truy cập http://<server-ip>:3000/docs (Swagger)
□ Ping từ thiết bị ESP32
□ Nhận dữ liệu từ MQTT
```

## 5. CÁC SỰ CỐ THƯỜNG GẶP

| Lỗi | Nguyên nhân | Cách xử lý |
|------|------------|-------------|
| Port in use | Server đang chạy | `pm2 kill` hoặc `pkill node` |
| Database locked | File .db bị lock | Xóa .db-wal, .db-shm |
| JWT_SECRET missing | Chưa config .env | Copy .env.example → .env |
| Memory error | Không đủ RAM | Tăng `--max-old-space-size` |
| Module not found | npm install lỗi | `npm install` |

## 6. CÁC BƯỚC BỔ SUNG CHO PRODUCTION

### 6.1 Với Nginx Reverse Proxy

```
Bước 1: Kiểm tra Nginx
    sudo systemctl status nginx
    ↓
Bước 2: Restart Nginx nếu cần
    sudo systemctl restart nginx
    ↓
Bước 3: Verify config
    sudo nginx -t
```

### 6.2 Với Firewall

```
Kiểm tra port mở:
    sudo ufw status
    # Đảm bảo 3000, 80, 443 đang allow
```

### 6.3 SSL Certificate

```
Kiểm tra SSL:
    curl -I https://<domain>
    # Verify không có lỗi SSL
```

## 7. THỜI GIAN KHỞI ĐỘNG MỤC TIÊU

| Môi trường | Thời gian mục tiêu |
|------------|---------------------|
| Development | 30 giây |
| Staging | 1 phút |
| Production | 2 phút |

## 8. ĐIỂM KIỂM TRA

- [ ] Server response sau 2 phút
- [ ] Database connection OK
- [ ] Logs không có ERROR
- [ ] External access OK
- [ ] PM2 process running

---

**Người tạo:** EcoSynTech | **Ngày:** 2026-04-20
**Người duyệt:** | **Ngày duyệt:**