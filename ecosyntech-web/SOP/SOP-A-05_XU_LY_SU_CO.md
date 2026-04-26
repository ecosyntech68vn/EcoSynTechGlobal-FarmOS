# SOP-A-05: XỬ LÝ SỰ CỐ BẢO MẬT
# Security Incident Response Procedure
# Phiên bản: 5.0.0 | Ngày: 2026-04-20

---

## 1. MỤC ĐÍCH

Đảm bảo hệ thống EcoSynTech FarmOS có quy trình xử lý các sự cố bảo mật một cách nhanh chóng, hiệu quả và có phương án phục hồi.

## 2. PHÂN LOẠI INCIDENT

| Level | Description | Response Time | Examples |
|--------|-------------|---------------|-----------|
| **Critical** | Data breach, complete system compromise | 15 phút | Hacker渗入, DB leak |
| **High** | Unauthorized access, malware | 1 giờ | Brute force, XSS |
| **Medium** | Attempted breach, policy violation | 4 giờ | Invalid login attempts |
| **Low** | Suspicious activity, warnings | 24 giờ | Unusual patterns |

## 3. QUY TRÌNH XỬ LÝ

```
┌─────────────────────────────────────────────────────────────┐
│  INCIDENT RESPONSE LIFECYCLE                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DETECT ──▶ CONTAIN ──▶ ERADICATE ──▶ RECOVER ──▶ LESSONS   │
│    │            │           │           │           │      │
│    ▼            ▼           ▼           ▼           ▼      │
│  Alerts    Isolate      Clean      Restore   Document      │
│  Logs      Users       Patch      Backup    Review       │
│  Monitor   Network     Update     Services  Update SOP    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 4. CÁC BƯỚC CHI TIẾT

### 4.1 Phát hiện (Detect)

| Nguồn | Công cụ |
|-------|---------|
| System logs | Telegram Alerts |
| API logs | File logging |
| Health checks | /api/health |

### 4.2 Cô lập (Contain)

```
Ngay khi phát hiện sự cố:
1. Thu thập logs (48h gần nhất)
2. Cô lập affected users
3. Disable affected tokens
4. Block suspicious IPs
```

### 4.3 Xóa bỏ (Eradicate)

```
Sau khi contain:
1. Identify root cause
2. Apply fix/patch
3. Verify fix effectiveness
4. Update dependencies
```

### 4.4 Phục hồi (Recover)

```
Sau khi eradicate:
1. Restore from backup (nếu cần)
2. Verify all services
3. Monitor closely 48h
4. Update stakeholders
```

### 4.5 Bài học (Lessons Learned)

```
Post-incident (trong 7 ngày):
1. Document incident timeline
2. Identify improvement areas
3. Update SOPs if needed
4. Schedule security review
```

## 5. CONTACT & ESCALATION

| Level | Contact | Time |
|-------|---------|------|
| **L1** | IT Admin On-Call | 24/7 |
| **L2** | IT Manager | 2h |
| **L3** | CTO / CEO | 30 phút |

**Telegram Channel:** `@ecosyntech-alerts`

## 6. ALERT THRESHOLDS

| Trigger | Action |
|---------|--------|
| 5 login failures | Alert + IP block |
| Database lock >10s | Alert |
| Uncaught exception | Alert + log |
| Disk <100MB | Alert |
| Memory >80% | Warning |

## 7. REPORTING

| Report Type | Frequency | Recipients |
|------------|-----------|------------|
| Incident Summary | Weekly | IT Team |
| Security Metrics | Monthly | Management |
| Compliance Report | Quarterly | Audit |

---

*Version: 5.0.0 | Date: 2026-04-20*