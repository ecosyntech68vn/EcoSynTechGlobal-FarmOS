---
name: auto-scale
description: "Auto-scale and optimize EcoSynTech resources"
user-invocable: true
agent: explore
---

# Auto-Scale Skill for EcoSynTech-web

Automatic resource management and scaling.

## 1. Auto-Scale Triggers
- CPU > 80% for 5 min → scale up
- Memory > 90% for 3 min → scale up
- Request queue > 100 → scale up

## 2. Scale Actions
```bash
# Scale PM2 workers
pm2 scale ecosyntech 4

# Add Redis cache
redis-server --maxmemory 256mb

# Enable clustering
node --cluster server.js
```

## 3. Scale Down (low traffic)
- CPU < 20% for 30 min → scale down
- Memory < 40% for 30 min → scale down

## 4. Optimization Actions
```bash
# Enable gzip compression
# Cache static assets
# Database query optimization
# Connection pooling
```

## 5. Load Balancing
- Round-robin distribution
- Health-based routing
- Geographic routing

## Execution

Monitor and apply optimizations:

```
## Auto-Scale Report

### Current Load
- CPU: 65%
- Memory: 512MB / 1024MB
- Requests: 450/min
- Response: 45ms

### Scaling Decision
[ ] Scale UP - workers: 2 → 4
[ ] Scale DOWN - workers: 2 → 1
[ ] Add CACHE - Redis
[ ] Optimize DB

### Auto-Scale Status
- Enabled: YES
- Min workers: 1
- Max workers: 8
- Scale-up threshold: 80%
- Scale-down threshold: 20%
```

Apply scaling with safety limits:
- Never scale above 8 workers
- Always keep 1 minimum
- 5 min cooldown between scalings