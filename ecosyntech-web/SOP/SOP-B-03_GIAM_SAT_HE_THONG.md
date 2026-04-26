# SOP-B-03: GIÁM SÁT HỆ THỐNG

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20 | **Chu kỳ:** 1 giờ

---

## 1. PHẠM VI

Áp dụng cho việc giám sát EcoSynTech FarmOS trong quá trình vận hành.

## 2. CÁC THAM SỐ GIÁM SÁT

### 2.1 System Resources

| Tham số | Ngưỡng cảnh báo | Ngưỡng nghiêm trọng |
|---------|-----------------|---------------------|
| CPU Usage | > 70% | > 90% |
| Memory Usage | > 75% | > 90% |
| Disk Usage | > 80% | > 95% |
| Load Average | > số core | > 2x core |

### 2.2 Application

| Tham số | Ngưỡng cảnh báo | Ngưỡng nghiêm trọng |
|---------|-----------------|---------------------|
| Response Time | > 2s | > 5s |
| Error Rate | > 1% | > 5% |
| Active Connections | > 80 max | > 100 max |
| Queue Length | > 10 | > 50 |

### 2.3 IoT Devices

| Tham số | Ngưỡng cảnh báo | Ngưỡng nghiêm trọng |
|---------|-----------------|---------------------|
| Offline Devices | > 5% | > 20% |
| Missing Data | > 10 phút | > 30 phút |
| Failed Commands | > 5% | > 15% |

## 3. CÔNG CỤ GIÁM SÁT

### 3.1 API Endpoints

```
Health Check:
    GET /api/health

System Status:
    GET /api/system/status

Device Stats:
    GET /api/devices/stats

Performance:
    GET /api/performance
```

### 3.2 PM2 Monitoring

```
Xem processes:
    pm2 list

Xem logs:
    pm2 logs ecosyntech --lines 50 --nostream

Xem real-time:
    pm2 monit
```

### 3.3 Logs

```
Xem logs realtime:
    tail -f logs/combined.log

Xem errors:
    tail -f logs/error.log

Search logs:
    grep "ERROR" logs/combined.log | tail -50
```

## 4. QUY TRÌNH GIÁM SÁT

### 4.1 Giám sát thường xuyên

| Tần suất | Hành động |
|---------|----------|
| Mỗi 15 phút | Check /api/health |
| Mỗi 1 giờ | Check system resources |
| Mỗi 4 giờ | Review error logs |
| Hàng ngày | Review daily stats |

### 4.2 Automated Alerts

Hệ thống tự động cảnh báo khi:
- [ ] Health endpoint trả về non-200
- [ ] CPU > 90% trong 5 phút
- [ ] Memory > 90%
- [ ] Disk > 95%
- [ ] > 10% devices offline
- [ ] Unusual error spike

### 4.3 Manual Check

```
Check mỗi ca (8 tiếng):
1. Truy cập /api/health
2. Check PM2 status
3. Review recent errors
4. Check device online count
5. Verify data coming in
```

## 5. CÁC VẤN ĐỀ THƯỜNG GẶP

### 5.1 High CPU

```
Nguyên nhân:
- Too many requests
- Infinite loop
- Memory leak

Xử lý:
1. Check pm2 top
2. Identify process
3. Restart if needed: pm2 restart ecosyntech
```

### 5.2 Memory Leak

```
Nguyên nhân:
- Unreleased cache
- Growing data structures

Xử lý:
1. Check memory usage over time
2. Restart daily if needed
3. Review code for leaks
```

### 5.3 Devices Offline

```
Nguyên nhân:
- Network issues
- Device power off
- Firmware crash

Xử lý:
1. Check device logs
2. Ping devices
3. Restart device if needed
4. Update firmware if needed
```

## 6. DASHBOARD GIÁM SÁT

### 6.1 Built-in Dashboard

```
Truy cập:
    http://<server>:3000/api/dashboard

Hoặc:
    http://<server>:3000 (PWA)
```

### 6.2 Metrics Export

```
Export metrics:
    GET /api/metrics

System info:
    GET /api/system/info
```

## 7. BÁO CÁO

### 7.1 Daily Report

Mỗi ngày cần tổng hợp:
- Uptime
- Error count
- Device status
- Response time avg
- Data throughput

### 7.2 Weekly Report

- System performance trends
- Incident summary
- Capacity planning
- Security events

## 8. ĐI��M KIỂM TRA

- [ ] Health check tự động hoạt động
- [ ] Alerts được gửi đúng
- [ ] Logs đầy đủ
- [ ] Dashboard accessible
- [ ] Reports generated

---

**Người tạo:** EcoSynTech | **Ngày:** 2026-04-20
**Người duyệt:** | **Ngày duyệt:**

---

## APPENDIX: QUICK COMMANDS

```bash
# Health check
curl http://localhost:3000/api/health

# System status  
curl http://localhost:3000/api/system/status

# Check PM2
pm2 list

# Check logs
pm2 logs ecosyntech --lines 20

# Restart
pm2 restart ecosyntech
```