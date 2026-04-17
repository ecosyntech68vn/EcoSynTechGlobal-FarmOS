---
name: cache-manager
description: "Manage Redis or in-memory cache"
user-invocable: true
agent: explore
---

# Cache Manager Skill for EcoSynTech

Manage caching for improved performance.

## 1. Redis Setup

```bash
# Install Redis
sudo apt install redis-server

# Start service
sudo systemctl start redis
```

## 2. Cache Commands

```bash
# Set cache
redis-cli SET sensor:temp:1 "25.5" EX 300

# Get cache
redis-cli GET sensor:temp:1

# Delete cache
redis-cli DEL sensor:temp:1

# Clear all cache
redis-cli FLUSHALL
```

## 3. Cache Configuration

```javascript
// config/cache.js
module.exports = {
  redis: {
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD
  },
  ttl: {
    sensor: 300,        // 5 min
    device: 3600,      // 1 hour
    config: 86400      // 24 hours
  }
};
```

## 4. Monitor Cache

```bash
# Cache stats
redis-cli INFO stats

# Memory usage
redis-cli INFO memory

# Key count
redis-cli DBSIZE
```

Execute:

```
## Cache Manager

### Redis Status
- Status: RUNNING
- Keys: 1,234
- Memory: 45MB
- Hit rate: 87%

### Cache Keys
| Type | Keys | TTL |
|------|------|-----|
| sensor | 500 | 5m |
| device | 100 | 1h |
| config | 50 | 24h |

### Actions
[ ] Clear expired keys
[ ] Flush all cache
[ ] Add Redis server
[ ] View cache stats
```