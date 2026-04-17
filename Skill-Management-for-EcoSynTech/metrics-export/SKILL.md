---
name: metrics-export
description: "Export metrics to Prometheus, Grafana, and external systems"
user-invocable: true
agent: explore
---

# Metrics Export Skill for EcoSynTech-web

Export and sync metrics to external monitoring systems.

## 1. Prometheus Integration

### Push Metrics
```bash
# Push custom metrics
curl -X POST http://localhost:3000/metrics/push \
  -d 'metric_name{label="value"} count'
```

### Prometheus Format
```
# HELP ecosyntech_api_requests_total Total API requests
# TYPE ecosyntech_api_requests_total counter
ecosyntech_api_requests_total 12345

# HELP ecosyntech_device_online_devices Number of online devices
# TYPE ecosyntech_device_online_devices gauge
ecosyntech_device_online_devices 8

# HELP ecosyntech_response_time_ms Average response time
# TYPE ecosyntech_response_time_ms gauge
ecosyntech_response_time_ms 45.2
```

## 2. Grafana Integration

### Dashboard Export
```bash
# Export dashboard JSON
curl -X GET localhost:3000/api/v1/metrics/grafana \
  > dashboards/ecosyntech.json

# Upload to Grafana
grafana-cli dashboards import dashboards/ecosyntech.json
```

### Data Source
```json
{
  "name": "EcoSynTech",
  "type": "prometheus",
  "url": "http://localhost:9090/prometheus",
  "access": "proxy"
}
```

## 3. Custom Metrics

### Business Metrics
- Active devices today
- Total messages processed
- Revenue metrics
- User activity

### Technical Metrics
- Response time p50, p95, p99
- Error rate by endpoint
- Database query time
- MQTT message rate

## 4. Export Scheduling

```yaml
# crontab
*/5 * * * * curl localhost:3000/metrics/prometheus
0 * * * * curl localhost:3000/metrics/hourly
0 0 * * * curl localhost:3000/metrics/daily
```

## 5. Third-Party Export

```bash
# Datadog
curl -X POST "https://api.datadoghq.com/api/v1/series" \
  -H "DD-API-KEY: $DD_KEY" \
  -d '{"series":[{"metric":"ecosyntech.requests","points":[[now,100]]}]}'

# New Relic
curl -X POST "https://insights-collector.newrelic.com/v1/accounts/$ACID/events" \
  -H "X-Insert-Key: $NR_KEY" \
  -d '[{"eventType":"System","requests":100}]'

# InfluxDB
curl -X POST "http://influxdb:8086/write?db=ecosyntech" \
  -d "api_requests,host=server value=100"
```

Execute:

```
## Metrics Export Status

### Prometheus
- Status: ENABLED
- Scrape interval: 5s
- Targets: 1

### Grafana
- Dashboards: 3
- Panels: 24
- Last sync: 10 min ago

### Third-Party
- Datadog: DISABLED
- New Relic: DISABLED
- InfluxDB: DISABLED

### Export Metrics
| Metric | Last Value | Rate |
|--------|-----------|------|
| api_requests | 1,234 | /min |
| device_online | 8 | count |
| response_time | 45ms | avg |
```