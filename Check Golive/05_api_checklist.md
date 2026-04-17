# CHECK GOLIVE - SECTION 4: API VÀ NGHIỆP VỤ

## Mục tiêu
Test toàn bộ API endpoints hoạt động đúng.

## Trước khi test - Lấy token
```bash
# Login để lấy token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"
```

## Checklist

### 4.1 Test Auth Register
```bash
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"test123456","name":"Test User"}'
# Expected: {"success":true,...}
```

### 4.2 Test Auth Login
```bash
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
# Expected: {"token":"...","user":{...}}
```

### 4.3 GET Sensors
```bash
curl -s http://localhost:3000/api/sensors \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"sensors":[...]}
```

### 4.4-4.7 Devices CRUD
```bash
# POST - Create device
DEVICE=$(curl -s -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Device","type":"sensor","zone":"zone1"}')
echo "$DEVICE"
DEVICE_ID=$(echo "$DEVICE" | jq -r '.id')
echo "Device ID: $DEVICE_ID"

# GET - List devices
curl -s http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN"

# PUT - Update device
curl -s -X PUT "http://localhost:3000/api/devices/$DEVICE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Updated Device"}'

# DELETE - Delete device
curl -s -X DELETE "http://localhost:3000/api/devices/$DEVICE_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### 4.8-4.9 Rules
```bash
# POST Rule
curl -s -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Rule","condition":{"sensor":"temperature","operator":">","value":30},"action":{"type":"alert"}}'

# GET Rules
curl -s http://localhost:3000/api/rules \
  -H "Authorization: Bearer $TOKEN"
```

### 4.10 Schedule
```bash
curl -s -X POST http://localhost:3000/api/schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Schedule","time":"06:00","duration":30,"zones":["zone1"]}'
```

### 4.11-4.13 History, Alerts, Stats
```bash
curl -s http://localhost:3000/api/history -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3000/api/alerts -H "Authorization: Bearer $TOKEN"
curl -s http://localhost:3000/api/stats -H "Authorization: Bearer $TOKEN"
```

### 4.14-4.15 Import/Export
```bash
curl -s -X POST http://localhost:3000/api/export -H "Authorization: Bearer $TOKEN"
curl -s -X POST http://localhost:3000/api/import \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

### 4.16-4.17 Health/Version
```bash
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/api/version
```

### 4.18-4.19 Test validation
```bash
# Missing required field
curl -s -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
# Expected: 400 Bad Request

# Invalid email
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid","password":"test"}'
# Expected: 400 Bad Request
```

## Sign-off
- [ ] Tất cả endpoints POST/GET/PUT/DELETE hoạt động
- [ ] Validation trả về 400 khi input sai
- [ ] Auth required cho các endpoints cần token

**Ngày**: _______________
**Người check**: _______________
**Kết quả**: ✅ PASS | ❌ FAIL
