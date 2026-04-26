#!/bin/bash
# EcoSynTech - Auto Install Script
# For Windows (Git Bash) and Linux/Mac

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "EcoSynTech IoT - Auto Installation"
echo "=========================================="
echo ""

# Check Node.js
echo -e "${YELLOW}[1/5] Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js not found${NC}"
    echo "Please install Node.js >= 12.0.0"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "Node.js: $NODE_VERSION ${GREEN}OK${NC}"

# Check npm
echo -e "${YELLOW}[2/5] Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm not found${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "npm: $NPM_VERSION ${GREEN}OK${NC}"

# Install dependencies
echo -e "${YELLOW}[3/5] Installing dependencies...${NC}"
npm install --production 2>/dev/null || npm install
echo -e "Dependencies ${GREEN}OK${NC}"

# Create data directories
echo -e "${YELLOW}[4/5] Creating directories...${NC}"
mkdir -p data data/backups logs
echo -e "Directories ${GREEN}OK${NC}"

# Test system
echo -e "${YELLOW}[5/5] Testing system...${NC}"
if node --check server.js && node --check src/ops/index.js; then
    echo -e "System test ${GREEN}PASSED${NC}"
else
    echo -e "System test ${RED}FAILED${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Installation Complete!${NC}"
echo "=========================================="
echo ""
echo "To start server:"
echo "  npm start"
echo ""
echo "To start in development mode:"
echo "  npm run dev"
echo ""
echo "To run tests:"
echo "  node scripts/test-skills.js"
echo ""