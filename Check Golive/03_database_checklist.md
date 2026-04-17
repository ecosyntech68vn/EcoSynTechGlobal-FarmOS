# CHECK GOLIVE - SECTION 2: DỮ LIỆU VÀ LƯU TRỮ

## Mục tiêu
Đảm bảo database hoạt động persistent, có backup, và không mất dữ liệu khi restart.

## Checklist

### 2.1 Kiểm tra DB_PATH
```bash
# Kiểm tra config
grep DB_PATH .env

# Expected: DB_PATH=./data/ecosyntech.db
```

### 2.2 Kiểm tra thư mục data
```bash
# Tạo thư mục nếu chưa có
mkdir -p data

# Kiểm tra quyền ghi
touch data/test.txt && rm data/test.txt && echo "Write OK"
```

### 2.3 Kiểm tra DB file
```bash
# Kiểm tra file tồn tại
ls -la data/ecosyntech.db

# Expected: File tồn tại với kích thước > 0
```

### 2.4 Backup database
```bash
# Chạy backup
npm run db-admin -- backup

# Kiểm tra file backup
ls -la data/backups/

# Expected: Có file backup mới nhất
```

### 2.5 Test restart không mất dữ liệu
```bash
# Lưu lại số lượng records trước
curl -s http://localhost:3000/api/devices | jq '. | length'

# Restart server
# Docker: docker-compose restart api
# Hoặc: pkill -f "node server.js" && npm start &

# Chờ server khởi động
sleep 5

# Kiểm tra số lượng records sau
curl -s http://localhost:3000/api/devices | jq '. | length'

# Expected: Số lượng giống nhau
```

### 2.6 Test migration
```bash
# Chạy migration
npm run db-admin -- migrate

# Expected: Migration chạy thành công
```

### 2.7 Test restore
```bash
# List backups
ls -la data/backups/

# Restore từ backup mới nhất
npm run db-admin -- restore

# Expected: Restore thành công
```

## Sign-off
- [ ] DB_PATH đúng
- [ ] Thư mục data tồn tại và có quyền ghi
- [ ] DB file tồn tại
- [ ] Backup tạo được
- [ ] Restart không mất dữ liệu
- [ ] Migration chạy được
- [ ] Restore chạy được

**Ngày**: _______________
**Người check**: _______________
**Kết quả**: ✅ PASS | ❌ FAIL
