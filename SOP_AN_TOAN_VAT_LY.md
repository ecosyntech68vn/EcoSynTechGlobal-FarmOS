# SOP AN TOÀN VẬT LÝ & MÔI TRƯỜNG

**Mã số:** SOP-ATS-001  
**Phiên bản:** 1.0  
**Ngày ban hành:** 2026-04-19  
**Người lập:** [Để trống]  
**Người duyệt:** Tạ Quang Thuận  
**Ngày duyệt:** [Để trống]

---

## 1. PHẠM VI ÁP DỤNG

SOP này áp dụng cho:
- Trung tâm dữ liệu (server hosting)
- Thiết bị IoT tại trang trại
- Văn phòng làm việc Công ty TNHH Công Nghệ EcoSynTech Global
- Khu vực lưu trữ thiết bị dự phòng

---

## 2. MỤC TIÊU

- Đảm bảo an ninh vật lý cho hệ thống và dữ liệu
- Bảo vệ thiết bị khỏi môi trường và truy cập trái phép
- Tuân thủ ISO 27001:2022 Annex A.11

---

## 3. KHU VỰC AN NINH

### 3.1 Cấp độ an ninh

| Cấp độ | Khu vực | Yêu cầu |
|---------|----------|---------|
| **Level 1** | Server/Cloud | Khóa, camera, kiểm soát ra vào |
| **Level 2** | Kho thiết bị | Khóa, chống cháy |
| **Level 3** | Văn phòng | Khóa cơ bản |
| **Level 4** | Thiết bị ngoài trời | IP67, chống trộm |

### 3.2 Danh sách khu vực

```
Khu vực              | Cấp  | Trách nhiệm        | Hiệu lực
---------------------|-------|-------------------|----------
Server Cloud (AWS/GCP)|   1   | Nhà cung cấp     | Đang áp dụng
Kho thiết bị HQ      |   2   | IT Manager        | Đang áp dụng
Văn phòng chính     |   3   | Admin             | Đang áp dụng
Trang trại khách hàng|   4   | Khách hàng       | Hướng dẫn
```

---

## 4. KIỂM SOÁT RA VÀO

### 4.1 Quy trình vào khu vực Level 1 & 2

```
1. Đăng ký trước 24h qua hệ thống
2. Xác minh danh tính (CCCD/Hộ chiếu)
3. Ký sổ ra vào
4. Nhận thẻ tạm (nếu cần)
5. Escort bởi nhân viên được ủy quyền
6. Ra: Trả thẻ, ký sổ
```

### 4.2 Quyền truy cập

| Vai trò | Level 1 | Level 2 | Level 3 | Level 4 |
|---------|---------|---------|---------|---------|
| Admin | ✅ | ✅ | ✅ | ✅ |
| IT Manager | ✅ | ✅ | ✅ | ❌ |
| Nhân viên IT | ❌ | ✅ | ✅ | ❌ |
| Khách | ❌ | ❌ | ✅ | ❌ |

### 4.3 Thẻ truy cập

- **Thẻ tạm:** Cấp cho khách, hiệu lực 1 ngày
- **Thẻ nhân viên:** Cấp khi làm việc, thu hồi khi nghỉ
- **Mất thẻ:** Báo cáo ngay, khóa trong 1 giờ

---

## 5. BẢO VỆ THIẾT BỊ

### 5.1 Thiết bị tại trang trại (Level 4)

| Yêu cầu | Tiêu chuẩn | Kiểm tra |
|---------|------------|----------|
| Chống nước | IP67 | Xuất xưởng |
| Chống bụi | IP67 | Xuất xưởng |
| Nhiệt độ | -10°C đến 60°C | Test environment |
| Gắn cố định | Neo/bu lông | Lắp đặt |
| Chống trộm | Khóa hoặc dây | Kiểm tra tuần |

### 5.2 Thiết bị tại kho (Level 2)

```
- Kệ chuyên dụng, không xếp chồng
- Cách sàn ≥10cm
- Cách tường ≥20cm  
- Nhiệt độ: 15-30°C
- Độ ẩm: 30-70%
```

### 5.3 Thiết bị di động

- Mã hóa đĩa (BitLocker/FileVault)
- Khóa màn hình tự động (5 phút)
- Không lưu dữ liệu nhạy cảm cục bộ

---

## 6. AN TOÀN MÔI TRƯỜNG

### 6.1 Điều kiện môi trường

