# SOP-B-03: GIÁM SÁT HỆ THỐNG
# System Monitoring Procedure
# Phiên bản: 5.0.0 | Ngày: 2026-04-20

---

## 1. MỤC ĐÍCH

Đảm bảo hệ thống EcoSynTech FarmOS được giám sát liên tục 24/7 với các cảnh báo kịp thời.

## 2. METRICS THEO DÕI

### 2.1 System Health

| Metric | Threshold | Alert |
|--------|----------|-------|
| Uptime | >99% | N/A |
| Memory Usage | >200MB | Warning |
| CPU Usage | >80% | Warning |
| Disk Usage | >90% | Critical |

### 2.2 API Performance

| Metric | Threshold | Alert |
|--------|----------|-------|
| Response Time (avg) | >500ms | Warning |
| Response Time (p99) | >2000ms | Critical |
| Error Rate | >1% | Warning |
| 5xx Errors | >0 | Critical |

### 2.3 Database

| Metric | Threshold | Alert |
|--------|----------|-------|
| Query Time | >100ms | Warning |
| Connection Pool | >80% | Warning |
| Lock Time | >5s | Critical |

## 3. HEALTH CHECKS

### 3.1 Endpoint Checks (5 phút)

```bash
# Health check
curl -s http://localhost:3000/api/health | jq '.status'

# Database check  
curl -s http://localhost:3000/api/health | jq '.checks.database'

# All services
curl -s http://localhost:3000/api/health
```

### 3.2 Automated Monitoring

| Check | Frequency | Action |
|-------|----------|--------|
| Health API | 5 phút | Alert if failed 3x |
| WebSocket | 5 phút | Reconnect if failed |
| Backup | Daily | Verify file exists |
| Disk space | 1 giờ | Alert if <100MB |

## 4. ALERT CHANNELS

| Channel | Use Case |
|--------|---------|
| Telegram | Critical alerts |
| Console | All logs |
| File | Persistent logs |

## 5. DASHBOARD

**Monitoring URL:** `http://localhost:3000/api/health`

**Stats URL:** `http://localhost:3000/api/stats`

---

*Version: 5.0.0 | Date: 2026-04-20*