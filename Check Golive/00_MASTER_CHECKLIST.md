# ✅ CHECKLIST GOLIVE - ECO SYNTECH v2.3.2

## Trạng thái: 🔴 CHƯA CHECK | 🟡 ĐANG CHECK | 🟢 ĐÃ CHECK

---

## 1️⃣ ỔN ĐỊNH PHIÊN BẢN

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 1.1 | [ ] Đồng bộ version 2.3.2: README, package.json, server.js, /api/version | 🔴 | | |
| 1.2 | [ ] Git tag `v2.3.2` đã tạo và push | 🔴 | | |
| 1.3 | [ ] Changelog có ghi chú cho bản này | 🔴 | | |
| 1.4 | [ ] Không còn code thử nghiệm/debug | 🔴 | | |

---

## 2️⃣ DỮ LIỆU VÀ LƯU TRỮ

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 2.1 | [ ] DB_PATH đúng: `./data/ecosyntech.db` | 🔴 | | |
| 2.2 | [ ] Thư mục `./data/` tồn tại và có quyền ghi | 🔴 | | |
| 2.3 | [ ] DB file tồn tại và có kích thước > 0 | 🔴 | | |
| 2.4 | [ ] Backup database: `npm run db-admin -- backup` | 🔴 | | |
| 2.5 | [ ] Test restart server - dữ liệu không mất | 🔴 | | |
| 2.6 | [ ] Test migration: `npm run db-admin -- migrate` | 🔴 | | |
| 2.7 | [ ] Test restore: `npm run db-admin -- restore` | 🔴 | | |

---

## 3️⃣ BẢO MẬT

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 3.1 | [ ] `HMAC_SECRET` đã đặt trong .env (không phải mặc định) | 🔴 | | |
| 3.2 | [ ] `JWT_SECRET` đã đặt trong .env (không phải `dev-secret-change-me`) | 🔴 | | |
| 3.3 | [ ] `WEBHOOK_SECRET` đã đặt trong .env | 🔴 | | |
| 3.4 | [ ] `CORS_ORIGIN` đặt domain thật (không phải `*`) | 🔴 | | |
| 3.5 | [ ] Không có secret trong code hoặc .env.example | 🔴 | | |
| 3.6 | [ ] Test gọi API không có token → 401 Unauthorized | 🔴 | | |
| 3.7 | [ ] Test webhook signature sai → 401 Unauthorized | 🔴 | | |
| 3.8 | [ ] Rate limit hoạt động (vượt quota → 429) | 🔴 | | |
| 3.9 | [ ] Helmet security headers enable | 🔴 | | |

---

## 4️⃣ API VÀ NGHIỆP VỤ

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 4.1 | [ ] POST `/api/auth/register` - đăng ký user mới | 🔴 | | |
| 4.2 | [ ] POST `/api/auth/login` - đăng nhập thành công | 🔴 | | |
| 4.3 | [ ] GET `/api/sensors` - lấy danh sách sensors | 🔴 | | |
| 4.4 | [ ] POST `/api/devices` - tạo device mới | 🔴 | | |
| 4.5 | [ ] GET `/api/devices` - lấy danh sách devices | 🔴 | | |
| 4.6 | [ ] PUT `/api/devices/:id` - cập nhật device | 🔴 | | |
| 4.7 | [ ] DELETE `/api/devices/:id` - xóa device | 🔴 | | |
| 4.8 | [ ] POST `/api/rules` - tạo rule mới | 🔴 | | |
| 4.9 | [ ] GET `/api/rules` - lấy danh sách rules | 🔴 | | |
| 4.10 | [ ] POST `/api/schedules` - tạo schedule mới | 🔴 | | |
| 4.11 | [ ] GET `/api/history` - lấy lịch sử | 🔴 | | |
| 4.12 | [ ] GET `/api/alerts` - lấy alerts | 🔴 | | |
| 4.13 | [ ] GET `/api/stats` - lấy statistics | 🔴 | | |
| 4.14 | [ ] POST `/api/import` - import data | 🔴 | | |
| 4.15 | [ ] POST `/api/export` - export data | 🔴 | | |
| 4.16 | [ ] GET `/api/health` - health check | 🔴 | | |
| 4.17 | [ ] GET `/api/version` - version info | 🔴 | | |
| 4.18 | [ ] Test input sai → 400 Bad Request | 🔴 | | |
| 4.19 | [ ] Test field vượt giới hạn → 400 | 🔴 | | |

---

## 5️⃣ WEBSOCKET VÀ REALTIME

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 5.1 | [ ] Kết nối WebSocket `/ws` thành công | 🔴 | | |
| 5.2 | [ ] Test reconnect khi mất mạng | 🔴 | | |
| 5.3 | [ ] Test 5+ clients cùng kết nối | 🔴 | | |
| 5.4 | [ ] Broadcast dữ liệu sensor realtime | 🔴 | | |
| 5.5 | [ ] Broadcast alerts realtime | 🔴 | | |
| 5.6 | [ ] Không rò rỉ kết nối khi client đóng | 🔴 | | |

---

