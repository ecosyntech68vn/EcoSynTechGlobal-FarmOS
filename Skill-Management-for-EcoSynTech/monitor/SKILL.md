---
name: monitor
description: "Real-time monitoring for EcoSynTech IoT system"
user-invocable: true
agent: explore
---

# Monitor Skill for EcoSynTech-web

Real-time monitoring dashboard and alerts.

## 1. System Metrics
- CPU usage: `top -bn1 | head -5`
- Memory: `free -h`
- Disk: `df -h`
- Process count: `pm2 list`

## 2. API Metrics
- Request count (last hour)
- Average response time
- Error rate
- Active connections

## 3. IoT Metrics
- Devices online/offline
- Messages per minute
- Last sensor readings
- MQTT broker status

## 4. Database Metrics
- Record counts by table
- Database size
- Query performance

## 5. Prometheus Integration
```bash
# Scrape metrics
curl localhost:3000/metrics

# Checkalert rules
cat prometheus/alerts.yml
```

## 6. Alert Conditions
- CPU > 80% for 5 min
- Memory > 90%
- Disk > 85%
- API error rate > 5%
- Device offline > 10%

Display all metrics in dashboard format:

```
╔════════════════════════════════════════════════════════════╗
║           EcoSynTech Monitor Dashboard                ║
╠════════════════════════════════════════════════════════════╣
║ SYSTEM                                               ║
║ CPU: ████████░░ 78%    Memory: ██████░░░░ 62%          ║
║ Disk: ████░░░░░░░ 42%    Uptime: 7d 12h               ║
╠════════════════════════════════════════════════════════════╣
║ API                                                  ║
║ Requests: 1,234/h  Latency: 45ms  Errors: 0.1%        ║
╠════════════════════════════════════════════════════════════╣
║ IOT                                                  ║
║ Devices: 8/10 online  MQTT: ✓  Msg/min: 45            ║
╠════════════════════════════════════════════════════════════╣
║ DATABASE                                            ║
║ Records: 12,456  Size: 2.3MB  Query: 12ms             ║
╚════════════════════════════════════════════════════════════╝
```

Alert on any critical threshold breach.