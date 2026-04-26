SOP: Monitoring & Observability

Goal
- Ensure system health visibility, performance insights, and rapid detection of issues.

Scope
- Server, DB, API, Dashboards, ML bootstrap components, and network paths.

Roles
- DevOps, SRE, Dev.

Metrics & Dashboards
- Define SLOs for API latency, error rate, memory usage, and disk usage.
- Establish dashboards and alerts (e.g., /api/health, /public/dashboard, /api/stats).

Data & Logs
- Centralize application logs; manage rotation; preserve audit trails for ISO.
- Instrument code with lightweight tracing where applicable.

Alerts & Response
- Alert thresholds; runbooks for common incidents; escalate per policy.
- Review alerts weekly and tune thresholds.

Testing & Verification
- Validate monitoring changes in staging; ensure alerts trigger correctly
- Periodic verification via blast tests.
