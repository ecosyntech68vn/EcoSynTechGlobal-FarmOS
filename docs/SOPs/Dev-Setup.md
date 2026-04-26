SOP: Development Environment Setup

What
- Prepare local development environment and dependencies for EcoSynTech Local Core.

Who
- Developers, QA engineers, and DevOps.

Where
- Local machine with Node.js 18+, npm, git, and Docker optionally.

When (Timing)
- Before starting feature work or when onboarding a new contributor.

How
- Steps:
 1. Install Node.js 18.x and npm.
 2. Clone repo and run npm install in EcoSynTech-Local-Core.
 3. Copy .env.example to .env and configure JWT_SECRET and DB options.
 4. Run npm install to fetch dependencies.
 5. Start server with npm start or npm run dev for development hot reload.
- Verification: visit http://localhost:3000 and ensure API endpoints respond with sample data.

Notes
- If heavy ML bootstrap is enabled, disable via NODE_ENV=test for tests.
