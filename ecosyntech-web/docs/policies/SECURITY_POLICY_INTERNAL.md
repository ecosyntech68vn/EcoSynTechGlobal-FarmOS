# CHÍNH SÁCH BẢO MẬT NỘI BỘ
## INTERNAL SECURITY POLICY

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20 | **Người cập nhật:** IT Security

---

## 1. PHẠM VI

Chính sách này áp dụng cho tất cả nhân viên, contractor và đối tác truy cập hệ thống EcoSynTech.

## 2. MỤC TIÊU

- Bảo vệ dữ liệu và hệ thống
- Đảm bảo tuân thủ ISO 27001
- Ngăn chặn truy cập trái phép
- Xử lý sự cố bảo mật nhanh chóng

---

## 3. PHÂN LOẠI DỮ LIỆU

| Cấp độ | Mô tả | Ví dụ |
|---------|-------|-------|
| **PUBLIC** | Có thể share | Website, marketing |
| **INTERNAL** | Nội bộ | Policies, procedures |
| **CONFIDENTIAL** | Hạn chế | Customer data, financials |
| **RESTRICTED** | Cần approval | Keys, credentials, source code |

---

## 4. QUYỀN TRUY CẬP

### 4.1 Phân quyền

| Vai trò | Truy cập |
|--------|---------|
| Guest | View PUBLIC only |
| Employee | INTERNAL |
| Manager | INTERNAL + CONFIDENTIAL |
| Admin | All + RESTRICTED |
| IT Admin | All + System config |

### 4.2 Quy trình cấp quyền

```
1. Yêu cầu bằng email
2. Line manager approve
3. IT cấp quyền
4. Log vào system
5. Review mỗi 90 ngày
```

### 4.3 Thu hồi quyền

- Khi nghỉ việc: Ngay lập tức
- Khi chuyển vị: Review lại
- Khi vi phạm: Tạm khóa

---

## 5. BẢO MẬT MẬT KHẨU

### 5.1 Yêu cầu mật khẩu

- Tối thiểu 12 ký tự
- Chữ hoa + thường + số + ký tự đặc biệt
- Không trùng 5 password cũ
- Thay đổi mỗi 90 ngày

### 5.2 Quản lý mật khẩu

- **KHÔNG** viết password
- **KHÔNG** share password
- Dùng password manager
- 2FA bắt buộc cho admin

### 5.3 Account lockout

| Sự cố | Hành động |
|-------|-----------|
| 5 lần login fail | Khóa 15 phút |
| 10 lần login fail | Khóa 24 giờ |
| Suspected breach | Khóa ngay |

---

## 6. BẢO MẬT THIẾT BỊ

### 6.1 Thiết bị công ty

- Mã hóa disk (BitLocker/FileVault)
- Cập nhật OS hàng tháng
- Antivirus luôn bật
- Khóa màn hình khi rời

### 6.2 Thiết bị cá nhân (BYOD)

- Cài đặt MDM
- Mã hóa storage
- VPN bắt buộc
- Remote wipe nếu mất

### 6.3 Mobile

- Khóa bằng PIN/biometric
- Không cài app không rõ nguồn
- Không lưu credentials

---

## 7. BẢO MẬT MẠNG

### 7.1 Network Segmentation

```
Office Network (LAN)
├── Guest WiFi (isolated)
├── Employee WiFi (encrypted)
└── Server Room (restricted)

Cloud Services
├── Production VPC
├── Development VPC  
└── Backup VPC
```

### 7.2 Firewall Rules

- Block all inbound
- Allow only necessary ports
- Logging tất cả attempts
- Review hàng tuần

### 7.3 WiFi Security

- **Corporate:** WPA3-Enterprise
- **Guest:** WPA2 với captive portal
- **Không** share credentials

---

## 8. BẢO MẬT EMAIL

### 8.1 Email Security

- SPF, DKIM, DMARC
- Phishing filter
- Spoofing protection
- Attachment scanning

### 8.2 Quy định

- Không click link lạ
- Không mở attachment không rõ
- Report phishing ngay
- Không forward bên ngoài

### 8.3 Sensitive Email

- Mã hóa cho CONFIDENTIAL
- Không gửi credentials
- Subject rõ ràng, không kích thích

---

## 9. BẢO MẬT DỮ LIỆU

### 9.1 Mã hóa

| Loại | Phương pháp |
|------|------------|
| At rest | AES-256 |
| In transit | TLS 1.3 |
| Backups | AES-256 + offline |
| Database | Transparent encryption |

### 9.2 Backup

- Encrypt trước khi backup
- Store offline/tự động
- Test restore hàng tháng
- Retain: 30 days

### 9.3 Data disposal

- Wipe trước khi throw
- Destroy đúng cách
- Log disposal

---

## 10. REMOTE WORK

### 10.1 Yêu cầu

- VPN bắt buộc
- 2FA cho VPN
- Home network secure
- Device company policy

### 10.2 Public WiFi

- **KHÔNG** dùng public WiFi
- Dùng VPN always
- Hotspot/tethering

---

## 11. ĐÀO TẠO BẢO MẬT

| Loại | Tần suất |
|------|---------|
| Onboarding | Trước khi bắt đầu |
| Annual | Mỗi năm |
| Phishing sim | Hàng quý |
| Policy update | Khi thay đổi |

---

## 12. VI PHẠM & XỬ LÝ

### 12.1 Vi phạm

| Mức độ | Hành động |
|--------|----------|
| Nhẹ | Cảnh cáo |
| Trung bình | Khóa tạm thời |
| Nặng | Disciplinary |
| Nghiêm trọng | Terminate + Legal |

### 12.2 Báo cáo

- Vi phạm report ngay cho IT Security
- Điều tra trong 24h
- Log tất cả

---

## 13. KIỂM TRA

| Loại | Tần suất |
|------|---------|
| Vulnerability scan | Hàng tháng |
| Penetration test | Hàng quý |
| Access review | Hàng quý |
| Policy compliance | Hàng năm |
| Incident drill | Hàng quý |

---

## PHỤ LỤC

### Liên hệ Security

| | |
|---|---|
| Security team | security@ecosyntech.vn |
| Emergency | [Số] |
| Hotline | [Số] |

### Xác nhận

Tôi đã đọc và đồng ý tuân thủ Chính sách Bảo mật này.

| | |
|---|---|
| Họ tên | _________________ |
| Chữ ký | _________________ |
| Ngày | _________________ |

---

*Document classification: Internal*
*Next review: 2026-10-20*