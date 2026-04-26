# SOP-A-05: XỬ LÝ SỰ CỐ BẢO MẬT

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20 | **Chu kỳ:** 1 tháng

---

## 1. PHẠM VI

Áp dụng cho mọi sự cố bảo mật liên quan đến EcoSynTech FarmOS.

## 2. PHÂN LOẠI SỰ CỐ

| Mức độ | Mô tả | Ví dụ | Thời gian phản hồi |
|--------|--------|-------|--------|------------------|
| **CRITICAL** | Đe dọa dữ liệu, hệ thống ngừng | Hacker tấn công, Data breach | 15 phút |
| **HIGH** | Ảnh hưởng nghiêm trọng | Malware, SQL injection | 1 giờ |
| **MEDIUM** | Ảnh hưởng hạn chế | Brute force attempt | 4 giờ |
| **LOW** | Cảnh báo, giám sát | Đăng nhập bất thường | 24 giờ |

## 3. QUY TRÌNH XỬ LÝ

### 3.1 Phase 1: Phát hiện & Đánh giá

```
Bước 1: Nhận cảnh báo từ hệ thống giám sát
       hoặc báo cáo từ người dùng
    ↓
Bước 2: Xác minh sự cố có thật không
    ↓
Bước 3: Phân loại mức độ (CRITICAL/HIGH/MEDIUM/LOW)
    ↓
Bước 4: Báo cáo ngay cho SOC/IT Admin nếu CRITICAL
```

### 3.2 Phase 2: Ngăn chặn

```
Bước 1: Cách ly hệ thống bị ảnh hưởng
    - Block IP độc hại
    - Vô hiệu hóa tài khoảncompromised
    - Tắt services không cần thiết
    ↓
Bước 2: Bảo vệ dữ liệu
    - Backup dữ liệu trước khi thao tác
    - Kiểm tra file integrity
    ↓
Bước 3: Ghi log chi tiết
    - Screenshot, log files, network captures
```

### 3.3 Phase 3: Khắc phục

```
Bước 1: Xác định nguyên nhân gốc rễ
    ↓
Bước 2: Áp dụng biện pháp khắc phục
    ↓
Bước 3: Cập nhật patches/security fixes
    ↓
Bước 4: Verify hệ thống hoạt động bình thường
```

### 3.4 Phase 4: Hồi phục & Cải thiện

```
Bước 1: Khôi phục dịch vụ
    ↓
Bước 2: Giám sát tăng cường (72h đầu)
    ↓
Bước 3: Rà soát toàn bộ hệ thống
    ↓
Bước 4: Cập nhật SOP nếu cần
    ↓
Bước 5: Báo cáo Post-Incident
```

## 4. LIÊN HỆ KHẨN CẤP

| Trường hợp | Liên hệ |
|-----------|--------|
| CRITICAL | IT Admin: [SDT] → CEO: [SDT] |
| HIGH | IT Admin: [SDT] |
| MEDIUM | Team Lead: [SDT] |
| LOW | Ticket support |

## 5. THỜI GIAN XỬ LÝ MỤC TIÊU

| Mức độ | Phát hiện | Ngăn chặn | Khắc phục |
|--------|-----------|-----------|-----------|-----------|
| CRITICAL | 15 phút | 1 giờ | 4 giờ |
| HIGH | 1 giờ | 4 giờ | 24 giờ |
| MEDIUM | 4 giờ | 24 giờ | 72 giờ |
| LOW | 24 giờ | 72 giờ | 7 ngày |

## 6. TÀI LIỆU SAU SỰ CỐ

Mỗi sự cố phải có báo cáo gồm:
- [ ] Timeline chi tiết
- [ ] Nguyên nhân gốc rễ
- [ ] Thiệt hại (nếu có)
- [ ] Biện pháp xử lý
- [ ] Lessons learned
- [ ] Đề xuất cải thiện

## 7. ĐIỂM KIỂM TRA

- [ ] Alert system hoạt động
- [ ] Danh bạ khẩn cấp cập nhật
- [ ] Backup log đầy đủ
- [ ] Review sự cố hàng tháng

---

**Người tạo:** EcoSynTech | **Ngày:** 2026-04-20
**Người duyệt:** | **Ngày duyệt:**

---

## PHỤ LỤC: CHECKLIST KHẨN CẤP

```
☐ Tắt server nginx/apache
☐ Block IP tấn công
☐ Backup logs
☐ Vô hiệu hóa tài khoản nghi Compromised
☐ Check malware
☐ Update passwords
☐ Verify data integrity
```