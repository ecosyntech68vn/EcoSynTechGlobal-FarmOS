EcoSynTech Local Core
Version: V3.0 (Local Core)

Overview
- Local Core provides the on-premise software stack for smart farming: API endpoints, dashboards, IoT device management, automation rules, data persistence, and AI model integration.

ISO/Quality Foundation
- ISO 27001 oriented information security controls and governance.
- 5S operational excellence to organize and standardize workflows.
- PDCA for continuous improvement.
- 5W1H for task planning and problem-solving.
- SWOT analysis used to guide risk management and opportunities.

Architecture at a Glance
- Express-based HTTP API + static dashboard pages served from public/
- Mock dashboard API for testing (/api/dashboard)
- SQLite in-memory DB for unit/integration tests
- Lightweight AI model bootstrap with optional large models (toggle via env)
- Micro services-like organization in src/: routes, services, middleware, core logic

Key Modules
- API: /api/* endpoints (auth, devices, rules, schedules, history, alerts, stats, etc.)
- Dashboard: static HTML pages under public/ with JS/CSS (dashboard-*.html)
- IoT: device and sensor management in src/core/iot
- AI: model bootstrap and prediction services (fallbacks when models unavailable)
- Security: auth, RBAC, rate limiting, audit hooks

How to Run
- Install: npm install
- Start: npm start
- Dev: npm run dev
- Test: npm test; npm run test:dashboard

Templates and SOPs
- See docs/ for ISO, 5S, PDCA, SWOT, 5W1H, and SOP guidance.

Governance and Compliance
- Change control, incident response, and audit trails are integrated into server lifecycle.
- SoA for ISO 27001 controls: access, logging, asset management, etc. mapping provided in docs.

Developer Guidance
- Coding standards: ASCII, clean code, minimal dependencies, tests first.
- CI/CD: GitHub Actions workflow ci-dashboard.yml for dashboard tests; unit tests run as part of npm test.
- Branching: feature branches; PRs merge to main after review.
