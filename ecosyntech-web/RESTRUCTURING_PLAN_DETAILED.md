# 📋 RESTRUCTURING PLAN - ECOSYNTECH-WEB
## Chi tiết từng bước theo 5S, PDCA, ISO 27001

---

## 📊 PHASE 1: ANALYZE - Phân tích hiện trạng

### Cấu trúc hiện tại:
```
src/
├── modules/        # 12 files - HỔN HỢP
├── skills/         # 20 folders - THIẾU PHÂ LOẠI
├── config/
├── routes/
├── middleware/
├── services/
├── ops/
├── watchdog/
└── websocket/
```

### Vấn đề:
- modules/ chứa nhiều loại module khác nhau (IoT, External, OPS, Security)
- skills/ không có tiêu chuẩn đặt tên
- Thiếu domain-based organization

---

## 🎯 PHASE 2: PLAN - Mapping chi tiết

### A) MODULES MAPPING (src/modules/)
| File | Domain | New Location |
|------|-------|--------------|
| iot-engine.js | CORE/IOT | src/core/iot/iot-engine.js |
| iot-dashboard.js | CORE/IOT | src/core/iot/iot-dashboard.js |
| hybrid-sync.js | CORE/SUPPLY-CHAIN | src/core/supply-chain/hybrid-sync.js |
| cart.js | CORE/INVENTORY | src/core/inventory/cart.js |
| analytics-engine.js | INTELLIGENCE | src/intelligence/analytics/analytics-engine.js |
| notification-system.js | OPS | src/ops/notifications/notification-system.js |
| security-enhancer.js | SECURITY | src/security/security-enhancer.js |
| blockchain-helper.js | EXTERNAL | src/external/blockchain/blockchain-helper.js |
| telegram-sales-bot.js | EXTERNAL | src/external/telegram/telegram-bot.js |
| zalo-integration.js | EXTERNAL | src/external/zalo/zalo-integration.js |
| messenger-integration.js | EXTERNAL | src/external/messenger/messenger-integration.js |
| sales-integration.js | EXTERNAL | src/external/sales/sales-integration.js |

### B) SKILLS MAPPING (src/skills/)
| Folder | Domain | New Location |
|--------|--------|--------------|
| agriculture | INTELLIGENCE | src/intelligence/ai-skills/agriculture/ |
| ai | INTELLIGENCE | src/intelligence/ai-skills/ |
| analysis | INTELLIGENCE | src/intelligence/analysis/ |
| communication | OPS | src/ops/communication/ |
| dashboard | INTELLIGENCE | src/intelligence/dashboard/ |
| defense | SECURITY | src/security/defense/ |
| diagnosis | INTELLIGENCE | src/intelligence/diagnosis/ |
| drift | INTELLIGENCE | src/intelligence/drift/ |
| governance | SECURITY | src/security/compliance/ |
| iot | CORE | src/core/iot/skills/ |
| maintenance | OPS | src/ops/maintenance/ |
| network | INFRASTRUCTURE | src/infrastructure/network/ |
| orchestration | OPS | src/ops/automation/ |
| recovery | OPS | src/ops/recovery/ |
| release | OPS | src/ops/deployment/ |
| sales | EXTERNAL | src/external/sales/skills/ |
| security | SECURITY | src/security/ |
| selfheal | OPS | src/ops/selfheal/ |
| sync | CORE | src/core/supply-chain/sync/ |
| traceability | CORE | src/core/traceability/ |

### C) INFRASTRUCTURE MAPPING
| Current | New |
|---------|-----|
| src/config/ | src/infrastructure/config/ |
| src/routes/ | src/infrastructure/routes/ |
| src/middleware/ | src/infrastructure/middleware/ |
| src/services/ | src/infrastructure/services/ |
| src/websocket/ | src/infrastructure/websocket/ |
| src/watchdog/ | src/infrastructure/watchdog/ |

### D) OPS MAPPING
| Current | New |
|---------|-----|
| src/ops/ | src/ops/core/ |
| src/jobs/ | src/ops/jobs/ |

---

## 🏗️ PHASE 3: TARGET STRUCTURE

```
ecosyntech-web/
├── src/
│   ├── 🏢 core/                     # CORE BUSINESS DOMAIN
│   │   ├── farm/                   # Farm Management
│   │   ├── iot/                   # IoT + Skills
│   │   ├── supply-chain/          # Supply Chain + Sync
│   │   ├── inventory/             # Inventory
│   │   ├── finance/              # Finance
│   │   ├── worker/               # Worker
│   │   └── traceability/         # Traceability
│   │
│   ├── 🧠 intelligence/            # AI & ML
│   │   ├── ml/                   # ML Models
│   │   ├── ai-skills/            # AI Skills (Agriculture, Diagnosis...)
│   │   ├── analytics/            # Analytics Engine
│   │   ├── analysis/            # Analysis Skills
│   │   ├── diagnosis/           # Diagnosis Skills
│   │   ├── dashboard/          # Dashboard Skills
│   │   ├── drift/               # Drift Detection
│   │   └── decision/            # Decision Support
│   │
│   ├── ⚙️ ops/                    # OPERATIONS
│   │   ├── automation/          # Orchestration Skills
│   │   ├── scheduler/           # Scheduling
│   │   ├── alerts/             # Alerts
│   │   ├── notifications/      # Notifications
│   │   ├── communication/      # Communication Skills
│   │   ├── maintenance/        # Maintenance Skills
│   │   ├── recovery/          # Recovery Skills
│   │   ├── deployment/        # Deployment Skills
│   │   ├── selfheal/           # Self-Healing Skills
│   │   └── core/               # Core Ops
│   │
│   ├── 🏗️ infrastructure/         # INFRASTRUCTURE
│   │   ├── config/             # Configuration
│   │   ├── database/          # Database
│   │   ├── middleware/        # Middleware
│   │   ├── routes/            # Routes
│   │   ├── services/         # Services
│   │   ├── websocket/         # WebSocket
│   │   └── network/          # Network Skills
│   │
│   ├── 🔐 security/               # SECURITY (ISO 27001)
│   │   ├── compliance/        # Compliance Skills
│   │   ├── defense/          # Defense Skills
│   │   └── security/         # Security Skills
│   │
│   ├── 🌐 external/               # EXTERNAL INTEGRATIONS
│   │   ├── telegram/          # Telegram
│   │   ├── zalo/             # Zalo
│   │   ├── messenger/         # Messenger
│   │   ├── blockchain/       # Blockchain
│   │   ├── weather/         # Weather
│   │   ├── weblocal/        # WebLocal
│   │   └── sales/           # Sales + Skills
│   │
│   ├── 📦 modules/              # BACKWARD COMPATIBILITY
│   │   ├── iot-engine.js → ../core/iot/
│   │   ├── iot-dashboard.js → ...
│   │   └── ...
│   │
│   └── 📜 common/              # COMMON
│
├── docs/                        # DOCUMENTATION
├── tests/                      # TESTS
├── migrations/                 # DB MIGRATIONS
└── seeders/                   # DB SEEDERS
```

---

## ✅ PRINCIPLES

### 5S:
- **Sort**: Phân loại theo domain
- **Set**: Module hóa theo chức năng
- **Shine**: Documentation đầy đủ
- **Standardize**: ISO 27001, naming convention
- **Sustain**: PDCA cycle

### FIFO:
- Database migrations: First In First Out
- Event queues: FIFO processing

### ISO 27001:
- Security modules riêng biệt
- Audit trail đầy đủ
- Compliance monitoring

### PDCA:
- Plan → Do → Check → Act

---

*Plan Version: 1.0*
*Created: 2026-04-26*