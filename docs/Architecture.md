EcoSynTech Local Core – Architecture Overview

Context
- Local Core provides API, dashboards, IoT device management, and AI bootstrap in a modular Express-based stack.

Key Components
- API Layer: /api/*, with security middleware, rate limiting, and logs.
- Dashboard Layer: static HTML under public/ with dynamic data from /api/dashboard endpoints.
- IoT Core: Sensors, devices, and MQTT integration points (implemented in src/core/iot).
- AI & ML: Lightweight bootstrap with optional large models (config via env); model loading with fallback modes.
- Data Layer: SQLite (sql.js) in-memory for tests; persistent storage in production using configured DB.
- Observability: OpenTelemetry config (optional), logging, and error handling.
- Testing: Jest-based tests for unit/integration/e2e, including mock dashboards.

Security & Compliance
- ISO27001-aligned governance; access control, logging, incident response, security reviews, and change management.
- Rate limiting and input sanitization in middleware.

Deployment Model
- Local deployment with an optional cloud integration path; Docker-based deployment supported in docs.
