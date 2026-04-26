SOP: Data Export / Import

Goal
- Enable moving data between environments safely (export/import utility).

Prerequisites
- Access to DB and export/import endpoints; test data prepared in a dedicated environment.

Export
- Steps:
 1. Trigger /api/export to collect a complete dataset.
 2. Validate JSON payload and store securely.
- Output: JSON payload for backup or migration.

Import
- Steps:
 1. Submit payload via /api/import with proper structure.
 2. Validate results and run integrity checks.

Notes
- Ensure compatibility with current schema; perform dry-run if supported.
