# EcoSynTech - Break-Even Calculation Explained
## Giải thích chi tiết cách tính điểm hòa vốn

---

## 1. CÁC THÀNH PHẦN CHI PHÍ

### Fixed Costs (Chi phí cố định - hàng tháng)
```
Server + Domain:    500,000 VND
MQTT Broker:        150,000 VND
Support Tools:      200,000 VND
Marketing:          500,000 VND
Development:      1,000,000 VND
─────────────────────────────
TỔNG FIXED:      2,450,000 VND/tháng
```

### Variable Costs (Chi phí biến đổi - mỗi khách hàng/tháng)
```
Data Storage:    5,000 VND
API/AI Calls:   10,000 VND
Support:        15,000 VND
────────────────
TỔNG VARIABLE: 30,000 VND/khách hàng/tháng
```

---

## 2. CONTRIBUTION MARGIN (Lợi nhuận góp) TỪNG TIER

### Công thức:
```
Contribution Margin = Monthly Revenue - Variable Costs
```

| Tier | Monthly Revenue | Variable Costs | Contribution Margin |
|------|-----------------|----------------|---------------------|
| **PRO** | 99,000 | 30,000 | **69,000 VND** |
| **PRO MAX** | 199,000 | 30,000 | **169,000 VND** |
| **PREMIUM** | 299,000 | 30,000 | **269,000 VND** |
| **BASE** | 0 | 30,000 | **-30,000 VND** (lỗ) |

### Ý nghĩa:
- Mỗi khách PRO mang lại **69,000 VND/tháng** để trả fixed costs
- Nếu bán được 22 khách PRO → 22 × 69,000 = 1,518,000 VND → Vẫn chưa đủ 2,450,000 ❌

---

## 3. WEIGHTED AVERAGE CONTRIBUTION (Trung bình gia quyền)

### Giả định mix khách hàng:
```
60% PRO     → 0.60
25% PRO MAX → 0.25
10% PREMIUM → 0.10
5% BASE     → 0.05
(Tổng = 100%)
```

### Tính toán:
```
PRO (60%):       69,000 × 0.60 = 41,400
PRO MAX (25%):  169,000 × 0.25 = 42,250
PREMIUM (10%):  269,000 × 0.10 = 26,900
BASE (5%):      (-30,000) × 0.05 = -1,500
────────────────────────────────────────────────
WEIGHTED CM:                    110,050 VND/khách/tháng
```

### Ý nghĩa:
- **Trung bình** mỗi khách hàng đóng góp **110,050 VND/tháng**
- Trung bình có tính đến cả khách BASE (lỗ 30K) và PREMIUM (lời 269K)

---

## 4. TÍNH ĐIỂM HÒA VỐN

### Công thức:
```
Break-Even Customers = Fixed Costs ÷ Weighted CM
```

### Tính toán:
```
BEP = 2,450,000 ÷ 110,050 = 22.26 ≈ 22 khách hàng/tháng
```

### Kiểm tra:
```
22 khách × 110,050 = 2,421,100 ≈ 2,450,000 ✅
```

---

## 5. BREAK-EVEN THEO TỪNG TRƯỜNG HỢP

### Nếu bán 100% PRO:
```
BEP = 2,450,000 ÷ 69,000 = 35.5 ≈ 36 khách/tháng
```

### Nếu bán 100% PRO MAX:
```
BEP = 2,450,000 ÷ 169,000 = 14.5 ≈ 15 khách/tháng
```

### Nếu bán 100% PREMIUM:
```
BEP = 2,450,000 ÷ 269,000 = 9.1 ≈ 10 khách/tháng
```

### Nếu bán mix (60/25/10/5):
```
BEP = 22 khách/tháng (như đã tính)
```

---

## 6. SCENARIOS - NẾU ĐỔI MIX KHÁCH HÀNG

### Mix A: Nhiều PRO hơn (70% PRO, 20% MAX, 10% PREMIUM)
```
PRO (70%):      69,000 × 0.70 = 48,300
MAX (20%):     169,000 × 0.20 = 33,800
PREMIUM (10%): 269,000 × 0.10 = 26,900
─────────────────────────────────────────
Weighted CM:                       109,000
BEP: 2,450,000 ÷ 109,000 = 22.5 ≈ 23 khách
```

### Mix B: Nhiều PREMIUM hơn (40% PRO, 30% MAX, 30% PREMIUM)
```
PRO (40%):      69,000 × 0.40 = 27,600
MAX (30%):     169,000 × 0.30 = 50,700
PREMIUM (30%): 269,000 × 0.30 = 80,700
─────────────────────────────────────────
Weighted CM:                       159,000
BEP: 2,450,000 ÷ 159,000 = 15.4 ≈ 16 khách
```

---

## 7. BẢNG TỔNG HỢP

| Scenario | Weighted CM | BEP (khách/tháng) |
|----------|-------------|-------------------|
| 100% BASE | -30,000 | ∞ (không bao giờ) |
| 100% PRO | 69,000 | 36 |
| 100% PRO MAX | 169,000 | 15 |
| 100% PREMIUM | 269,000 | 10 |
| **Mix hiện tại (60/25/10/5)** | **110,050** | **22** |
| Mix B (40/30/30) | 159,000 | 16 |

---

## 8. Ý NGHĨA THỰC TẾ

### Với 22 khách/tháng:
```
Doanh thu tháng (mix 60/25/10/5):
├── 13-14 PRO       × 99K     = 1.3-1.4M
├── 5-6 PRO MAX    × 199K    = 1.0-1.2M
├── 2 PREMIUM      × 299K    = 0.6M
└── 1 BASE         × 0       = 0
──────────────────────────────────
TỔNG:                        ~3.0-3.2M/tháng

Trừ variable (22 × 30K):     -0.66M
Trừ fixed:                   -2.45M
──────────────────────────────────
LỢI NHUẬN:                   ~0 (hòa vốn) ✅
```

### Target hàng năm:
```
22 khách/tháng × 12 tháng = 264 khách/năm
```

---

## 9. CÁC BƯỚC TỐI ƯU GIÁ

### Bước 1: Xác định Fixed Costs
- Tính tổng chi phí cố định hàng tháng

### Bước 2: Xác định Variable Costs
- Tính chi phí cho mỗi khách hàng

### Bước 3: Đặt giá subscription
- Giá phải > Variable Costs để có contribution margin dương

### Bước 4: Ước tính mix khách hàng
- Dự đoán tỷ lệ khách mỗi tier

### Bước 5: Tính Weighted CM
- Trung bình gia quyền theo mix

### Bước 6: Tính BEP
- Fixed Costs ÷ Weighted CM

### Bước 7: Verify
- Kiểm tra lại với doanh thu thực tế

---

**Document:** Break-Even Calculation Explanation
**Date:** 2026-04-25