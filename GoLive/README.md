# EcoSynTech Skill Scheduler - Go-Live Package

## Contents

```
Skill-Management-for-EcoSynTech/
├── scheduler/
│   ├── scheduler-runner.js    # Main scheduler process
│   ├── config/
│   │   └── scheduler.json    # Schedule configuration
│   ├── ui/
│   │   ├── index.html         # Web UI
│   │   └── app.js             # UI JavaScript
│   ├── systemd/
│   │   └── ecosyntech-scheduler.service
│   └── README.md
├── README.md                   # Skills overview
└── [26 skill directories]      # Automation skills
```

## Deployment Steps

### 1. Prerequisites

- Node.js 18+
- EcoSynTech backend running on port 3000
- SCHEDULER_API_KEY generated

### 2. Generate API Key

```bash
openssl rand -hex 32
```

### 3. Configure Environment

Add to `.env`:
```bash
SCHEDULER_API_KEY=your-generated-key
SCHEDULER_ENABLED=true
```

### 4. Start Scheduler

Development:
```bash
SCHEDULER_API_KEY=your-key node scheduler-runner.js
```

Production (systemd):
```bash
sudo cp systemd/ecosyntech-scheduler.service /etc/systemd/system/
sudo systemctl enable ecosyntech-scheduler
sudo systemctl start ecosyntech-scheduler
```

### 5. Access UI

Open: `http://localhost:3000/Skill-Management-for-EcoSynTech/scheduler/ui/`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/skills/scheduler` | List schedules |
| POST | `/api/v1/skills/scheduler` | Create schedule |
| PUT | `/api/v1/skills/scheduler/:id` | Update schedule |
| DELETE | `/api/v1/skills/scheduler/:id` | Delete schedule |
| POST | `/api/v1/skills/scheduler/:id/toggle` | Toggle enable/disable |
| GET | `/api/v1/skills/scheduler/export` | Export config |
| POST | `/api/v1/skills/scheduler/import` | Import config |

## Security

- All API requests require `X-Scheduler-API-Key` header
- API key must match `SCHEDULER_API_KEY` environment variable
- 401 returned if key missing
- 403 returned if key invalid

## Monitoring

```bash
# View logs
sudo journalctl -u ecosyntech-scheduler -f

# Check status
sudo systemctl status ecosyntech-scheduler
```

## Included Skills (26)

| Category | Skills |
|----------|--------|
| Security | security-audit, firewall-setup, ssl-manager |
| Operations | health-check, monitor, alerting, system-report, config-manager, api-gateway, user-manager |
| Debug | log-analyzer, iot-debug, fix-common |
| DevOps | deployment, test-runner, device-provision, firmware-update |
| Maintenance | backup, update, database-migrate, db-cleanup, cache-manager, auto-scale |
| Monitoring | metrics-export |
| Quality | load-test |

## Support

- GitHub: https://github.com/ecosyntech68vn/Ecosyntech-web
- Documentation: See scheduler/README.md
