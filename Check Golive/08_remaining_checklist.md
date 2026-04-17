# CHECK GOLIVE - SECTION 7-11: TÀI KHOẢN, LOGGING, HIỆU NĂNG, DEPLOY, TÀI LIỆU

---

## SECTION 7: TÀI KHOẢN VÀ PHÂN QUYỀN

### 7.1 Test đăng ký email trùng
```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"existing@test.com","password":"test123456","name":"User"}'
# Lần 2 → Expected: Error email exists
```

### 7.2 Test password ngắn
```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@test.com","password":"123","name":"User"}'
# Expected: 400 Bad Request
```

### 7.3 Test login sai password
```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}'
# Expected: 401 Unauthorized
```

### 7.4 Test token hết hạn
```bash
# Tạo token với expiry ngắn (test)
# Sau đó đợi hoặc dùng token đã hết hạn
curl -s http://localhost:3000/api/devices \
  -H "Authorization: Bearer expired-token"
# Expected: 401 Token expired
```

### 7.5 Test refresh token
```bash
# Login để lấy refresh token
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}')

REFRESH_TOKEN=$(echo $RESPONSE | jq -r '.refreshToken')

# Dùng refresh token để lấy token mới
curl -s -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"'"$REFRESH_TOKEN"'"}'
```

### 7.6-7.8 Test RBAC
```bash
# Admin login
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"adminpass"}' | jq -r '.token')

# User login
USER_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"userpass"}' | jq -r '.token')

# Admin có quyền tạo user
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"test123456","name":"New"}'

# User không có quyền admin (tùy implement)
# Expected: 403 Forbidden cho một số actions
```

---

## SECTION 8: LOGGING VÀ GIÁM SÁT

### 8.1 Kiểm tra format log
```bash
cat logs/*.log | head -20
# Expected: Có timestamp, level, message
```

### 8.2 Không log secret
```bash
grep -i "password\|secret\|token" logs/*.log | grep -v "masked\|***"
# Expected: Không có secret thật được log
```

### 8.3 Kiểm tra error logs
```bash
grep -i "error" logs/*.log | tail -10
# Expected: Không có errors không xử lý
```

### 8.4-8.6 Metrics & Health
```bash
curl -s http://localhost:3000/metrics | head -20
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/api/healthz
# Expected: Tất cả trả về 200
```

---

## SECTION 9: HIỆU NĂNG

### 9.1 Test response time
```bash
time curl -s http://localhost:3000/api/health > /dev/null
time curl -s http://localhost:3000/api/sensors -H "Authorization: Bearer $TOKEN" > /dev/null
# Expected: < 200ms
```

### 9.2 Test concurrent requests
```bash
for i in {1..50}; do
  curl -s http://localhost:3000/api/health > /dev/null &
done
wait
echo "50 concurrent requests done"
```

### 9.3 Test memory
```bash
# Docker
docker stats --no-stream | grep ecosyntech

# Hoặc process
ps aux | grep "node server.js" | awk '{print $6/1024" MB"}'
```

---

## SECTION 10: BUILD / DEPLOY

### 10.1-10.3 Tests, Lint, Build
```bash
npm test
npm run lint
npm run build
```

### 10.4-10.6 Docker
```bash
docker build -t ecosyntech:v2.3.2 .
docker-compose up -d
docker-compose ps
docker-compose logs api | tail -20
```

---

## SECTION 11: TÀI LIỆU

### 11.1-11.5 Kiểm tra docs
```bash
ls -la README.md docs/ .env.production

cat README.md | head -50
cat docs/*.md | head -20
```

---

## Sign-off Sections 7-11

| Section | Status | Ghi chú |
|---------|--------|---------|
| 7. Tài khoản | 🔴 | |
| 8. Logging | 🔴 | |
| 9. Hiệu năng | 🔴 | |
| 10. Deploy | 🔴 | |
| 11. Tài liệu | 🔴 | |

**Ngày**: _______________
**Người check**: _______________
**Kết quả**: ✅ PASS | ❌ FAIL
