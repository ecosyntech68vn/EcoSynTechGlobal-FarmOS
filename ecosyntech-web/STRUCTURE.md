# 📁 ECOSYNTECH-WEB RESTRUCTURED
## Theo tiêu chuẩn 5S, PDCA, FIFO, ISO 27001

---

## 🏗️ CẤU TRÚC MỚI (Domain-Based Organization)

```
src/
├── 🏢 core/                    # CORE BUSINESS MODULES
│   ├── iot/                   # IoT Engine + Dashboard
│   ├── supply-chain/          # Hybrid Sync
│   ├── inventory/             # Cart/Inventory
│   ├── finance/              # Finance
│   ├── worker/              # Worker Management
│   └── traceability/         # Traceability
│
├── 🧠 intelligence/           # AI & ML
│   ├── ml/                  # Machine Learning
│   ├── ai-skills/           # AI Skills Agents
│   └── analytics/           # Analytics Engine
│
├── ⚙️ ops/                   # OPERATIONS
│   ├── automation/         # Orchestration
│   ├── scheduler/          # Scheduling
│   ├── alerts/            # Alerts
│   ├── notifications/    # Notification System
│   ├── recovery/          # Recovery Skills
│   └── skill-registry.js  # Resilient Skill Loader
│
├── 🏗️ infrastructure/        # INFRASTRUCTURE
│   ├── config/             # Configuration
│   ├── database/          # Database
│   ├── middleware/        # Middleware
│   ├── routes/           # API Routes
│   └── websocket/        # WebSocket
│
├── 🔐 security/             # SECURITY (ISO 27001)
│   └── security-enhancer.js
│
├── 🌐 external/             # EXTERNAL INTEGRATIONS
│   ├── telegram/          # Telegram Bot
│   ├── zalo/             # Zalo
│   ├── messenger/        # Messenger
│   ├── blockchain/       # Blockchain
│   ├── weather/         # Weather
│   ├── weblocal/        # WebLocal
│   └── sales/           # Sales
│
├── 📦 modules/ (BACKWARD COMPATIBILITY ALIASES)
└── skills/ (giữ nguyên)
```

---

## ✅ 5S PRINCIPLES APPLIED

| 5S | Implementation |
|----|----------------|
| Sort | Phân loại theo domain |
| Set | Module hóa theo chức năng |
| Shine | Documentation đầy đủ |
| Standardize | ISO 27001 alignment |
| Sustain | Resilient loader |

---

## 🔄 BACKWARD COMPATIBILITY

- `src/modules/*.js` → aliases re-export
- Code cũ không cần sửa
- Import paths giữ nguyên

---

## 🛡️ RESILIENT LOADING

`skill-registry.js` dùng safeRequire() để handle missing skills.

---

## 🚀 TEST

```bash
npm install
node server.js
```

---

*Restructured: 2026-04-26*
*5S, PDCA, ISO 27001*
*Backward Compatible: ✅*