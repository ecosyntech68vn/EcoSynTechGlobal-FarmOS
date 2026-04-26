SOP: Run Tests

What
- Execute unit, integration, and dashboard tests.

Who
- QA engineers and developers.

Where
- Projects root; npm scripts in package.json.

When
- On code changes; before PR; during CI.

How
- Commands:
  - npm test
  - npm run test:dashboard
  - npm run test:coverage
  - npm run typecheck
- Ensure dependencies are installed: npm ci or npm i.
- Review test results and fix failing tests.

Notes
- In test environment, disable heavy ML bootstrap to speed up tests.
