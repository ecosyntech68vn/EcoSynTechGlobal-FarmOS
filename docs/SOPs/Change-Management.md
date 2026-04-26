SOP: Change Management

What
- Manage changes to code, configuration, and infrastructure to minimize risk and disruption.

Who
- Change Advisory Board (CAB), Tech Lead, Dev, QA, Security.

Where
- Codebase (Git), deployment pipelines, infrastructure as code (if any).

When
- For every modification affecting behavior, security, or uptime.

How
- Plan: Capture change summary, risk assessment, and rollback plan.
- Approve: Obtain necessary approvals (CAB or equivalent).
- Do: Implement change in a feature branch; run unit/integration tests; perform code review.
- Check: Validate testing results, security checks, and rollback readiness.
- Act: Merge to main after sign-off; execute deployment; monitor post-change metrics; update docs.

Rollback
- Predefine rollback steps; ensure quick revert to previous commit or tag.

Documentation
- Record change details, approvals, and test results in the change log.
