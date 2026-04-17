---
name: api-gateway
description: "Manage API gateway, rate limiting, and routing for EcoSynTech"
user-invocable: true
agent: explore
---

# API Gateway Skill for EcoSynTech-web

Manage API gateway configuration.

## 1. Rate Limiting

### Configure Limits
```javascript
// config/rate-limit.js
module.exports = {
  // By endpoint
  '/api/v1/data': { windowMs: 60000, max: 100 },  // 100/min
  '/api/v1/webhook': { windowMs: 60000, max: 10 },  // 10/min
  
  // By device
  device: { windowMs: 3600000, max: 1000 },  // 1000/hour
  
  // Global
  global: { windowMs: 60000, max: 1000 }  // 1000/min
};
```

### Check Status
```bash
# View current limits
curl localhost:3000/api/v1/admin/rate-limits
```

## 2. Request Routing

### Route Rules
```yaml
# routes/config.yml
routes:
  - path: /api/v1/data
    target: http://localhost:3000
    methods: [GET]
    
  - path: /api/v1/webhook
    target: http://localhost:3000
    methods: [POST]
    
  - path: /api/v1/admin/*
    target: http://localhost:3000
    auth: required
    methods: [GET, POST, PUT, DELETE]
```

## 3. Authentication

### API Keys
```bash
# Generate key
curl -X POST localhost:3000/api/v1/admin/keys \
  -d '{"name":"Partner API","permissions":["read"]}'

# Revoke key
curl -X DELETE localhost:3000/api/v1/admin/keys/key_123
```

### JWT Settings
```javascript
// config/jwt.js
module.exports = {
  expiresIn: '24h',
  refreshEnabled: true,
  refreshExpiresIn: '7d',
  maxSessions: 5
};
```

## 4. IP Whitelist

```yaml
# config/access.yml
whitelist:
  admin:
    - 127.0.0.1
    - 192.168.1.0/24
    
  partners:
    - 203.0.113.0/24
    
blocked:
  - 192.0.2.0/24  # TEST-NET
```

## 5. Request Logging

```bash
# View recent requests
curl localhost:3000/api/v1/admin/requests?limit=50

# Request statistics
curl localhost:3000/api/v1/admin/requests/stats
```

Execute:

```
## API Gateway Status

### Rate Limiting
| Endpoint | Limit | Used | Remaining |
|---------|-------|------|----------|
| /api/v1/data | 100/min | 45 | 55 |
| /api/v1/webhook | 10/min | 3 | 7 |
| /api/v1/admin | 20/min | 0 | 20 |

### Active Sessions
- Total: 12
- API Keys: 8
- JWT: 4

### Recent Requests (10)
| Time | IP | Endpoint | Status |
|------|-----|----------|--------|
| 14:00:01 | 192.168.1.5 | /api/v1/data | 200 |
| 14:00:02 | 10.0.0.5 | /api/v1/webhook | 200 |
| 14:00:05 | 192.168.1.6 | /api/v1/data | 429 |

### Actions
[ ] View all rate limits
[ ] Update limits
[ ] Block IP
[ ] Generate API key
[ ] Revoke session
```