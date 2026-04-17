# 📋 CHECK GOLIVE - ECO SYNTECH v2.3.2

## Mục lục

| File | Mô tả |
|------|-------|
| [00_MASTER_CHECKLIST.md](./00_MASTER_CHECKLIST.md) | Checklist tổng hợp tất cả sections |
| [01_auto_check.sh](./01_auto_check.sh) | Script tự động check các mục cơ bản |
| [02_version_checklist.md](./02_version_checklist.md) | Section 1: Phiên bản |
| [03_database_checklist.md](./03_database_checklist.md) | Section 2: Database |
| [04_security_checklist.md](./04_security_checklist.md) | Section 3: Bảo mật |
| [05_api_checklist.md](./05_api_checklist.md) | Section 4: API endpoints |
| [06_device_checklist.md](./06_device_checklist.md) | Section 6: Thiết bị ESP32 |
| [07_websocket_checklist.md](./07_websocket_checklist.md) | Section 5: WebSocket |
| [08_remaining_checklist.md](./08_remaining_checklist.md) | Sections 7-11 |
| [09_FIELD_CHECK.md](./09_FIELD_CHECK.md) | **CHECK HIỆN TRƯỜNG** - Phiên bản đơn giản |

---

## 🚀 Hướng dẫn sử dụng

### Bước 1: Chạy Auto Check
```bash
cd "Check Golive"
chmod +x 01_auto_check.sh

# Set environment
export BASE_URL=http://localhost:3000
export HMAC_SECRET=<your-secret>

# Chạy auto check
./01_auto_check.sh
```

### Bước 2: Check từng Section
```bash
# Mở file checklist tương ứng
# Làm theo hướng dẫn trong checklist
# Tick ✅ khi hoàn thành mỗi mục
```

### Bước 3: Cập nhật Master Checklist
```bash
# Mở 00_MASTER_CHECKLIST.md
# Cập nhật Status: 🔴 → 🟡 → 🟢
# Điền ngày check và ghi chú
```

---

## 📊 Bảng tổng kết nhanh

### CHECK HIỆN TRƯỜNG (12 items) - CHO VIỆC DEPLOY TẠI SITE
→ Xem: [09_FIELD_CHECK.md](./09_FIELD_CHECK.md)
→ Đơn giản, thực tế, không cần scripts phức tạp

### Cần cho GO-LIVE PILOT ✅
- [ ] Section 1: Phiên bản
- [ ] Section 2: Database
- [ ] Section 3: Bảo mật (3.1-3.5)
- [ ] Section 4: API (4.1-4.4)
- [ ] Section 6: Thiết bị (6.1-6.3)
- [ ] Section 10: Deploy

### Cần cho GO-LIVE THƯƠNG MẠI
- [ ] Tất cả sections

---

## ⚡ Quick Commands

```bash
# 1. Verify server is running
curl http://localhost:3000/api/health

# 2. Run auto checks
./01_auto_check.sh

# 3. Check version
curl http://localhost:3000/api/version

# 4. Test API without auth (should fail)
curl http://localhost:3000/api/devices

# 5. Test webhook signature
./01_auto_check.sh | grep -A5 "SECURITY"

# 6. Check metrics
curl http://localhost:3000/metrics | head -10

# 7. Check logs
tail -f logs/*.log

# 8. Database backup
npm run db-admin -- backup

# 9. Docker status
docker-compose ps

# 10. Full test suite
npm test
```

---

## 📝 Ghi chú khi check

### Trước khi bắt đầu
1. Đảm bảo server đang chạy
2. Backup database
3. Chuẩn bị credentials (HMAC_SECRET, JWT_SECRET)

### Trong quá trình check
1. Ghi lại tất cả failures
2. Chụp log/response khi có lỗi
3. Test lại sau khi fix

### Sau khi check
1. Tổng hợp kết quả
2. Liệt kê các issues cần fix
3. Lên kế hoạch fix và retest

---

## 📞 Hỗ trợ

Nếu gặp lỗi khi check, xem:
- [Server Logs](./logs/)
- [API Docs](../docs/)
- [README](../README.md)

---

**Version**: 2.3.2
**Last Updated**: 2026-04-17
**Status**: 🔴 CHƯA CHECK
