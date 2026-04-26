# Customer Deployment Guide

This guide describes how to deploy EcoSynTech FarmOS in a customer environment, including Docker-based deployment, AI/ML Bootstrap steps, and Vietnam pilot configuration.

## Prerequisites

- Node.js 18+ (for local dev) or Docker for containerized deployment
- Git access to the Ecosyntech-web repository
- Basic knowledge of environment management and secret storage
- MQTT broker (public HiveMQ used by default: wss://broker.hivemq.com:8884/mqtt)

---

## 1. Quick Docker-based Deployment

### Option A: Docker Compose (recommended for customers)

1. **Prepare environment variables** in a `.env` file:
   ```
   JWT_SECRET=<long-random-secret>
   WEBHOOK_SECRET=<long-random-secret>
   MQTT_BROKER_URL=wss://broker.hivemq.com:8884/mqtt
   DB_PATH=/data/ecosyntech.db
   AI_SMALL_MODEL=1
   AI_LARGE_MODEL=0
   FARM_LAT=10.7769
   FARM_LON=106.7009
   ```

2. **Start the service:**
   ```bash
   docker-compose up -d
   ```

3. **Verify Health:**
   ```bash
   curl http://localhost:3000/api/health
   ```

4. **Verify Bootstrap Status:**
   ```bash
   curl -H "Authorization: Bearer <token>" http://localhost:3000/api/bootstrap/status
   ```

### Option B: Native Node.js Deployment

1. Install Node.js 18+ and npm
2. Install dependencies: `npm ci`
3. Create a local `.env` with required keys
4. Run: `npm start`
5. Verify health as above

---

## 2. AI/ML Bootstrap Setup

After deployment, configure the AI/ML model system.

### Default Setup (Small Model Only)

The plant disease detector (TFLite, ~4MB) is enabled by default:
```bash
npm run bootstrap-ai status
```

### Enable Large Model (Optional)

To enable the irrigation LSTM predictor (ONNX, ~2GB):

1. **Set the download URL** (Google Drive or direct HTTP):
   ```
   AI_LARGE_MODEL=1
   AI_ONNX_URL=https://drive.google.com/file/d/XXXX/view
   ```

2. **Apply via CLI:**
   ```bash
   npm run bootstrap-ai apply --large 1 --url "https://drive.google.com/file/d/XXXX/view"
   ```

3. **Or via API:**
   ```bash
   curl -X POST -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"large":true,"largeUrl":"https://..."}' \
     http://localhost:3000/api/bootstrap/configure
   ```

### Bootstrap Admin UI

Access the admin dashboard at: `http://localhost:3000/bootstrap`

Features: status dashboard, model configuration, history timeline, reload button.

---

## 3. Vietnam Pilot Configuration (100 ESP32 Devices)

### Environment Variables

```bash
# Vietnam Ho Chi Minh City coordinates
FARM_LAT=10.7769
FARM_LON=106.7009
TZ=Asia/Ho_Chi_Minh

# MQTT (public HiveMQ broker)
MQTT_BROKER_URL=wss://broker.hivemq.com:8884/mqtt

# AI Bootstrap (default: small model ON)
AI_SMALL_MODEL=1
AI_LARGE_MODEL=0

# Device provisioning
MAX_DEVICES=100
DEVICE_HEARTBEAT_INTERVAL=60
```

### ESP32 Device Configuration

Each ESP32 device should be configured with:

```cpp
// ESP32 MQTT Configuration
#define MQTT_SERVER "broker.hivemq.com"
#define MQTT_PORT 8884
#define MQTT_TOPIC "ecosyntech/sensors/soil"
#define MQTT_CLIENT_ID "ESP32-FARM-XXX"

// Sensor types and topics
const char* SENSOR_TOPICS[] = {
  "ecosyntech/sensors/soil",
  "ecosyntech/sensors/temperature",
  "ecosyntech/sensors/humidity",
  "ecosyntech/sensors/water"
};

// Payload format: {"value": <number>}
void sendSensorReading(const char* topic, float value) {
  StaticJsonDocument<64> doc;
  doc["value"] = value;
  char buffer[64];
  serializeJson(doc, buffer);
  client.publish(topic, buffer);
}
```

### Device Registration

1. **Register devices via API:**
   ```bash
   curl -X POST -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"name":"ESP32-FARM-001","type":"ESP32","zone":"A1"}' \
     http://localhost:3000/api/devices
   ```

2. **Device sends heartbeat:**
   ```bash
   curl -X POST http://localhost:3000/api/devices/DEV-XXXXXXXX/heartbeat
   ```

3. **Device sends sensor data via MQTT** to `ecosyntech/sensors/<type>` with payload `{"value": <number>}`

---

## 4. Verification and Tests

```bash
# Run test suite
npm test

# Verify AI predictions
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/ai/predict/irrigation?farm_id=default

# Verify governance report
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/ai/governance/report

# Verify audit trail
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/ai/governance/audit
```

---

## 5. Security Checklist

- [ ] JWT_SECRET rotated from default
- [ ] WEBHOOK_SECRET rotated from default
- [ ] MQTT credentials configured (if using private broker)
- [ ] AI model checksums verified after download
- [ ] Bootstrap UI access restricted to admin users
- [ ] Device API access controlled via RBAC

---

## 6. Troubleshooting

| Issue | Solution |
|-------|----------|
| Docker fails to start | Check logs: `docker-compose logs` |
| Model fails to load | Run `npm run bootstrap-ai health`; check SHA256 checksum |
| Device not sending data | Verify MQTT broker connectivity; check device logs |
| Prediction returns null | Check `dataQuality.score` - may be below 40 (blocked by quality gate) |
| 401 Unauthorized | Verify JWT token is valid and not expired |

---

## 7. Support

- **Vietnam Pilot Issues**: Contact AI Ops Lead
- **ISO 27001 Governance**: See ISMS_POLICY.md and AUDIT_CHECKLIST.md
- **AI/ML Bootstrap**: See docs/bootstrap-runbook.md