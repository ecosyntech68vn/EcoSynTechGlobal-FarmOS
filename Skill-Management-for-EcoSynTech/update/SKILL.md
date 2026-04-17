---
name: update
description: "Update EcoSynTech dependencies and firmware"
user-invocable: true
agent: explore
---

# Update Skill for EcoSynTech-web

Manage updates safely.

## 1. Check Updates
```bash
# Node packages
npm outdated

# Security patches
npm audit

# Latest versions
npm check
```

## 2. Safe Update Process
```bash
# 1. Create backup
./scripts/backup.sh

# 2. Update in staging
npm update

# 3. Run tests
npm test

# 4. Check for breaking changes
npm run lint
```

## 3. Update Types

### Patch (safe)
- Bug fixes
- Security patches
- Always applies

### Minor (preview)
- New features
- May need config change
- Test first

### Major (planning)
- Breaking changes
- Requires migration
- Full regression

## 4. Rollback Procedure
```bash
# Rollback npm
npm install package@previous-version

# Rollback database
./scripts/backup-restore.sh backup_before_update

# Rollback code
git checkout previous-tag
npm install
pm2 restart ecosyntech
```

## 5. Scheduled Updates
- Security patches: Weekly (Monday)
- Minor updates: Monthly
- Major updates: Quarterly

Execute update:

```
## Update Check

### Available Updates
| Package | Current | Latest | Type |
|---------|---------|--------|------|
| express | 4.18.2 | 4.21.0 | MINOR |
| socket.io | 4.6.0 | 4.7.0 | PATCH |

### Recommended Actions
[ ] Apply SECURITY patches (PATCH) - safe
[ ] Review MINOR updates - test first
[ ] Schedule MAJOR update

### Backup Status
Last backup: 2026-04-17
Location: /backups/
```