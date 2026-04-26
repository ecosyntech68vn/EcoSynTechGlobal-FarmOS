# SOP-A-04: SAO LƯU VÀ PHỤC HỒI

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20 | **Chu kỳ:** 1 tháng

---

## 1. PHẠM VI

Áp dụng cho việc sao lưu và phục hồi dữ liệu EcoSynTech FarmOS.

## 2. MỤC TIÊU

- Đảm bảo dữ liệu không bị mất
- Khôi phục nhanh chóng khi xảy ra sự cố
- Tuân thủ ISO 27001:2022 (A.8.13 Backup)

## 3. LOẠI BACKUP

| Loại | Tần suất | Lưu trữ | Mục đích |
|------|---------|---------|----------|
| Full | Hàng ngày 00:00 | 30 ngày | Khôi phục hoàn toàn |
| Incremental | Mỗi 6 giờ | 7 ngày | Thay đổi gần nhất |
| Config | Sau mỗi thay đổi | 90 ngày | Cấu hình hệ thống |

## 4. QUY TRÌNH SAO LƯU

### 4.1 Tự động (khuyến nghị)

```
Hệ thống tự động:
├── 00:00 - Full backup
├── 06:00 - Incremental
├── 12:00 - Incremental
├── 18:00 - Incremental
└── Sau config thay đổi - Config backup
```

### 4.2 Thủ công (khi cần)

```
Bước 1: SSH vào server
    ↓
Bước 2: Chạy backup script
    cd /root/EcoSynTechClaude-Code
    npm run backup
    ↓
Bước 3: Xác nhận file backup tạo thành công
    ↓
Bước 4: Upload lên storage ngoài (S3/Google Drive)
```

## 5. QUY TRÌNH PHỤC HỒI

### 5.1 Phục hồi Database

```
Bước 1: Dừng server
    pm2 stop ecosyntech
    ↓
Bước 2: Xác định thời điểm cần phục hồi
    ↓
Bước 3: Chạy restore
    npm run restore -- --date=YYYY-MM-DD
    ↓
Bước 4: Xác nhận dữ liệu phục hồi đúng
    ↓
Bước 5: Khởi động lại server
    pm2 start ecosyntech
```

### 5.2 Phục hồi sau thảm họa

```
Bước 1: Chuẩn bị server mới
    ↓
Bước 2: Cài đặt dependencies
    npm install
    ↓
Bước 3: Phục hồi từ backup gần nhất
    npm run restore
    ↓
Bước 4: Phục hồi cấu hình
    cp .env.example .env
    # Cập nhật env variables
    ↓
Bước 5: Kiểm tra hệ thống
    npm test
    ↓
Bước 6: Khởi động
    npm start
```

## 6. KIỂM TRA BACKUP

| Hành động | Tần suất |
|-----------|---------|
| Verify backup tự động | Hàng ngày |
| Test restore | Hàng tháng |
| Review dung lượng lưu trữ | Hàng tuần |

## 7. THỜI GIAN PHỤC HỒI MỤC TIÊU

| Loại sự cố | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|------------|-------------------------|------------------------------|
| Database | 30 phút | 6 giờ |
| Server | 1 giờ | 24 giờ |
| Thảm họa | 4 giờ | 24 giờ |

## 8. DANH MỤC KIỂM TRA

- [ ] Backup tự động chạy đúng giờ
- [ ] Dung lượng backup trong giới hạn
- [ ] Test restore thành công hàng tháng
- [ ] Backup được lưu ngoài server

---

**Người tạo:** EcoSynTech | **Ngày:** 2026-04-20
**Người duyệt:** | **Ngày duyệt:**