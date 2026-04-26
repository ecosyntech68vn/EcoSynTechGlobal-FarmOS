# Personal Data Protection Implementation

**Document ID:** SEC-DATA-001  
**Version:** 1.0  
**Effective Date:** 2026-04-24  
**ISO 27001:2022 Controls:** A.5.34  
**Related Regulations:** GDPR (EU), PDP (Vietnam)

---

## 1. Purpose

This document outlines how EcoSynTech Farm OS implements technical and organizational measures to protect personal data in compliance with GDPR and Vietnamese Personal Data Protection (PDP) regulations.

---

## 2. Data Classification

| Category | Examples | Sensitivity | Protection Level |
|----------|----------|-------------|------------------|
| **Public** | Product info, public API data | Low | Basic |
| **Internal** | System logs, device config | Medium | Standard |
| **Personal** | Farmer name, phone, email | High | Enhanced |
| **Sensitive** | Biometric, payment data | Critical | Maximum |

---

## 3. Personal Data Collected

| Data Field | Purpose | Legal Basis | Retention |
|------------|---------|-------------|-----------|
| Name | Account identification | Consent | Account lifetime |
| Email | Communication | Consent | Account lifetime |
| Phone | Alerts, 2FA | Consent | Account lifetime |
| Farm location | Service delivery | Contract | Account lifetime |
| Device usage | Analytics | Consent | 2 years |
| Biometric (if any) | Authentication | Explicit consent | Until revoked |

---

## 4. Technical Measures (A.5.34)

### 4.1 Data Minimization
- Only collect data necessary for service delivery
- No unnecessary fields in registration forms
- Anonymize data where possible (analytics)

### 4.2 Encryption
```javascript
// At rest - encryption configured per database
// At transit - TLS 1.2+ enforced via Helmet

// Data masking in logs
const maskPersonalData = (data) => {
  const masked = { ...data };
  if (masked.email) masked.email = maskEmail(masked.email);
  if (masked.phone) masked.phone = maskPhone(masked.phone);
  return masked;
};
```

### 4.3 Access Control
- RBAC implementation with role-based permissions
- Minimum privilege principle
- Audit trail for all data access

### 4.4 Pseudonymization
- User identifiers separated from personal data
- Session tokens rather than persistent user data

---

## 5. Data Subject Rights (GDPR/PDP)

| Right | Implementation | Endpoint |
|-------|----------------|----------|
| Access | GET /api/users/me | Return user data |
| Rectification | PUT /api/users/me | Update profile |
| Erasure | DELETE /api/users/me | Soft delete with 30-day recovery |
| Portability | GET /api/users/me/export | Export as JSON |
| Objection | PUT /api/users/me/privacy | Opt-out of non-essential processing |

---

## 6. Data Processing Records

All data processing activities are logged:

```javascript
// Processing activity logging
const logDataProcessing = (userId, activity, purpose) => {
  runQuery(
    `INSERT INTO data_processing_log (id, user_id, activity, purpose, timestamp)
     VALUES (?, ?, ?, ?, datetime("now"))`,
    [uuidv4(), userId, activity, purpose]
  );
};
```

---

## 7. Data Breach Response

### 7.1 Detection & Assessment
- Automated anomaly detection
- User-reported breach notification

### 7.2 Containment
- Isolate affected systems
- Preserve evidence

### 7.3 Notification
- **Supervisory Authority:** Within 72 hours
- **Data Subjects:** Without undue delay

### 7.4 Remediation
- Fix vulnerability
- Restore data integrity

---

## 8. Third-Party Data Sharing

| Third Party | Data Shared | Purpose | Legal Basis |
|-------------|-------------|---------|-------------|
| Weather API | Farm location only | Weather data | Contract |
| Cloud Provider | All data | Hosting | DPA signed |
| Analytics | Aggregated only | Analytics | Consent |

---

## 9. Data Retention Schedule

| Data Type | Retention | Disposal Method |
|-----------|-----------|-----------------|
| User account | Active + 2 years inactive | Secure deletion |
| Sensor data | 1 year | Automated purge |
| Logs | 90 days | Automated rotation |
| Audit records | 3 years | Secure deletion |
| Backup | 30 days | Automated purge |

---

## 10. Compliance Verification

| Requirement | Verification Method |
|-------------|---------------------|
| Consent management | Consent audit logs |
| Data access | Access log review |
| Breach notification | Incident response test |
| Data portability | Quarterly export tests |
| Erasure verification | Deletion verification |

---

## 11. Responsibilities

| Role | Responsibility |
|------|----------------|
| DPO (Data Protection Officer) | Overall compliance oversight |
| Developers | Implement data protection |
| Operations | Monitor data processing |
| HR | Consent management |

---

## 12. Links

| Resource | Location |
|----------|----------|
| Privacy Policy | docs/policies/PRIVACY_POLICY.md |
| Data Retention | docs/policies/DATA_RETENTION_POLICY.md |
| Incident Response | docs/operations/INCIDENT_RESPONSE_PLAN.md |

---

**Document Owner:** Security/DPO  
**Next Review:** 2026-10-24  
**Classification:** Internal