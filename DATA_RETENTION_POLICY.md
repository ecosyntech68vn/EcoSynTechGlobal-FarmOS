# CHÍNH SÁCH LƯU TRỮ VÀ XÓA DỮ LIỆU
## DATA RETENTION POLICY

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20 | **Người cập nhật:** IT & Legal

---

## 1. MỤC ĐÍCH

- Đảm bảo dữ liệu được lưu trữ đủ lâu theo quy định pháp luật
- Xóa dữ liệu khi không còn cần thiết
- Bảo vệ quyền riêng tư
- Tối ưu chi phí lưu trữ

---

## 2. PHẠM VI

Áp dụng cho tất cả dữ liệu:
- Customer data
- Employee data
- Financial data
- System logs
- Communications
- Backups

---

## 3. PHÂN LOẠI DỮ LIỆU

### 3.1 Theo loại

| Loại | Mô tả | Ví dụ |
|------|-------|-------|
| **PII** | Thông tin cá nhân | Name, email, phone |
| **Sensitive** | Nhạy cảm | Health, financials |
| **Proprietary** | Độc quyền | Source code, IP |
| **Public** | Công khai | Website content |

### 3.2 Theo nguồn

| Nguồn | Mô tả |
|--------|-------|
| Customer | Từ khách hàng |
| Employee | Từ nhân viên |
| System | Từ hệ thống |
| Third-party | Từ đối tác |

---

## 4. THỜI GIAN LƯU TRỮ

### 4.1 Dữ liệu khách hàng

| Loại dữ liệu | Thời gian | Cơ sở |
|-------------|-----------|--------|
| Account info | 5 năm sau terminate | Thuế |
| Transaction | 10 năm | Kế toán |
| Sensor data | 30-365 ngày | SLA |
| Communications | 3 năm | Pháp luật |
| Support tickets | 5 năm | Hợp đồng |

### 4.2 Dữ liệu nhân viên

| Loại dữ liệu | Thời gian | Cơ sở |
|-------------|-----------|--------|
| Hồ sơ tuyển dụng | 1 năm sau nghỉ | Lao động |
| Hồ sơ lương | 10 năm | Kế toán |
| Performance review | 5 năm | Lao động |
| Training records | 3 năm | ISO |
| Benefits | 5 năm sau nghỉ | Bảo hiểm |

### 4.3 Dữ liệu tài chính

| Loại dữ liệu | Thời gian | Cơ sở |
|-------------|-----------|--------|
| Hóa đơn | 10 năm | Thuế |
| Báo cáo tài chính | 10 năm | Kế toán |
| Hợp đồng | 10 năm sau hết hạn | Pháp luật |
| Bank statements | 10 năm | Thuế |
| Tax returns | 10 năm | Thuế |

### 4.4 Dữ liệu hệ thống

| Loại dữ liệu | Thời gian | Cơ sở |
|-------------|-----------|--------|
| System logs | 90 ngày | Security |
| Access logs | 1 năm | Security |
| Security events | 1 năm | ISO 27001 |
| Backups | 30 ngày | Operations |
| Archives | 1 năm | Business |

### 4.5 Dữ liệu marketing

| Loại dữ liệu | Thời gian | Cơ sở |
|-------------|-----------|--------|
| Lead data | 2 năm không hoạt động | GDPR/PDP |
| Analytics | 2 năm | Analytics |
| Campaign data | 2 năm | Marketing |

---

## 5. QUY TRÌNH XÓA DỮ LIỆU

### 5.1 Xóa định kỳ

```
Schedule:
├── Daily: Temp files, caches
├── Weekly: Old logs
├── Monthly: Expired customer data
├── Quarterly: Review retention
└── Annually: Archive audit
```

### 5.2 Xóa yêu cầu

**Khi khách hàng yêu cầu:**
1. Verify identity
2. Confirm data scope
3. Remove from production
4. Verify backup removal
5. Confirm to customer

**Thời gian:** Theo PDP (30 ngày)

### 5.3 Xóa khi hết hạn

```
Expiration process: (Monthly)
├── 1. Identify expired data
├── 2. Create list
├── 3. Manager approval
├── 4. securely delete
├── 5. Verify deletion
├── 6. Log to audit trail
└── 7. Report
```

---

## 6. YÊU CẦU KỸ THUẬT

### 6.1 Secure deletion

| Loại dữ liệu | Phương pháp |
|-------------|-----------|
| Database | Overwrite + delete |
| Files | DoD 5220.22-M 3-pass |
| SSD | Crypto wipe |
| Backups | Delete + verify |
| Tape | Degauss |

### 6.2 Verification

- Verify deletion completes
- Confirm no backup copies
- Test restore (nếu cần)
- Log all deletions

---

## 7. NGOẠI LỆ

### 7.1 Legal hold

Khi có yêu cầu pháp lý:
- **KHÔNG XÓA** dữ liệu liên quan
- Extend retention vô thời hạn
- Document legal hold

### 7.2 Ongoing litigation

- Legal hold cho tất cả related data
- IT notified ngay
- Extend đến khi resolve

---

## 8. TRÁCH NHIỆM

| Vai trò | Trách nhiệm |
|--------|------------|
| **Data Owner** | Define retention |
| **IT** | Execute deletion |
| **Legal** | Ensure compliance |
| **Security** | Verify deletion |
| **HR** | Employee data |

---

## 9. REPORTING

| Báo cáo | Tần suất | Người nhận |
|---------|----------|------------|
| Deletion log | Hàng ngày | IT |
| Compliance report | Hàng quý | Legal + Management |
| Audit report | Hàng năm | Board |

---

## 10. CHECKLIST

- [ ] Inventory all data types
- [ ] Define retention periods
- [ ] Configure auto-deletion
- [ ] Train IT staff
- [ ] Test deletion process
- [ ] Document exceptions
- [ ] Annual review

---

*Document classification: Internal*
*Next review: 2026-10-20*