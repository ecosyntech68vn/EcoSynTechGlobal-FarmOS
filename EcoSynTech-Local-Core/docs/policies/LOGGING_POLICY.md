# LOGGING POLICY

Version: 1.0 | Date: 2026-04-20 | Owner: Security

## 1. Mục đích
- Đặt tiêu chuẩn cho logging: format, retention, access, và auditing.

## 2. Phạm vi
- Áp dụng cho mọi logs sinh ra từ hệ thống EcoSynTech FarmOS và telemetry stack.

## 3. Yêu cầu kỹ thuật
- Format log: JSON hoặc logfmt, cấu trúc thống nhất.
- Ghi nhận đủ ngữ cảnh (request id, user id, path, status, latency).
- Retention: giữ logs tối thiểu 30 ngày, tối đa 90 ngày hoặc theo quy định pháp luật.
- Bảo mật: encrypt logs khi lưu, access bị kiểm soát bằng RBAC.
- Rotation: có rotation và purge tự động theo policy.

## 4. Quy trình và phân quyền
- Người dùng được phân quyền: Viewer (xem), Maintainer (xem + rotate), Admin (full control).
- Audit trails cho mọi thay đổi trong cấu hình logging.

## 5. Xử lý sự cố & đảm bảo khả năng phục hồi
- Log bảo mật và logs sự cố được lưu trữ và phân tích nhanh.
- Có runbooks để phản ứng khi có sự cố logging (connector down, collector fail).

---
Người sở hữu: Security
