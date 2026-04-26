# ISMS Scope – Observability for EcoSynTech FarmOS

Version: 1.0 | Date: 2026-04-20 | Owner: Security

## 1. Mục đích
- Xác định phạm vi quản lý an toàn thông tin cho hệ thống Telemetry/Observability (logs, traces, metrics, dashboards) liên quan đến EcoSynTech FarmOS.

## 2. Phạm vi
- Thành phần thuộc phạm vi: ứng dụng Node.js Express API, OpenTelemetry instrumentation, OpenTelemetry Collector (otelcol), backend logging, và bản ghi/activity trong hệ thống telemetry.
- Không bao gồm dữ liệu cá nhân nhạy cảm ngoài phạm vi quản lý bởi policy hiện tại, trừ khi được phân loại và xử lý theo policy dữ liệu.

## 3. Phạm vi tổ chức & vai trò
- ISMS Owner: Security Lead
- Roles liên quan: Admin, DevOps/SRE, Security Auditor, Compliance
- Quyền trách nhiệm: RBAC cho telemetry access; audit trails; change control cho cấu hình telemetry.

## 4. Ràng buộc pháp lý & tiêu chuẩn liên quan
- ISO/IEC 27001:2022 – Annex A controls: A.5, A.6, A.9, A.12, A.13, A.14, A.15, A.16, A.17, A.18.

## 5. Cấu hình quản trị và xem xét
- Documented policy for telemetry data handling, retention, and masking.
- Data classification for telemetry data with PII handling rules.
- Change management for telemetry configuration (who can change, how, and rollback).
- Logging policy: format (JSON), retention period, encryption where applicable.
- Incident response linkage for telemetry incidents.

## 6. Kế hoạch kiểm soát và cải tiến (PDCA)
- Plan: Xác định scope, assess risks, define controls.
- Do: Implement controls (RBAC, masking, retention, collector config).
- Check: Internal audit, monitoring, KPI.
- Act: cải tiến dựa trên lessons learned, chúng mình sẽ thực hiện theo từng release.

## 7. KPI và Metrics liên quan
- Độ đầy đủ audit trails cho telemetry
- Tỷ lệ dữ liệu telemetry được masking đúng (không chứa PII)
- Thời gian phản hồi và resolution cho sự cố liên quan telemetry
- Số lần phóng thích/không đồng bộ bị lỗi trong pipeline telemetry

---

Người chịu trách nhiệm: Security Lead | Ngày cập nhật: 2026-04-20
