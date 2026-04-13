# HƯỚNG DẪN TRIỂN KHAI ECO SYNTECH IOT V2.1.1
## Từ A đến Z - Cầm tay chỉ việc

---

## MỤC LỤC
1. [Chuẩn bị](#1-chuẩn-bị)
2. [Cài đặt Server](#2-cài-đặt-server)
3. [Cấu hình](#3-cấu-hình)
4. [Kết nối Thiết bị ESP32](#4-kết-nối-thiết-bị-esp32)
5. [Quản lý Thiết bị](#5-quản-lý-thiết-bị)
6. [Truy xuất Nguồn gốc](#6-truy-xuất-nguồn-gốc)
7. [Giám sát & Cảnh báo](#7-giám-sát--cảnh-báo)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. CHUẨN BỊ

### Yêu cầu hệ thống
- **Server/VPS:** Ubuntu 20.04+ hoặc Windows 10+
- **RAM:** Tối thiểu 2GB
- **Disk:** 10GB SSD
- **Domain/IP:** Công public hoặc Dynamic DNS

### Software cần thiết
- [Node.js v18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

### Đăng ký tài khoản (Miễn phí)
- [Render.com](https://render.com) - Deploy miễn phí
- [Fly.io](https://fly.io) - Deploy miễn phí  
- [Railway.app](https://railway.app) - Deploy miễn phí

---

## 2. CÀI ĐẶT SERVER

### Cách 1: Deploy lên Render (Khuyến nghị)

#### Bước 2.1 - Tạo tài khoản Render
1. Mở trình duyệt → Vào [render.com](https://render.com)
2. Click **Sign Up** → Đăng nhập bằng **GitHub**
3. Xác nhận email

#### Bước 2.2 - Fork repository
1. Mở [github.com/ecosyntech68vn/Ecosyntech-web](https://github.com/ecosyntech68vn/Ecosyntech-web)
2. Click **Fork** (góc trên phải)
3. Đợi tạo xong

#### Bước 2.3 - Tạo Web Service
1. Login [render.com](https://render.com)
2. Click **New** → **Web Service**
3. Tìm repo **Ecosyntech-web** của bạn → Click **Connect**
4. Cấu hình:
   - **Name:** `ecosyntech-iot`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Create Web Service**
6. Đợi deploy xong (~3-5 phút)

#### Bước 2.4 - Lấy URL
1. Sau khi deploy, lấy URL ở bên trái (ví dụ): `https://ecosyntech-iot.onrender.com`

---

### Cách 2: Chạy Local (Test)

#### Bước 2.5 - Clone và chạy
```bash
# Mở Terminal (Mac/Linux) hoặc PowerShell (Windows)

# Clone repo
git clone https://github.com/ecosyntech68vn/Ecosyntech-web.git
cd Ecosyntech-web

# Cài đặt
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa .env
nano .env
```
Trong file .env, sửa:
```env
PORT=3000
JWT_SECRET=mat_khau_bi_mat_dai_12_ky_tu
API_BASE_URL=http://localhost:3000
```

Chạy server:
```bash
npm start
```
Mở trình duyệt → Vào `http://localhost:3000`

---

## 3. CẤU HÌNH

### Bước 3.1 - Đăng ký tài khoản Admin

Mở Terminal, chạy:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecosyntech.com","password":"Admin123!@#","name":"Admin"}'
```

**Ghi lại:**
- Email: `admin@ecosyntech.com`
- Password: `Admin123!@#`

### Bước 3.2 - Đăng nhập lấy Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecosyntech.com","password":"Admin123!@#"}'
```

**Copy token** từ kết quả (bắt đầu bằng `eyJ...`)

### Bước 3.3 - Cấu hình Telegram (Cảnh báo)

1. Mở Telegram → Tìm **@BotFather**
2. Gửi `/newbot` → Đặt tên → Lấy **Bot Token** (vd: `123456789:ABCdefGHI...`)
3. Mở **@userinfobot** → Lấy **Chat ID** của bạn

4. Cập nhật .env:
```env
TELEGRAM_NOTIFY_TOKEN=123456789:ABCdefGHI...
TELEGRAM_NOTIFY_CHAT_ID=12345678
```

---

## 4. KẾT NỐI THIẾT BỊ ESP32

### Bước 4.1 - Nạp Firmware V8.5.0

**Tải firmware:**
[Vào đây](https://github.com/ecosyntech68vn/Ecosyntech-FW) → Tải file `EcoSynTech_Firmware_V8_5_0.ino`

**Cấu hình trong Arduino IDE:**

1. Mở Arduino IDE → File → Preferences
2. Thêm URL: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Tools → Board → Board Manager → Cài **esp32 by Espressif**
4. Mở file firmware vừa tải
5. **Sửa các thông số MỀM:**

```cpp
// ===== THAY ĐỔI TẠI ĐÂY =====

// Tên thiết bị - THAY BẰNG ID CỦA BẠN
const char* device_id = "ECOSYNTECHFG0001";  // <-- ĐỔI THÀNH ID MỚI

// URL server - THAY BẰNG URL CỦA BẠN
const char* server_url = "https://ecosyntech-iot.onrender.com";  // <-- ĐỔI URL

// Webhook endpoint (thêm vào sau url)
String webhook_url = String(server_url) + "/api/firmware/webhook";

// HMAC Secret - PHẢI TRÙNG với server .env
const char* hmac_secret = "CEOTAQUANGTHUAN_TADUYANH_CTYTNHHDUYANH_ECOSYNTECH_2026";
```

### Bước 4.2 - Nạp code

1. ESP32 kết nối máy tính qua USB
2. Tools → Port → Chọn **COMx** (Windows) hoặc **/dev/ttyUSB0** (Mac/Linux)
3. Tools → Board → **ESP32 Dev Module**
4. Upload Speed: **921600**
5. Click **Upload** (mũi tên phải→)

### Bước 4.3 - Đổi ID thiết bị

Để đổi ID theo dạng `ECOSYNTECHFG0001`:

**Cách 1 - Sửa trong code trước khi nạp:**
```cpp
const char* device_id = "ECOSYNTECHFG0001";  // ID mới
```

**Cách 2 - Gửi lệnh đổi tên qua webhook:**
```bash
curl -X POST "https://your-server.com/api/firmware/devices/OLD_ID/command" \
  -H "Content-Type: application/json" \
  -d '{"command":"set_id","params":{"new_id":"ECOSYNTECHFG0001"}}'
```

### Bước 4.4 - Kiểm tra kết nối

Mở Serial Monitor (115200 baud), nếu thấy:
```
✓ Sensor data sent successfully
✓ Response received
```
= Kết nối thành công!

---

## 5. QUẢN LÝ THIẾT BỊ

### Bước 5.1 - Xem danh sách thiết bị

```bash
curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bước 5.2 - Gửi lệnh điều khiển

**Bật relay 1:**
```bash
curl -X POST http://localhost:3000/api/devices/ECOSYNTECHFG0001/command \
  -H "Content-Type: application/json" \
  -d '{"command":"relay1_on","params":{"duration":300}}'
```

**Tắt relay 1:**
```bash
curl -X POST http://localhost:3000/api/devices/ECOSYNTECHFG0001/command \
  -H "Content-Type: application/json" \
  -d '{"command":"relay1_off"}'
```

**Reboot thiết bị:**
```bash
curl -X POST http://localhost:3000/api/devices/ECOSYNTECHFG0001/command \
  -H "Content-Type: application/json" \
  -d '{"command":"reboot"}'
```

### Bước 5.3 - Cập nhật cấu hình

```bash
curl -X PUT http://localhost:3000/api/device-mgmt/ECOSYNTECHFG0001/config \
  -H "Content-Type: application/json" \
  -d '{"post_interval_sec":1800,"sensor_interval_sec":30,"deep_sleep_enabled":true}'
```

---

## 6. TRUY XUẤT NGUỒN GỐC

### Bước 6.1 - Tạo lô sản phẩm

```bash
curl -X POST http://localhost:3000/api/traceability/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name":"Rau cải xanh",
    "product_type":"vegetable",
    "batch_code":"LOT001",
    "zone":"vietname"
  }'
```

**Kết quả:** Nhận QR Code và URL truy xuất

### Bước 6.2 - Gán thiết bị vào lô

```bash
curl -X POST http://localhost:3000/api/firmware/batch/LOT001/attach \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"ECOSYNTECHFG0001"}'
```

### Bước 6.3 - Thêm giai đoạn

```bash
curl -X POST http://localhost:3000/api/traceability/batch/LOT001/stage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stage_name":"Gieo trồng",
    "stage_type":"planting",
    "description":"Gieo hạt giống",
    "performed_by":"Anh Tuấn"
  }'
```

### Bước 6.4 - Xem thông tin truy xuất

- QR Code: `http://localhost:3000/api/traceability/batch/LOT001/qr`
- Thông tin: `http://localhost:3000/api/traceability/batch/LOT001`

---

## 7. GIÁM SÁT & CẢNH BÁO

### Bước 7.1 - Xem cảm biến

```bash
curl -X GET http://localhost:3000/api/sensors \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bước 7.2 - Xem cảnh báo

```bash
curl -X GET http://localhost:3000/api/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bước 7.3 - Xem lịch sử

```bash
curl -X GET http://localhost:3000/api/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bước 7.4 - Dashboard

Mở: `http://localhost:3000/api/analytics/dashboard`

---

## 8. TROUBLESHOOTING

### Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách khắc phục |
|-----|------------|---------------|
| `Signature invalid` | HMAC secret không khớp | Kiểm tra .env `HMAC_SECRET` |
| `Timestamp expired` | Server time lệch | Đồng bộ thời gian |
| `Device not found` | ID sai | Kiểm tra device_id |
| `Connection failed` | Server down | Kiểm tra server đang chạy |
| `Database error` | SQLite lỗi | Xóa file .db trong thư mục data/ |

### Kiểm tra logs

```bash
# Xem logs server
tail -f logs/ecosyntech.log

# Xem real-time
npm run dev
```

### Reset hoàn toàn

```bash
# Xóa database
rm -rf data/ecosyntech.db

# Xóa node_modules
rm -rf node_modules

# Cài lại
npm install

# Chạy lại
npm start
```

---

## BẢNG TRA CỨU API

### Authentication
```
POST /api/auth/register  - Đăng ký
POST /api/auth/login   - Đăng nhập
GET  /api/auth/me    - Thông tin user
```

### Sensors
```
GET  /api/sensors           - Tất cả cảm biến
GET  /api/sensors/:type    - Cảm biến cụ thể
POST /api/sensors/update   - Cập nhật giá trị
```

### Devices
```
GET    /api/devices              - Danh sách thiết bị
GET    /api/devices/:id          - Thông tin thiết bị
POST   /api/devices             - Thêm thiết bị
POST   /api/devices/:id/command - Gửi lệnh
DELETE /api/devices/:id         - Xóa thiết bị
```

### Traceability
```
GET    /api/traceability/batches   - Danh sách lô
POST   /api/traceability/batch    - Tạo lô mới
GET    /api/traceability/batch/:code - Thông tin lô
POST   /api/traceability/batch/:code/stage - Thêm giai đoạn
GET    /api/traceability/batch/:code/qr  - QR Code
```

### Analytics
```
GET /api/analytics/dashboard   - Dashboard
GET /api/analytics/kpis    - KPIs
GET /api/analytics/export/pdf - Export PDF
GET /api/analytics/export/excel - Export Excel
```

### Firmware
```
POST /api/firmware/webhook          - Webhook ESP32
GET  /api/firmware/devices/:id   - Thông tin firmware
POST /api/firmware/devices/:id/command - Gửi lệnh
```

---

## LIÊN HỆ HỖ TRỢ

- **Email:** support@ecosyntech.com
- **Zalo:** [Link sẽ có]
- **Website:** [Link sẽ có]

---

**Version:** 2.1.1
**Updated:** 13/04/2026
**EcoSynTech IOT Platform**