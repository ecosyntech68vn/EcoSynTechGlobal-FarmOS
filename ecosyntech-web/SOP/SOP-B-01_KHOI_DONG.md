# SOP-B-01: KHỞI ĐỘNG VÀ TẮT HỆ THỐNG
# System Startup and Shutdown Procedure
# Phiên bản: 5.0.0 | Ngày: 2026-04-20

---

## 1. MỤC ĐÍCH

Quy trình khởi động và tắt hệ thống EcoSynTech FarmOS một cách an toàn và nhất quán.

## 2. KHỞI ĐỘNG HỆ THỐNG

### 2.1 Khởi động thủ công (Windows)

```batch
REM 1-CAI-DAT.bat
npm install
node server.js
```

### 2.2 Khởi động thủ công (Linux/Mac)

```bash
./setup-run.sh
# hoặc
npm start
```

### 2.3 Kiểm tra sau khởi động

| Check | Endpoint | Expected |
|-------|----------|----------|
| Server running | http://localhost:3000 | 200 OK |
| Database | /api/health | DB connected |
| WebSocket | WS connection | Connected |
| Sensors | /api/sensors | Data returned |

### 2.4 Automatic Startup (Production)

```bash
# Systemd service
sudo cp ecosyntech.service /etc/systemd/system/
sudo systemctl enable ecosyntech
sudo systemctl start ecosyntech
```

## 3. TẮT HỆ THỐNG AN TOÀN

### 3.1 Graceful Shutdown

```bash
# Gửi SIGTERM để graceful shutdown
kill PID

# Hoặc qua API
POST /api/shutdown
```

### 3.2 Quy trình tắt

```
┌─────────────────────────────────────────────────────────────┐
│  GRACEFUL SHUTDOWN SEQUENCE                                 │
├─────────────────────────────────────────────────────────────┤
│  1. Stop accepting new connections                         │
│  2. Wait for active requests to complete (max 30s)       │
│  3. Save database to disk                                 │
│  4. Close database connections                           │
│  5. Stop WebSocket server                                 │
│  6. Log shutdown event                                    │
│  7. Exit process                                         │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Emergency Shutdown (Chỉ khi cần thiết)

```bash
# Force kill (KHÔNG khuyến khích)
kill -9 PID
```

**Cảnh báo:** Emergency shutdown có thể gây mất dữ liệu chưa lưu!

## 4. LOGS SAU KHỞI ĐỘNG

| Log File | Location |
|----------|----------|
| Application | stdout/stderr |
| Error logs | logs/error.log |
| Combined | logs/combined.log |

## 5. TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| Port 3000 in use | Kill process hoặc đổi PORT |
| Database lock | Xóa .db-wal, restart |
| Memory error | Restart server |

---

*Version: 5.0.0 | Date: 2026-04-20*