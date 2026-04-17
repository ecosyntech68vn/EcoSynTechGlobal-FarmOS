---
name: fix-common
description: "Auto-fix common issues in EcoSynTech"
user-invocable: true
agent: explore
---

# Fix Common Issues Skill for EcoSynTech-web

Automatically diagnose and fix common problems.

## 1. High CPU Usage
**Symptoms:** CPU > 80%
**Fix:**
```bash
# Find culprit process
ps aux --sort=-%cpu | head -10

# Check PM2 processes
pm2 list

# Restart if needed
pm2 restart ecosyntech
```

## 2. Memory Leak
**Symptoms:** Memory growing, > 90%
**Fix:**
```bash
# Check V8 heap
node --inspect -e "console.log(process.memoryUsage())"

# Restart service
pm2 restart ecosyntech
```

## 3. Database Locked
**Symptoms:** "SQLITE_BUSY: database is locked"
**Fix:**
```bash
# Check connections
lsof data/ecosyntech.db

# Force close connections
killall node

# Restart
pm2 restart ecosyntech
```

## 4. MQTT Not Connecting
**Symptoms:** Devices offline, no MQTT messages
**Fix:**
```bash
# Check broker
systemctl status mosquitto

# Restart broker
systemctl restart mosquitto

# Test connection
mosquitto_sub -t 'test' -v
```

## 5. API 500 Errors
**Symptoms:** High error rate
**Fix:**
```bash
# Check recent errors
tail -100 logs/error.log

# Identify error pattern
grep "500" logs/access.log

# Fix and restart
pm2 restart ecosyntech
```

## 6. Device Offline
**Symptoms:** ESP32 not showing data
**Fix:**
```bash
# Check device registration
curl localhost:3000/api/v1/devices | jq

# Force re-register
curl -X POST localhost:3000/api/v1/devices/register \
  -H "Content-Type: application/json" \
  -d '{"device_id":"ESP32_001","type":"ESP32"}'
```

## 7. Certificate Expired
**Symptoms:** HTTPS errors
**Fix:**
```bash
# Check SSL expiry
openssl x509 -enddate -noout -in certs/server.crt

# Renew (Let's Encrypt)
certbot renew
```

## 8. Disk Full
**Symptoms:** "No space left on device"
**Fix:**
```bash
# Find large files
du -sh /* | sort -rh | head -10

# Clean logs
rm -f logs/*.log.OLD

# Clean PM2 logs
pm2 flush
```

## Execution

Run diagnostic first, then apply fix with confirmation:

```
## Issue Detection

### Symptoms Detected
- [ ] High CPU (78%)
- [ ] Memory (91%)
- [ ] Disk (42%)

### Proposed Fixes
1. Restart PM2 process (memory issue)
2. Verify MQTT connection

### Your Confirmation Required
[ ] Apply fix 1
[ ] Apply fix 2
```

Apply fixes in order of severity: Critical > High > Medium.