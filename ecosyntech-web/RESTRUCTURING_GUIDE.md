# 📋 RESTRUCTURING GUIDE - ECOSYNTECH-WEB
## Hướng dẫn tái cấu trúc chi tiết theo 5S, PDCA, ISO 27001

---

## ⚠️ CẢNH BÁO

**Dừng lại ở đây vì mức độ phức tạp cao:**
- 316+ JS files trong src/
- Nhiều interdependencies phức tạp
- Skills-registry có hàng trăm dynamic imports

**Khuyến nghị:** Thực hiện theo từng bước nhỏ với script tự động

---

## 📊 CẤU TRÚC HIỆN TẠI (đã revert về gốc)

```
src/
├── modules/         # 12 files - CẦN TÁCH
├── skills/        # 20 folders - CẦN TÁCH
├── config/        # Giữ nguyên
├── routes/        # Giữ nguyên
├── middleware/    # Giữ nguyên
├── services/      # Giữ nguyên
├── ops/          # CẦN TÁCH
├── watchdog/     # Giữ nguyên
├── websocket/    # Giữ nguyên
└── jobs/        # Giữ nguyên
```

---

## 🎯 CẤU TRÚC MỤC TIÊU

```
src/
├── 🏢 core/                    # CORE BUSINESS
│   ├── iot/                   # iot-engine, iot-dashboard
│   ├── supply-chain/         # hybrid-sync
│   └── inventory/           # cart
│
├── 🧠 intelligence/           # AI/ML
│   ├── analytics/           # analytics-engine
│   ├── ai-skills/         # agriculture, ai, analysis...
│   └── diagnosis/        # diagnosis skills
│
├── ⚙️ ops/                 # OPERATIONS
│   ├── automation/        # orchestration
│   ├── scheduler/        # scheduler
│   ├── alerts/          # alerts
│   └── notifications/   # notification-system
│
├── 🔐 security/             # SECURITY (ISO 27001)
│   └── security-enhancer.js
│
├── 🌐 external/            # EXTERNAL
│   ├── telegram/         # telegram-bot
│   ├── zalo/           # zalo-integration
│   ├── blockchain/     # blockchain-helper
│   └── sales/          # sales-integration + sales skills
│
├── 🏗️ infrastructure/       # INFRASTRUCTURE
│   ├── config/
│   ├── routes/
│   ├── middleware/
│   └── services/
│
└── 📦 modules/             # BACKWARD COMPATIBILITY
    ├── iot-engine.js → ../core/iot/
    └── ...
```

---

## 📋 CÁC BƯỚC THỰC HIỆN

### Bước 1: Clone và tạo branch mới
```bash
git clone https://github.com/ecosyntech68vn/Ecosyntech-web.git
cd Ecosyntech-web
git checkout -b restructure-v2
```

### Bước 2: Tạo cấu trúc thư mục
```bash
mkdir -p src/core/iot src/core/supply-chain src/core/inventory
mkdir -p src/intelligence/analytics src/intelligence/ai-skills src/intelligence/diagnosis
mkdir -p src/ops/automation src/ops/scheduler src/ops/alerts src/ops/notifications
mkdir -p src/security src/external/telegram src/external/zalo src/external/blockchain src/external/sales
mkdir -p src/infrastructure/config src/infrastructure/routes src/infrastructure/middleware src/infrastructure/services
```

### Bước 3: Di chuyển files
```bash
# CORE
mv src/modules/iot-engine.js src/core/iot/
mv src/modules/iot-dashboard.js src/core/iot/
mv src/modules/hybrid-sync.js src/core/supply-chain/
mv src/modules/cart.js src/core/inventory/

# INTELLIGENCE
mv src/modules/analytics-engine.js src/intelligence/analytics/
mv src/skills/agriculture src/intelligence/ai-skills/
mv src/skills/ai src/intelligence/ai-skills/
mv src/skills/diagnosis src/intelligence/diagnosis/

# OPS
mv src/modules/notification-system.js src/ops/notifications/
mv src/skills/orchestration src/ops/automation/

# SECURITY
mv src/modules/security-enhancer.js src/security/

# EXTERNAL
mv src/modules/telegram-sales-bot.js src/external/telegram/
mv src/modules/zalo-integration.js src/external/zalo/
mv src/modules/blockchain-helper.js src/external/blockchain/
mv src/modules/sales-integration.js src/external/sales/
```

### Bước 4: Tạo index.js cho mỗi domain
```javascript
// src/core/iot/index.js
module.exports = {
  ...require('./iot-engine'),
  ...require('./iot-dashboard')
};
```

### Bước 5: Tạo backward compatibility aliases
```bash
# src/modules/iot-engine.js → Backward compatibility
module.exports = require('../core/iot/iot-engine');
```

### Bước 6: Fix relative paths
```javascript
// Trong src/core/iot/iot-engine.js
// Sửa: require('../config/database')
// Thành: require('../../infrastructure/config/database')
```

### Bước 7: Tạo skill-registry resilient loader
```javascript
// src/ops/skill-registry.js
function safeRequire(path) {
  try { return require(path); } catch (e) { return null; }
}
// Load skills với safeRequire để không crash
```

### Bước 8: Test
```bash
npm install
node server.js
# Kiểm tra http://localhost:3000/api/health
```

---

## ✅ CHECKLIST

- [ ] Tạo branch mới
- [ ] Tạo cấu trúc thư mục
- [ ] Di chuyển modules theo domain
- [ ] Di chuyển skills theo domain
- [ ] Tạo index files
- [ ] Tạo backward compatibility
- [ ] Fix relative paths
- [ ] Fix skill-registry
- [ ] Test server khởi động
- [ ] Test API endpoints

---

## 🔧 SCRIPTS HỖ TRỢ

Tôi có thể tạo script tự động cho từng bước nếu bạn cần.

---

*Guide Version: 1.0*
*Created: 2026-04-26*
*Status: Ready for manual execution*