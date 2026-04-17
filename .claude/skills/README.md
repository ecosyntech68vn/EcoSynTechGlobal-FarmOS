# EcoSynTech Skills

Custom skills for managing EcoSynTech IoT backend.

## Available Skills (12 Total)

| Skill | Description | Category |
|-------|-------------|----------|
| `/security-audit` | Comprehensive security audit | Security |
| `/health-check` | System health and API status | Operations |
| `/log-analyzer` | Analyze logs and find issues | Debug |
| `/iot-debug` | Debug ESP32 device issues | Debug |
| `/deployment` | Deploy and manage production | DevOps |
| `/backup` | Database backup/restore | Maintenance |
| `/monitor` | Real-time monitoring dashboard | Monitoring |
| `/fix-common` | Auto-fix common issues | Auto-fix |
| `/auto-scale` | Auto-scale resources | Automation |
| `/alerting` | Configure and manage alerts | Monitoring |
| `/update` | Update dependencies safely | Maintenance |
| `/test-runner` | Run test suites | Quality |

## Usage

```bash
# Invoke skills with / prefix in Claude Code:
/security-audit
/health-check
/log-analyzer
/iot-debug
/deployment
/backup
/monitor
/fix-common
/auto-scale
/alerting
/update
/test-runner
```

## Skill Categories

### Security
- **security-audit**: Vulnerability scanning, auth checks, SSL verification

### Operations
- **health-check**: Server, database, MQTT, device status
- **monitor**: Real-time metrics dashboard

### Debug & Fix
- **log-analyzer**: Error pattern analysis
- **iot-debug**: ESP32/sensor troubleshooting
- **fix-common**: Auto-fix 8+ common issues

### Automation
- **auto-scale**: Scale workers based on load
- **alerting**: Configure alert rules and channels

### Maintenance
- **backup**: Manual and scheduled backups
- **update**: Safe dependency updates

### DevOps
- **deployment**: Production deployment pipeline
- **test-runner**: Comprehensive test execution

## Adding New Skills

Add skills to `.claude/skills/` directory.

Structure:
```
.claude/skills/
├── skill-name/
│   └── SKILL.md    # Required
│   └── scripts/   # Optional: executable code
│   └── config/    # Optional: configuration
└── another-skill/
    └── SKILL.md
```

## Best Practices

1. **Keep skills focused** - One skill, one purpose
2. **Include verification** - Confirm before destructive actions
3. **Add rollback** - Always have recovery plan
4. **Document edge cases** - Handle all scenarios

## Automation Coverage

| Area | Skills | Automation Level |
|------|--------|-----------------|
| Health | health-check, monitor | 80% |
| Debug | log-analyzer, iot-debug, fix-common | 70% |
| Security | security-audit | 90% |
| Deployment | deployment, test-runner | 85% |
| Maintenance | backup, update, auto-scale, alerting | 75% |

Total automation: **~80% of operations**