## 6️⃣ FIRMWARE / THIẾT BỊ

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 6.1 | [ ] Test POST `/api/webhook/esp32` - ESP32 gửi data | 🔴 | | |
| 6.2 | [ ] Test nhận envelope signature đúng | 🔴 | | |
| 6.3 | [ ] Test signature sai → 401 | 🔴 | | |
| 6.4 | [ ] Test non replay (nonce reuse → 401) | 🔴 | | |
| 6.5 | [ ] Test timestamp hết hạn → 401 | 🔴 | | |
| 6.6 | [ ] Test GET `/api/webhook/command/:deviceId` - ESP32 nhận lệnh | 🔴 | | |
| 6.7 | [ ] Test POST `/api/webhook/command-result` - ESP32 báo kết quả | 🔴 | | |
| 6.8 | [ ] Test mapping sensor readings vào DB | 🔴 | | |
| 6.9 | [ ] Test config response về ESP32 (600/600) | 🔴 | | |
| 6.10 | [ ] Test batches/rules response | 🔴 | | |

---

## 7️⃣ TÀI KHOẢN VÀ PHÂN QUYỀN

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 7.1 | [ ] Test đăng ký với email trùng → lỗi | 🔴 | | |
| 7.2 | [ ] Test đăng ký với password ngắn → lỗi | 🔴 | | |
| 7.3 | [ ] Test login với sai password → lỗi | 🔴 | | |
| 7.4 | [ ] Test token hết hạn → 401 | 🔴 | | |
| 7.5 | [ ] Test refresh token | 🔴 | | |
| 7.6 | [ ] Test admin có quyền full | 🔴 | | |
| 7.7 | [ ] Test user không có quyền admin | 🔴 | | |
| 7.8 | [ ] Test user không xem được data của user khác | 🔴 | | |

---

## 8️⃣ LOGGING VÀ GIÁM SÁT

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 8.1 | [ ] Logs có format đầy đủ (timestamp, level, message) | 🔴 | | |
| 8.2 | [ ] Không log password/token/secret | 🔴 | | |
| 8.3 | [ ] Error logs được ghi đầy đủ | 🔴 | | |
| 8.4 | [ ] Metrics `/metrics` hoạt động | 🔴 | | |
| 8.5 | [ ] Health endpoint `/api/health` hoạt động | 🔴 | | |
| 8.6 | [ ] Health endpoint `/api/healthz` hoạt động | 🔴 | | |

---

## 9️⃣ HIỆU NĂNG

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 9.1 | [ ] Test response time API chính < 200ms | 🔴 | | |
| 9.2 | [ ] Test 50 requests đồng thời không lỗi | 🔴 | | |
| 9.3 | [ ] Memory usage ổn định (restart không leak) | 🔴 | | |

---

## 🔟 BUILD / DEPLOY

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 10.1 | [ ] Tests pass: `npm test` → 46/46 | 🔴 | | |
| 10.2 | [ ] Lint pass: `npm run lint` → 0 errors | 🔴 | | |
| 10.3 | [ ] Build pass: `npm run build` | 🔴 | | |
| 10.4 | [ ] Docker build thành công | 🔴 | | |
| 10.5 | [ ] Docker compose up thành công | 🔴 | | |
| 10.6 | [ ] Health check sau deploy → healthy | 🔴 | | |

---

## 1️⃣1️⃣ TÀI LIỆU

| # | Mục kiểm tra | Status | Check lúc | Ghi chú |
|---|--------------|--------|-----------|---------|
| 11.1 | [ ] README.md đầy đủ | 🔴 | | |
| 11.2 | [ ] .env.production có đầy đủ config | 🔴 | | |
| 11.3 | [ ] Có docs/API endpoint | 🔴 | | |
| 11.4 | [ ] Có hướng dẫn rollback | 🔴 | | |
| 11.5 | [ ] Có hướng dẫn backup/restore | 🔴 | | |

---

## 📋 TỔNG KẾT

| Section | Đã Check | Tổng | % Hoàn thành |
|---------|----------|------|--------------|
| 1. Phiên bản | 0 | 4 | 0% |
| 2. Dữ liệu | 0 | 7 | 0% |
| 3. Bảo mật | 0 | 9 | 0% |
| 4. API | 0 | 19 | 0% |
| 5. WebSocket | 0 | 6 | 0% |
| 6. Thiết bị | 0 | 10 | 0% |
| 7. Tài khoản | 0 | 8 | 0% |
| 8. Logging | 0 | 6 | 0% |
| 9. Hiệu năng | 0 | 3 | 0% |
| 10. Deploy | 0 | 6 | 0% |
| 11. Tài liệu | 0 | 5 | 0% |
| **TỔNG** | **0** | **83** | **0%** |

---

## ✅ KẾT LUẬN

- [ ] **ĐẠT GO-LIVE PILOT**: Cần hoàn thành sections 1, 2, 3, 4.1-4.4, 6.1-6.3, 10, 11
- [ ] **ĐẠT GO-LIVE THƯƠNG MẠI**: Cần hoàn thành 100% tất cả sections

**Ngày check**: _______________
**Người check**: _______________
**Kết luận**: _______________
