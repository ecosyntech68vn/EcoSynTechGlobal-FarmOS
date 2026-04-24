# Repository Security & Branch Management Policy

**Document ID:** SEC-REP-001  
**Version:** 1.0  
**Effective Date:** 2026-04-24  
**ISO 27001:2022 Controls:** A.5.9, A.5.10, A.5.12, A.8.4  

---

## 1. Purpose

This document establishes the procedures for managing the EcoSynTech Farm OS repository to protect intellectual property (IP) while enabling collaboration and investor demonstrations.

## 2. Scope

Applies to all code repositories managed by EcoSynTech Global, including:
- Primary repository: `ecosyntech68vn/Ecosyntech-web`
- All branches and forks

## 3. Information Classification (A.5.9)

### 3.1 Classification Levels

| Level | Description | Examples | Handling |
|-------|-------------|----------|----------|
| **RESTRICTED** | Core IP, competitive advantage | AI models (.tflite, .onnx), proprietary algorithms | Never commit to shared repos |
| **CONFIDENTIAL** | Sensitive business data | Credentials, .env files, secrets | .gitignore protected |
| **INTERNAL** | Company-only information | Internal docs, SOPs | Private branches only |
| **PUBLIC** | Can be shared externally | README, API docs, governance | Public branches OK |

### 3.2 RESTRICTED Files (Never Share)

```bash
# AI/ML Models - Proprietary
models/*.tflite
models/*.onnx
models/*.h5
models/*.pt

# Secrets & Credentials
.env
.env.production
*.pem
*.key
credentials.json

# Proprietary Algorithms
src/services/ai/tfliteDiseasePredictor.js
src/services/ai/lstmIrrigationPredictor.js
src/services/blockchain/aptos.js  # (optional)
```

### 3.3 PUBLIC-Ready Files (Safe to Share)

```bash
# Documentation
docs/governance/
docs/sop/
docs/deployment/

# Public-Facing
README.md
ARCHITECTURE.md

# UI & Public APIs
public/
src/routes/
src/middleware/
src/config/ (non-sensitive)
```

---

## 4. Branch Strategy (A.5.10)

### 4.1 Branch Types

| Branch | Purpose | Access | Protected |
|--------|---------|--------|-----------|
| `main` | Production code | Internal team only | ✅ Yes |
| `feat/*` | Feature development | Internal team | ✅ Yes |
| `public/demo` | Investor/demo version | Read-only for investors | ⚠️ Sanitized |
| `release/*` | Release preparation | Internal team | ✅ Yes |

### 4.2 Creating Demo Branch

```bash
# Step 1: Create from main
git checkout main
git checkout -b public/demo

# Step 2: Remove RESTRICTED files
git rm --cached models/*.tflite
git rm --cached models/*.onnx

# Step 3: Remove CONFIDENTIAL files
git rm --cached .env*
git rm --cached src/services/ai/tfliteDiseasePredictor.js

# Step 4: Create .gitkeep for empty model directories
touch models/.gitkeep

# Step 5: Commit and push
git add .
git commit -m "chore: public demo - sanitized for investor review"
git push origin public/demo
```

### 4.3 Demo Branch Validation Script

```bash
#!/bin/bash
# scripts/validate-demo-branch.sh

echo "🔍 Validating demo branch for sensitive content..."

# Check for AI models
if find . -name "*.tflite" -o -name "*.onnx" 2>/dev/null | grep -q .; then
    echo "❌ FAIL: AI model files found"
    exit 1
fi

# Check for secrets
if grep -r "SECRET\|PASSWORD\|KEY\|TOKEN" . --include="*.js" 2>/dev/null | grep -v "// .gitignore" | grep -v "process.env" | head -5; then
    echo "❌ WARNING: Potential secrets found"
fi

# Check for .env files
if find . -name ".env*" -not -name ".gitignore" 2>/dev/null | grep -q .; then
    echo "❌ FAIL: Environment files found"
    exit 1
fi

echo "✅ PASS: Demo branch is clean"
```

---

## 5. Git Configuration (A.5.12, A.8.4)

### 5.1 .gitignore

The repository includes `.gitignore` that automatically protects:
- AI model files (`*.tflite`, `*.onnx`)
- Environment files (`.env*`)
- Credentials and keys (`*.pem`, `*.key`)
- Database files

### 5.2 .gitattributes

Configured to:
- Mark binary files appropriately
- Ensure consistent line endings
- Support Git LFS (optional for large models)

### 5.3 Branch Protection Rules

```json
{
  "protection": {
    "main": {
      "require_reviews": true,
      "required_approvals": 1,
      "dismiss_stale": true,
      "allow_force_push": false
    },
    "public/demo": {
      "require_reviews": false,
      "allow_force_push": false,
      "linear_history": true
    }
  }
}
```

---

## 6. Procedures

### 6.1 Before Any External Sharing

1. **Review classification** - Verify all files are appropriately classified
2. **Run validation script** - `scripts/validate-demo-branch.sh`
3. **Use demo branch** - Always use `public/demo`, never `main`
4. **Verify remote** - Confirm pushing to correct repository

### 6.2 Investor/Demo Checklist

- [ ] Create fresh demo branch from main
- [ ] Remove all RESTRICTED files
- [ ] Run validation script
- [ ] Review README is up-to-date
- [ ] Verify AI features show placeholder/fallback
- [ ] Test API endpoints work without models

### 6.3 Incident Response

If sensitive content is accidentally exposed:

1. **Immediate**: Revert the commit or branch
2. **Notify**: Inform security team within 24 hours
3. **Review**: Assess exposure scope
4. **Document**: Record in security incident log
5. **Remediate**: Update procedures if needed

---

## 7. Roles & Responsibilities

| Role | Responsibility |
|------|----------------|
| **Developer** | Follow classification, use .gitignore |
| **Tech Lead** | Review PRs, approve demo branches |
| **Security** | Audit procedures, incident response |
| **Management** | Authorize external sharing |

---

## 8. References

- ISO 27001:2022 A.5.9 - Information classification
- ISO 27001:2022 A.5.10 - Labelling of information
- ISO 27001:2022 A.5.12 - Classification of information
- ISO 27001:2022 A.8.4 - Access to source code

---

**Document Owner:** Security Team  
**Next Review:** 2026-10-24  
**Classification:** INTERNAL