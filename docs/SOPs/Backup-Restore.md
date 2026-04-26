SOP: Backup & Restore

Goal
- Ensure reliable data backups and recoverability for EcoSynTech Local Core.

Scope
- All critical data stores (SQLite/sql.js in tests; production DB as configured). File backups, schema backups, and configuration.

Roles
- DBA, DevOps, Security.

Schedule & Retention
- Backups: daily incremental, weekly full; retention policy configurable in config.
- Retain at least 30 days locally; longer-term offsite storage as required.

Process
- Backup:
  1. Trigger backup job via script or API (e.g., /api/export to export data if needed).
  2. Persist backup with timestamp; verify integrity (checksum).
  3. Store copy in secure offsite/storage.
- Restore:
  1. Retrieve backup artifact; validate checksum.
  2. Restore to target environment; verify data consistency and app health.
  3. Run smoke tests to confirm core flows (auth, devices, rules, schedules).

Testing & Validation
- Regular restore tests; document outcomes in CHANGLOG.
