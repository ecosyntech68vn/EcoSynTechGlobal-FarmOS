# SOP QUẢN LÝ NHÀ CUNG CẤP

**Mã số:** SOP-NCC-001  
**Phiên bản:** 1.0  
**Ngày ban hành:** 2026-04-19  
**Người lập:** [Để trống]  
**Người duyệt:** Tạ Quang Thuận  
**Ngày duyệt:** [Để trống]

---

## 1. PHẠM VI ÁP DỤNG

SOP này áp dụng cho tất cả nhà cung cấp:
- Dịch vụ đám mây (AWS, GCP, Azure)
- Dịch vụ hosting/server
- Phần mềm bên thứ ba
- Thiết bị IoT và linh kiện
- Dịch vụ bảo trì/hỗ trợ

---

## 2. MỤC TIÊU

- Đảm bảo nhà cung cấp đáp ứng yêu cầu an ninh
- Quản lý rủi ro từ chuỗi cung ứng
- Tuân thủ ISO 27001:2022 Annex A.15

---

## 3. PHÂN LOẠI NHÀ CUNG CẤP

### 3.1 Cấp độ rủi ro

| Cấp | Loại nhà cung cấp | Ví dụ | Yêu cầu |
|------|-------------------|--------|----------|
| **A - Cao** | Tiếp cận dữ liệu nhạy cảm | AWS, GCP, AI services | Full assessment |
| **B - Trung bình** | Cung cấp phần mềm | SaaS vendors | Basic assessment |
| **C - Thấp** | Cung cấp phần cứng | Thiết bị ESP32 | Self-declaration |

### 3.2 Danh sách nhà cung cấp

| STT | Tên | Loại | Cấp | Hợp đồng | Hết hạn |
|-----|-----|------|-----|----------|----------|
| 1 | AWS/GCP | Cloud | A | Có | [Để trống] |
| 2 | HiveMQ | MQTT Broker | A | Có | [Để trống] |
| 3 | VNG/Zalo | Communication | B | Có | [Để trống] |
| 4 | Espressif | Hardware | C | PO | [Để trống] |

---

## 4. QUY TRÌNH ĐÁNH GIÁ NHÀ CUNG CẤP

### 4.1 Đánh giá lần đầu

```
Bước 1: Thu thập thông tin
  □ Giấy phép kinh doanh
  □ Chứng chỉ bảo mật (ISO 27001, SOC 2)
  □ Chính sách bảo mật
  □ SLA cam kết

Bước 2: Đánh giá rủi ro
  □ Tiếp cận dữ liệu?
  □ Lưu trữ dữ liệu tại VN?
  □ Có đội ngũ hỗ trợ?
  □ Lịch sử sự cố?

Bước 3: Quyết định
  □ Chấp nhận - Cấp B/C
  □ Đàm phán - Cấp A
  □ Từ chối
```

### 4.2 Tiêu chí đánh giá

| Tiêu chí | Trọng số | Điểm tối đa |
|----------|----------|-------------|
| Chứng chỉ bảo mật | 30% | 100 |
| SLA đáp ứng | 25% | 100 |
| Hỗ trợ kỹ thuật | 20% | 100 |
| Giá cả | 15% | 100 |
| Lịch sử hoạt động | 10% | 100 |

**Ngưỡng đánh giá:**
- ≥70 điểm: Chấp nhận
- 50-69 điểm: Đàm phán điều khoản
- <50 điểm: Từ chối

---

## 5. HỢP ĐỒNG VÀ ĐIỀU KHOẢN

### 5.1 Điều khoản bắt buộc (Nhà cung cấp Cấp A)

| Điều khoản | Yêu cầu |
|------------|----------|
| Bảo mật dữ liệu | Cam kết bảo mật dữ liệu |
| Quản lý incident | Thông báo trong 24h |
| Quyền audit | Cho phép đánh giá hàng năm |
| SLA | Cam kết uptime ≥99.9% |
| Chấm dứt | Thông báo 30 ngày, hoàn dữ liệu |
| Bảo hiểm | Có bảo hiểm trách nhiệm |

### 5.2 NDA (Non-Disclosure Agreement)

Tất cả nhà cung cấp Cấp A và B phải ký NDA trước khi ký hợp đồng chính.

### 5.3 Data Processing Agreement (DPA)

Nhà cung cấp Cấp A phải có DPA bao gồm:
- Mục đích xử lý dữ liệu
- Loại dữ liệu được xử lý
- Thời gian lưu trữ
- Quyền của chủ dữ liệu
- Xử lý sự cố

---

## 6. GIÁM SÁT & ĐÁNH GIÁ

### 6.1 Đánh giá định kỳ

