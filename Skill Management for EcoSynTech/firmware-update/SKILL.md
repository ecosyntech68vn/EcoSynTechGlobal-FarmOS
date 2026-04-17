---
name: firmware-update
description: "Push firmware updates to ESP32 devices"
user-invocable: true
agent: explore
---

# Firmware Update Skill for EcoSynTech

Push firmware to ESP32 devices over-the-air (OTA).

## 1. Build Firmware

```bash
# Build for ESP32
platformio run -e esp32dev

# Output: .pio/build/esp32dev/firmware.bin
```

## 2. Upload to Server

```bash
# Upload to firmware server
curl -X POST localhost:3000/api/v1/firmware/upload \
  -F "file=@firmware.bin" \
  -d "version=2.3.3"
```

## 3. Push to Devices

```bash
# Push to specific device
curl -X POST localhost:3000/api/v1/devices/ESP32_001/firmware \
  -d '{"version":"2.3.3","url":"https://..."}'

# Push to all devices
curl -X POST localhost:3000/api/v1/firmware/push-all \
  -d '{"version":"2.3.3"}'
```

## 4. Monitor Update

```bash
# Check update status
curl localhost:3000/api/v1/devices/ESP32_001/firmware/status
```

Execute:

```
## Firmware Update

### Current Version
- Server: 2.3.2
- Devices: mixed 2.3.1, 2.3.2

### Available: 2.3.3 (NEW)

### Push Update
[ ] Select devices: ( ) All ( ) Group: ____
[ ] Schedule: ( ) Now ( ) Maintenance window

### Progress
- Sent: 0/10
- Success: 0
- Failed: 0
```