#!/bin/bash
# =============================================================================
# EcoSynTech Farm OS - Create Demo Branch for Investor Review
# =============================================================================
# This script creates a sanitized demo branch that removes/restricts
# sensitive files before sharing with investors or external parties.
#
# ISO 27001:2022 Controls: A.5.9, A.5.10, A.5.12, A.8.4
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=============================================="
echo "  EcoSynTech - Create Demo Branch"
echo "=============================================="

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    exit 1
fi

# Default values
DEMO_BRANCH="public/demo"
SOURCE_BRANCH="main"
AUTO_PUSH=false
DRY_RUN=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --branch)
            DEMO_BRANCH="$2"
            shift 2
            ;;
        --source)
            SOURCE_BRANCH="$2"
            shift 2
            ;;
        --push)
            AUTO_PUSH=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --branch <name>    Demo branch name (default: public/demo)"
            echo "  --source <branch>  Source branch (default: main)"
            echo "  --push            Auto-push to remote"
            echo "  --dry-run         Show what would be done without executing"
            echo "  --help, -h        Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

echo ""
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Source branch: $SOURCE_BRANCH"
echo "  Demo branch:   $DEMO_BRANCH"
echo "  Auto-push:     $AUTO_PUSH"
echo "  Dry-run:       $DRY_RUN"
echo ""

# Files to remove from demo branch
RESTRICTED_FILES=(
    "models/plant_disease.tflite"
    "models/irrigation_lstm.onnx"
    "models/*.tflite"
    "models/*.onnx"
    "models/*.h5"
    "models/*.pt"
    ".env"
    ".env.production"
    ".env.pilot"
    "*.pem"
    "*.key"
    "*.crt"
)

# Files to replace with placeholders
PLACEHOLDER_FILES=(
    "src/services/ai/tfliteDiseasePredictor.js"
    "src/services/ai/lstmIrrigationPredictor.js"
)

# Step 1: Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${YELLOW}🔄 Step 1: Current branch: $CURRENT_BRANCH${NC}"

# Step 2: Switch to source branch
if [ "$CURRENT_BRANCH" != "$SOURCE_BRANCH" ]; then
    echo "  Switching to $SOURCE_BRANCH..."
    git checkout "$SOURCE_BRANCH" 2>/dev/null || git checkout -b "$SOURCE_BRANCH" main
fi

# Step 3: Create demo branch
if git branch -D "$DEMO_BRANCH" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Removed existing $DEMO_BRANCH branch"
fi
git checkout -b "$DEMO_BRANCH"
echo -e "  ${GREEN}✓${NC} Created new branch: $DEMO_BRANCH"

# Step 4: Remove/restrict files
echo -e "${YELLOW}🔄 Step 2: Removing restricted files...${NC}"
for pattern in "${RESTRICTED_FILES[@]}"; do
    if ls $pattern 2>/dev/null; then
        if [ "$DRY_RUN" = false ]; then
            git rm --cached -r "$pattern" 2>/dev/null || true
        fi
        echo "  ✓ Would remove: $pattern"
    fi
done

# Step 5: Create model directory placeholders
if [ "$DRY_RUN" = false ]; then
    mkdir -p models
    if [ ! -f "models/.gitkeep" ]; then
        echo "# AI Models - Not included in public demo" > models/.gitkeep
        git add models/.gitkeep
    fi
    echo -e "  ${GREEN}✓${NC} Created models/.gitkeep placeholder"
fi

# Step 6: Replace AI services with placeholders
echo -e "${YELLOW}🔄 Step 3: Creating AI placeholders...${NC}"
for file in "${PLACEHOLDER_FILES[@]}"; do
    if [ -f "$file" ] && [ "$DRY_RUN" = false ]; then
        # Keep the file but replace content with placeholder
        cat > "$file" << 'EOF'
/**
 * EcoSynTech Farm OS - AI Service Placeholder
 * 
 * This is a placeholder for the proprietary AI service.
 * For demonstration purposes, the system uses fallback heuristics.
 * 
 * Full AI capabilities available in production deployment.
 * 
 * Contact: kd.ecosyntech@gmail.com
 */

// Placeholder - See docs/ai/AI_SETUP.md for production setup
class AIPredictor {
  async predict(data) {
    return {
      success: true,
      method: 'fallback',
      message: 'AI model not loaded in demo mode'
    };
  }
}

module.exports = AIPredictor;
EOF
        git add "$file"
        echo "  ✓ Placeholder created: $file"
    fi
done

# Step 7: Update README for demo
if [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}🔄 Step 4: Updating README for demo...${NC}"
    # Add demo notice to README if not already there
    if ! grep -q "DEMO VERSION" README.md; then
        echo "" >> README.md
        echo "---" >> README.md
        echo "## 🏷️ DEMO VERSION" >> README.md
        echo "This is a public demo version. Full AI capabilities available in production." >> README.md
        echo "Contact: kd.ecosyntech@gmail.com" >> README.md
        git add README.md
        echo -e "  ${GREEN}✓${NC} Updated README with demo notice"
    fi
fi

# Step 8: Commit changes
if [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}🔄 Step 5: Committing changes...${NC}"
    git commit -m "chore: create public demo branch - sanitized for investor review"
    echo -e "  ${GREEN}✓${NC} Committed changes"
fi

# Step 9: Push to remote
if [ "$AUTO_PUSH" = true ] && [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}🔄 Step 6: Pushing to remote...${NC}"
    git push -u origin "$DEMO_BRANCH"
    echo -e "  ${GREEN}✓${NC} Pushed to origin/$DEMO_BRANCH"
fi

# Summary
echo ""
echo "=============================================="
echo -e "${GREEN}✅ Demo branch created successfully!${NC}"
echo "=============================================="
echo ""
echo "Branch: $DEMO_BRANCH"
echo ""
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}⚠️  This was a dry run - no changes were made${NC}"
else
    echo "Next steps:"
    echo "  1. Review the branch: git checkout $DEMO_BRANCH"
    echo "  2. Run validation: ./scripts/validate-demo-branch.sh"
    echo "  3. Push to remote: git push -u origin $DEMO_BRANCH"
    echo ""
    echo "Share this URL with investors:"
    echo "  https://github.com/ecosyntech68vn/Ecosyntech-web/tree/$DEMO_BRANCH"
fi
echo ""

# Return to original branch
if [ "$CURRENT_BRANCH" != "$DEMO_BRANCH" ] && [ "$CURRENT_BRANCH" != "" ]; then
    git checkout "$CURRENT_BRANCH" 2>/dev/null || true
fi