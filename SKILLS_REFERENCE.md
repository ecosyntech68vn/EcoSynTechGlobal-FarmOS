# EcoSynTech Skills Reference

## Tổng quan

Hệ thống gồm **58 skills** tự động hóa quản lý, vận hành, giám sát.

## Skills List

### 🔄 Drift (2 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| version-drift | Version Drift Monitor | cron:1h, event:watchdog.tick | low | Monitor version changes |
| config-drift | Config Drift Monitor | cron:1h, event:config.change | low | Detect config changes |

### 🌐 Network (2 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| ws-heartbeat | WebSocket Heartbeat | cron:1m, event:watchdog.tick | low | Monitor WebSocket health |
| mqtt-watch | MQTT Watch | cron:1m, event:mqtt.status | low | Monitor MQTT connection |

### 📊 Data (2 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| alert-deduper | Alert Deduper | event:alert.created | low | Loại bỏ alert trùng lặp |
| incident-correlator | Incident Correlator | event:incident.created | medium | Correlate related incidents |

### 🚀 Release (2 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| build-test-gate | Build Test Gate | event:build.complete | medium | Validate build |
| approval-gate | Approval Gate | event:deploy.request | medium | Require approval for deploy |

### 🔍 Diagnosis (6 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| route-mapper | Route Mapper | event:request.error | low | Map request routes |
| webhook-correlator | Webhook Correlator | event:webhook.fail | low | Correlate webhook failures |
| anomaly-classifier | Anomaly Classifier | event:sensor.anomaly | medium | Classify anomalies |
| device-state-diff | Device State Diff | event:device.state_change | low | Detect device state changes |
| kpi-drift | KPI Drift | cron:15m, event:watchdog.tick | medium | Monitor KPI drift |
| root-cause-hint | Root Cause Hint | event:error | low | Provide root cause hints |

### 🔧 Self-Heal (6 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| retry-job | Retry Job | event:job.failed | low | Retry failed jobs |
| reconnect-bridge | Reconnect Bridge | event:bridge.disconnected | medium | Auto reconnect bridges |
| reset-device | Reset Device | event:device.offline | medium | Reset stuck devices |
| clear-cache | Clear Cache | cron:1h, event:memory.high | low | Clear memory cache |
| rollback-ota | Rollback OTA | event:ota.failed | high | Rollback failed OTA |
| auto-acknowledge | Auto Acknowledge | event:alert.created | low | Auto ack low alerts |

### 🎛️ Orchestration (6 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| rules-engine | Rules Engine | event:sensor.update | medium | Execute rules |
| schedules-engine | Schedules Engine | cron:1m | medium | Execute schedules |
| webhook-dispatch | Webhook Dispatch | event:trigger.webhook | low | Dispatch webhooks |
| command-router | Command Router | event:command.received | medium | Route commands |
| ota-orchestrator | OTA Orchestrator | event:ota.request | medium | Orchestrate OTA |
| report-export | Report Export | cron:1d, event:report.request | low | Export reports |

### 🛡️ Governance (6 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| rbac-guard | RBAC Guard | route:* | high | Enforce RBAC |
| audit-trail | Audit Trail | event:* | low | Log all actions |
| secrets-check | Secrets Check | cron:1d | high | Scan for secrets |
| tenant-isolation | Tenant Isolation | event:request | medium | Enforce tenant isolation |
| rate-limit-guard | Rate Limit Guard | route:* | low | Enforce rate limits |
| approval-gate-advanced | Advanced Approval | event:action.request | medium | Multi-level approval |

### 📈 Analysis (4 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| root-cause-analyzer | Root Cause Analyzer | event:error, event:incident.created | medium | Analyze root causes |
| auto-backup | Auto Backup | cron:3h | low | Auto backup data |
| anomaly-predictor | Anomaly Predictor | event:sensor-update, cron:15m | medium | Predict anomalies |
| system-health-scorer | System Health Scorer | event:watchdog.tick, cron:30m | low | Score system health |

### ♻️ Recovery (1 skill)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| auto-restore | Auto Restore | event:restore.request | high | Auto restore from backup |

### 🔒 Security (1 skill)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| vuln-scanner | Vulnerability Scanner | cron:1d, event:security.scan | medium | Scan vulnerabilities |

