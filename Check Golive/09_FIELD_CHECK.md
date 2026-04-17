# ✅ CHECK HIỆN TRƯỜNG - ECO SYNTECH v2.3.2

## Phiên bản: ĐƠN GIẢN - CHO VIỆC CHECK TẠI SITE

---

## 🔴 TRƯỚC KHI LÊN MÁY (Ở VĂN PHÒNG)

### 1. Chuẩn bị Server
```bash
# [ ] Server đã cài Node.js 18+
node --version

# [ ] Clone code
git clone https://github.com/ecosyntech68vn/Ecosyntech-web.git
cd Ecosyntech-web
git checkout v2.3.2

# [ ] Cài dependencies
npm install

# [ ] Tạo .env production
cp .env.production .env
```

### 2. Cấu hình Secrets
```bash
# [ ] Mở .env và điền:
nano .env
```
```
HMAC_SECRET=<tạo chuỗi ngẫu nhiên 32+ ký tự>
JWT_SECRET=<tạo chuỗi ngẫu nhiên 32+ ký tự>
WEBHOOK_SECRET=<tạo chuỗi ngẫu nhiên>
CORS_ORIGIN=https://<domain-của-bạn>
NODE_ENV=production
```

### 3. Test cơ bản
```bash
# [ ] Build
npm run build

# [ ] Lint
npm run lint

# [ ] Tests
npm test
```

---

## 🟡 TẠI HIỆN TRƯỜNG - SERVER

### 4. Khởi động Server
```bash
# [ ] Tạo thư mục data
mkdir -p data

# [ ] Backup database (nếu có DB cũ)
npm run db-admin -- backup

# [ ] Start server
npm start

# [ ] Kiểm tra server chạy
curl http://localhost:3000/api/health
```

### 5. Verify Health
```bash
# [ ] Health check
curl http://localhost:3000/api/health
# Expected: {"status":"healthy","version":"2.3.2",...}

# [ ] Version check
curl http://localhost:3000/api/version
# Expected: {"api":"2.3.2",...}

# [ ] Metrics check
curl http://localhost:3000/metrics
# Expected: Prometheus metrics
```

### 6. Verify Database
```bash
# [ ] DB backup
npm run db-admin -- backup

# [ ] DB status
npm run db-admin -- status
# Expected: Hiển thị số devices, sensors, rules
```

---

## 🟡 TẠI HIỆN TRƯỜNG - BẢO MẬT

### 7. Test Auth
```bash
# [ ] Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test1234!","name":"Admin"}'

# [ ] Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Test1234!"}'
# Expected: Có token trả về
```

### 8. Test API Protection
```bash
# [ ] Gọi API không có token → phải lỗi
curl http://localhost:3000/api/devices
# Expected: 401 Unauthorized

# [ ] Gọi API có token → thành công
TOKEN="<token-đã-login>"
curl http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN"
# Expected: 200 OK
```

### 9. Test Webhook Security
```bash
# [ ] Webhook không có signature → lỗi
curl -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":{},"signature":""}'
# Expected: 401

# [ ] Webhook signature sai → lỗi
curl -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":{},"signature":"wrong"}'
# Expected: 401
```

---

## 🟡 TẠI HIỆN TRƯỜNG - THIẾT BỊ

### 10. Test ESP32 Webhook (Có thể dùng Postman/cURL)
```bash
# Tạo payload mẫu
TIMESTAMP=$(date +%s)
NONCE=$(openssl rand -hex 16)
PAYLOAD='{"_did":"ESP-TEST","_ts":'$TIMESTAMP',"_nonce":"'$NONCE'","readings":[{"sensor_type":"temperature","value":25.5,"unit":"C"}]}'

# Sign với HMAC_SECRET đã đặt
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$HMAC_SECRET" | awk '{print $2}')

# [ ] Gửi webhook
curl -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":'"$PAYLOAD"',"signature":"'"$SIGNATURE"'"}'
# Expected: {"ok":true,...}
```

### 11. Test Config Response
```bash
# [ ] Request config
CONFIG_PAYLOAD='{"_did":"ESP-TEST","_ts":'$TIMESTAMP',"_nonce":"'$(openssl rand -hex 16)'","get_config":true}'
CONFIG_SIG=$(echo -n "$CONFIG_PAYLOAD" | openssl dgst -sha256 -hmac "$HMAC_SECRET" | awk '{print $2}')

curl -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":'"$CONFIG_PAYLOAD'", "signature":"'"$CONFIG_SIG"'"}' | jq .config
# Expected: post_interval_sec: 600, sensor_interval_sec: 600
```

---

## 🟡 TẠI HIỆN TRƯỜNG - WEBSOCKET

### 12. Test WebSocket
```bash
# Cài wscat
npm install -g wscat

# [ ] Kết nối WebSocket
wscat -c ws://localhost:3000/ws
# Expected: Connected

# [ ] Gửi ping, nhận pong
> ping
```

---

## 🟢 HOÀN THÀNH

### 13. Checklist Cuối
```bash
# [ ] Server chạy ổn định > 5 phút
# [ ] Không có lỗi trong logs
tail -f logs/*.log

# [ ] Backup database thành công
ls -la data/backups/

# [ ] Docker compose up (nếu dùng Docker)
docker-compose up -d
docker-compose ps
```

---

## 📋 TỔNG KẾT NHANH - CHECK HIỆN TRƯỜNG

| # | Mục | Status |
|---|------|--------|
| 1 | Server khởi động | ⬜ |
| 2 | Health endpoint OK | ⬜ |
| 3 | Version 2.3.2 | ⬜ |
| 4 | Database backup OK | ⬜ |
| 5 | Auth đăng ký OK | ⬜ |
| 6 | Auth login OK | ⬜ |
| 7 | API không auth → lỗi | ⬜ |
| 8 | API có auth → OK | ⬜ |
| 9 | Webhook signature OK | ⬜ |
| 10 | Config 600/600 | ⬜ |
| 11 | WebSocket kết nối | ⬜ |
| 12 | Logs không lỗi | ⬜ |

---

## ❌ NẾU CÓ LỖI

### Lỗi: "HMAC_SECRET is required"
```bash
# Kiểm tra .env
cat .env | grep HMAC_SECRET
# Đảm bảo đã điền giá trị
```

### Lỗi: "Database initialization failed"
```bash
# Kiểm tra quyền thư mục
chmod 755 data/
mkdir -p data
```

### Lỗi: "Port already in use"
```bash
# Kill process
pkill -f "node server.js"
# Hoặc đổi port trong .env
```

---

**Ngày check**: _______________
**Địa điểm**: _______________
**Người check**: _______________
**Kết quả**: ✅ PASS | ❌ FAIL

---

## Ghi chú thêm:
________________________________________________________________
________________________________________________________________
________________________________________________________________
