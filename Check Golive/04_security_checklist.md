# CHECK GOLIVE - SECTION 3: BẢO MẬT

## Mục tiêu
Đảm bảo tất cả secrets được cấu hình đúng và các tấn công cơ bản bị chặn.

## Checklist

### 3.1-3.3 Kiểm tra secrets trong .env
```bash
# Xem các secrets (không hiển thị giá trị thật)
grep -E "HMAC_SECRET|JWT_SECRET|WEBHOOK_SECRET" .env

# Expected: 
# HMAC_SECRET=<giá trị dài, không phải mặc định>
# JWT_SECRET=<giá trị dài, không phải 'dev-secret-change-me'>
# WEBHOOK_SECRET=<giá trị>
```

### 3.4 Kiểm tra CORS
```bash
# Xem CORS config
grep CORS_ORIGIN .env

# Expected: CORS_ORIGIN=https://<domain-thật-của-bạn>
# NOT: CORS_ORIGIN=*
```

### 3.5 Không có secret trong code
```bash
# Tìm các hardcoded secrets
grep -r "dev-secret-change-me\|your-super-secret\|CEOTAQUANG" src/ --include="*.js"

# Expected: Không có kết quả
```

### 3.6 Test API không có token → 401
```bash
curl -s -w "\nHTTP_CODE: %{http_code}\n" http://localhost:3000/api/devices

# Expected: HTTP_CODE: 401
```

### 3.7 Test webhook signature sai → 401
```bash
curl -s -w "\nHTTP_CODE: %{http_code}\n" -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":{"_did":"TEST"},"signature":"invalid-signature"}'

# Expected: HTTP_CODE: 401
```

### 3.8 Test rate limit
```bash
# Gửi 101 requests trong 1 phút
for i in {1..101}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/devices 2>/dev/null
done | tail -5

# Expected: Các requests cuối trả về 429 Too Many Requests
```

### 3.9 Kiểm tra Helmet headers
```bash
curl -sI http://localhost:3000/api/health | grep -i "content-security\|strict-transport\|x-frame"

# Expected: Có các security headers
```

## Sign-off
- [ ] HMAC_SECRET đã đặt (không mặc định)
- [ ] JWT_SECRET đã đặt (không mặc định)
- [ ] WEBHOOK_SECRET đã đặt
- [ ] CORS_ORIGIN restrict đúng domain
- [ ] Không có secret trong code
- [ ] API không auth → 401
- [ ] Webhook signature sai → 401
- [ ] Rate limit hoạt động
- [ ] Security headers enable

**Ngày**: _______________
**Người check**: _______________
**Kết quả**: ✅ PASS | ❌ FAIL
