# EcoSynTech Skills

Custom skills for managing EcoSynTech IoT backend - Complete automation suite.

## Available Skills (19 Total)

| Skill | Description | Category |
|-------|-------------|----------|
| `/security-audit` | Comprehensive security audit | Security |
| `/firewall-setup` | Configure firewall rules | Security |
| `/scheduler` | Orchestrate and schedule other skills | Automation |
| `/health-check` | System health and API status | Operations |
| `/monitor` | Real-time monitoring dashboard | Monitoring |
| `/alerting` | Configure and manage alerts | Monitoring |
| `/system-report` | Generate reports | Operations |
| `/log-analyzer` | Analyze logs and find issues | Debug |
| `/iot-debug` | Debug ESP32 device issues | Debug |
| `/fix-common` | Auto-fix common issues | Auto-fix |
| `/deployment` | Deploy and manage production | DevOps |
| `/test-runner` | Run test suites | Quality |
| `/backup` | Database backup/restore | Maintenance |
| `/update` | Update dependencies safely | Maintenance |
| `/database-migrate` | Run database migrations | Maintenance |
| `/auto-scale` | Auto-scale resources | Automation |
| `/metrics-export` | Export to Prometheus/Grafana | Monitoring |
| `/device-provision` | Auto-provision ESP32 devices | DevOps |
| `/api-gateway` | Manage API gateway rules | Operations |

## Usage

```bash
# Invoke in Claude Code:
/security-audit
/scheduler
/health-check
/monitor
/alerting
/log-analyzer
/iot-debug
/fix-common
/deployment
/test-runner
/backup
/update
/database-migrate
/auto-scale
/metrics-export
/device-provision
/api-gateway
/firewall-setup
/system-report
```

## Skill Categories (19 Skills)

### Security (2)
- **security-audit**: Vulnerability scanning, auth checks
- **firewall-setup**: UFW, iptables, fail2ban

### Automation (2)
- **scheduler**: Orchestrate other skills on schedule
- **auto-scale**: Scale resources based on load

### Operations (5)
- **health-check**: Server, database, MQTT, device status
- **monitor**: Real-time metrics dashboard
- **alerting**: Alert rules and channels
- **system-report**: Daily/weekly/monthly reports
- **api-gateway**: Rate limiting, routing

### Debug & Fix (3)
- **log-analyzer**: Error pattern analysis
- **iot-debug**: ESP32/sensor troubleshooting
- **fix-common**: Auto-fix 8+ issues

### DevOps (2)
- **deployment**: Production deployment
- **test-runner**: Test suite execution

### Hardware (1)
- **device-provision**: New ESP32 registration

### Maintenance (4)
- **backup**: Database backup/restore
- **update**: Safe dependency updates
- **database-migrate**: Schema migrations

### Monitoring (1)
- **metrics-export**: Prometheus, Grafana, external systems

## Scheduler - Auto-Run Intervals

| Interval | Skills | Frequency |
|----------|-------|----------|
| Every 5 min | health-check, monitor | Critical |
| Every 15 min | log-analyzer, iot-debug | Debug |
| Every 30 min | backup, alerting | Backup + alerts |
| Every 1 hour | system-report, metrics-export | Report |
| Every 2 hours | auto-scale, security-audit | Scale + security |
| Every 6 hours | update, database-migrate | Maintenance |
| Every 24 hours | full-report, firewall-setup | Daily |

## Automation Coverage

| Area | Skills | Automation |
|------|--------|-----------|
| Security | security-audit, firewall-setup | 95% |
| Health & Monitoring | health-check, monitor, scheduler | 95% |
| Debug & Fix | log-analyzer, iot-debug, fix-common | 85% |
| DevOps | deployment, test-runner, device-provision | 85% |
| Maintenance | backup, update, database-migrate, auto-scale | 85% |
| Reporting | system-report, metrics-export | 80% |

**Total automation: ~88% of operations**

## Adding New Skills

```bash
mkdir -p "Skill Management for EcoSynTech/new-skill"
# Add SKILL.md with YAML frontmatter
```

## Best Practices

1. **Keep skills focused** - One skill, one purpose
2. **Include verification** - Confirm before destructive actions
3. **Add rollback** - Always have recovery plan
4. **Document edge cases** - Handle all scenarios
5. **Use scheduler** - Orchestrate automated runs