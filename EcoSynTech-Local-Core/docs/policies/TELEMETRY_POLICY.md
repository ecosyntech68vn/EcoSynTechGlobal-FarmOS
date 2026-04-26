# TELEMETRY DATA POLICY

Version: 1.0 | Date: 2026-04-20 | Owner: Security

## 1. Mục đích
- Đảm bảo thu thập, lưu trữ, và xử lý telemetry data (logs, traces, metrics) an toàn và tuân thủ ISO 27001:2022.

## 2. Phạm vi
- Áp dụng cho mọi telemetry data thu thập bởi EcoSynTech FarmOS (SDK OpenTelemetry, Collector, dashboards, logs và metrics).

## 3. Phân loại dữ liệu
- Public: dữ liệu có thể chia sẻ công khai và không chứa PII/nhạy cảm.
- Internal: dữ liệu nội bộ có giới hạn người xem.
- Confidential: dữ liệu nhạy cảm hoặc liên quan khách hàng (PII/anonymized hoặc masked khi log).

## 4. Quản trị dữ liệu
- Data minimization: thu thập tối thiểu dữ liệu cần thiết cho vận hành và monitoring.
- Masking/Redaction: log/traces phải loại bỏ/che dữ liệu nhạy cảm (PII) trước khi lưu hoặc xuất logs.
- Access control: RBAC cho xem/ghi telemetry dashboards và logs.
- Encryption: dữ liệu truyền (TLS) và dữ liệu lưu (at rest) khi có sẵn.
- Retention: retention policy cho logs/traces (ví dụ 30–90 ngày cho logs, theo quy định pháp lý cho dữ liệu lâu hơn).
- Audit: logging of access/changes đối với telemetry configs và collectors.

## 5. Vận hành an toàn
- Incident response liên quan telemetry: IR playbook cho telemetry incidents.
- Vendor/supplier controls: đảm bảo các nhà cung cấp liên quan (collector, exporters) đáp ứng tiêu chuẩn bảo mật.

## 6. Đánh giá và cải tiến
- Định kỳ đánh giá policy (quarterly hoặc sau sự cố) và điều chỉnh.

---
Người sở hữu: Security
