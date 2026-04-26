# Statement of Applicability (SoA) – Telemetry & Observability

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20 | **Chủ sở hữu:** Security

## 1. Mục đích
Xác định các kiểm soát áp dụng cho Observability và Telemetry trong EcoSynTech FarmOS theo ISO 27001:2022.

## 2. Phạm vi áp dụng
- Observability data (logs, traces, metrics), OpenTelemetry, Collector, dashboards, và dữ liệu liên quan thông qua API.

## 3. Kiểm soát áp dụng (gắn với Annex A)
- A.5 Security policies: Đã/ sẽ ban hành policy telemetry và logging.
- A.6 Organization: Roles: Admin, SRE, Security, Auditor; các quyền được phân cấp rõ.
- A.9 Access control: RBAC cho telemetry & dashboards.
- A.12 Operations security: Logging, monitoring, backup, change mgmt, incident mgmt.
- A.13 Communications: TLS/secure transport, network segmentation cho collector.
- A.14 System acquisition: Thiết kế và duy trì telemetry tính an toàn.
- A.15 Supplier relationships: Supplier OTEL collector (và các components) – SLA và posture an toàn.
- A.16 Incident management: IR process cho telemetry incidents.
- A.17 Continuity: DR for telemetry data & collector, failover.
- A.18 Compliance: Dữ liệu telemetry tuân thủ pháp lý và chuẩn audit.

## 4. Tình trạng theo SoA
- Các kiểm soát đang áp dụng: Logging, RBAC, TLS, retention policy (đang xác định).
- Các kiểm soát còn thiếu: policy rõ, SLA cho supplier, DR testing.

## 5. Remediation Plan (ongoing)
- 0-2 tuần: Cài đặt policy telemetry, RBAC và data minimization.
- 2-4 tuần: Thiết lập retention và DR planning, backup.
- 4-6 tuần: Đạt audit readiness cho telemetry; docs và runbooks.

## 6. KPI & Review
- Tỉ lệ tuân thủ SoA, thời gian phản hồi IR, số incidents liên quan telemetry, audit findings.

---
Người chịu trách nhiệm: Security
