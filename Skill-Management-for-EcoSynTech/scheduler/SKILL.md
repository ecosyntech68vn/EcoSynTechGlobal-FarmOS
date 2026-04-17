---
name: scheduler
description: "Orchestrate and schedule other skills to run automatically"
user-invocable: true
agent: explore
---

# Scheduler Skill for EcoSynTech

Orchestrate and schedule other skills to run automatically at configured intervals.

## 1. Predefined Schedules

| Interval | Skills to Run | Use Case |
|----------|--------------|----------|
| Every 5 min | health-check, monitor | Critical monitoring |
| Every 15 min | log-analyzer, iot-debug | Debug check |
| Every 30 min | backup, alerting | Backup + alerts |
| Every 1 hour | system-report, metrics-export | Hourly report |
| Every 2 hours | auto-scale, security-audit | Scale + security |
| Every 6 hours | update, database-migrate | Maintenance |
| Every 24 hours | full-report, firewall-setup | Daily report |

## 2. Schedule Configuration

```yaml
# config/scheduler.yml
schedules:
  - name: critical_monitoring
    interval: 5m  # 5 minutes
    skills:
      - health-check
      - monitor
    enabled: true
    
  - name: debug_check
    interval: 15m
    skills:
      - log-analyzer
      - iot-debug
    enabled: true
    
  - name: backup_and_alerts
    interval: 30m
    skills:
      - backup
      - alerting
    enabled: true
    
  - name: hourly_report
    interval: 1h
    skills:
      - system-report
      - metrics-export
    enabled: true
    
  - name: scale_and_security
    interval: 2h
    skills:
      - auto-scale
      - security-audit
    enabled: true
    
  - name: maintenance
    interval: 6h
    skills:
      - update
    enabled: false
    
  - name: daily_report
    interval: 24h
    skills:
      - full-report
      - firewall-setup
    enabled: true
```

## 3. Cron Expressions

```yaml
# Alternative cron format
cron_schedules:
  - name: morning_check
    cron: "0 6 * * *"  # 6 AM daily
    skills: [health-check, system-report]
    
  - name: midnight_backup
    cron: "0 0 * * *"  # Midnight daily
    skills: [backup]
    
  - name: weekly_security
    cron: "0 2 * * 0"  # Sunday 2 AM
    skills: [security-audit, firewall-setup]
```

## 4. Running Scheduler

```bash
# Start scheduler
npm run scheduler:start

# Stop scheduler
npm run scheduler:stop

# Run specific schedule
scheduler run critical_monitoring

# List schedules
scheduler list
```

## 5. Execution Mode

### Direct Run
```bash
# Run immediately
scheduler run --now health-check
```

### Interval Run
```bash
# Background process
scheduler daemon --config config/scheduler.yml
```

### Crontab Run
```bash
# Add to crontab
*/5 * * * * /path/to/scheduler run health-check
*/30 * * * * /path/to/scheduler run backup
0 * * * * /path/to/scheduler run hourly-report
```

## 6. Skill Dependencies

Some skills must run before others:

```yaml
dependencies:
  health-check: []  # No dependencies
  monitor: [health-check]  # Needs health check first
  backup: [health-check]  # Needs healthy system
  system-report: [health-check, monitor]  # Needs both
```

## 7. Execution Report

```
## Scheduler Status

### Running Schedules
| Schedule | Interval | Next Run | Status |
|----------|---------|---------|--------|
| critical_monitoring | 5m | 14:05 | ✓ RUNNING |
| debug_check | 15m | 14:15 | ✓ RUNNING |
| backup_alerts | 30m | 14:30 | ✓ RUNNING |
| hourly_report | 1h | 15:00 | ✓ RUNNING |
| scale_security | 2h | 16:00 | ✓ RUNNING |
| maintenance | 6h | 20:00 | ✗ DISABLED |
| daily_report | 24h | tomorrow 00:00 | ✓ RUNNING |

### Last Executions
| Skill | Last Run | Duration | Status |
|-------|---------|----------|--------|
| health-check | 14:00:05 | 3s | ✓ |
| monitor | 14:00:08 | 5s | ✓ |
| backup | 14:00:13 | 45s | ✓ |
| system-report | 14:00:58 | 12s | ✓ |

### Next Scheduled
[1] 14:05:00 - health-check
[2] 14:05:00 - monitor
[3] 14:10:00 - iot-debug
[4] 14:15:00 - log-analyzer
```

## 8. Custom Schedule

Create custom schedule:

```
## Create Custom Schedule

Schedule Name: __________
[ ] Every X minutes: __
[ ] Every X hours: __
[ ] Specific time (HH:MM): __:__

Select skills to run:
[ ] security-audit
[ ] health-check
[ ] monitor
[ ] log-analyzer
[ ] iot-debug
[ ] fix-common
[ ] deployment
[ ] backup
[ ] update
[ ] auto-scale
[ ] metrics-export
[ ] system-report

Enable: [ ]
Run now: [ ]
```

## 9. Pause/Resume

```bash
# Pause all
scheduler pause

# Resume all
scheduler resume

# Pause specific
scheduler pause hourly_report

# Resume specific
scheduler resume hourly_report
```

Use `/scheduler` to manage all skill scheduling.