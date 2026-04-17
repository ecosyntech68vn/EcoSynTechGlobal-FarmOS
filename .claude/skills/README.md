# EcoSynTech Skills

Custom skills for managing EcoSynTech IoT backend.

## Available Skills

| Skill | Description | Usage |
|-------|-------------|--------|
| `/security-audit` | Comprehensive security audit | Run security checks |
| `/health-check` | System health and API status | Check system health |
| `/log-analyzer` | Analyze logs and find issues | Debug issues |
| `/iot-debug` | Debug IoT device issues | Troubleshoot ESP32 |
| `/deployment` | Deploy and manage production | Deploy to production |
| `/backup` | Database backup/restore | Backup data |
| `/monitor` | Real-time monitoring dashboard | Live metrics |
| `/fix-common` | Auto-fix common issues | Fix problems |

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
```

## Skill Categories

### Core Operations
- **health-check**: Server, database, MQTT, device status
- **monitor**: Real-time metrics dashboard

### Debug & Fix
- **log-analyzer**: Error pattern analysis
- **iot-debug**: ESP32/sensor troubleshooting
- **fix-common**: Auto-fix 8+ common issues

### Maintenance
- **backup**: Manual and scheduled backups
- **deployment**: Production deployment

### Security
- **security-audit**: Security vulnerability scanning

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