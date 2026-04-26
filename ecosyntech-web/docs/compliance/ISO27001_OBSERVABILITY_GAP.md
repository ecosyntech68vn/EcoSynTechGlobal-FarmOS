# ISO 27001 Gap Analysis – Observability (Telemetry) for EcoSynTech FarmOS

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20

## Mục tiêu
- Đảm bảo các hoạt động telemtry, logging, và observability tuân thủ yêu cầu an toàn thông tin theo ISO 27001:2022.
- Đảm bảo kiểm soát truy cập, bảo mật dữ liệu, and khả năng giám sát/dò lỗi liên quan đến telemetry và hình thức thu thập dữ liệu từ hệ thống.

## Phạm vi
- Tất cả thành phần liên quan tới Observability: OpenTelemetry setup,Collector, Prometheus/Grafana (nếu có), logs, và dashboards liên quan đến API & hệ thống.

## Các kiểm soát ISO 27001 liên quan (Annex A)
- A.5 Security policies: Chính sách an toàn cho telemetry data và logging.
- A.6 Organization of information security: Vai trò, phân công trách nhiệm cho Observability (SPoC secure logging, SRE, DevOps).
- A.9 Access control: RBAC cho telemetry data và dashboards; giới hạn ai được xem/ghi/điều chỉnh.
- A.12 Operations security: Logging, monitoring, change management, backup & restore, performance tuning.
- A.13 Communications security: TLS/HTTPS và secure transport cho data telemetry; network segmentation cho collector.
- A.14 System acquisition, development and maintenance: Thiết kế observability từ giai đoạn phát triển; review security in CI/CD for telemetry components.
- A.15 Supplier relationships: Quản lý supplier cho collector và exporters (OTLP collector, Prometheus/Grafana, logging backend).
- A.16 Information security incident management: Xử lý sự cố liên quan telemetry (alerting, runbooks, post-mortem).
- A.17 Information security continuity: DR cho telemetry (backup cấu hình, collector redundancy).
- A.18 Compliance: Đảm bảo lưu trữ log & trace hợp pháp và audit trails.

## Hiện trạng (Current State)
- OpenTelemetry được bật ở mức tối thiểu với Http/Express instrumentation; Collector đang triển khai (otelcol) để nhận OTLP traces/metrics và log ra console.
- Baseline data retention và data minimization chưa đầy đủ theo chuẩn (PII in telemetry nên bị hạn chế).

## Gap và remediation (Gaps & Remediation)
1) Governance & Policy
- Gap: Chưa có policy riêng cho telemetry data. Remediate: bổ sung Telemetry Data Policy trong Security/Internal policy.
2) Access Control
- Gap: Quyền truy cập telemetry và dashboards chưa rõ RBAC. Remediate: xác định vai trò: Admin, Operator, Auditor; implement RBAC ở frontend và API.
3) Data Privacy & Minimization
- Gap: Thông tin nhạy cảm có thể vô tình được log. Remediate: áp dụng redaction/masking; config theo rules; ensure data minimization.
4) Logging Retention & Archiving
- Gap: Retention policy chưa rõ. Remediate: define retention (e.g., 30-90 ngày cho logs; 7-30 ngày cho traces), with secure purge.
5) Incident Management
- Gap: Incident response runbook for telemetry incidents. Remediate: create IR playbook, alert routing to Security.
6) Supplier Relationships
- Gap: các phụ thuộc OTEL collector có SLAs. Remediate: get security posture, data handling guidance from supplier.

## Remediation Plan (RACI + Timeline)
- 0-2 weeks: Define scope, assign roles (ISMS owner, Security, DevOps, SRE). Prepare Telemetry policy and data classification.
- 2-4 weeks: Implement data masking, log redaction, RBAC, and basic alert rules for telemetry anomalies.
- 4-6 weeks: Deploy OTEL collector hardened config, backups, and DR readiness; implement retention policy.
- 6-8 weeks: Create runbooks, training, and start internal audit readiness for telemetry.

## KPI & Validation
- % of telemetry data that is compliant (masked) vs raw data.
- Time to detect telemetry-related incidents (MTTD).
- Time to recover telemetry data after incidents (MTTR).
- Audit log completeness and traceability.

---
*Bản phân tích này nhằm mục tiêu hướng tới ISMS-27001 với PDCA đối với Observability.*
