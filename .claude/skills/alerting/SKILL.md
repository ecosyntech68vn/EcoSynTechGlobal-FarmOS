---
name: alerting
description: "Configure and manage alerts for EcoSynTech"
user-invocable: true
agent: explore
---

# Alerting Skill for EcoSynTech-web

Configure and manage alert rules and notifications.

## 1. Alert Rules

### Critical (immediate action)
- **Server down**: HTTP 503 → Page on-call
- **Database down**: → Page + SMS
- **Major breach attempt** → Page + Telegram

### Warning (resolve in 1h)
- High CPU (>85%) → Slack
- High Memory (>90%) → Slack
- API error rate >5% → Slack

### Info (review daily)
- New device registered → Log
- Config changed → Log
- Deployment complete → Slack

## 2. Channels
```bash
# Telegram
curl -X POST "https://api.telegram.org/bot$BOT/sendMessage" \
  -d "chat_id=$CHAT&text=ALERT: $MESSAGE"

# Email (nodemailer)
nodemailer.sendMail({from, to, subject, text})

# SMS (Twilio)
twilio.messages.create({body, to, from})
```

## 3. On-Call Rotation
```json
{
  "rotation": [
    {"name": "On-call 1", "phone": "+84...", "priority": 1},
    {"name": "On-call 2", "phone": "+84...", "priority": 2}
  ],
  "escalation": 15
}
```

## 4. Alert Configuration
```yaml
# config/alerts.yml
rules:
  - name: server_down
    condition: http_code == 503
    severity: critical
    notify: [telegram, sms]
    
  - name: high_cpu
    condition: cpu > 85
    duration: 5m
    severity: warning
    notify: [slack]
    
  - name: new_device
    condition: event == 'device_registered'
    severity: info
    notify: [log]
```

Execute alert setup:

```
## Alerting Status

### Active Rules
| Rule | Condition | Severity | Channel |
|------|----------|----------|---------|
| server_down | 503 | CRITICAL | SMS+Telegram |
| high_cpu | >85% | WARNING | Slack |
| new_device | registered | INFO | Log |

### Recent Alerts (24h)
- 2026-04-17 14:00: CPU 87% (WARNING)
- 2026-04-17 10:30: API error 5.2% (WARNING)
- 2026-04-16 22:15: Deployment (INFO)

### On-Call
- Primary: +84XXX-XXX-XXX
- Escalation: 15 min
```