# Vietnam Pilot Deployment Checklist

## 1. ENV SETUP
```bash
# Copy pilot env
cp .env.pilot .env

# Verify JWT_SECRET is set (not default)
grep "JWT_SECRET" .env | head -1
# Should show: JWT_SECRET=c982d5c7...
```

## 2. START SERVER
```bash
# Option A: Docker
docker-compose up -d

# Option B: Native Node.js
npm start
```

## 3. VERIFY HEALTH
```bash
curl http://localhost:3000/api/health
# Response: {"ok":true,"status":"healthy",...}
```

## 4. VERIFY AI BOOTSTRAP (need admin token)
```bash
# Login to get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecosyntech.vn","password":"admin123"}' | jq -r '.token')

# Check bootstrap
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/bootstrap/status
```

## 5. REGISTER ESP32 DEVICE
```bash
# Register first device
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"ESP32-FARM-001","type":"ESP32","zone":"A1"}'
# Returns: {"success":true,"device":{"id":"DEV-XXXXXXXX",...}}
```

## 6. TEST AI PREDICTIONS
```bash
# Irrigation prediction
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/ai/predict/irrigation?farm_id=default

# Disease detection
curl -H "Authorization: Bearer $TOKEN" \
  -X POST http://localhost:3000/api/ai/detect-disease \
  -H "Content-Type: application/json" \
  -d '{"temperature":28,"humidity":70}'
```

## 7. TEST MQTT (from ESP32)
```bash
# ESP32 publishes to broker.hivemq.com:8884
# Topic: ecosyntech/sensors/soil
# Payload: {"value":45}
```

## 8. VERIFY GOVERNANCE
```bash
# Check audit trail
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/ai/governance/audit
```

---

## QUICK START COMMANDS

```bash
# 1. Setup
cp .env.pilot .env

# 2. Start
npm start &

# 3. Test
curl http://localhost:3000/api/health

# 4. Login (seeded admin)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecosyntech.vn","password":"admin123"}' | jq -r '.token')

# 5. Bootstrap status
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/bootstrap/status

# 6. Register device
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"ESP32-001","type":"ESP32","zone":"A1"}'
```

---

## DEFAULT CREDENTIALS (SEEDED)

| Email | Password | Role |
|-------|----------|------|
| admin@ecosyntech.vn | admin123 | admin |
| user@ecosyntech.vn | user123 | user |

**⚠️ CHANGE PASSWORDS IN PRODUCTION!**