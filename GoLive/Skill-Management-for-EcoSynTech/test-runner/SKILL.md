---
name: test-runner
description: "Run test suites for EcoSynTech"
user-invocable: true
agent: explore
---

# Test Runner Skill for EcoSynTech-web

Comprehensive test execution and reporting.

## 1. Test Suites

### Unit Tests
```bash
npm run test:unit
# Tests: src/**/*.test.js
# Coverage: required >80%
```

### Integration Tests
```bash
npm run test:integration
# Tests: tests/integration/**/*.js
# Requires: database, MQTT
```

### End-to-End Tests
```bash
npm run test:e2e
# Tests: tests/e2e/**/*.js
# Full system simulation
```

### Quick Tests (CI)
```bash
npm run test:fast
# Critical paths only
# ~30 seconds
```

## 2. Running Tests

### All Tests
```bash
npm test
# Full suite with coverage
```

### Watch Mode
```bash
npm run test:watch
# Auto-run on file changes
```

### Specific Module
```bash
npm test -- --grep "device"
# Run only device-related tests
```

### Coverage Report
```bash
npm run test:coverage
# Generates coverage/
```

## 3. CI Integration
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run test:fast
      - run: npm run lint
```

## 4. Test Reporting

```
## Test Results Summary

### Test Suite
- Total: 46
- Passed: 46 ✓
- Failed: 0
- Skipped: 0
- Duration: 12.4s

### Coverage
- Statements: 87%
- Branches: 82%
- Functions: 91%
- Lines: 88%

### By Module
| Module | Tests | Status |
|--------|-------|--------|
| API | 18 | ✓ |
| MQTT | 8 | ✓ |
| Database | 12 | ✓ |
| Utils | 8 | ✓ |

### CI Status
- Lint: PASS ✓
- Test: PASS ✓
- Build: PASS ✓
```

## 5. Test Coverage Requirements

| Priority | Coverage | Action |
|----------|----------|--------|
| CRITICAL | 90%+ | Block merge |
| HIGH | 80%+ | Review required |
| MEDIUM | 70%+ | Improve when possible |

Run tests before any merge to main.