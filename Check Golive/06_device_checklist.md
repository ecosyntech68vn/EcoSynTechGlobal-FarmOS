# CHECK GOLIVE - SECTION 6: FIRMWARE / THIẾT BỊ

## Mục tiêu
Test tích hợp ESP32 - Webhook endpoints với envelope HMAC security.

## Trước khi test - Tạo envelope
```bash
# Function để tạo HMAC signature
sign_envelope() {
  local payload="$1"
  local secret="${HMAC_SECRET:-your-secret}"
  echo -n "$payload" | openssl dgst -sha256 -hmac "$secret" | awk '{print $2}'
}

# Payload mẫu
PAYLOAD='{"_did":"ESP-TEST","_ts":'$(date +%s)',"_nonce":"test-nonce-123","readings":[{"sensor_type":"temperature","value":25.5,"unit":"C"}]}'

# Tạo signature
SIGNATURE=$(sign_envelope "$PAYLOAD")
echo "Payload: $PAYLOAD"
echo "Signature: $SIGNATURE"
```

## Checklist

### 6.1 Test ESP32 webhook với signature đúng
```bash
# Set HMAC secret
export HMAC_SECRET="your-hmac-secret"

# Tạo envelope
TIMESTAMP=$(date +%s)
NONCE=$(openssl rand -hex 16)
PAYLOAD='{"_did":"ESP-TEST","_ts":'$TIMESTAMP',"_nonce":"'$NONCE'","readings":[{"sensor_type":"temperature","value":25.5,"unit":"C"}]}'

# Sign
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$HMAC_SECRET" | awk '{print $2}')

# Gửi request
curl -s -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":'"$PAYLOAD"',"signature":"'"$SIGNATURE"'"}' | jq .
```

**Expected**: Response chứa `{"ok":true,...}`

### 6.2 Test signature sai → 401
```bash
curl -s -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":'"$PAYLOAD"',"signature":"wrong-signature"}'
```

**Expected**: `{"error":"Invalid signature"}` với HTTP 401

### 6.3 Test thiếu signature → 401
```bash
curl -s -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":'"$PAYLOAD"'}'
```

**Expected**: HTTP 400 hoặc 401

### 6.4 Test timestamp hết hạn (>20 phút)
```bash
OLD_TIMESTAMP=$(($(date +%s) - 1300))
OLD_PAYLOAD='{"_did":"ESP-TEST","_ts":'$OLD_TIMESTAMP',"_nonce":"old-nonce","readings":[]}'
OLD_SIG=$(echo -n "$OLD_PAYLOAD" | openssl dgst -sha256 -hmac "$HMAC_SECRET" | awk '{print $2}')

curl -s -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":'"$OLD_PAYLOAD"',"signature":"'"$OLD_SIG"'"}'
```

**Expected**: `{"error":"Timestamp expired"}` với HTTP 401

### 6.5 Test nonce replay (dùng lại nonce)
```bash
# Dùng lại nonce đã sử dụng ở test 6.1
curl -s -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":'"$PAYLOAD"',"signature":"'"$SIGNATURE"'"}'
```

**Expected**: `{"error":"Nonce replay detected"}` với HTTP 401

### 6.6 Test GET command cho device
```bash
curl -s "http://localhost:3000/api/webhook/command/ESP-TEST?api_key=test-api-key" | jq .
```

### 6.7 Test command result
```bash
# Tạo command trước (cần login vào admin)
# Sau đó ESP32 báo kết quả:
CMD_PAYLOAD='{"command_id":"test-cmd-123","status":"completed","note":"OK"}'
CMD_SIG=$(echo -n "$CMD_PAYLOAD" | openssl dgst -sha256 -hmac "$HMAC_SECRET" | awk '{print $2}')

curl -s -X POST http://localhost:3000/api/webhook/command-result \
  -H "Content-Type: application/json" \
  -d '{"payload":'"$CMD_PAYLOAD"',"signature":"'"$CMD_SIG"'"}' | jq .
```

### 6.8-6.10 Test config response
```bash
# Yêu cầu config
CONFIG_PAYLOAD='{"_did":"ESP-TEST","_ts":'$(date +%s)',"_nonce":"'$(openssl rand -hex 16)'","get_config":true}'
CONFIG_SIG=$(echo -n "$CONFIG_PAYLOAD" | openssl dgst -sha256 -hmac "$HMAC_SECRET" | awk '{print $2}')

curl -s -X POST http://localhost:3000/api/webhook/esp32 \
  -H "Content-Type: application/json" \
  -d '{"payload":'"$CONFIG_PAYLOAD'", "signature":"'"$CONFIG_SIG"'"}' | jq '.config'

# Expected: 
# {
#   "post_interval_sec": 600,
#   "sensor_interval_sec": 600,
#   "deep_sleep_enabled": true,
#   "config_version": 6
# }
```

## Sign-off
- [ ] ESP32 webhook với signature đúng → 200 OK
- [ ] Signature sai → 401
- [ ] Timestamp hết hạn → 401
- [ ] Nonce replay → 401
- [ ] Config response đúng 600/600
- [ ] Batch/Rules response hoạt động

**Ngày**: _______________
**Người check**: _______________
**Kết quả**: ✅ PASS | ❌ FAIL
