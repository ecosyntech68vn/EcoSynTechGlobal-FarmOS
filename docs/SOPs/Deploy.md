SOP: Deploy to Staging/Production

What
- Deploy updated code to staging and/or production environments.

Who
- DevOps, Release Engineer, and Tech Lead.

Where
- Cloud/On-Prem infrastructure; CI/CD pipelines (GitHub Actions).

When
- On release schedule or hotfix.

How
- Steps:
 1. Ensure tests pass (npm test) and lint/typecheck succeed.
 2. Merge PR to main (or tag release).
 3. Run deployment script or trigger CI/CD (ci-dashboard.yml or equivalent).
 4. Validate health endpoints, dashboard pages, and critical APIs post-deploy.
 5. Rollback plan if a critical issue arises.

Notes
- Consider downtime and maintenance windows; update stakeholders.
