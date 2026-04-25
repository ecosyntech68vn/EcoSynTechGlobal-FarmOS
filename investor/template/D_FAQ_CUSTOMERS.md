# EcoSynTech FarmOS - FAQ Customers
## Câu hỏi Thường gặp

---

## 1. VỀ SẢN PHẨM

### 1.1 Thiết bị có hoạt động khi không có internet không?
**✅ CÓ**

EcoSynTech FarmOS hoạt động **offline hoàn toàn**:
- Controller chạy local trên LAN
- Tưới tự động theo lịch đặt sẵn
- Lưu dữ liệu khi không có internet
- Đồng bộ lên cloud khi có internet

### 1.2 Cần wifi để dùng không?
**Không bắt buộc**, nhưng **nên có** để:
- Xem dữ liệu từ xa qua điện thoại
- Nhận cảnh báo qua Zalo
- Cập nhật firmware tự động

**Không cần internet để:**
- Tưới tự động theo lịch
- Điều khiển bật/tắt thủ công
- Lưu dữ liệu cục bộ

### 1.3 Thiết bị có chống nước không?
**✅ CÓ, IP67**

Controller đạt chuẩn **IP67**:
- Chống bụi hoàn toàn
- Chịu được ngập nước 1m trong 30 phút
- Phù hợp lắp ngoài trời, nhà kho

### 1.4 Bao lâu thì hết pin?
**Không có pin** - thiết bị cắm điện 24/7:
- Nguồn 12V DC (adapter đi kèm)
- Tiêu thụ điện rất thấp: ~0.5W
- Chi phí điện: ~5,000 VND/tháng

---

## 2. VỀ CÀI ĐẶT

### 2.1 Có tự lắp được không?
**✅ CÓ** - Dễ lắp như bộ đèn ngủ!

Thời gian lắp: **30-60 phút**

Video hướng dẫn: [QR Code trong hộp]

Hoặc chúng tôi hỗ trợ lắp đặt **miễn phí** cho pilot customers.

### 2.2 Lắp ở đâu?
Được, miễn là:
- Có nguồn điện 220V gần đó
- Bắt được Wifi (hoặc gần đó)
- Không bị ngập nước

Khu vực hiện tại: Đồng Nai, Bình Dương, Long An

### 2.3 Cần khoan tường không?
**Có** - Bắt controller lên tường:
- 4 lỗ m3
- Tua vít Phillips
- Khoan tường thông thường

Không cần khoan đường dây vì:
- Dùng cáp bọc có sẵn
- Đi dây nổi (bảo vệ bằng ống gen)

---

## 3. VỀ GIÁ

### 3.1 Giá bao gồm những gì?

| Gói | Bao gồm |
|-----|---------|
| Hardware | Controller, cảm biến, nguồn |
| Lắp đặt | Pilot customers: Miễn phí |
| App | Sử dụng miễn phí |
| Bảo hành | 12 tháng |
| Thuê bao | Tùy gói: FREE - 299K/tháng |

### 3.2 Thuê bao hàng tháng là gì?
Là phí để sử dụng **AI và dịch vụ cloud**:
- AI dự đoán thời tiết
- AI phát hiện bệnh cây
- Lưu dữ liệu không giới hạn
- Dashboard nâng cao
- Cảnh báo qua Zalo

**BASE (FREE)**: Chỉ theo dõi, không AI
**PRO trở lên**: Đầy đủ AI features

### 3.3 Có trả góp không?
**Có**, cho hardware:
- Trả trước 50%
- Còn lại chia 3 tháng
- Không lãi suất cho pilot customers

---

## 4. VỀ BẢO HÀNH

### 4.1 Bảo hành bao lâu?
**12 tháng** cho hardware

Nội dung bảo hành:
- Lỗi nhà sản xuất
- Thay mới hoặc sửa miễn phí

Không bảo hành:
- Rơi vỡ, va đập
- Ngập nước quá 30 phút
- Tự ý sửa chữa

### 4.2 Hỏng thì làm sao?
1. Gọi hotline / nhắn Zalo
2. Mô tả lỗi hoặc gửi ảnh
3. Kỹ thuật viên hỗ trợ:
   - **Từ xa**: Hướng dẫn tự sửa
   - **Tại nhà**: Hẹn lịch ghé