| Thông số | Tối thiểu | Tối ưu | Tối đa |
|----------|-----------|---------|---------|
| Nhiệt độ | 10°C | 22°C | 30°C |
| Độ ẩm | 30% | 45% | 70% |
| Ánh sáng | 300 lux | 500 lux | - |

### 6.2 Giám sát

- **Nhiệt độ/Độ ẩm:** Sensor tự động, cảnh báo >28°C hoặc <20°C
- **Nước:** Detector rò rỉ tại server
- **Điện:** UPS backup, generator (nếu có)

### 6.3 Phòng chống cháy

| Khu vực | Thiết bị | Kiểm tra |
|---------|----------|----------|
| Server | Bình CO2, sprinkler | 6 tháng/lần |
| Kho | Bình bột, ABC | 6 tháng/lần |
| Văn phòng | Bình ABC | 12 tháng/lần |

---

## 7. LOẠI BỎ THIẾT BỊ

### 7.1 Quy trình loại bỏ

```
1. Sao lưu dữ liệu (nếu cần)
2. Xóa dữ liệu (format 3 lần hoặc xóa mã hóa)
3. Gỡ bỏ khỏi hệ thống (CMDB)
4. Loại bỏ theo quy định (rác thải điện tử)
5. Lưu chứng từ
```

### 7.2 Trách nhiệm

| Vai trò | Trách nhiệm |
|---------|-------------|
| IT Manager | Xác nhận xóa dữ liệu |
| Admin | Loại bỏ vật lý |
| Security | Giám sát |

---

## 8. KIỂM TRA & ĐÁNH GIÁ

### 8.1 Lịch kiểm tra

| Hạng mục | Tần suất | Người thực hiện |
|-----------|----------|------------------|
| Kiểm tra thẻ ra vào | Hàng ngày | Bảo vệ |
| Kiểm tra camera | Hàng tuần | IT |
| Kiểm tra môi trường | Hàng ngày | Tự động |
| Kiểm tra PCCC | 6 tháng/lần | NT PCCC |
| Đánh giá an ninh | Hàng quý | IT Manager |

### 8.2 Checklist kiểm tra

```
CHECKLIST AN NINH VẬT LÝ - [Ngày]

□ Thẻ truy cập hoạt động bình thường
□ Camera giám sát hoạt động
□ Khóa cửa an toàn
□ Không có người lạ trong khu vực
□ Thiết bị PCCC sẵn sàng
□ Nhiệt độ/Độ ẩm trong ngưỡng
□ UPS hoạt động bình thường
□ Sổ ra vào cập nhật

Người kiểm: _____________ Ngày: _____________
```

---

## 9. SỰ CỐ & ỨNG PHÓ

### 9.1 Phân loại sự cố

| Mức | Loại sự cố | Phản ứng |
|------|------------|----------|
| **Khẩn** | cháy, ngập, trộm | Gọi 114/115 ngay |
| **Cao** | mất điện >4h, hỏng server | Báo cáo IT Manager trong 1h |
| **Trung bình** | khóa cửa hỏng | Sửa trong 24h |
| **Thấp** | thẻ mất | Khóa trong 1h |

### 9.2 Danh bạ khẩn

| STT | Liên hệ | Số điện thoại |
|-----|---------|---------------|
| 1 | IT Manager | [Để trống] |
| 2 | Bảo vệ | [Để trống] |
| 3 | PCCC | 114 |
| 4 | Công an | 113 |

---

## 10. PHỤ LỤC

### Phụ lục A: Biểu mẫu

- BM-ATS-001: Đăng ký ra vào
- BM-ATS-002: Đề nghị cấp thẻ
- BM-ATS-003: Báo cáo sự cố
- BM-ATS-004: Biên bản loại bỏ thiết bị

### Phụ lục B: Danh sách kiểm soát

- DS-ATS-001: Danh sách thẻ truy cập
- DS-ATS-002: Danh sách nhân viên có quyền
- DS-ATS-003: Danh sách thiết bị an ninh

---

## 11. LỊCH SỬ SỬA ĐỔI

| Phiên bản | Ngày | Mô tả | Người sửa |
|-----------|------|-------|-----------|
| 1.0 | 2026-04-19 | Ban hành lần đầu | [Để trống] |

---

**Người lập:** [Để trống]  
**Người duyệt:** Tạ Quang Thuận  
**Ngày duyệt:** [Để trống]  

*Document này là tài sản của Công ty TNHH Công Nghệ EcoSynTech Global - Không sao chép khi chưa được phê duyệt*