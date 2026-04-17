---
name: db-cleanup
description: "Database vacuum, optimize, cleanup"
user-invocable: true
agent: explore
---

# Database Cleanup Skill for EcoSynTech

Optimize and clean database.

## 1. SQLite Vacuum

```bash
# Manual vacuum
sqlite3 data/ecosyntech.db "VACUUM;"

# Analyze for query optimization
sqlite3 data/ecosyntech.db "ANALYZE;"
```

## 2. Cleanup Old Data

```sql
-- Delete old readings (keep 30 days)
DELETE FROM readings WHERE timestamp < datetime('now', '-30 days');

-- Delete old logs (keep 7 days)
DELETE FROM logs WHERE timestamp < datetime('now', '-7 days');

-- Delete acknowledged alerts (keep 7 days)
DELETE FROM alerts WHERE acknowledged = 1 AND timestamp < datetime('now', '-7 days');
```

## 3. Reindex

```bash
# Reindex database
sqlite3 data/ecosyntech.db "REINDEX;"
```

## 4. Backup Before Cleanup

```bash
# Full backup
cp data/ecosyntech.db backups/ecosyntech_pre_cleanup_$(date +%Y%m%d).db
```

Execute:

```
## Database Cleanup

### Current Size
- Database: 2.3MB
- Free pages: 123

### Cleanup Actions
[ ] Vacuum database
[ ] Analyze indexes
[ ] Delete old readings (keep 30 days)
[ ] Delete old logs (keep 7 days)
[ ] Delete old alerts

### Estimated
- Before: 2.3MB
- After: ~1.8MB
- Space saved: 500KB
```