| Cấp | Tần suất | Người thực hiện |
|------|----------|------------------|
| A | 6 tháng/lần | IT Manager |
| B | Hàng năm | IT Manager |
| C | 2 năm/lần | Admin |

### 6.2 Theo dõi hiệu suất

| Chỉ số | Mục tiêu | Cảnh báo |
|--------|----------|----------|
| Uptime | ≥99.9% | <99.5% |
| Response time | <4h | >8h |
| SLA compliance | 100% | <95% |
| Security incidents | 0 | ≥1 |

### 6.3 Review hàng năm

```
Nội dung review:
□ Hiệu suất SLA
□ Sự cố đã xảy ra
□ Thay đổi chính sách
□ Cập nhật công nghệ
□ Đề xuất cải tiến
□ Quyết định tiếp tục/tạm dừng
```

---

## 7. QUẢN LÝ RỦI RO

### 7.1 Ma trận rủi ro nhà cung cấp

| Nhà cung cấp | Rủi ro | Xác suất | Tác động | Biện pháp giảm |
|--------------|--------|----------|----------|-----------------|
| AWS/GCP | Dịch vụ down | Thấp | Cao | Multi-region, backup |
| HiveMQ | Data leak | Thấp | Cao | Encryption, monitoring |
| VNG/Zalo | Privacy | Trung bình | Trung bình | Không lưu PII |

### 7.2 Kế hoạch dự phòng

```
□ Backup nhà cung cấp được xác định
□ SLA chuyển đổi được đàm phán
□ Data portability được đảm bảo
□ Exit plan được lập
```

---

## 8. QUẢN LÝ SỰ CỐ

### 8.1 Phản ứng với sự cố nhà cung cấp

```
1. Xác nhận sự cố (15 phút)
2. Đánh giá tác động (30 phút)
3. Thông báo nội bộ (1 giờ)
4. Liên hệ nhà cung cấp (1 giờ)
5. Theo dõi khắc phục (liên tục)
6. Hậu đánh giá (7 ngày)
```

### 8.2 Yêu cầu thông báo

Nhà cung cấp Cấp A phải thông báo trong:
- **Khẩn (Critical):** Ngay lập tức
- **Cao (High):** Trong 4 giờ
- **Trung bình (Medium):** Trong 24 giờ
- **Thấp (Low):** Trong 7 ngày

---

## 9. CHẤM DỨT HỢP ĐỒNG

### 9.1 Quy trình chấm dứt

```
1. Thông báo trước 30-90 ngày
2. Sao lưu dữ liệu
3. Export dữ liệu (định dạng chuẩn)
4. Xác nhận xóa dữ liệu
5. Đóng tài khoản
6. Hoàn tất thanh toán
7. Lưu trữ hồ sơ (5 năm)
```

### 9.2 Checklists chấm dứt

```
□ Thông báo chính thức gửi nhà cung cấp
□ Sao lưu đầy đủ dữ liệu
□ Xác nhận export thành công
□ Xác nhận xóa dữ liệu ( письменное)
□ Hủy quyền truy cập
□ Đóng tài khoản thanh toán
□ Lưu hồ sơ pháp lý
```

---

## 10. DANH BẠ & TRÁCH NHIỆM

### 10.1 Trách nhiệm

| Vai trò | Trách nhiệm |
|---------|-------------|
| IT Manager | Đánh giá, ký hợp đồng Cấp A |
| Admin | Quản lý hợp đồng Cấp B/C |
| Finance | Thanh toán, đánh giá tài chính |
| Legal | Review pháp lý |

### 10.2 Liên hệ

| STT | Nhà cung cấp | SLAContact | Support |
|-----|---------------|------------|---------|
| 1 | AWS | [Để trống] | support@aws.amazon.com |
| 2 | GCP | [Để trống] | support.google.com |
| 3 | HiveMQ | [Để trống] | hivemq.com/support |

---

## 11. PHỤ LỤC

### Phụ lục A: Mẫu đánh giá NCC
- Mẫu NCC-001: Bảng câu hỏi đánh giá
- Mẫu NCC-002: Phiếu đánh giá
- Mẫu NCC-003: Biên bản đánh giá

### Phụ lục B: Checklist hợp đồng
- Checklist NDA
- Checklist DPA
- Checklist SLA

---

## 12. LỊCH SỬ SỬA ĐỔI

| Phiên bản | Ngày | Mô tả | Người sửa |
|-----------|------|-------|-----------|
| 1.0 | 2026-04-19 | Ban hành lần đầu | [Để trống] |

---

**Người lập:** [Để trống]  
**Người duyệt:** Tạ Quang Thuận  
**Ngày duyệt:** [Để trống]  

*Document này là tài sản của Công ty TNHH Công Nghệ EcoSynTech Global*