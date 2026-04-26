SOP: Release Management

Goal
- Provide a repeatable, auditable process for releasing changes to staging/production.

Scope
- All code, configs, and assets that go to production.

Roles
- Release Manager, DevOps, QA, Security.

Process
- Plan: Define release scope, risks, rollback plan, and communication.
- Build & Test: Create release candidate; run unit/integration/end-to-end tests; security scans.
- Validate: Verify health checks, metrics, and dashboards post-deploy.
- Deploy: Roll out to staging first; monitor; then to production with downtime planning if needed.
- Review: Post-release retrospective; update docs and SOPs.

Rollback
- Predefine rollback path to previous tag/commit; ensure data integrity.

Documentation
- Release notes at CHANGLOG; updated docs and SOPs with changes.
