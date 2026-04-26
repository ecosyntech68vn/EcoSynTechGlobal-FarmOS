#!/bin/bash
# ============================================
#  EcoSynTech Farm OS - Setup & Run
#  Cho Mac/Linux - 1 click
# ============================================

# Màu sắc
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo "============================================"
echo "  🌱 ECO SYNTECH - KHOI DONG FARM OS"
echo "  Danh cho nong dan Viet Nam"
echo "============================================"
echo ""

# ===== BƯỚC 1: KIỂM TRA NODE.JS =====
echo -e "${BLUE}[1/5]${NC} Kiem tra Node.js..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}[!] May chua cai Node.js!${NC}"
    echo ""
    echo "  Huong dan cai dat:"
    echo "  1. Mo trinh duyet: https://nodejs.org"
    echo "  2. Tai ban Mac (LTS)"
    echo "  3. Mo file cai dat, keo vao Application"
    echo ""
    echo "  Sau cai dat xong, chay lai script nay!"
    echo ""
    read -p "  Nhan Enter de thoat..."
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Node.js: $(node --version)"

# ===== BƯỚC 2: CÀI ĐẶT THƯ VIỆN =====
echo ""
echo -e "${BLUE}[2/5]${NC} Tai thu vien (lan dau)..."

if [ ! -d "node_modules" ]; then
    echo -e "  ${YELLOW}Dang tai...${NC} (Cho 1-3 phut)"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}[!] Loi tai thu vien!${NC}"
        read -p "  Nhan Enter de thoat..."
        exit 1
    fi
fi

echo -e "${GREEN}[OK]${NC} Tai xong!"

# ===== BƯỚC 3: TẠO THƯ MỤC DATA =====
echo ""
echo -e "${BLUE}[3/5]${NC} Tao thu muc luu du lieu..."

mkdir -p data
echo -e "${GREEN}[OK]${NC} Tao xong!"

# ===== BƯỚC 4: TẠO FILE CẤU HÌNH =====
echo ""
echo -e "${BLUE}[4/5]${NC} Tao cau hinh mat khau..."

if [ ! -f ".env" ]; then
    # Generate secure random keys
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "dev-$(date +%s)-secret")
    HMAC_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "hmac-$(date +%s)-key")
    WEBHOOK_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "webhook-$(date +%s)-secret")
    
    cat > .env << EOF
# === Cau hinh EcoSinTech Farm OS ===
# Sinh tu dong - Mat khau bao mat
PORT=3000
NODE_ENV=development
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
HMAC_SECRET=$HMAC_SECRET
WEBHOOK_SECRET=$WEBHOOK_SECRET

# Du lieu
DB_PATH=./data/ecosyntech.db
BACKUP_DIR=./backups

# Vi tri trang trai (mac dinh)
FARM_LAT=10.7769
FARM_LON=106.7009
EOF
    
    echo -e "${GREEN}[OK]${NC} Tao xong! Mat khau: Tu dong tao"
else
    echo -e "${GREEN}[OK]${NC} Cau hinh da san!"
fi

# ===== BƯỚC 5: CHẠY SERVER =====
echo ""
echo "============================================"
echo -e "${GREEN}  🌱 DA CAI DAT XONG!${NC}"
echo "============================================"
echo ""
echo -e "${CYAN}📱 MO TRINH DUYET va truy cap:${NC}"
echo ""
echo "     http://localhost:3000         - Trang chu ban hang"
echo "     http://localhost:3000/products - San pham"
echo "     http://localhost:3000/policies  - Chinh sach"
echo "     http://localhost:3000/dashboard - Quan ly trang trai"
echo ""
echo -e "${YELLOW}📞 HO TRO: Zalo 0989516698${NC}"
echo ""
echo -e "${YELLOW}Nhan ${RED}Ctrl+C${YELLOW} de dung server${NC}"
echo "============================================"
echo ""

# Chạy server
npm start