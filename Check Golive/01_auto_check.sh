#!/bin/bash
# ============================================
# SCRIPT CHECK GOLIVE - ECO SYNTECH v2.3.2
# Chạy tự động các test cơ bản
# ============================================

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ PASS${NC}: $1"; ((PASS++)); }
fail() { echo -e "${RED}✗ FAIL${NC}: $1"; ((FAIL++)); }
info() { echo -e "${YELLOW}ℹ INFO${NC}: $1"; }

echo "=============================================="
echo "  ECO SYNTECH v2.3.2 - GOLIVE CHECK"
echo "=============================================="
echo ""

# ============================================
# SECTION 1: VERSION CHECK
# ============================================
info "=== SECTION 1: VERSION CHECK ==="

# Check version endpoint
VERSION_RESPONSE=$(curl -s "$BASE_URL/api/version")
if echo "$VERSION_RESPONSE" | grep -q '"api":"2.3.2"'; then
    pass "API version is 2.3.2"
else
    fail "API version mismatch: $VERSION_RESPONSE"
fi

# Check health endpoint
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
    pass "Health endpoint returns healthy"
else
    fail "Health endpoint not healthy: $HEALTH_RESPONSE"
fi

# Check version in health
if echo "$HEALTH_RESPONSE" | grep -q '"version":"2.3.2"'; then
    pass "Health version is 2.3.2"
else
    fail "Health version mismatch"
fi

echo ""

# ============================================
# SECTION 2: DATABASE CHECK
# ============================================
info "=== SECTION 2: DATABASE CHECK ==="

# Check DB backup command
if npm run db-admin -- backup > /dev/null 2>&1; then
    pass "Database backup command works"
else
    fail "Database backup command failed"
fi

# Check DB status
DB_STATUS=$(npm run db-admin -- status 2>/dev/null | tail -1)
if echo "$DB_STATUS" | grep -q "devices"; then
    pass "Database status works: $DB_STATUS"
else
    fail "Database status failed"
fi

echo ""

# ============================================
# SECTION 3: SECURITY CHECK
# ============================================
info "=== SECTION 3: SECURITY CHECK ==="

# Test API without auth (should fail)
NO_AUTH_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/devices")
if [ "$NO_AUTH_RESPONSE" = "401" ]; then
    pass "API without auth returns 401"
else
    fail "API without auth returns $NO_AUTH_RESPONSE (expected 401)"
fi

# Test webhook without signature (should fail)
NO_SIG_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$BASE_URL/api/webhook/esp32" \
    -H "Content-Type: application/json" \
    -d '{"payload":{}}')
if [ "$NO_SIG_RESPONSE" = "401" ]; then
    pass "Webhook without signature returns 401"
else
    fail "Webhook without signature returns $NO_SIG_RESPONSE (expected 401)"
fi

# Test invalid signature (should fail)
BAD_SIG_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null -X POST "$BASE_URL/api/webhook/esp32" \
    -H "Content-Type: application/json" \
    -d '{"payload":{},"signature":"invalid"}')
if [ "$BAD_SIG_RESPONSE" = "401" ]; then
    pass "Webhook with invalid signature returns 401"
else
    fail "Webhook with invalid signature returns $BAD_SIG_RESPONSE (expected 401)"
fi

echo ""

# ============================================
# SECTION 4: API CHECK
# ============================================
info "=== SECTION 4: API ENDPOINTS CHECK ==="

# Get health endpoints
ENDPOINTS=(
    "/api/health"
    "/api/healthz"
    "/api/version"
    "/api/stats"
)

for endpoint in "${ENDPOINTS[@]}"; do
    RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL$endpoint")
    if [ "$RESPONSE" = "200" ]; then
        pass "GET $endpoint returns 200"
    else
        fail "GET $endpoint returns $RESPONSE (expected 200)"
    fi
done

echo ""

# ============================================
# SECTION 5: WEBSOCKET CHECK
# ============================================
info "=== SECTION 5: WEBSOCKET CHECK ==="

# Check WebSocket endpoint exists (basic check)
WS_CHECK=$(curl -s -i "$BASE_URL/ws" 2>&1 | head -5)
if echo "$WS_CHECK" | grep -qi "websocket\|upgrade"; then
    pass "WebSocket endpoint exists"
else
    info "WebSocket check requires manual testing or wscat"
fi

echo ""

# ============================================
# SECTION 6: METRICS CHECK
# ============================================
info "=== SECTION 6: METRICS CHECK ==="

METRICS_RESPONSE=$(curl -s "$BASE_URL/metrics")
if echo "$METRICS_RESPONSE" | grep -q "http_requests_total"; then
    pass "Prometheus metrics endpoint works"
else
    fail "Prometheus metrics endpoint not working"
fi

echo ""

# ============================================
# SECTION 7: BUILD/DEPLOY CHECK
# ============================================
info "=== SECTION 7: BUILD CHECK ==="

# Test lint
if npm run lint > /dev/null 2>&1; then
    pass "Lint passes with 0 errors"
else
    fail "Lint has errors"
fi

# Test build
if npm run build > /dev/null 2>&1; then
    pass "Build passes"
else
    fail "Build failed"
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo "=============================================="
echo "  RESULTS SUMMARY"
echo "=============================================="
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ ALL AUTO CHECKS PASSED${NC}"
    exit 0
else
    echo -e "${RED}✗ SOME CHECKS FAILED${NC}"
    echo "Please review failures above and run manual checks."
    exit 1
fi
