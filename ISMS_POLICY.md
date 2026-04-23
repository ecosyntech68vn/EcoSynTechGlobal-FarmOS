# ISMS Policy – EcoSynTech FarmOS
# Version: 1.1.0 | Date: 2026-04-23 | Owner: ISMS Manager

---

## 1. Purpose & Scope
This ISMS Policy defines the information security management system for EcoSynTech FarmOS, covering:
- Cloud services, on-premise components, software, AI/ML models, IoT data, and all suppliers in the information processing lifecycle.
- Applies to all employees, contractors, and third parties with access to EcoSynTech systems.
- Aligned with ISO/IEC 27001:2022 and ISO/IEC 27002:2022 Annex A controls.

---

## 2. Policy Statement
Management is committed to:
1. Establishing, implementing, maintaining, and continually improving the ISMS.
2. Protecting confidentiality, integrity, and availability of information assets.
3. Ensuring compliance with applicable legal, regulatory, and contractual requirements.
4. Managing information security risks to an acceptable level.

---

## 3. Governance Structure

| Role | Person | Responsibilities |
|------|--------|-----------------|
| Top Management | CEO (Tạ Quang Thuận) | Approve ISMS scope, allocate resources, review performance |
| ISMS Manager | Security Lead | Risk assessment, controls, internal audit, management reviews |
| AI Governance Lead | Dev Lead | AI model lifecycle, bootstrap governance, A.14 compliance |
| Data Owner | Data Lead | Data classification, retention, access control |
| All Employees | Staff/Contractors | Comply with controls, report incidents |

---

## 4. ISO 27001:2022 Control Alignment (Key Controls)

### A.5 Information Security Policies
- **A.5.1** Policies set approved by management → this document
- **A.5.2** Policies reviewed at planned intervals → 6-month review cycle

### A.6 Organisation of Information Security
- **A.6.1.1** Information security roles and responsibilities → defined above
- **A.6.2.1** Contact with authorities → ISMS Manager
- **A.6.3.1** Contact with special interest groups → documented in SUPPLIER_SECURITY_SOP.md

### A.7 Human Resource Security
- **A.7.1.1** Screening → background checks for staff
- **A.7.2.1** Management responsibilities → onboarding training
- **A.7.2.2** Information security awareness → annual training

### A.8 Asset Management
- **A.8.1.1** Inventory of assets → models/registry.json + IoT device inventory
- **A.8.1.2** Asset ownership → Data Owner role
- **A.8.2.1** Information classification → Confidential/Internal/Public
- **A.8.3.1** Information handling → encryption at rest and in transit
- **A.8.9.1** ESP32 Secure Baseline → TLS, firmware validation
- **A.8.12.1** Data leakage prevention → masking, RBAC, audit logs

### A.12 Technical Security
- **A.12.1.1** Secure boot environment → CI/CD pipeline, code signing
- **A.12.4.1** Event logging → audit logs with JSON format
- **A.12.4.2** Protection of log information → access restricted to admin
- **A.12.5.1** Secure operating environment → minimal permissions, hardened configs
- **A.12.6.1** Vulnerability management → dependency scanning, patch cycle
- **A.12.7.1** Web filtering → safe browsing policies enforced

### A.13 Security Incident Management
- **A.13.1.1** Incident management process → INCIDENT_RESPONSE_SOP.md
- **A.13.2.1** Incident reporting → Telegram alerts + incidentService.js
- **A.13.2.3** Incident escalation → automated routing per severity

### A.14 AI/ML Operations (v6.0 – NEW)
- **A.14.1** AI decision logging → SmartAutomationEngine + audit logs
- **A.14.2** AI lifecycle management → src/bootstrap/modelLoader.js + model registry
- **A.14.3** Data governance for AI → sensor data retention, minimization policy
- **A.14.4** Security of AI assets → RBAC + model access control + SOP_AI_GOVERNANCE.md
- **A.14.5** AI incident response → INCIDENT_RESPONSE_SOP.md AI section
- **A.14.6** Drive-hosted model bootstrap → scripts/setup-models.sh + bootstrap API

### A.16 Business Continuity
- **A.16.1.1** Business continuity → BUSINESS_CONTINUITY_SOP.md

---

## 5. Risk Management

| Risk | Likelihood | Impact | Score | Mitigation | Residual Risk |
|------|-----------|--------|-------|-----------|---------------|
| Device unauthorized access | Low | High | 3 | JWT + RBAC + HMAC auth | Low |
| Data breach (IoT telemetry) | Low | High | 3 | Encryption + access control | Low |
| DoS attack | Medium | Medium | 4 | Rate limiting + request deduplication | Medium |
| Malware injection | Low | High | 3 | Input sanitization + CSP | Low |
| AI model misclassification | Medium | Medium | 4 | Fallback heuristics + logging | Medium |
| Supply chain compromise | Low | Medium | 2 | Supplier SOP + verification | Low |
| Model download from Drive (integrity) | Medium | High | 4 | Two-step download + checksum verification | Medium |
| Physical theft of device | Low | Low | 1 | Remote data backup + device wipe | Low |

---

## 6. Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-04-20 | EcoSynTech | Initial release |
| 1.1.0 | 2026-04-23 | EcoSynTech | Added A.14 AI/ML Operations + AI bootstrap governance |

- This is a controlled document; revisions must be approved by ISMS Manager.
- Next review: 2026-10-23

---

## 7. References
- ISO/IEC 27001:2022
- ISO/IEC 27002:2022 (Annex A controls)
- ISO_27001_2022_GAP_ANALYSIS.md
- RISK_REGISTER.md
- SOP_INDEX.md
- SOP_AI_GOVERNANCE.md

---

*Document Classification: Internal – Controlled*
*Owner: ISMS Manager | Approved: CEO (Tạ Quang Thuận)*