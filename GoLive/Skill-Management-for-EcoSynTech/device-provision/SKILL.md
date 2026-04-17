---
name: device-provision
description: "Auto-provision new ESP32 devices for EcoSynTech"
user-invocable: true
agent: explore
---

# Device Provision Skill for EcoSynTech-web

Auto-provision and manage new IoT devices.

## 1. Device Registration

### Manual Registration
```bash
# Register new device
curl -X POST localhost:3000/api/v1/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32_001",
    "type": "ESP32_WROOM",
    "firmware": "v2.3.2",
    "location": "Garden"
  }'
```

### Auto-Discovery
```bash
# Check for new devices (MQTT)
mosquitto_sub -t 'ecosyntech/device/+/register' -v
```

## 2. Device Provisioning Workflow

### Step 1: Validate Device
- Verify device ID format
- Check for duplicates
- Validate firmware version

### Step 2: Configure
- Assign MQTT topic
- Set device group
- Configure thresholds

### Step 3: Activate
- Enable MQTT for device
- Add to monitoring
- Send welcome payload

### Step 4: Notify
- Confirm via API
- Log registration
- Alert if needed

## 3. Batch Provisioning

```bash
# CSV-based bulk registration
device_id,type,location,firmware
ESP32_001,ESP32_WROOM,Garden,v2.3.2
ESP32_002,ESP32_WROOM,Greenhouse,v2.3.2

# Process
curl -X POST localhost:3000/api/v1/devices/bulk \
  -d @devices.csv
```

## 4. Device Lifecycle

| Stage | Actions | Status |
|-------|---------|--------|
| New | Validate, Configure | PENDING |
| Provisioning | Flash firmware | IN_PROGRESS |
| Active | Monitor | ACTIVE |
| Maintenance | Update | MAINTENANCE |
| Decommission | Archive | INACTIVE |

## 5. Device Templates

```json
{
  "templates": {
    "ESP32_WROOM": {
      "firmware": "v2.3.2",
      "intervals": {
        " telemetry": 60000,
        "heartbeat": 300000
      },
      "sensors": ["DHT22", "DS18B20", "Soil"]
    },
    "ESP32_CAM": {
      "firmware": "v1.0.0",
      "intervals": {
        "snapshot": 300000
      },
      "features": ["motion"]
    }
  }
}
```

## 6. Decommission

```bash
# Disable device
curl -X DELETE localhost:3000/api/v1/devices/ESP32_001

# Archive data
./scripts/archive_device.sh ESP32_001

# Notify
curl -X POST .../notify -d '{"device":"ESP32_001","action":"decommissioned"}'
```

Execute:

```
## Device Provisioning

### Pending Devices
| Device ID | Type | Requested |
|-----------|------|-----------|
| ESP32_010 | ESP32_WROOM | 2026-04-17 |

### Provision New Device
[ ] Enter Device ID: __________
[ ] Select Type: ( ) ESP32 ( ) ESP32-CAM
[ ] Enter Location: __________
[ ] Confirm Provisioning

### Device Groups
| Group | Devices | Last Activity |
|-------|---------|--------------|
| Garden | 3 | 5 min |
| Greenhouse | 4 | 2 min |
| Roof | 1 | 10 min |
```