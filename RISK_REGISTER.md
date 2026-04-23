# RISK REGISTER – EcoSynTech FarmOS
# Version: 1.1.0 | Date: 2026-04-23 | Owner: ISMS Manager

---

## Overview
This risk register documents identified information security risks for EcoSynTech FarmOS, their assessment, treatment, and residual risk levels. Aligned with ISO 27001:2022 A.6.1.2 and A.8.2.1.

Risk Scoring: Likelihood (1-3) × Impact (1-3) = Risk Score (1-9)
- 1-3: Low | 4-6: Medium | 7-9: High

---

## AI/ML Risks (A.14 – NEW in v6.0)

| ID | Risk | Likelihood | Impact | Score | Category | Mitigation | Residual | Owner |
|----|------|-----------|--------|-------|---------|-----------|---------|-------|
| **R-AI-01** | AI model misclassification causing crop damage | 2 | 3 | 6 | AI/ML | Fallback heuristics + sensor fusion + logging | 3 | AI Ops |
| **R-AI-02** | Model download from Drive being tampered | 3 | 3 | 9 | AI/ML | Two-step Drive download + checksum + RBAC | 4 | AI Ops |
| **R-AI-03** | AI model drift over time | 2 | 3 | 6 | AI/ML | Periodic model re-validation + feedback loop | 3 | AI Ops |
| **R-AI-04** | Data used for AI training contains PII | 1 | 3 | 3 | AI/ML | Data minimization policy + PII masking | 1 | Data Lead |
| **R-AI-05** | Unauthorized access to AI model management API | 2 | 3 | 6 | AI/ML | Auth + RBAC + audit logs | 2 | Security |
| **R-AI-06** | Bootstrap script fails silently, system uses fallback without notification | 2 | 2 | 4 | AI/ML | Bootstrap logs + status API + alerting | 2 | DevOps |
| **R-AI-07** | Large ONNX model (>2GB) exhausts disk/bandwidth | 3 | 2 | 6 | AI/ML | Bootstrap on-demand + size limit check | 2 | DevOps |

---

## IoT/Device Risks (A.8, A.12)

| ID | Risk | Likelihood | Impact | Score | Category | Mitigation | Residual | Owner |
|----|------|-----------|--------|-------|---------|-----------|---------|-------|
| **R-IOT-01** | ESP32 unauthorized access | 1 | 3 | 3 | IoT | JWT + HMAC auth + firmware validation | 1 | Security |
| **R-IOT-02** | Telemetry data leakage | 1 | 3 | 3 | IoT | Encryption at rest + TLS in transit | 1 | Security |
| **R-IOT-03** | DoS attack on telemetry endpoint | 2 | 3 | 6 | IoT | Rate limiting + request deduplication | 3 | Security |
| **R-IOT-04** | Malicious firmware update to ESP32 | 1 | 3 | 3 | IoT | Code signing + firmware validation | 1 | DevOps |
| **R-IOT-05** | MQTT broker compromise | 1 | 3 | 3 | IoT | Auth + TLS + access control | 1 | Security |
| **R-IOT-06** | Device data retention exceeds policy | 2 | 2 | 4 | IoT | Data retention policy + automated cleanup | 1 | Data Lead |

---

## Information Security Risks (A.5–A.13)

| ID | Risk | Likelihood | Impact | Score | Category | Mitigation | Residual | Owner |
|----|------|-----------|--------|-------|---------|-----------|---------|-------|
| **R-IS-01** | Unauthorized access to admin panel | 1 | 3 | 3 | InfoSec | RBAC + JWT + session timeout | 1 | Security |
| **R-IS-02** | SQL injection in API | 1 | 3 | 3 | InfoSec | Input sanitization + parameterized queries | 1 | Dev |
| **R-IS-03** | API key leakage | 2 | 3 | 6 | InfoSec | Key rotation + secrets management | 2 | DevOps |
| **R-IS-04** | Supply chain compromise (supplier software) | 1 | 3 | 3 | Supply | SUPPLIER_SECURITY_SOP.md + verification | 1 | Procurement |
| **R-IS-05** | Business continuity disruption | 1 | 3 | 3 | BCP | BUSINESS_CONTINUITY_SOP.md + backup | 1 | Ops |
| **R-IS-06** | Security incident not detected | 1 | 3 | 3 | Incident | Real-time alerting + Telegram + logging | 1 | SOC |
| **R-IS-07** | Physical theft of server hardware | 1 | 2 | 2 | Physical | Remote data backup + device wipe capability | 1 | Ops |
| **R-IS-08** | Open handle leak in Node.js (resource exhaustion) | 2 | 2 | 4 | InfoSec | Monitoring + forceExit in tests + process limits | 2 | DevOps |

---

## Risk Treatment Plan Summary

| Priority | Risks | Treatment |
|----------|-------|----------|
| **CRITICAL (7-9)** | R-AI-02 | Immediately implement checksum verification for Drive downloads |
| **HIGH (4-6)** | R-AI-01, R-AI-03, R-AI-05, R-IOT-03, R-IS-03 | Address in current sprint; monitoring and logging |
| **MEDIUM (2-3)** | All others | Address in next sprint; review in 3 months |

---

## Risk Review Schedule

| Review | Date | Conducted By | Status |
|--------|------|-------------|--------|
| Initial | 2026-04-20 | Security Lead | Complete |
| v6.0 Update | 2026-04-23 | ISMS Manager | Complete |
| Q3 Review | 2026-07-23 | ISMS Manager | Planned |
| Annual Review | 2027-04-23 | ISMS Manager | Planned |

---

## References
- ISO/IEC 27001:2022 – A.6.1.2
- ISMS_POLICY.md
- ISO_27001_2022_GAP_ANALYSIS.md
- SOP_AI_GOVERNANCE.md (AI risks)
- INCIDENT_RESPONSE_SOP.md
- BUSINESS_CONTINUITY_SOP.md

---

*Document Classification: Internal – Controlled*
*Owner: ISMS Manager | Review Cycle: 3 months*