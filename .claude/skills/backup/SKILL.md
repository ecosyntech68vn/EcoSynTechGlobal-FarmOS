---
name: backup
description: "Backup and restore database for EcoSynTech"
user-invocable: true
agent: explore
---

# Backup Skill for EcoSynTech-web

## 1. Manual Backup
```bash
# Create timestamped backup
BACKUP_NAME="ecosyntech_$(date +%Y%m%d_%H%M%S).db"
cp data/ecosyntech.db "backups/$BACKUP_NAME"
# Compress
tar -czf "backups/$BACKUP_NAME.tar.gz" -C data ecosyntech.db
```

## 2. Automated Backup
- Daily backups at configured time
- Keep last 7 days locally
- Archive to cloud storage

## 3. Restore from Backup
```bash
# List available backups
ls -la backups/

# Stop server
pm2 stop ecosyntech

# Restore
cp backups/backup_file.db data/ecosyntech.db

# Restart
pm2 start ecosyntech
```

## 4. Verify Backup
- Check file integrity
- Verify database opens correctly
- Test with read-only query

Execute backup/restore with confirmation at each step.

Provide report:
```
## Backup Report

### Last Backup
- Timestamp: YYYY-MM-DD HH:MM:SS
- File: filename.db
- Size: X MB
- Checksum: sha256...

### Available Backups
| Date | Size | File |
|------|------|------|
| ... | ... | ... |

### Restore Options
- [ ] Choose backup file
```