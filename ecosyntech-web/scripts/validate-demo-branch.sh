#!/bin/bash
# =============================================================================
# EcoSynTech Farm OS - Validate Demo Branch
# =============================================================================
# Validates that a demo branch doesn't contain sensitive content
# before sharing with investors or external parties.
#
# ISO 27001:2022 Controls: A.5.9, A.5.10, A.5.12, A.8.4
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "=============================================="
echo "  EcoSynTech - Validate Demo Branch"
echo "=============================================="
echo ""

# Get current branch or validate specified branch
BRANCH=${1:-$(git branch --show-current)}
echo "Validating branch: $BRANCH"
echo ""

# Check 1: AI Model Files
echo -e "${YELLOW}🔍 Checking for AI model files...${NC}"
MODELS=$(find . -type f \( -name "*.tflite" -o -name "*.onnx" -o -name "*.h5" -o -name "*.pt" -o -name "*.pth" \) 2>/dev/null || true)
if [ -n "$MODELS" ]; then
    echo -e "${RED}❌ FAIL: AI model files found:${NC}"
    echo "$MODELS" | sed 's/^/   /'
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ PASS: No AI model files${NC}"
fi
echo ""

# Check 2: Environment Files
echo -e "${YELLOW}🔍 Checking for environment files...${NC}"
ENV_FILES=$(find . -maxdepth 2 -type f \( -name ".env*" -not -name ".gitignore" -not -name "*.example" \) 2>/dev/null || true)
if [ -n "$ENV_FILES" ]; then
    echo -e "${RED}❌ FAIL: Environment files found:${NC}"
    echo "$ENV_FILES" | sed 's/^/   /'
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ PASS: No environment files${NC}"
fi
echo ""

# Check 3: Credentials
echo -e "${YELLOW}🔍 Checking for credentials...${NC}"
CREDENTIALS=$(grep -r -E "(SECRET|PASSWORD|API_KEY|BOT_TOKEN|PRIVATE_KEY)" --include="*.js" --include="*.json" . 2>/dev/null | grep -v "process.env" | grep -v "// " | grep -v "example\|YOUR_" | head -5 || true)
if [ -n "$CREDENTIALS" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Potential hardcoded credentials found:${NC}"
    echo "$CREDENTIALS" | head -3 | sed 's/^/   /'
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓ PASS: No hardcoded credentials${NC}"
fi
echo ""

# Check 4: Private Keys
echo -e "${YELLOW}🔍 Checking for private keys...${NC}"
KEYS=$(find . -type f \( -name "*.pem" -o -name "*.key" -o -name "*.crt" -o -name "*.p12" \) 2>/dev/null || true)
if [ -n "$KEYS" ]; then
    echo -e "${RED}❌ FAIL: Private key files found:${NC}"
    echo "$KEYS" | sed 's/^/   /'
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ PASS: No private key files${NC}"
fi
echo ""

# Check 5: Sensitive Source Code
echo -e "${YELLOW}🔍 Checking for proprietary AI code exposure...${NC}"
PROPRIETARY=$(find src/services/ai -type f -name "*.js" 2>/dev/null || true)
if [ -n "$PROPRIETARY" ]; then
    # Check if they're placeholder or real
    if grep -q "AIPredictor\|fallback\|placeholder" "$PROPRIETARY" 2>/dev/null; then
        echo -e "${GREEN}✓ PASS: AI services are placeholders${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING: Proprietary AI code detected${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${GREEN}✓ PASS: No AI service files (using placeholders)${NC}"
fi
echo ""

# Check 6: Documentation completeness
echo -e "${YELLOW}🔍 Checking documentation...${NC}"
if [ -f "docs/index.md" ]; then
    echo -e "${GREEN}✓ PASS: docs/index.md exists${NC}"
else
    echo -e "${YELLOW}⚠️  WARNING: docs/index.md not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "README.md" ]; then
    echo -e "${GREEN}✓ PASS: README.md exists${NC}"
else
    echo -e "${RED}❌ FAIL: README.md not found${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "=============================================="
echo "  Validation Summary"
echo "=============================================="
echo ""
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo "Please fix the errors before sharing this branch."
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  VALIDATION PASSED WITH WARNINGS${NC}"
    echo "Review warnings before sharing."
    exit 0
else
    echo -e "${GREEN}✅ VALIDATION PASSED${NC}"
    echo "This branch is safe to share with investors."
    exit 0
fi