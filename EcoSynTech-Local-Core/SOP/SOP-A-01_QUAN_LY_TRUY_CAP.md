# SOP-A-01: QUẢN LÝ TRUY CẬP VÀ XÁC THỰC

**Phiên bản:** 1.0 | **Ngày:** 2026-04-20 | **Chu kỳ:** 3 tháng

---

## 1. PHẠM VI

Áp dụng cho tất cả người dùng truy cập hệ thống EcoSynTech FarmOS.

## 2. MỤC TIÊU

- Đảm bảo chỉ người dùng được ủy quyền mới truy cập hệ thống
- Bảo vệ thông tin đăng nhập
- Tuân thủ ISO 27001:2022

## 3. ĐỊNH NGHĨA

| Thuật ngữ | Định nghĩa |
|-----------|-------------|
| Người dùng | Nhân viên có tài khoản truy cập hệ thống |
| Quản trị viên | IT Admin có quyền cao nhất |
| Token | JWT dùng để xác thực API |

## 4. QUY TRÌNH

### 4.1 Tạo tài khoản mới

```
Bước 1: Quản trị viên nhận yêu cầu từ Phòng Nhân sự
    ↓
Bước 2: Xác minh danh tính qua email công ty
    ↓
Bước 3: Tạo tài khoản với vai trò phù hợp
    ↓
Bước 4: Gửi thông tin đăng nhập qua kênh bảo mật
    ↓
Bước 5: Người dùng đổi mật khẩu trong 24h
```

### 4.2 Xóa tài khoản

```
Bước 1: Nhận yêu cầu từ Phòng Nhân sự
    ↓
Bước 2: Xác minh lý do (nghỉ việc, chuyển công tác...)
    ↓
Bước 3: Vô hiệu hóa tài khoản trong vòng 24h
    ↓
Bước 4: Xóa quyền truy cập khỏi hệ thống
    ↓
Bước 5: Lưu log vào hồ sơ
```

### 4.3 Đổi mật khẩu

| Tần suất | Yêu cầu |
|----------|---------|
| Theo định kỳ | 90 ngày/lần |
| Sau sự cố | Ngay lập tức |

**Yêu cầu mật khẩu:**
- Tối thiểu 8 ký tự
- Chữ hoa, chữ thường, số, ký tự đặc biệt
- Không trùng 5 mật khẩu gần nhất

### 4.4 Xác thực hai yếu tố (2FA)

**Bắt buộc cho:**
- Quản trị viên
- Tài khoản truy cập API production
- Người dùng quyền admin

**Phương thức 2FA:**
1. Email xác minh
2. Ứng dụng Authenticator (Google Auth, Authy)

## 5. TRÁCH NHIỆM

| Vai trò | Trách nhiệm |
|--------|-------------|
| IT Admin | Tạo, xóa, quản lý tài khoản |
| Người dùng | Bảo mật thông tin đăng nhập |
| Quản lý | Phê duyệt quyền truy cập |

## 6. KIỂM SOÁT

- Log truy cập được lưu 90 ngày
- Đăng nhập thất bại 5 lần → Khóa 15 phút
- Session timeout: 30 phút không hoạt động

## 7. ĐIỂM KIỂM TRA

- [ ] Tài khoản mới được phê duyệt
- [ ] Mật khẩu đổi sau 24h
- [ ] Log kiểm tra hàng tuần
- [ ] Review quyền hàng tháng

---

**Người tạo:** EcoSynTech | **Ngày:** 2026-04-20
**Người duyệt:** | **Ngày duyệt:**