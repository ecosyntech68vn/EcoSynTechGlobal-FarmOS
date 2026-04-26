# EcoSynTech Local Core V3.0 - Quickstart Guide

## English | Tiếng Việt

**Cài đặt và chạy hệ thống trong 5 phút**

---

## 🚀 CÀI ĐẶT NHANH (5 PHÚT)

### Yêu cầu / Requirements

| Thành phần | Phiên bản tối thiểu |
|------------|--------------------|
| Node.js | 18.x hoặc cao hơn |
| npm | 9.x hoặc cao hơn |
| RAM | 512MB (Lite) / 2GB (Pro) |
| Disk | 500MB |

### Cách 1: 1-Click Install (Khuyến nghị)

```bash
# Clone và cài đặt tự động
git clone https://github.com/ecosyntech68vn/EcoSynTech-Local-Core.git
cd EcoSynTech-Local-Core
chmod +x install.sh
./install.sh
```

### Cách 2: Manual Install

```bash
# 1. Clone
git clone https://github.com/ecosyntech68vn/EcoSynTech-Local-Core.git
cd EcoSynTech-Local-Core

# 2. Cài đặt dependencies
npm install

# 3. Tạo .env (4 tùy chọn)
#    Tùy chọn A: BASE (cho người mới bắt đầu - MIỄN PHÍ)
copy .env.base .env

#    Tùy chọn B: PRO (gói chuyên nghiệp - Đủ dùng)
copy .env.pro .env

#    Tùy chọn C: PREMIUM (đầy đủ mọi tính năng)
copy .env.premium .env

#    Tùy chọn D: FULL (tùy chỉnh nâng cao)
copy .env.full .env

# 4. Tạo thư mục data
mkdir -p data data/backups logs

# 5. Chạy
npm start
```

**4 Tùy chọn .env:**

| File | Gói | Cho | Giá |
|-----|-----|-----|-----|
| `.env.base` | BASE | Người mới bắt đầu | Miễn phí ⚡ |
| `.env.pro` | PRO | HTX nhỏ, hộ gia đình | ~500K |
| `.env.premium` | PREMIUM | Doanh nghiệp | ~2M |
| `.env.full` | FULL | Nâng cao, tùy chỉnh | Tùy chọn |

### So sánh tính năng (giống nhau, khác giới hạn):

| Tính năng | BASE | PRO | PREMIUM |
|-----------|------|-----|---------|
| AI Skills | ✓ 50+ | ✓ 150+ | ✓ 228 |
| Thiết bị | 50 | 200 | Unlimited |
| Users | 10 | 50 | Unlimited |
| AI Providers | DeepSeek | 2 providers | 4 providers |
| Backup tự động | ✓ Daily | ✓ Daily | ✓ Hourly + Cloud |
| Payment | - | VNPay | Full gateway |
| Blockchain | - | - | ✓ |
| Analytics | ✓ | ✓ Advanced | ✓ Full |
| Water Optimization | ✓ | ✓ | ✓ |
| Weather API | ✓ | ✓ | ✓ |
| Telegram/Zalo | ✓ | ✓ | ✓ |
| Support | Community | Priority | 24/7 |

### Cách 3: Docker (Khuyến nghị cho Production)

```bash
# Clone và chạy Docker
git clone https://github.com/ecosyntech68vn/EcoSynTech-Local-Core.git
cd EcoSynTech-Local-Core
cp .env.example .env

# Chạy với Docker
docker-compose up -d

# Hoặc chạy Lite version (cho Raspberry Pi)
docker-compose -f docker-compose.lite.yml up -d
```

---

## ⚡ KHỞI ĐỘNG NHANH

### Kiểm tra hệ thống / System Check

```bash
# Chạy system audit
node src/intelligence/ai-skills/system-audit.skill.js
```

### Truy cập / Access

