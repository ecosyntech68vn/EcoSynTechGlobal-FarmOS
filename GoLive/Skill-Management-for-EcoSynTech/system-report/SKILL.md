---
name: system-report
description: "Generate comprehensive system reports for EcoSynTech"
user-invocable: true
agent: explore
---

# System Report Skill for EcoSynTech-web

Generate daily/weekly/monthly reports.

## 1. Daily Report

```bash
# Run report
npm run report:daily

# Output:
# ====== Daily Report: 2026-04-17 ======
# API Requests: 1,234 (+12%)
# Avg Response: 45ms
# Errors: 0.1%
# Devices Online: 8/10
# Top Endpoints: /api/v1/data, /api/v1/status
```

## 2. Weekly Report

```bash
npm run report:weekly

# Output:
# ====== Weekly Report: Week 16 ======
# Total Requests: 8,765 (+8%)
# Peak Day: Tuesday (2,123)
# Downtime: 0 min
# New Devices: 2
# Incidents: 0
```

## 3. Monthly Report

```bash
npm run report:monthly

# ====== Monthly Report: April 2026 ======
#
# SUMMARY
# -------
# API Requests: 35,642
# Uptime: 99.98%
# Avg Response: 42ms
# Error Rate: 0.12%
#
# DEVICES
# -------
# Total: 10
# Active: 8
# New: 2
# Offline: 2
#
# STORAGE
# -------
# Database: 2.3MB (+15%)
# Logs: 45MB
# Backups: 340MB (7 backups)
#
# INCIDENTS
# ---------
# Critical: 0
# Warning: 2
# Info: 5
```

## 4. Custom Report

```yaml
# report-config.yml
period: custom
start_date: 2026-04-01
end_date: 2026-04-15
sections:
  - api_metrics
  - device_status
  - storage
  - incidents
  - security
format: json  # or html, pdf
```

## 5. Scheduled Reports

```yaml
# crontab
0 8 * * * npm run report:daily | mail -s "Daily Report" admin@ecosyntech.com
0 8 * * 1 npm run report:weekly | mail -s "Weekly Report" admin@ecosyntech.com
0 8 1 * * npm run report:monthly | mail -s "Monthly Report" admin@ecosyntech.com
```

## 6. Report Sections

| Section | Metrics |
|---------|---------|
| API | Requests, Response time, Errors |
| Devices | Online, Offline, New |
| Storage | Database, Logs, Backups |
| Security | Auth failures, Alerts |
| Incidents | Count, Resolution time |

Execute:

```
## Report Generator

### Report Types
| Type | Last Run | Next Scheduled |
|------|---------|----------------|
| Daily | Today 08:00 | Tomorrow 08:00 |
| Weekly | Mon 08:00 | Next Mon 08:00 |
| Monthly | Apr 01 08:00 | May 01 08:00 |

### Generate Report
[ ] Daily Report
[ ] Weekly Report
[ ] Custom Range
[ ] Export to PDF

### Custom Range
Start: ____/____/______
End: ____/____/______
```