# EcoSynTech i18n Guide

## Tổng quan

Hệ thống hỗ trợ **3 ngôn ngữ**:
- 🇻🇳 **Tiếng Việt (vi)** - Default
- 🇺🇸 **English (en)**
- 🇨🇳 **中文 (zh)**

## Cấu trúc

```
src/i18n/
├── index.js      # Core i18n functions
├── vi.json       # Tiếng Việt
├── en.json       # English
└── zh.json       # 中文
```

## Sử dụng trong Code

### Load translations
```javascript
const i18n = require('./src/i18n');

// Load tất cả translations
i18n.loadAllTranslations();
```

### Get current language
```javascript
const lang = i18n.getLanguage(); // 'vi'
```

### Set language
```javascript
i18n.setLanguage('en');
console.log(i18n.getLanguage()); // 'en'
```

### Translate
```javascript
// Translate
const text = i18n.t('dashboard.title');

// Với params
const text = i18n.t('time.minutes_ago', { n: 5 });
// Output: "5 phút trước" (nếu là tiếng Việt)
```

### Get supported languages
```javascript
const langs = i18n.getSupportedLanguages();
// { vi: { name: 'Tiếng Việt', ... }, en: {...}, zh: {...} }
```

### Pluralization
```javascript
const text = i18n.tArray('notification.item', 1);  // one
const text = i18n.tArray('notification.item', 3);  // few
const text = i18n.tArray('notification.item', 10); // many
```

## Sử dụng trong API

### Via Header
```bash
curl -H "Accept-Language: en" http://localhost:3000/api/sensors
```

### Via API
```bash
curl -X POST http://localhost:3000/api/settings/language \
  -H "Content-Type: application/json" \
  -d '{"language": "zh"}'
```

## Sử dụng trong Frontend

```javascript
// Detect language from browser
const lang = i18n.detectLanguage(navigator.language || 'en');

// Store in localStorage
localStorage.setItem('language', 'en');

// Load on page init
const savedLang = localStorage.getItem('language') || 'vi';
i18n.setLanguage(savedLang);

// Get translations
function t(key) {
  return i18n.t(key);
}

// Use in UI
document.getElementById('title').innerText = t('dashboard.title');
```

## Language Switcher Skill

Skill tự động switch language khi có event:

```javascript
{
  id: 'language-switcher',
  triggers: ['event:language.change', 'event:watchdog.tick'],
  run: function(ctx) {
    const lang = ctx.event.language || 'vi';
    i18n.setLanguage(lang);
    return { ok: true, language: lang };
  }
}
```

## Danh sách Keys (vi.json)

### App
- `app.name` - EcoSynTech IoT
- `app.tagline` - Nông nghiệp thông minh

### Navigation
- `nav.home` - Trang chủ
- `nav.dashboard` - Bảng điều khiển
- `nav.sensors` - Cảm biến
- `nav.devices` - Thiết bị
- `nav.rules` - Quy tắc
- `nav.schedules` - Lịch trình
- `nav.history` - Lịch sử
- `nav.alerts` - Cảnh báo
- `nav.settings` - Cài đặt

### Dashboard
- `dashboard.title` - Bảng điều khiển
- `dashboard.temperature` - Nhiệt độ
- `dashboard.humidity` - Độ ẩm
- `dashboard.soil_moisture` - Độ ẩm đất
- `dashboard.light` - Ánh sáng
- `dashboard.online` - Trực tuyến
- `dashboard.offline` - Ngoại tuyến

### Sensors
- `sensors.title` - Cảm biến
- `sensors.temperature` - Nhiệt độ
- `sensors.humidity` - Độ ẩm
- `sensors.soil` - Độ ẩm đất
- `sensors.light` - Ánh sáng
- `sensors.water` - Nước
- `sensors.co2` - CO2
- `sensors.ph` - pH
- `sensors.ec` - EC

### Devices
- `devices.title` - Thiết bị
- `devices.status` - Trạng thái
- `devices.online` - Hoạt động
- `devices.offline` - Ngừng
- `devices.last_seen` - Lần cuối

### Rules
- `rules.title` - Quy tắc
- `rules.create` - Tạo quy tắc
- `rules.edit` - Sửa
- `rules.delete` - Xóa
- `rules.enabled` - Bật
- `rules.disabled` - Tắt

### Common
- `common.save` - Lưu
- `common.cancel` - Hủy
- `common.delete` - Xóa
- `common.edit` - Sửa
- `common.add` - Thêm
- `common.search` - Tìm kiếm
- `common.loading` - Đang tải...
- `common.error` - Lỗi
- `common.success` - Thành công

### Units
- `unit.celsius` - °C
- `unit.percent` - %
- `unit.lux` - lux
- `unit.ppm` - ppm

### Time
- `time.now` - Bây giờ
- `time.minutes_ago` - {n} phút trước
- `time.hours_ago` - {n} giờ trước
- `time.days_ago` - {n} ngày trước

### Agriculture
- `agriculture.water.optimize` - Tối ưu nước
- `agriculture.water.soil_ok` - Độ ẩm đất tối ưu
- `agriculture.water.critical` - Thiếu nước nghiêm trọng
- `agriculture.crop.stage` - Giai đoạn
- `agriculture.crop.harvest` - Thu hoạch
- `agriculture.fertilizer.next` - Bón phân sau {n} ngày
- `agriculture.pest.detected` - Phát hiện sâu bệnh

### Ops
- `ops.health.score` - Điểm sức khỏe
- `ops.health.healthy` - Khỏe mạnh
- `ops.health.warning` - Cảnh báo
- `ops.health.critical` - Nguy hiểm
- `ops.backup.created` - Backup đã tạo
- `ops.backup.restored` - Đã phục hồi từ backup

## Thêm translation mới

### Thêm key vào vi.json
```json
{
  "custom.new_key": "Nội dung mới"
}
```

### Sử dụng
```javascript
i18n.loadAllTranslations(); // Reload
const text = i18n.t('custom.new_key');
```

---

**Version: 2.3.2**