| Service | URL | Default |
|---------|-----|--------|
| **Web Dashboard** | http://localhost:3000 | admin/admin123 |
| **API** | http://localhost:3000/api | - |
| **Health Check** | http://localhost:3000/health | - |
| **WebSocket** | ws://localhost:3000 | - |

---

## 📋 CẤU HÌNH CƠ BẢN

### Environment Variables

Tạo file `.env`:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./data/ecosyntech.db

# JWT Secret (thay đổi password này!)
JWT_SECRET=change-this-secret-key

# AI Providers (tùy chọn - có thể dùng miễn phí)
DEEPSEEK_API_KEY=your-deepseek-key
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Telegram Bot (tùy chọn)
TELEGRAM_BOT_TOKEN=your-bot-token

# Zalo (tùy chọn)
ZALO_APP_ID=your-zalo-app-id
ZALO_APP_SECRET=your-zalo-secret
```

### Cấu hình AI Models

```bash
# AI Provider (deepseek, ollama, openai, gemini)
AI_PROVIDER=deepseek
```

---

## 🔧 LỆNH THƯỜNG DÙNG

| Lệnh | Mô tả |
|------|-------|
| `npm start` | Chạy production |
| `npm run dev` | Chạy development |
| `npm run test` | Chạy tests |
| `npm run audit` | System audit |
| `npm run backup` | Backup data |
| `npm run log` | Xem logs |
| `npm run stop` | Dừng server |
| `npm run restart` | Khởi động lại |

### Docker Commands

```bash
# Chạy
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng
docker-compose down

# Rebuild
docker-compose build --no-cache
```

---

## 🔐 LOGIN MẶC ĐỊNH

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |
| manager | manager123 | Manager |
| user | user123 | User |

**Lưu ý:** Đổi mật khẩu ngay sau khi đăng nhập lần đầu!

---

## 📊 KIỂM TRA HỆ THỐNG

### Kiểm tra hoạt động

```bash
# Health check
curl http://localhost:3000/health

# System audit
curl http://localhost:3000/api/audit

# AI skills count
curl http://localhost:3000/api/skills/count
```

### Xem logs

```bash
# Real-time logs
tail -f logs/app.log

# Error logs only
grep ERROR logs/app.log
```

---

## 🆘 XỬ LÝ SỰ CỐ

### Server không khởi động

```bash
# Kiểm tra port đang sử dụng
lsof -i :3000

# Kill process sử dụng port
kill -9 <PID>

# Thử cổng khác
PORT=3001 npm start
```

### Lỗi database

```bash
# Xóa và tạo lại database
rm data/ecosyntech.db
npm start
# Hệ thống sẽ tự tạo database mới
```

### Lỗi AI

```bash
# Kiểm tra AI provider
node -e "const p=require('./src/services/aiEngine.js');console.log(p.getProvider())"

# Fallback về template
AI_PROVIDER=template npm start
```

---

## ☁️ DEPLOY LÊN CLOUD

### Railway

```bash
# Cài đặt Railway CLI
npm i -g @railway/cli

# Login
railway login

# Init
railway init

# Deploy
railway up

# Variables
railway variables set PORT=3000
```

### Render

```bash
# Kết nối GitHub với Render.com
# Build command: npm start
# Start command: npm start
```

### VPS/Server

```bash
# Cài đặt Nginx
sudo apt install nginx

# Copy config
sudo cp nginx.conf /etc/nginx/sites-available/ecosyntech

# Enable sites
sudo ln -s /etc/nginx/sites-available/ecosyntech /etc/nginx/sites-enabled/

# Restart
sudo systemctl restart nginx
```

---

## 📞 HỖ TRỢ

| Kênh | Liên hệ |
|------|--------|
| **Email** | kd.ecosyntech@gmail.com |
| **Phone** | 0989516698 |
| **Website** | ecosyntechglobal.com |
| **GitHub** | github.com/ecosyntech68vn |

---

**Copyright © 2024-2025 EcoSynTech. All rights reserved.**