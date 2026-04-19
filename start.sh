#!/bin/bash
# ============================================
#  EcoSynTech Farm OS - Khởi động nhanh
#  Chỉ 1 click là chạy - Dành cho nông dân
# ============================================

echo "🌱 EcoSynTech Farm OS - Đang khởi động..."
echo "========================================"

# Màu sắc
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Bước 1: Kiểm tra Node.js
echo -e "${BLUE}📋 Bước 1:${NC} Kiểm tra Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js chưa cài đặt!${NC}"
    echo "   Vui lòng cài đặt Node.js từ: https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js: $(node --version)"

# Bước 2: Cài đặt dependencies nếu cần
echo -e "${BLUE}📋 Bước 2:${NC} Kiểm tra thư viện..."
if [ ! -d "node_modules" ]; then
    echo "   Đang cài đặt thư viện lần đầu..."
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Lỗi cài đặt thư viện!${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓${NC} Thư viện OK"

# Bước 3: Tạo .env nếu chưa có
echo -e "${BLUE}📋 Bước 3:${NC} Kiểm tra cấu hình..."
if [ ! -f ".env" ]; then
    echo "   Tạo file cấu hình mới..."
    node bootstrap.js 2>/dev/null || {
        cat > .env << 'EOF'
# EcoSynTech Farm OS Configuration
PORT=3000
NODE_ENV=development
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "dev-$(date +%s)-secret")
JWT_EXPIRES_IN=7d
HMAC_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "hmac-$(date +%s)-key")
WEBHOOK_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "webhook-$(date +%s)-secret")
DB_PATH=./data/ecosyntech.db
FARM_LAT=10.7769
FARM_LON=106.7009
EOF
    }
fi
echo -e "${GREEN}✓${NC} Cấu hình OK"

# Bước 4: Tạo thư mục data nếu chưa có
echo -e "${BLUE}📋 Bước 4:${NC} Kiểm tra dữ liệu..."
mkdir -p data
echo -e "${GREEN}✓${NC} Thư mục dữ liệu OK"

# Bước 5: Chạy server
echo -e "${GREEN}========================================"
echo -e "${GREEN}🌱 EcoSynTech Farm OS ĐÃ SẴN SÀNG!"
echo -e "${GREEN}========================================"
echo ""
echo -e "📱 Truy cập website:"
echo -e "   ${BLUE}http://localhost:3000${NC} - Trang chủ"
echo -e "   ${BLUE}http://localhost:3000/products${NC} - Sản phẩm"
echo -e "   ${BLUE}http://localhost:3000/policies${NC} - Chính sách"
echo -e "   ${BLUE}http://localhost:3000/dashboard${NC} - Quản lý farm"
echo ""
echo -e "👨‍🌾 Nhấn ${YELLOW}Ctrl+C${NC} để dừng server"
echo ""

# Chạy server
npm start