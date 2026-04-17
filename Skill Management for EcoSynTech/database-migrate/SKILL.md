---
name: database-migrate
description: "Run database migrations for EcoSynTech"
user-invocable: true
agent: explore
---

# Database Migration Skill for EcoSynTech-web

Run database schema migrations safely.

## 1. Create Migration

```bash
# Generate migration file
npm run migrate:create -- --name add_device_group

# Edit migration file
# migrations/20260417_add_device_group.js
```

## 2. Migration Template

```javascript
// migrations/TIMESTAMP_migration_name.js
module.exports = {
  up: async (db) => {
    // Add column
    await db.schema.table('devices', (table) => {
      table.string('group', 50);
    });
    
    // Create index
    await db.schema.alter('devices', (table) => {
      table.index('group');
    });
  },
  
  down: async (db) => {
    // Rollback
    await db.schema.table('devices', (table) => {
      table.dropColumn('group');
    });
  }
};
```

## 3. Run Migrations

### Check Status
```bash
npm run migrate:status
```

### Migrate Up
```bash
# Run all pending
npm run migrate

# Run specific
npm run migrate:up 20260417
```

### Migrate Down
```bash
# Rollback last
npm run migrate:down

# Rollback to specific
npm run migrate:downTo 20260415
```

## 4. Seed Data

```javascript
// seeds/seed_devices.js
module.exports = {
  up: async (db) => {
    await db('devices').insert([
      { device_id: 'TEST_001', type: 'ESP32', location: 'Test Lab' }
    ]);
  },
  
  down: async (db) => {
    await db('devices').where({ device_id: 'TEST_001' }).delete();
  }
};
```

## 5. Migration Safety

| Check | Required |
|-------|----------|
| Backup before | YES |
| Test on staging | YES |
| Down migration works | YES |
| Data migration valid | YES |

Execute:

```
## Database Migration

### Pending Migrations
| Timestamp | Name | Status |
|------------|------|--------|
| 20260417 | add_device_group | PENDING |
| 20260418 | add_firmware_version | PENDING |

### Completed
| Date | Name | Records |
|------|------|---------|
| 20260410 | initial_schema | - |
| 20260412 | add_mqtt_topic | 0 |

### Run Migration
[ ] Backup database [REQUIRED]
[ ] Test on staging
[ ] Run migration
[ ] Verify data
[ ] Rollback plan ready

### Migration: add_device_group
- Adds column: devices.group (VARCHAR 50)
- Creates index: devices.group_index
- Affects: ALL devices (X records)
```