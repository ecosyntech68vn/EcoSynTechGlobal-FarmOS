---
name: config-manager
description: "Manage configuration versioning and environment"
user-invocable: true
agent: explore
---

# Config Manager Skill for EcoSynTech

Manage configuration and environment variables.

## 1. List Configs

```bash
# List all configs
ls -la config/

# View current config
cat config/default.json
```

## 2. Config Structure

```javascript
// config/default.json
{
  "server": {
    "port": 3000,
    "env": "production"
  },
  "database": {
    "path": "./data/ecosyntech.db"
  },
  "security": {
    "jwtExpiry": "7d",
    "rateLimit": 100
  }
}
```

## 3. Environment Override

```bash
# Use production config
export NODE_ENV=production

# Use staging config
export NODE_ENV=staging
```

## 4. Config Versioning

```bash
# Commit config change
git add config/
git commit -m "Update rate limiting to 100"

# Rollback
git checkout HEAD^ config/
```

Execute:

```
## Config Manager

### Current Environment
- NODE_ENV: production
- Config file: config/production.json

### Config Versions
| Version | Date | Changed by |
|---------|------|------------|
| v2.3.2 | 2026-04-17 | admin |
| v2.3.1 | 2026-04-10 | admin |
| v2.3.0 | 2026-04-01 | system |

### Actions
[ ] View current config
[ ] Edit config
[ ] Rollback version
[ ] Export config
```