Thời gian phản hồi:
- PRO: Trong 48 giờ
- PREMIUM: Trong 24 giờ

### 4.3 Đổi trả được không?
**✅ Có, 30 ngày**

Điều kiện:
- Sản phẩm còn nguyên vẹn
- Đầy đủ phụ kiện
- Có hóa đơn

Liên hệ để làm thủ tục đổi trả.

---

## 5. VỀ HOẠT ĐỘNG

### 5.1 Máy bơm có tự chạy không?
**Có** - khi:
- Độ ẩm đất xuống dưới ngưỡng đặt (VD: <40%)
- Đến giờ tưới theo lịch
- Bạn bật thủ công qua App

### 5.2 Tưới bao lâu một lần?
Tùy cài đặt:
- Mặc định: 15 phút/lần, 2 lần/ngày
- Có thể điều chỉnh: 5-60 phút, 1-4 lần/ngày

### 5.3 Nếu mất điện thì sao?
- Controller có **hardware watchdog** (TPL5010)
- Khi có điện lại → Tự khởi động lại
- Lịch tưới không bị mất (lưu trong EEPROM)
- Cài đặt giữ nguyên

### 5.4 Dữ liệu có bị mất không?
**Không** - Controller lưu:
- Cài đặt: EEPROM (10 năm)
- Dữ liệu 7 ngày: Local storage
- Dữ liệu >7 ngày: Cloud (khi có internet)

---

## 6. VỀ KỸ THUẬT

### 6.1 Wifi yếu có dùng được không?
**Được**, nhưng có thể chậm:
- Xem dữ liệu: Có thể chậm 5-10 giây
- Điều khiển: Có thể chậm 10-20 giây
- Tưới tự động: **Không ảnh hưởng** (chạy local)

### 6.2 Kết nối mấy thiết bị cùng lúc?
App EcoSynTech có thể:
- 1 tài khoản → Nhiều controller
- 1 controller → Nhiều cảm biến
- Xem tất cả farm trên 1 dashboard

### 6.3 Có dùng được với máy bơm lớn không?
**Có** - Relay chịu được:
- 10A 250VAC (2.5kW)
- Phù hợp máy bơm 0.5HP - 1HP

Với máy bơm >1HP, dùng thêm **contactor** (chúng tôi tư vấn).

---

## 7. VỀ AI

### 7.1 AI có đoán chính xác không?
**~80-90%** chính xác:
- Dự đoán thời tiết: 85%
- Phát hiện bệnh: 80%
- Tưới tối ưu: 90%

AI càng **chính xác hơn** khi:
- Dùng càng lâu (học từ dữ liệu)
- Càng nhiều nông dân dùng (federated learning)

### 7.2 AI cần internet để hoạt động không?
**Không** - AI chạy **local trên cloud**:
- Mỗi ngày đồng bộ dữ liệu lên cloud
- Cloud xử lý AI, gửi kết quả về
- Nếu mất internet: Chờ đến khi có lại

---

## 8. THÔNG TIN LIÊN HỆ

| Kênh | Thông tin | Thời gian |
|------|-----------|-----------|
| 📞 Hotline | [Số điện thoại] | 7:00 - 21:00 (T2-T7) |
| 💬 Zalo | [ID Zalo] | 24/7 |
| 🌐 Web | www.ecosyntech.vn | 24/7 |
| 📧 Email | [Email] | Trong 48h |

---

## 9. MỤC LỤC NHANH

```
Câu hỏi phổ biến nhất:

⚡ Có hoạt động không internet?  → Câu 1.1
💰 Giá bao gồm gì?               → Câu 3.1
🔧 Tự lắp được không?             → Câu 2.1
💧 Máy bơm tự chạy không?         → Câu 5.1
🔒 Bảo hành bao lâu?               → Câu 4.1
📱 Hỏi hỗ trợ ở đâu?              → Câu 8.1
```

---

**Document:** FAQ Customers V1.0
**Version:** 1.0
**Date:** 2026-04-25
**Last Updated:** [Date]