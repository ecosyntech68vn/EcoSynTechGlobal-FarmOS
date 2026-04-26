# EcoSynTech Local Core - Hướng Dẫn Cấu Hình Marketing Automation

## Mục Lục
1. [Chuẩn Bị](#1-chuẩn-bị---máy-chạy-hệ-thống)
2. [Cấu Hình Each Platform](#2-cấu-hình-each-platform)
3. [Cách Lấy API Credentials](#3-cách-lấy-api-credentials)
4. [Đăng Ký Các Dịch Vụ](#4-đăng-ký-các-dịch-vụ)
5. [Chạy Hệ Thống](#5-chạy-hệ-thống)
6. [Cấu Hình Nội Dung](#6-cấu-hình-nội-dung)

---

## 1. Chuẩn Bị - Máy Chạy Hệ Thống

### ✅ Yêu Cầu Tối Thiểu:
| Thành phần | Cấu hình tối thiểu | Cấu hình khuyến nghị |
|------------|-------------------|-------------------|
| RAM | 4GB | 8GB+ |
| CPU | 2 cores | 4 cores+ |
| Ổ cứng | 20GB SSD | 50GB SSD |
| Node.js | v18+ | v20 LTS |
| Internet | 10Mbps | 50Mbps |

### 🚀 Cách Chạy:

```bash
# 1. Clone repo
git clone https://github.com/ecosyntech68vn/EcoSynTech-Local-Core.git
cd EcoSynTech-Local-Core

# 2. Cài đặt dependencies
npm install

# 3. Cấu hình biến môi trường
cp .env.example .env
# Edit file .env và điền các credentials

# 4. Chạy server
npm start
# Server chạy tại http://localhost:3000
```

**Server phải chạy 24/7** để:
- Nhận tin nhắn Telegram/Zalo real-time
- Đăng bài tự động theo lịch
- Thu thập leads liên tục

---

## 2. Cấu Hình Each Platform

### 📋 Tạo file `.env`:

```env
# ===================
# TELEGRAM
# ===================
TELEGRAM_BOT_TOKEN=1234567890:ABCdEFGhijKLMNopQRsTUvwXyZ
ADMIN_CHAT_IDS=123456789,987654321

# ===================
# FACEBOOK
# ===================
FB_PAGE_ID=1234567890123456
FB_ACCESS_TOKEN=EAACEdEose0cBAK...
FB_AD_ACCOUNT_ID=act_1234567890123456

# ===================
# INSTAGRAM (cần link với Facebook)
# ===================
IG_ACCOUNT_ID=17841400123456789
IG_ACCESS_TOKEN=

# ===================
# TIKTOK
# ===================
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
TIKTOK_ACCESS_TOKEN=

# ===================
# YOUTUBE
# ===================
YT_API_KEY=AIzaSy...
YT_CHANNEL_ID=UC...

# ===================
# ZALO
# ===================
ZALO_ACCESS_TOKEN=
ZALO_OA_ID=
ZALO_SECRET_KEY=

# ===================
# GOOGLE (for HR tests)
# ===================
GOOGLE_ACCESS_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=1abc123...
```

---

## 3. Cách Lấy API Credentials

### 📘 FACEBOOK

#### 🔑 Bước 1: Tạo Facebook Developer Account
1. Vào [developers.facebook.com](https://developers.facebook.com)
2. Đăng nhập bằng Facebook cá nhân
3. Xác minh email (bắt buộc)

#### 🔑 Bước 2: Tạo App
1. Vào **My Apps** → **Create App**
2. Chọn "Consumer" → Đặt tên app → Tạo
3. Vào app, thêm sản phẩm:
   - **Marketing API**
   - **Instagram Graph API** (nếu dùng IG)

#### 🔑 Bước 3: Lấy Access Token
1. Vào **Tools** → **Graph API Explorer**
2. Chọn app vừa tạo
3. Thêm quyền: `pages_read_leads`, `pages_manage_posts`, `ads_management`
4. Click **Generate Access Token**
5. Copy token (dài, bắt đầu bằng `EAAC...`)

#### 🔑 Bước 4: Lấy Page ID
1. Vào Facebook Page → **Settings** → **About**
2. Scroll xuống xem **Page ID**

#### 🔑 Bước 5: Lấy Ad Account ID
1. Vào [business.facebook.com](https://business.facebook.com) → **Ad Accounts**
2. Click vào ad account → Copy ID (bắt đầu bằng `act_`)

---

### 📸 INSTAGRAM

| Thông tin | Cách lấy |
|----------|----------|
| **Business Account** | Chuyển Instagram cá nhân → Instagram Business (Settings → Account → Switch to Professional) |
| **Link Facebook** | Settings → Page → Connect to Facebook Page |
| **Account ID** | Vào [developers.facebook.com](https://developersfacebook.com) → Instagram Graph API → Business Discovery |

---

### 🎵 TIKTOK

1. Vào [developers.tiktok.com](https://developers.tiktok.com)
2. **Apps** → **Create App**
3. Điền thông tin:
   - App Name: EcoSynTech Bot
   - Website: https://yourdomain.com
   - Redirect URL: https://yourdomain.com/callback
4. Lấy **Client Key** và **Client Secret**
5. Gọi API `/v2/oauth/token/` để lấy Access Token

---

### 🎥 YOUTUBE

1. Vào [console.cloud.google.com](https://console.cloud.google.com)
2. Tạo project mới
3. **APIs & Services** → **Library**
4. Enable **YouTube Data API v3**
5. **credentials** → **Create Credentials** → **API Key**
6. Copy API Key (bắt đầu bằng `AIzaSy`)

---

### 💬 ZALO OA

1. Đăng ký [Zalo Official Account](https://oa.zalo.me/)
2. Xác minh doanh nghiệp (cần Giấy CNĐKKD)
3. Vào **Quản lý OA** → **Cài đặt API**
4. Lấy:
   - **Access Token** (token kèm theo mỗi API call)
   - **OA ID** (xem trong phần thông tin OA)
   - **Secret Key**

---

### 🤖 TELEGRAM

1. Mở Telegram, tìm **@BotFather**
2. Gõ `/newbot`
3. Đặt tên bot (phải kết thúc bằng "bot")
4. Copy **Bot Token** (ví dụ: `123456:ABC-DEF`)
5. Gửi tin nhắn cho bot để activate
6. **Lấy Chat ID**: Forward tin nhắn cho @userinfobot

---

## 4. Đăng Ký Các Dịch Vụ

### Google Cloud (cho YouTube, Drive):
1. [console.cloud.google.com](https://console.cloud.google.com)
2. Tạo project mới
3. Enable APIs cần thiết
4. Tạo OAuth 2.0 credentials (cho YouTube upload)

### Meta for Developers:
1. [developers.facebook.com](https://developers.facebook.com)
2. Tạo app → Thêm Marketing API

### TikTok Developers:
1. [developers.tiktok.com](https://developers.tiktok.com)
2. Đăng ký developer
3. Tạo app

---

## 5. Chạy Hệ Thống

### ⚙️ Khởi động:

```bash
# Development
npm run dev

# Production
npm start

# Với PM2 (khuyến nghị cho server)
npm install -g pm2
pm2 start ecosystem.config.js
```

### 📡 Webhook URLs (cho Telegram):

```
https://your-server.com/webhook/telegram
```

### 📊 APIs:

```
# Multi-Platform Publisher
POST /api/skills/multi-platform-publisher/execute
{
  "content": { "title": "...", "body": "...", "images": ["..."] },
  "platforms": ["facebook", "tiktok", "instagram"]
}

# Telegram Bot (webhook)
POST /webhook/telegram
{ "message": { "text": "Xin chào", "chatId": "123456" }

# Facebook Lead Crawler
POST /api/skills/facebook-lead-crawler/execute
{ "type": "page_leads", "limit": 100 }

# Sales Funnel
POST /api/skills/sales-funnel-automation/execute
{ "action": "process_lead", "lead": { "name": "..." } }
```

---

## 6. Cấu Hình Nội Dung

### 📝 Nội dung lấy từ đâu?

#### Cách 1: Từ Database
```javascript
// Tạo content trong database hoặc CMS
const content = await db.content.find({ 
  status: 'scheduled',
  publishAt: { $lte: new Date() }
});
```

#### Cách 2: Từ API Input
```javascript
POST /api/publish
{
  "content": {
    "title": "Bài viết mới",
    "body": "Nội dung chi tiết...",
    "images": ["https://example.com/image1.jpg"],
    "hashtags": ["#marketing", "#tech"]
  },
  "platforms": ["facebook", "instagram"],
  "schedule": "2025-01-20T10:00:00Z"
}
```

#### Cách 3: Từ Content Calendar
```javascript
// Nội dung được lên lịch sẵn
const scheduled = await skill.execute({
  action: 'get_calendar',
  platform: 'all'
});
```

---

### 📅 Content Calendar:

```javascript
const calendar = new ContentCalendarSkill();

// Thêm nội dung
await calendar.execute({
  action: 'schedule',
  content: {
    title: 'Ra mắt sản phẩm mới',
    body: 'Giới thiệu sản phẩm...',
    platforms: ['facebook', 'tiktok'],
    type: 'product_launch'
  },
  schedule: '2025-01-20T10:00:00'
});
```

---

## 🔧 Troubleshooting

| Lỗi | Cách fix |
|------|---------|
| Token hết hạn | Regenerate token mới |
| API rate limit | Giảm tần suất gọi |
| Webhook không hoạt động | Kiểm tra SSL certificate |
| Tin nhắn không gửi được | Kiểm tra quyền bot |

---

## 📞 Hỗ Trợ

- Email: support@ecosyntech.com
- Zalo: 0123 456 789
- Website: https://ecosyntech.com