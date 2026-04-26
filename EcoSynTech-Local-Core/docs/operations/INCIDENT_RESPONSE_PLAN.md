# KẾ HOẠCH ỨNG CỨU SỰ CỐ
## INCIDENT RESPONSE PLAN

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20 | **Người cập nhật:** IT Security

---

## 1. TỔNG QUAN

### 1.1 Mục đích

- Phản ứng nhanh và hiệu quả với sự cố
- Giảm thiệt hại và thời gian downtime
- Khôi phục hoạt động bình thường
- Đảm bảo tuân thủ pháp luật

### 1.2 Phạm vi

- Tất cả sự cố CNTT
- An ninh mạng
- Dữ liệu
- Thiết bị

---

## 2. ĐỘI NGŨ ỨNG CỨU

### 2.1 CSIRT (Computer Security Incident Response Team)

| Vai trò | Người | Liên hệ | Dự phòng |
|--------|-------|--------|----------|
| **Team Lead** | IT Manager | [Số] | [Dự phòng] |
| **Technical** | Security Engineer | [Số] | [Dự phòng] |
| **Technical** | System Admin | [Số] | [Dự phòng] |
| **Communication** | HR/Comms | [Số] | [Dự phòng] |
| **Legal** | Legal Counsel | [Số] | [Dự phòng] |

### 2.2 Liên hệ khẩn cấp

```
CSIRT Hotline: [Số]
CEO: [Số]
External: [Số] (Forensic company)
```

---

## 3. PHÂN LOẠI SỰ CỐ

### 3.1 Mức độ nghiêm trọng

| Mức | Tiêu chí | Ví dụ | SLA Phản hồi |
|------|----------|-------|-------------|--------------|
| **P1 - CRITICAL** | Ảnh hưởng toàn hệ thống | Ransomware, Data breach | 15 phút |
| **P2 - HIGH** | Ảnh hưởng nhiều người | Malware, DDoS | 1 giờ |
| **P3 - MEDIUM** | Ảnh hưởng hạn chế | Phishing, Account compromised | 4 giờ |
| **P4 - LOW** | Ảnh hưởng nhỏ | Attempts, Probe | 24 giờ |

### 3.2 Loại sự cố

| Mã | Loại sự cố |
|----|-----------|
| SEC-01 | Malware/Ransomware |
| SEC-02 | Phishing |
| SEC-03 | Unauthorized access |
| SEC-04 | Data breach |
| SEC-05 | DDoS |
| SEC-06 | Insider threat |
| SEC-07 | Physical security |
| SEC-08 | System failure |

---

## 4. QUY TRÌNH ỨNG CỨU

### 4.1 Phase 1: Chuẩn bị (Preparation)

**Trước khi có sự cố:**

- [ ] Xây dựng CSIRT
- [ ] Định nghĩa qui trình
- [ ] Chuẩn bị tools
- [ ] Training định kỳ
- [ ] Diễn tập 6 tháng/lần

### 4.2 Phase 2: Phát hiện (Detection)

```
Nguồn phát hiện:
├── SIEM/IDS alerts
├── User reports
├── Automated monitoring
└── External notifications
```

**Hành động:**
1. Xác minh sự cố có thật
2. Phân loại mức độ
3. Kích hoạt CSIRT nếu P1-P2

### 4.3 Phase 3: Ngăn chặn (Containment)

**Short-term containment (ngay):**
- Isolate affected systems
- Block attack vectors
- Preserve evidence

**Long-term containment (sau đó):**
- Patch vulnerabilities
- Harden systems
- Enhanced monitoring

### 4.4 Phase 4: Xóa bỏ (Eradication)

1. Identify root cause
2. Remove malware/backdoors
3. Patch vulnerabilities
4. Verify clean

### 4.5 Phase 5: Khôi phục (Recovery)

1. Restore from clean backup
2. Verify system integrity
3. Gradual restoration
4. Monitor enhanced

### 4.6 Phase 6: Học hỏi (Lessons Learned)

- Post-incident review trong 7 ngày
- Cập nhật documentation
- Improve defenses
- Update training

---

## 5. CHECKLIST THEO MỨC ĐỘ

### 5.1 P1 - CRITICAL

```
□ Kích hoạt CSIRT trong 15 phút
□ Thông báo CEO trong 30 phút
□ Isolate affected systems ngay
□ Preserve all logs
□ Contact forensic (nếu cần)
□ Legal notification (nếu data breach)
□ Customer notification (nếu cần)
□ Media handling (nếu cần)
□ Full incident report trong 48h
```

### 5.2 P2 - HIGH

```
□ Kích hoạt CSIRT trong 1 giờ
□ IT Manager notify trong 2 giờ
□ Containment trong 4 giờ
□ Root cause analysis trong 24h
□ Report trong 72h
```

### 5.3 P3 - MEDIUM

```
□ Assign to analyst
□ Investigate trong 24h
□ Containment trong 48h
□ Report trong 1 tuần
```

### 5.4 P4 - LOW

```
□ Log incident
□ Investigate trong 1 tuần
□ Resolution trong 2 tuần
□ Monthly summary
```

---

## 6. COMMUNICATION PLAN

### 6.1 Internal

| Sự cố | Thông báo |
|-------|-----------|
| P1 | CSIRT + CEO + Board |
| P2 | CSIRT + IT Manager |
| P3 | IT Team |
| P4 | Log only |

### 6.2 External

| Sự cố | Thông báo |
|-------|-----------|
| Data breach | 72h theo Nghị định 13/2023 |
| Service down | Customer notification |
| Media inquiry | PR/Comms handle |

### 6.3 Templates

**Internal notification:**
```
[URGENT] Incident SEC-[ID] - [Title]
Severity: [P1-P4]
Status: [Investigating/Containment/Eradication/Recovery]
Timeline:
- [Time] - [Action]
- [Time] - [Action]
Next update: [Time]
```

**Customer notification:**
```
[IMPORTANT] Service Notification - [Date]

Dear Customer,

We are experiencing a service disruption. Our team is actively working to resolve this issue.

Impact: [Description]
Resolution ETA: [Time]
Updates: [URL]

We apologize for any inconvenience.

Best regards,
EcoSynTech Team
```

---

## 7. TOOLS VÀ RESOURCES

### 7.1 Tools

| Tool | Purpose |
|------|---------|
| SIEM | Detection & correlation |
| EDR | Endpoint detection |
| NIDS | Network monitoring |
| Forensic kit | Evidence collection |
| Backup | Recovery |

### 7.2 Contact list

```
Hardware vendor: [Số]
ISP: [Số]
Cloud provider: [Số]
Forensic company: [Số]
Legal counsel: [Số]
Insurance: [Số]
```

---

## 8. TESTING & TRAINING

| Hoạt động | Tần suất |
|----------|---------|
| tabletop exercise | Hàng quý |
| Full simulation | Hàng năm |
| Technical training | Hàng tháng |
| Phishing simulation | Hàng quý |

---

## 9. POST-INCIDENT CHECKLIST

- [ ] Root cause identified
- [ ] Impact documented
- [ ] Lessons learned
- [ ] Action items created
- [ ] Policy updated
- [ ] Training updated
- [ ] CSIRT performance reviewed

---

## 10. METRICS

| Metric | Target |
|--------|--------|
| Detection time | < 15 phút |
| Response time P1 | < 15 phút |
| Containment time | < 4 giờ |
| Recovery time | < 24 giờ |
| False positive rate | < 20% |

---

*Document classification: Internal*
*Next review: 2026-10-20*
*Next drill: 2026-07-20*