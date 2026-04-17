# CHECK GOLIVE - SECTION 1: PHIÊN BẢN

## Mục tiêu
Đảm bảo version đồng nhất và có tag release chính thức.

## Checklist

### 1.1 Đồng bộ version
```bash
# Kiểm tra version trong các file
grep '"version"' package.json
grep 'v2.3.2' server.js
curl http://localhost:3000/api/version | grep api
curl http://localhost:3000/api/health | grep version
```

**Expected**: Tất cả đều là `2.3.2`

### 1.2 Git tag
```bash
# Kiểm tra tag đã tồn tại
git tag -l

# Tạo tag mới nếu chưa có
git tag -a v2.3.2 -m "Release v2.3.2 - Production Ready"

# Push tag
git push origin v2.3.2
```

**Expected**: Tag `v2.3.2` đã được push

### 1.3 Changelog
```bash
# Kiểm tra changelog
cat docs/CHANGELOG.md
```

**Expected**: Có ghi chú cho version 2.3.2 với các thay đổi

### 1.4 Không còn code thử nghiệm
```bash
# Tìm console.log debug
grep -r "console.log" src/ --include="*.js" | grep -v test || echo "No debug logs"

# Tìm TODO/FIXME
grep -r "TODO\|FIXME\|XXX" src/ --include="*.js" || echo "No TODOs"
```

**Expected**: Không có debug logs hoặc TODOs trong code production

## Sign-off
- [ ] Đã kiểm tra tất cả items
- [ ] Version đồng bộ ở 2.3.2
- [ ] Git tag đã được tạo và push
- [ ] Changelog đã được cập nhật

**Ngày**: _______________
**Người check**: _______________
**Kết quả**: ✅ PASS | ❌ FAIL
