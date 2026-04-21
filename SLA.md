# THỎA THUẬN MỨC DỊCH VỤ (SLA - SERVICE LEVEL AGREEMENT)

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20

---

## 1. TỔNG QUAN

### 1.1 Mục đích

Thỏa thuận này xác định mức dịch vụ tối thiểu mà EcoSynTech cam kết cung cấp cho khách hàng.

### 1.2 Phạm vi

Áp dụng cho tất cả các dịch vụ FarmOS bao gồm:
- Web Application
- API Services
- Mobile App (nếu có)
- MQTT Broker
- WebSocket Services

## 2. CAM KẾT MỨC DỊCH VỤ

### 2.1 Uptime (Thời gian hoạt động)

| Gói dịch vụ | Uptime cam kết | Downtime tối đa/tháng |
|-------------|----------------|----------------------|
| Starter | 99.0% | 7.3 giờ |
| Professional | 99.5% | 3.6 giờ |
| Enterprise | 99.9% | 43 phút |

**Công thức tính Uptime:**
```
Uptime % = (Tổng thời gian - Thời gian downtime) / Tổng thời gian × 100
```

### 2.2 Thời gian phản hồi

| Loại yêu cầu | Starter | Professional | Enterprise |
|--------------|---------|--------------|------------|
| API Response | < 500ms | < 200ms | < 100ms |
| Page Load | < 3s | < 2s | < 1s |
| WebSocket | < 1s | < 500ms | < 200ms |

### 2.3 Hỗ trợ kỹ thuật

| Tiêu chí | Starter | Professional | Enterprise |
|----------|---------|--------------|------------|
| Kênh hỗ trợ | Email | Email, Ticket | Email, Ticket, Phone |
| Giờ hỗ trợ | 8h-17h (T2-T6) | 8h-20h (T2-T7) | 24/7 |
| Thời gian phản hồi | 48h | 24h | 4h |
| Thời gian xử lý | 72h | 48h | 24h |

## 3. BẢO TRÌ HỆ THỐNG

### 3.1 Bảo trì theo kế hoạch

| Loại | Tần suất | Thông báo | Downtime |
|------|---------|----------|----------|
| Cập nhật nhỏ | Hàng tuần | 24h trước | < 30 phút |
| Cập nhật lớn | Hàng tháng | 7 ngày trước | < 2 giờ |
| Bảo trì lớn | Hàng quý | 30 ngày trước | < 4 giờ |

### 3.2 Bảo trì khẩn cấp

- Không cần thông báo trước
- Thông báo trong vòng 1 giờ sau khi hoàn thành
- Cố gắng giảm thiểu downtime

## 4. GIỚI HẠN VÀ LOẠI TRỪ

### 4.1 Không tính vào Uptime

- Bảo trì theo kế hoạch (đã thông báo)
- Lỗi từ bên thứ ba (DNS, ISP)
- Lỗi do khách hàng (config sai, quá tải)
- Force majeure (thiên tai,停电 lớn)
- DDoS tấn công

### 4.2 Giới hạn sử dụng

| Tài nguyên | Starter | Professional | Enterprise |
|------------|---------|--------------|------------|
| API calls/tháng | 10,000 | 100,000 | Unlimited |
| Thiết bị | 10 | 50 | 100+ |
| Users | 5 | 20 | 100+ |
| Storage | 1GB | 10GB | 100GB |

## 5. BỒI THƯỜNG

### 5.1 Điều kiện bồi thường

Khi Uptime thực tế thấp hơn cam kết:

| Uptime thực tế | Bồi thường |
|----------------|------------|
| 98% - 99% | 10% tháng |
| 95% - 98% | 25% tháng |
| < 95% | 50% tháng |

### 5.2 Hình thức bồi thường

- Giảm phí tháng tiếp theo
- Không hoàn tiền trực tiếp
- Tối đa 100% giá trị tháng

### 5.3 Yêu cầu bồi thường

- Gửi yêu cầu trong vòng 30 ngày
- Cung cấp logs, screenshots
- EcoSynTech xác nhận trong 7 ngày

## 6. GIÁM SÁT VÀ BÁO CÁO

### 6.1 Công cụ giám sát

- **Status Page**: status.ecosyntech.vn
- **API Health**: /api/health
- **Monitoring**: Tự động gửi alert

### 6.2 Báo cáo

| Loại báo cáo | Tần suất | Nội dung |
|--------------|---------|----------|
| Uptime | Hàng tháng | % uptime, downtime |
| Usage | Hàng tháng | API calls, storage |
| Incidents | Khi có sự cố | Root cause, resolution |

## 7. QUẢN LÝ SỰ CỐ

### 7.1 Phân loại sự cố

| Mức độ | Mô tả | Phản hồi | Xử lý |
|--------|-------|----------|-------|
| **Critical** | Hệ thống down | 15 phút | 4 giờ |
| **High** | Chức năng chính lỗi | 1 giờ | 8 giờ |
| **Medium** | Chức năng phụ lỗi | 4 giờ | 24 giờ |
| **Low** | Lỗi nhỏ | 24 giờ | 72 giờ |

### 7.2 Quy trình xử lý

```
1. Phát hiện sự cố (tự động hoặc báo cáo)
2. Thông báo cho khách hàng trong 15 phút
3. Xác định nguyên nhân
4. Áp dụng biện pháp khắc phục
5. Khôi phục dịch vụ
6. Báo cáo Post-Incident
```

## 8. HỖ TRỢ VÀ LIÊN HỆ

| | Email | Điện thoại |
|---|-------|------------|
| **Hỗ trợ** | support@ecosyntech.vn | [Số] |
| **Kỹ thuật** | tech@ecosyntech.vn | [Số] |
| **Sales** | sales@ecosyntech.vn | [Số] |

## 9. THAY ĐỔI SLA

- Thông báo trước 60 ngày
- Áp dụng từ kỳ thanh toán mới
- Có thể hủy hợp đồng nếu không đồng ý

---

**Xác nhận đồng ý SLA**

| | |
|---|---|
| **Khách hàng** | **EcoSynTech** |
| | |
| Họ tên: _________________ | Đại diện: _________________ |
| Chức vụ: _________________ | Chức vụ: _________________ |
| Ngày: _________________ | Ngày: _________________ |
| Ký & Đóng dấu: | Ký & Đóng dấu: |