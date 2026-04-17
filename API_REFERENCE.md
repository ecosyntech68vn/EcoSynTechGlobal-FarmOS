# EcoSynTech API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication
Tất cả endpoints cần auth có icon 🔐

```bash
# Header
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints

### 📊 Stats
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /stats | ❌ | Thống kê hệ thống |
| GET | /stats/dashboard | ❌ | Dashboard stats |
| GET | /stats/sensors | ❌ | Sensor statistics |

---

### 👥 Users
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | /auth/register | ❌ | Đăng ký |
| POST | /auth/login | ❌ | Đăng nhập |
| GET | /auth/me | 🔐 | Thông tin user |
| PUT | /auth/password | 🔐 | Đổi password |

---

### 🌡️ Sensors
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /sensors | ❌ | Danh sách sensors |
| GET | /sensors/:type | ❌ | Chi tiết sensor |
| POST | /sensors/update | ❌ | Cập nhật giá trị |

---

### 📟 Devices
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /devices | ❌ | Danh sách devices |
| GET | /devices/:id | ❌ | Chi tiết device |
| POST | /devices | 🔐 | Thêm device |
| PUT | /devices/:id | 🔐 | Cập nhật device |
| DELETE | /devices/:id | 🔐 | Xóa device |
| POST | /devices/:id/command | 🔐 | Gửi command |

---

### 📋 Rules
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /rules | 🔐 | Danh sách rules |
| GET | /rules/:id | 🔐 | Chi tiết rule |
| POST | /rules | 🔐 | Tạo rule |
| PUT | /rules/:id | 🔐 | Cập nhật rule |
| DELETE | /rules/:id | 🔐 | Xóa rule |
| GET | /rules/:id/history | 🔐 | Lịch sử trigger |

---

### ⏰ Schedules
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /schedules | 🔐 | Danh sách schedules |
| GET | /schedules/:id | 🔐 | Chi tiết schedule |
| POST | /schedules | 🔐 | Tạo schedule |
| PUT | /schedules/:id | 🔐 | Cập nhật schedule |
| DELETE | /schedules/:id | 🔐 | Xóa schedule |

---

### 📜 History
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /history | ❌ | Lịch sử events |
| GET | /history/device/:id | ❌ | Lịch sử device |

---

### 🚨 Alerts
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /alerts | 🔐 | Danh sách alerts |
| POST | /alerts/:id/acknowledge | 🔐 | Acknowledge |

---

### 🔗 Webhooks
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /webhooks | 🔐 | Danh sách webhooks |
| POST | /webhooks | 🔐 | Tạo webhook |
| PUT | /webhooks/:id | 🔐 | Cập nhật webhook |
| DELETE | /webhooks/:id | 🔐 | Xóa webhook |

---

### 📈 Analytics
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /analytics/overview | 🔐 | Overview |
| GET | /analytics/trends | 🔐 | Xu hướng |
| GET | /analytics/export/pdf | 🔐 | Export PDF |
| GET | /analytics/export/excel | 🔐 | Export Excel |

---

### 🌱 Agriculture
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /agriculture/crops | 🔐 | Danh sách cây trồng |
| POST | /agriculture/crops | 🔐 | Thêm cây trồng |
| POST | /agriculture/crops/:id/harvest | 🔐 | Thu hoạch |
| GET | /agriculture/crops/:id/yields | 🔐 | Lịch sử thu hoạch |

---

### 🔒 Security
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /security/vulns | 🔐 | Vulnerability scan |
| POST | /security/scan | 🔐 | Trigger scan |

---

### 🔐 RBAC
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /rbac/roles | 🔐 | Danh sách roles |
| POST | /rbac/roles | 🔐 | Tạo role |
| GET | /rbac/permissions | 🔐 | Danh sách permissions |

---

### 📱 Device Management
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | /device-mgmt/provision | 🔐 | Provision device |
| POST | /device-mgmt/:id/firmware | 🔐 | Update firmware |
| GET | /device-mgmt/:id/status | 🔐 | Device status |

---

### 📦 Traceability (QR Code + Blockchain)

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | /traceability/batch | 🔐 | Tạo batch + QR |
| GET | /traceability/batches | 🔐 | Danh sách batches |
| GET | /traceability/batch/:code | ❌ | Truy xuất batch |
| POST | /traceability/batch/:code/stage | 🔐 | Thêm giai đoạn |
| POST | /traceability/batch/:code/harvest | 🔐 | Thu hoạch |
| POST | /traceability/batch/:code/export | 🔐 | Xuất bán |
| POST | /traceability/batch/:code/certify | 🔐 | Thêm chứng nhận |
| GET | /traceability/batch/:code/full | ❌ | Timeline đầy đủ |
| GET | /traceability/batch/:code/qr | ❌ | Lấy QR code |
| GET | /traceability/batch/:code/label | ❌ | Label in được |
| POST | /traceability/scan | ❌ | Scan QR check nguồn gốc |
| GET | /traceability/verify/:code | ❌ | Verify blockchain |
| GET | /traceability/export/pdf | 🔐 | Export PDF |
| GET | /traceability/export/excel | 🔐 | Export Excel |
| GET | /traceability/stats | 🔐 | Thống kê |

---

### 📝 Settings
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| GET | /settings | 🔐 | Settings |
| PUT | /settings | 🔐 | Cập nhật settings |
| POST | /settings/language | ❌ | Đổi ngôn ngữ |

---

## Example Usage

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecosyntech.com", "password": "admin123"}'

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {...}
}
```

### Create Batch with QR
```bash
curl -X POST http://localhost:3000/api/traceability/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "product_name": "Rau muống",
    "product_type": "vegetable",
    "quantity": 100,
    "unit": "kg",
    "farm_name": "EcoFarm"
  }'

# Response
{
  "success": true,
  "batch": {
    "batch_code": "BATCH-XXXX-XXXX",
    "product_name": "Rau muống"
  },
  "qr_code": "data:image/png;base64,...",
  "trace_url": "https://ecosyntech.com/trace/BATCH-XXXX-XXXX"
}
```

### Scan QR Code
```bash
curl -X POST http://localhost:3000/api/traceability/scan \
  -H "Content-Type: application/json" \
  -d '{"qr_data": "https://ecosyntech.com/trace/BATCH-XXXX-XXXX"}'

# Response
{
  "success": true,
  "valid": true,
  "origin": {
    "farm_name": "EcoFarm",
    "product_name": "Rau muống",
    "planting_date": "2026-01-15"
  },
  "timeline": [...],
  "blockchain": {...}
}
```

---

## WebSocket Events

```javascript
// Connect
const ws = new WebSocket('ws://localhost:3000');

// Subscribe
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'sensors'
}));

// Listen
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

### Event Types
- `sensor-update` - Cập nhật sensor
- `device-status` - Trạng thái device
- `alert` - Alert mới
- `rule-triggered` - Rule được trigger

---

## Error Codes

| Code | Mô tả |
|------|-------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Error |

---

**Version: 2.3.2**