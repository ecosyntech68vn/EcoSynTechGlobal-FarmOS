# HƯỚNG DẪN TRIỂN KHAI ECO SYNTECH IOT V2.1.1
## Dành cho Khách hàng - Cầm tay chỉ việc

---

## MỤC LỤC
1. [Giới thiệu](#1-giới-thiệu)
2. [Chuẩn bị](#2-chuẩn-bị)
3. [Bắt đầu nhanh](#3-bắt-đầu-nhanh)
4. [Cài đặt chi tiết](#4-cài-đặt-chi-tiết)
5. [Kết nối Thiết bị](#5-kết-nối-thiết-bị)
6. [Sử dụng Dashboard](#6-sử-dụng-dashboard)
7. [Quản lý thiết bị](#7-quản-lý-thiết-bị)
8. [Truy xuất nguồn gốc](#8-truy-xuất-nguồn-gốc)
9. [Câu hỏi thường gặp](#9-câu-hỏi-thường-gặp)

---

## 1. GIỚI THIỆU

### 1.1 EcoSynTech IoT là gì?
EcoSynTech IoT là hệ thống nông nghiệp thông minh giúp bạn:
- 🌡️ **Giám sát** cảm biến nhiệt độ, độ ẩm, đất, ánh sáng
- 📱 **Điều khiển** thiết bị tưới, quạt, đèn từ xa
- 📊 **Dashboard** xem dữ liệu real-time
- 🔍 **Truy xuất** nguồn gốc sản phẩm bằng QR Code
- 📢 **Nhận cảnh báo** qua Telegram

### 1.2 Sơ đồ hệ thống
```
┌─────────────┐      HTTPS       ┌─────────────────┐
│   ESP32     │ ◄──────────────► │   SERVER        │
│  (Thiết bị) │    /webhook     │  (Cloud)        │
│             │                 │                 │
│ Sensors     │                 │ - Database      │
│ Relays      │                 │ - API           │
│ WiFi        │                 │ - Dashboard     │
└─────────────┘                 └─────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │  Dashboard / App   │
                              │  Telegram Bot       │
                              │  QR Code Trace      │
                              └─────────────────────┘
```

### 1.3 Yêu cầu thiết bị
- ✅ ESP32 WROOM hoặc ESP32-S3
- ✅ Cảm biến: DHT22, DS18B20, Soil Moisture
- ✅ Relay 5V điều khiển thiết bị
- ✅ Nguồn 5V/2A

---

## 2. CHUẨN BỊ

### 2.1 Danh sách cần chuẩn bị

| STT | Item | Mục đích | Ghi chú |
|-----|------|----------|---------|
| 1 | Điện thoại/PC có internet | Truy cập dashboard | Có WiFi |
| 2 | Tài khoản GitHub | Deploy server miễn phí | Dùng email đăng ký |
| 3 | Telegram | Nhận cảnh báo | Tải app trên điện thoại |
| 4 | Arduino IDE | Nạp firmware | [Tải tại đây](https://www.arduino.cc/en/software) |
| 5 | ESP32 Module | Thiết bị IoT | Mua tại shop |
| 6 | Cáp USB | Nạp code | Cáp data phone |

### 2.2 Tạo tài khoản Render (Server miễn phí)

**Bước 2.2.1 - Đăng ký**
1. Mở trình duyệt (Chrome/Edge/Safari)
2. Gõ: **render.com**
3. Click nút **Sign Up**
4. Chọn **Sign up with GitHub** (nhanh nhất)
5. Cho phép quyền truy cập GitHub
6. Nhập tên và xác nhận email

**Bước 2.2.2 - Xác nhận email**
1. Vào email (gmail/yahoo)
2. Mở thư từ Render
3. Click link xác nhận

✅ **Hoàn tất đăng ký!**

---

## 3. BẮT ĐẦU NHANH

Nếu bạn muốn dùng thử nhanh, làm theo 3 bước:

### Bước 3.1 - Deploy Server (3 phút)
1. Vào **github.com/ecosyntech68vn/Ecosyntech-web**
2. Click **Fork** (góc trên phải)
3. Vào **render.com** → **New** → **Web Service**
4. Tìm repo **Ecosyntech-web** (của bạn) → **Connect**
5. Đặt tên: `ecosyntech-iot`
6. Click **Create Web Service**
7. Đợi 3-5 phút → Copy URL (vd: `https://xxx.onrender.com`)

### Bước 3.2 - Đăng ký tài khoản
1. Mở Terminal (hoặc PowerShell)
2. Chạy:
```bash
curl -X POST https://YOUR_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"MatKhau123!","name":"Admin"}'
```
Thay `YOUR_URL` bằng URL server ở Bước 3.1

### Bước 3.3 - Nạp firmware vào ESP32
1. Tải firmware từ repo **ecosyntech68vn/Ecosyntech-FW**
2. Mở file `.ino` trong Arduino IDE
3. Sửa `device_id` và `server_url`
4. Nạp vào ESP32

✅ **Xong! Xem hướng dẫn chi tiết bên dưới**

---

## 4. CÀI ĐẶT CHI TIẾT

### 4.1 Deploy Server lên Render

**Bước 4.1.1 - Fork repository**
1. Mở **github.com/ecosyntech68vn/Ecosyntech-web**
2. Đợi trang tải xong
3. Click **Fork** (góc trên phải, màu xanh lá)
4. Chọn **Create fork**
5. Đợi tạo xong (~10 giây)

**Bước 4.1.2 - Tạo Web Service**
1. Mở **render.com** → Đăng nhập
2. Click **Dashboard** (menu trái)
3. Click **New** → **Web Service**
4. Tìm ô **GitHub** → Gõ tên repo của bạn
5. Chọn repo **Ecosyntech-web**
6. Click **Connect**

**Bước 4.1.3 - Cấu hình**
Trong trang cấu hình:

| Trường | Giá trị |
|--------|---------|
| Name | `ecosyntech-iot` |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Plan | **Free** |

**Bước 4.1.4 - Deploy**
1. Click **Create Web Service** (cuối trang)
2. Đợi **Building** (~2-3 phút)
3. Đợi **Deploying** (~1-2 phút)
4. Thấy chữ **Live** màu xanh = ✅ Thành công!

**Bước 4.1.5 - Lấy URL**
1. Trang Render, bên trái có chữ **ecosyntech-iot**
2. Copy URL bên cạnh (vd: `https://ecosyntech-iot.onrender.com`)
3. **Lưu URL này!** Dùng cho các bước sau

---

### 4.2 Cấu hình Telegram (Nhận cảnh báo)

**Bước 4.2.1 - Tạo Bot**
1. Mở **Telegram** trên điện thoại
2. Gõ tìm kiếm: **@BotFather** → Click
3. Gửi tin nhắn: `/newbot`
4. Bot hỏi tên bot - gõ: `EcoSynTech Alert`
5. Bot hỏi username - gõ: `ecosyntechalert_bot` (phải kết thúc bằng bot)
6. **QUAN TRỌNG:** Bot sẽ gửi một tin nhắn chứa **Token** dạng:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
7. **Copy và lưu token này!**

**Bước 4.2.2 - Lấy Chat ID**
1. Trong Telegram, gõ tìm: **@userinfobot** → Click
2. Gửi tin nhắn bất kỳ
3. Bot sẽ trả lời thông tin, tìm dòng **ID:**
4. **Copy số ID đó!** (vd: `12345678`)

**Bước 4.2.3 - Cập nhật server**
1. Vào trang **Dashboard** trên Render
2. Click **ecosyntech-iot** → **Environment**
3. Click **Add Environment Variable**
4. Thêm:
   | Key | Value |
   |-----|-------|
   | TELEGRAM_NOTIFY_TOKEN | `token từ Bước 4.2.1` |
   | TELEGRAM_NOTIFY_CHAT_ID | `ID từ Bước 4.2.2` |
5. Click **Deploy** (nút xanh trên cùng)
6. Đợi deploy lại (~2 phút)

✅ **Telegram sẽ gửi cảnh báo khi có sự cố!**

---

### 4.3 Đăng ký tài khoản Admin

**Cách 1 - Dùng Terminal**

Mở **Terminal** (Mac/Linux) hoặc **PowerShell** (Windows):

```bash
# Thay YOUR_URL bằng URL ở Bước 4.1.5
curl -X POST https://YOUR_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ecosyntech.com","password":"Admin123!@#","name":"QuanLy"}'
```

**Cách 2 - Dùng Postman (Dễ hơn)**

1. Tải **Postman** từ [postman.com](https://www.postman.com/downloads/)
2. Mở Postman
3. **NEW** → **Request**
4. Method: **POST**
5. URL: `https://YOUR_URL/api/auth/register`
6. Click **Body** → **raw** → Chọn **JSON**
7. Paste:
```json
{
  "email": "admin@ecosyntech.com",
  "password": "Admin123!@#",
  "name": "QuanLy"
}
```
8. Click **Send**
9. Thấy `"success":true` = ✅ Đăng ký thành công!

**Ghi lại thông tin đăng nhập:**
- Email: `admin@ecosyntech.com`
- Password: `Admin123!@#`

---

## 5. KẾT NỐI THIẾT BỊ

### 5.1 Cài đặt Arduino IDE

**Bước 5.1.1 - Tải và cài đặt**
1. Vào [arduino.cc/en/software](https://www.arduino.cc/en/software)
2. Click **Windows** / **Mac** / **Linux**
3. Cài đặt bình thường (Next → Next → Finish)

**Bước 5.1.2 - Cài đặt ESP32**
1. Mở Arduino IDE
2. Click **Arduino** → **Preferences** (Mac) hoặc **File** → **Preferences** (Windows)
3. Tìm ô **Additional Boards Manager URLs**
4. Paste link này:
```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```
5. Click **OK**
6. Click **Tools** → **Board** → **Boards Manager**
7. Gõ tìm: `esp32`
8. Click **Install** (chờ ~2 phút)

✅ **Xong phần cài đặt!**

---

### 5.2 Tải và cấu hình Firmware

**Bước 5.2.1 - Tải firmware**
1. Mở trình duyệt → Vào **github.com/ecosyntech68vn/Ecosyntech-FW**
2. Tìm file **EcoSynTech_Firmware_V8_5_0.ino**
3. Click vào file → Click **Download** (hoặc Copy raw content)

**Bước 5.2.2 - Mở file trong Arduino IDE**
1. Mở Arduino IDE
2. Click **File** → **Open**
3. Tìm và mở file vừa tải (đuôi .ino)

**Bước 5.2.3 - CẤU HÌNH QUAN TRỌNG!**

Tìm và sửa các dòng sau trong file code:

```cpp
// ==========================================
// 👇 SỬA CÁC DÒNG NÀY 👇
// ==========================================

// Dòng 1: Đặt ID thiết bị (duy nhất, không trùng)
const char* device_id = "ECOSYNTECHFG0001";  // 👈 ĐỔI THÀNH ID MỚI

// Dòng 2: URL server (từ Bước 4.1.5)
const char* server_url = "https://ecosyntech-iot.onrender.com";  // 👈 ĐỔI URL

// Dòng 3: Webhook URL (tự động ghép)
String webhook_url = String(server_url) + "/api/firmware/webhook";

// Dòng 4: HMAC Secret (phải giống server)
const char* hmac_secret = "CEOTAQUANGTHUAN_TADUYANH_CTYTNHHDUYANH_ECOSYNTECH_2026";
```

**Quy tắc đặt ID thiết bị:**
- Định dạng: `ECOSYNTECHFGXXXX` (X là số)
- Thiết bị 1: `ECOSYNTECHFG0001`
- Thiết bị 2: `ECOSYNTECHFG0002`
- Thiết bị 3: `ECOSYNTECHFG0003`
- **KHÔNG được trùng nhau!**

---

### 5.3 Nạp Firmware vào ESP32

**Bước 5.3.1 - Kết nối phần cứng**
1. Cắm **ESP32** vào máy tính bằng **cáp USB**
2. Đợi máy nhận driver (~30 giây)

**Bước 5.3.2 - Chọn Port**
1. Trong Arduino IDE
2. Click **Tools** → **Port**
3. Chọn **COMx** (Windows) hoặc **/dev/cu.xxx** (Mac)
4. Nếu không thấy port, cài driver CH340:
   - [Driver Windows](https://cdn.sparkfun.com/assets/f/f/a/9/3/CH341SER_WIN.ZIP)
   - [Driver Mac](https://cdn.sparkfun.com/assets/1/b/5/6/e/CH341SER_MAC.ZIP)

**Bước 5.3.3 - Cấu hình nạp**
1. Click **Tools** và cấu hình:
   | Setting | Value |
   |---------|-------|
   | Board | `ESP32 Dev Module` |
   | Upload Speed | `921600` |
   | Flash Frequency | `80MHz` |
   | Partition Scheme | `Default` |

**Bước 5.3.4 - Nạp code**
1. Click **Upload** (nút mũi tên → bên trên)
2. Đợi compile (~30 giây)
3. Thấy `Connecting...` → ESP32 nhấp nháy đèn
4. Thấy `Leaving...` = ✅ Nạp thành công!

---

### 5.4 Kiểm tra kết nối

**Bước 5.4.1 - Mở Serial Monitor**
1. Trong Arduino IDE
2. Click **Tools** → **Serial Monitor**
3. Chọn Baud Rate: **115200**

**Bước 5.4.2 - Xem log**
- Nếu thấy dòng:
  ```
  ✅ WiFi connected
  ✅ POST sensor data - 200 OK
  ✅ Response received
  ```
  = **Kết nối thành công!**

- Nếu thấy lỗi:
  ```
  ❌ WiFi failed
  ❌ Connection refused
  ❌ Signature error
  ```
  = **Xem mục 9 - Troubleshooting**

---

## 6. SỬ DỤNG DASHBOARD

### 6.1 Đăng nhập

1. Mở trình duyệt → Vào URL server
2. Click **Login** hoặc vào `/api/auth/login`
3. Nhập:
   - Email: `admin@ecosyntech.com`
   - Password: `Admin123!@#`
4. Copy **token** từ kết quả (dùng cho các API)

### 6.2 Xem Dashboard

| URL | Mô tả |
|-----|-------|
| `/api/analytics/dashboard` | Tổng quan hệ thống |
| `/api/analytics/kpis` | Chỉ số KPIs |
| `/api/sensors` | Dữ liệu cảm biến |
| `/api/devices` | Danh sách thiết bị |
| `/api/alerts` | Cảnh báo |
| `/api/history` | Lịch sử hoạt động |

### 6.3 Xem danh sách thiết bị

```bash
curl -X GET https://YOUR_URL/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Kết quả sẽ hiện danh sách thiết bị đã kết nối!

---

## 7. QUẢN LÝ THIẾT BỊ

### 7.1 Gửi lệnh điều khiển

**Bật thiết bị (Relay 1):**
```bash
curl -X POST https://YOUR_URL/api/devices/ECOSYNTECHFG0001/command \
  -H "Content-Type: application/json" \
  -d '{"command":"relay1_on","params":{"duration":300}}'
```

**Tắt thiết bị:**
```bash
curl -X POST https://YOUR_URL/api/devices/ECOSYNTECHFG0001/command \
  -H "Content-Type: application/json" \
  -d '{"command":"relay1_off"}'
```

**Reboot thiết bị:**
```bash
curl -X POST https://YOUR_URL/api/devices/ECOSYNTECHFG0001/command \
  -H "Content-Type: application/json" \
  -d '{"command":"reboot"}'
```

### 7.2 Cập nhật cấu hình

```bash
curl -X PUT https://YOUR_URL/api/device-mgmt/ECOSYNTECHFG0001/config \
  -H "Content-Type: application/json" \
  -d '{"post_interval_sec":1800,"sensor_interval_sec":30}'
```

### 7.3 Xem lịch sử thiết bị

```bash
curl -X GET https://YOUR_URL/api/firmware/devices/ECOSYNTECHFG0001/history
```

---

## 8. TRUY XUẤT NGUỒN GỐC

### 8.1 Tạo lô sản phẩm

```bash
curl -X POST https://YOUR_URL/api/traceability/batch \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_name": "Rau cải xanh",
    "product_type": "vegetable",
    "batch_code": "LOT001",
    "zone": "vietname"
  }'
```

**Kết quả:** Nhận QR Code + URL truy xuất!

### 8.2 Gán thiết bị vào lô

```bash
curl -X POST https://YOUR_URL/api/firmware/batch/LOT001/attach \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"ECOSYNTECHFG0001"}'
```

### 8.3 Thêm giai đoạn

```bash
curl -X POST https://YOUR_URL/api/traceability/batch/LOT001/stage \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "stage_name": "Gieo trồng",
    "stage_type": "planting",
    "description": "Gieo hạt giống cải xanh",
    "performed_by": "Anh Tuấn"
  }'
```

### 8.4 Xem QR Code

- QR: `https://YOUR_URL/api/traceability/batch/LOT001/qr`
- Info: `https://YOUR_URL/api/traceability/batch/LOT001`

---

## 9. CÂU HỎI THƯỜNG GẶP

### Lỗi 1: "Signature invalid"

**Nguyên nhân:** HMAC Secret không khớp giữa firmware và server

**Cách sửa:**
1. Trong file firmware, kiểm tra dòng `hmac_secret`
2. Đảm bảo giống với `.env` trong server
3. Nạp lại firmware

---

### Lỗi 2: "Device not found"

**Nguyên nhân:** ID thiết bị sai

**Cách sửa:**
1. Kiểm tra serial monitor để xem ID đang dùng
2. Sửa lại `device_id` trong firmware cho đúng

---

### Lỗi 3: ESP32 không kết nối WiFi

**Nguyên nhân:** Sai tên/mật khẩu WiFi

**Cách sửa:**
1. Tìm dòng `ssid` và `password` trong firmware
2. Sửa thành tên WiFi và mật khẩu của bạn
3. Nạp lại firmware

---

### Lỗi 4: Server không phản hồi

**Nguyên nhân:** Server bị sleep trên Render (sau 15 phút không dùng)

**Cách sửa:**
- Lần đầu vào, đợi 30 giây để server wake up
- Hoặc nâng cấp lên plan **Paid** ($7/tháng)

---

### Lỗi 5: Không gửi được lệnh

**Nguyên nhân:** Thiết bị offline hoặc token hết hạn

**Cách sửa:**
1. Kiểm tra thiết bị có online không: `/api/devices`
2. Refresh token: `/api/auth/login` lại

---

## 10. THÔNG TIN LIÊN HỆ

| Kênh | Thông tin |
|------|-----------|
| 📧 Email | support@ecosyntech.com |
| 📱 Zalo | [Liên hệ qua shop] |
| 🌐 Website | www.ecosyntech.com |
| 📖 Tài liệu | github.com/ecosyntech68vn/Ecosyntech-web |

---

## PHỤ LỤC: BẢNG TRA CỨU NHANH

### API Endpoints

| Mục đích | URL | Method |
|----------|-----|--------|
| Đăng nhập | `/api/auth/login` | POST |
| Xem cảm biến | `/api/sensors` | GET |
| Xem thiết bị | `/api/devices` | GET |
| Gửi lệnh | `/api/devices/:id/command` | POST |
| Tạo lô | `/api/traceability/batch` | POST |
| Xem QR | `/api/traceability/batch/:code/qr` | GET |
| Dashboard | `/api/analytics/dashboard` | GET |

---

**Cảm ơn bạn đã sử dụng EcoSynTech IoT!**

**Version:** 2.1.1  
**Ngày cập nhật:** 13/04/2026

---

*Made with ❤️ by EcoSynTech*