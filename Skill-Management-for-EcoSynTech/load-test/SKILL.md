---
name: load-test
description: "Load testing and stress testing"
user-invocable: true
agent: explore
---

# Load Test Skill for EcoSynTech

Run load and stress tests.

## 1. Basic Load Test

```bash
# Using ab (Apache Bench)
ab -n 1000 -c 10 http://localhost:3000/api/v1/health
```

## 2. Using wrk

```bash
# Install wrk
sudo apt install wrk

# Run test
wrk -t4 -c100 -d30s http://localhost:3000/api/v1/data
```

## 3. Custom Script

```javascript
// load-test.js
const loadtest = require('loadtest');

const options = {
  url: 'http://localhost:3000',
  requests: 1000,
  concurrency: 50,
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: { device_id: 'TEST', data: { temp: 25 } }
};

loadtest.loadTest(options, (error, result) => {
  console.log('Requests:', result.requests);
  console.log('Errors:', result.errors);
});
```

## 4. Results

```
## Load Test Results

### Test Configuration
- Duration: 30 seconds
- Concurrency: 100 users
- Total requests: 10,000

### Results
- Requests/sec: 333
- Mean latency: 45ms
- p95 latency: 120ms
- p99 latency: 250ms
- Errors: 0 (0%)

### Capacity
- Max sustainable: ~400 req/sec
- Bottleneck: CPU at 85%
```