### 🛡️ Defense (1 skill)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| intrusion-detector | Intrusion Detector | event:intrusion.attempt | high | Detect intrusions |

### 📢 Communication (4 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| telegram-notifier | Telegram Notifier | event:alert, event:report | low | Send Telegram notifications |
| report-generator | Report Generator | cron:1d | low | Generate reports |
| voice-notifier | Voice Notifier | event:critical.alert | low | Voice alerts |
| language-switcher | Language Switcher | event:language.change | low | Switch language |

### 🌱 Agriculture (5 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| weather-decision | Weather Decision | event:weather.update | low | Make irrigation decisions |
| water-optimization | Water Optimization | event:sensor.soil | low | Optimize water usage |
| crop-growth-tracker | Crop Growth Tracker | cron:1d | low | Track crop growth |
| pest-alert | Pest Alert | event:pest.detected | medium | Alert pests |
| fertilizer-scheduler | Fertilizer Scheduler | cron:1d | low | Schedule fertilization |

### 📡 IoT (3 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| energy-saver | Energy Saver | cron:5m, event:device.idle | low | Save device energy |
| predictive-maintenance | Predictive Maintenance | event:device-status, cron:1h | medium | Predict maintenance |
| multi-farm-manager | Multi-Farm Manager | event:farm.update | medium | Manage multiple farms |

### 🔧 Maintenance (3 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| cleanup-agent | Cleanup Agent | cron:1h | low | Cleanup temp files |
| log-rotator | Log Rotator | cron:1d | low | Rotate logs |
| db-optimizer | DB Optimizer | cron:1d | low | Optimize database |

### 🤖 AI (1 skill)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| ai-predict-weather | AI Weather Prediction | event:weather.update, cron:6h | low | Predict weather |

### 📦 Traceability (3 skills)

| ID | Name | Triggers | Risk | Mô tả |
|----|------|----------|------|-------|
| qr-traceability | QR Traceability | event:traceability.create, cron:1h | low | Generate QR codes |
| aptos-blockchain | Aptos Blockchain | event:blockchain.record, cron:5m | medium | Record to blockchain |
| aptos-integration | Aptos Integration | event:aptos.submit, cron:10m | medium | Aptos API integration |

---

## Skill Properties

```javascript
{
  id: 'skill-id',           // Unique ID
  name: 'Skill Name',       // Display name
  triggers: [...],         // Trigger events/crons
  riskLevel: 'low|medium|high',
  canAutoFix: true|false,
  run: function(ctx) {     // Skill logic
    // ...
    return { ok: true, ... };
  }
}
```

---

## Trigger Types

| Type | Example | Mô tả |
|------|---------|-------|
| Event | `event:alert.created` | Trigger khi event xảy ra |
| Cron | `cron:1h` | Trigger định kỳ |
| Route | `route:/api/sensors` | Trigger khi route được gọi |

---

## Context Object

```javascript
{
  event: {           // Event trigger
    type: 'alert.created',
    data: {...}
  },
  stateStore: {      // Persistent state
    get: (key) => value,
    set: (key, value) => {},
    push: (key, value) => {}
  },
  logger: {          // Logger
    info: (msg) => {},
    error: (msg) => {}
  },
  config: {...},      // System config
  baseUrl: '...',    // Server URL
  packageVersion: '2.3.2'
}
```

---

## Skill Execution Flow

```
Event/Cron → Policy Match → Orchestrator → Skill.run() → Result
                ↓
         Filter by triggers
                ↓
         Run matching skills
                ↓
         Save state, log results
```

---

## Testing Skills

```bash
# Test all skills
node scripts/test-skills.js

# Test specific skill
node -e "
const { createOps } = require('./src/ops');
const ops = createOps({ info:()=>{}, error:()=>{} }, 'http://localhost', '2.3.2', {});
const skill = ops.registry.get('ai-predict-weather');
const result = skill.run({
  stateStore: { get:()=>null, set:()=>{} },
  event: { type: 'test', data: { temperature: 28, humidity: 75 } }
});
console.log(result);
"
```

---

## Monitoring Skills

```bash
# View scheduler status
node manage.js status

# View logs
tail -f logs/ops.log

# View metrics
curl http://localhost:3000/api/stats
```

---

**Total: 58 Skills**  
**Version: 2.3.2**