# UI/UX & DASHBOARD SPEC – EcoSynTech FarmOS PRO

## Mục lục
1. [Mục tiêu](#81-mục-tiêu)
2. [Nguyên tắc thiết kế](#82-nguyên-tắc-thiết-kế)
3. [Cấu trúc điều hướng](#83-cấu-trúc-điều-hướng-tổng-thể)
4. [Dashboard chính](#84-dashboard-chính)
5. [Dashboard theo vai trò](#85-dashboard-theo-vai-trò)
6. [Màn hình Farm Overview](#86-màn-hình-farm-overview)
7. [Màn hình Asset Management](#87-màn-hình-asset-management)
8. [Màn hình Logs](#88-màn-hình-logs)
9. [Màn hình Plans & Tasks](#89-màn-hình-plans--tasks)
10. [Màn hình IoT](#810-màn-hình-iot)
11. [Màn hình AI](#811-màn-hình-ai)
12. [Màn hình Traceability](#812-màn-hình-traceability)
13. [Màn hình Reports](#813-màn-hình-reports)
14. [Màn hình Alerts](#814-màn-hình-alerts)
15. [Form design rules](#815-form-design-rules)
16. [QR / Scan UX](#816-qr--scan-ux)
17. [Design system](#817-design-system)
18. [Responsive behavior](#818-responsive-behavior)
19. [Accessibility](#819-accessibility)
20. [Offline/low-connectivity UX](#820-offlinelow-connectivity-ux)
21. [Notification UX](#821-notification-ux)
22. [User flow mẫu](#822-user-flow-mẫu)
23. [KPI cho UI/UX](#823-kpi-cho-uiux)
24. [UI/UX priorities theo phase](#824-uiux-priorities-theo-phase)

---

## 8.1 Mục tiêu

UI/UX của EcoSynTech FarmOS PRO phải đạt **4 mục tiêu**:

| Mục tiêu | Mô tả |
|----------|-------|
| **Dễ dùng tại hiện trường** | Người dùng ngoài nông trại phải thao tác nhanh, ít bước, ít nhập liệu |
| **Phù hợp nhiều vai trò** | Mỗi nhóm người dùng nhìn thấy đúng thứ họ cần |
| **Thời gian thực, dễ ra quyết định** | Dashboard ưu tiên cảnh báo, khuyến nghị và hành động |
| **Chuẩn SaaS enterprise** | Trông chuyên nghiệm, rõ ràng, có thể bán cho farm, hợp tác xã và doanh nghiệp |

---

## 8.2 Nguyên tắc thiết kế

### A. Mobile-first
> Giao diện phải dùng tốt trên điện thoại vì người làm nông thường kiểm tra bằng mobile trước.

### B. Action-first
Mỗi màn hình nên trả lời nhanh 3 câu:
1. **Có vấn đề gì không?** → Hiển thị alerts nổi bật
2. **Cần làm gì ngay?** → Action buttons rõ ràng
3. **Ai chịu trách nhiệm?** → Assignee hiển thị

### C. Information hierarchy rõ ràng
Ưu tiên theo thứ tự:
1. 🔴 Cảnh báo (Alert)
2. 🟡 Tình trạng vận hành (Status)
3. 🔵 Dữ liệu chi tiết (Details)
4. ⚪ Báo cáo lịch sử (History)

### D. Ít nhập tay
Nên dùng:
- ✅ Chọn nhanh (dropdown, chips)
- ✅ Scan QR
- ✅ Nút hành động (action buttons)
- ✅ Template sẵn (quick log templates)

### E. Tối ưu cho outdoor usage
- Font lớn (≥14px body)
- Tương phản tốt (contrast ratio ≥4.5:1)
- Nút chạm rõ (≥44px touch target)
- Không quá nhiều chữ nhỏ

---

## 8.3 Cấu trúc điều hướng tổng thể

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIDEBAR / BOTTOM NAV                       │
├─────────────┬─────────────┬─────────────┬─────────────┬────────┤
│  Dashboard  │   Farms    │   Assets   │    Logs    │  Plans  │
├─────────────┼─────────────┼─────────────┼────���────────┼────────┤
│     IoT     │Traceability │     AI     │  Reports   │ Alerts │
├─────────────┴─────────────┴─────────────┴─────────────┴────────┤
│                      Settings                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Desktop Layout
```
┌──────────────────────────────────────────────────────────────┐
│  [Logo]  [Farm Selector ▼]  [Search]  [🔔]  [👤]            │ ← Top Bar
├────────────┬───────────────────────────────────────────────┤
│            │                                                │
│  SIDEBAR   │              MAIN CONTENT                      │
│            │                                                │
│  Dashboard │   (Dynamic based on navigation)               │
│  Farms     │                                                │
│  Assets    │                                                │
│  Logs      │                                                │
│  Plans     │                                                │
│  IoT       │                                                │
│  Trace    │                                                │
│  AI        │                                                │
│  Reports  │                                                │
│  Alerts   │                                                │
│  Settings │                                                │
└────────────┴───────────────────────────────────────────────┘
```

### Mobile Layout
```
┌──────────────────────────────────────────────────────────────┐
│                    TOP BAR                                   │
├──────────────────────────────────────────────────────────────┤
│                                                        │
│                 MAIN CONTENT                             │
│                                                        │
├──────────┬──────────┬──────────┬──────────┬──────────┤
│Dashboard│  Farms   │  Tasks   │  Alerts  │   More   │
│   🏠    │   🌾    │   📋    │   🔔    │   ⋯     │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 8.4 Dashboard chính

> Dashboard chính là màn hình quan trọng nhất.

### Thành phần bắt buộc

| STT | Thành phần | Mô tả |
|-----|----------|-------|
| 1 | Tổng số farm | Số lượng farm đang quản lý |
| 2 | Số khu vực hoạt động | Area đang canh tác |
| 3 | Trạng thái thiết bị | Online/Offline count |
| 4 | Cảnh báo mở | Số alert chưa xử lý |
| 5 | Task hôm nay | Task cần làm hôm nay |
| 6 | Khuyến nghị AI | AI recommendations |
| 7 | Tiến độ mùa vụ |Season progress |
| 8 | Chỉ số sản xuất chính | KPIs |

### Cấu trúc Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. HEADER SUMMARY                                             │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│ │  Farm A    │  │  Mùa Xuân   │  │  ✅ Good   │            │
│ │  (đang chọn)│  │  2024     │  │  Status   │            │
│ └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ 2. KPI CARDS                                                  │
│ ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐        │
│ │ 🌡️ 28°C│ │ 💧 75% │ │ 📡 12/ │ │ ⚠️ 3   │ │ 📋 5   │        │
│ │ Nhiệt  │ │ Độ Ẩm │ │  15   │ │ Alerts │ │ Tasks  │        │
│ └────────┘└────────┘└────────┘└────────┘└────────┘        │
├─────────────────────────────────────────────────────────────┤
│ 3. ALERT PANEL                                                │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ 🔴 [Cảnh báo] Độ ẩm đất khu A-12 thấp (28%)              │  │
│ │ 🟡 [Chú ý]   Thiết bị #4 mất kết nối                      │  │
│ │ 🟡 [Chú ý]   Dự báo mưa lớn ngày mai                      │  │
│ └─────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ 4. AI RECOMMENDATION PANEL                                     │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ 🤖 Khuyến nghị: Tưới nước khu vực B-3                  │  │
│ │    Lý do: Độ ẩm đất 28% < ngưỡng tối thiểu 35%          │  │
│ │    [✅ Duyệt] [⏰ Hoãn] [❌ Bỏ qua]                     │  │
│ └─────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ 5. ACTIVITY TIMELINE                                           │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ 🕐 14:30 - Worker Nguyen Van A thu hoạch khu A-1       │  │
│ │ 🕐 10:15 - Tưới nước khu B-2 (500L)                   │  │
│ �� 🕐 08:00 - Bón phân NPK khu A-3                       │  │
│ └─────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ 6. CHARTS                                                    │
│ ┌────────────────────────┐ ┌────────────────────────┐      │
│ │   📈 Trend độ ẩm       │ │   📊 Yield by Season   │      │
│ │   [7 ngày qua]        │ │   [2023 vs 2024]       │      │
│ └────────────────────────┘ └────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8.5 Dashboard theo vai trò

### A. Super Admin Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ SYSTEM OVERVIEW                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 50 Tenants│ │ 99.9%   │ │ 12     │ │ 3       │           │
│ │          │ │ Uptime  │ │ Errors │ │ Security│           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│ [Tenant Map] [Billing] [Queue Backlog] [Security Alerts]      │
└──��──────────────────────────────────────────────────────────────┘
```

### B. Org Owner Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ FARM OVERVIEW + FINANCIAL                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 5 Farms │ │ ₫150M   │ │ +12%    │ │ 98%     │           │
│ │          │ │ Revenue │ │ YoY     │ │ Quality │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│ [Cost by Season] [ROI Chart] [Traceability Status] [AI Summary]│
└─────────────────────────────────────────────────────────────────┘
```

### C. Farm Manager Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ TODAY'S TASKS + PLAN PROGRESS                                     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 12 Tasks │ │ 65%     │ │ 3 Alerts │ │ 8 Recs  │           │
│ │ Hôm nay  │ │ Progress│ │ Need Fix │ │ AI      │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│ [Task Board] [Season Calendar] [AI Recommendations] [Asset Map]  │
└─────────────────────────────────────────────────────────────────┘
```

### D. Technician Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ DEVICE HEALTH + MAINTENANCE                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│ │ 15/15    │ │ 1        │ │ v2.3.1   │ │ 0.1%    │           │
│ │ Online   │ │ Offline  │ │ Firmware │ │ Loss    │           │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│ [Device Cards] [Signal History] [MaintenanceTasks] [Firmware]  │
└─────────────────────────────────────────────────────────────────┘
```

### E. Worker Dashboard
```
┌─────────────────────────────────────────────────────────────────┐
│ MY TASKS + QUICK LOG                                             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ☑️ Tưới nước khu A-1 (hoàn thành)                          │ │
│ │ ☐ Bón phân khu B-2 (15:00 deadline)                       │ │
│ │ ☐ Kiểm tra bệnh khu C-3                                   │ │
│ └──────────────────────────────────────────────────────────┘ │
│ [📷 Quick Log] [📱 Scan QR] [✅ Confirm Task]                   │
└─────────────────────────────────────────────────────────────────┘
```

### F. Viewer Dashboard (Read-only)
```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 DASHBOARD VIEW ONLY                                          │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│ │ 🌡️ 28°C │ │ 💧 75%  │ │ 📈 12T  │                         │
│ └──────────┘ └──────────┘ └──────────┘                         │
│ [Farm Stats] [Reports] [History]                               │
│ ⚠️ Bạn chỉ có quyền xem. Liên hệ admin để chỉnh sửa.            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8.6 Màn hình Farm Overview

### Thành phần
- Bản đồ farm / khu vực (Map view)
- Danh sách farm / area (List view)
- Trạng thái từng khu
- Thiết bị gắn vào khu
- Task và log liên quan
- Cảnh báo theo khu

### UX Requirements
| Yêu cầu | Mô tả |
|--------|-------|
| Click area | Mở side panel chi tiết |
| Đổi farm | Dropdown hoặc map selector |
| Filter | Theo mùa vụ, loại cây, trạng thái, mức cảnh báo |
| Search | Tìm nhanh theo tên |

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│ [Farm: Farm A ▼] [+ New Farm] [🔍 Search] [⚙️]            │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────────────────┐ │
│ │                    │ │ AREA A-1                        │ │
│ │    🗺️ MAP VIEW    │ │ Status: 🟢 Active               │ │
│ │                    │ │ Crop: Rau muống                 │ │
│ │   [Area Pins]     │ │ Device: 3/3 online              │ │
│ │                    │ │ Alerts: 0                     │ │
│ │                    │ │ [View Details →]              │ │
│ └────────────────────┘ └────────────────────────────────┘ │
│ ┌────────────────────┐ ┌────────────────────────────────┐ │
│ │                    │ │ AREA A-2                        │ │
│ │                    │ │ Status: 🟡 Warning (1 alert)    │ │
│ │                    │ │ Crop: Xà lách                   │ │
│ │                    │ │ Device: 2/3 online              │ │
│ └────────────────────┘ └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 8.7 Màn hình Asset Management

### Thành phần
| Chức năng | Mô tả |
|-----------|-------|
| Tạo asset | Thêm mới asset |
| Chỉnh sửa asset | Edit thông tin |
| Gắn asset vào area | Link asset-area |
| Xem lịch sử asset | History timeline |
| Xem relation | Asset parent-child tree |
| Truy ngược log | Link to related logs |

### Asset Card
```
┌────────────────────────────────────────────────────────────┐
│ 🛠️ Máy bơm nước BP-001                    [🟢 Online]     │
│ Type: Water Pump                                           │
│ Location: Khu A-2                                         │
│ Last Update: 14:30 (5 phút trước)                         │
│ Related Logs: 45 | Last Activity: Tưới nước              │
│ ───────────────────────────────────────────────────────── │
│ [📋 Logs] [📍 Location] [✏️ Edit] [🗑️ Delete]            │
└────────────────────────────────────────────────────────────┘
```

### Views
- **Tree View**: Hierarchical parent-child relationship
- **List View**: Table với sort/filter
- **Card View**: Grid of cards với quick actions

---

## 8.8 Màn hình Logs

### Thành phần
| Chức năng | Mô tả |
|-----------|-------|
| Timeline | Log sorted by time |
| Filters | Type, farm, area, asset |
| Attachments | Ảnh, ghi chú, file |
| Links | Quantity, task, batch |

### Log Entry Format
```
┌────────────────────────────────────────────────────────────┐
│ 🕐 14:30 - 25/04/2024                                     │
│ 👤 Nguyen Van A                                           │
│ 🌾 Khu A-1 (Rau muống)                                   │
│ ───────────────────────────────────────────────────────── │
│ Loại: Tưới nước                                          │
│ Nội dung: Tưới 500L, áp suất 2.5bar                      │
│ ───────────────────────────────────────────────────────── │
│ 📷 [img_001.jpg] [img_002.jpg]                           │
│ ───────────────────────────────────────────────────────── │
│ [📋 View Detail] [✏️ Edit] [🗑️ Delete]                   │
└────────────────────────────────────────────────────────────┘
```

### Quick Log Templates
| Template | Fields |
|----------|---------|
| Tưới nước | Khu vực, lượng nước, áp suất |
| Bón phân | Khu vực, loại phân, liều lượng |
| Quan sát | Khu vực, ghi chú, ảnh |
| Thu hoạch | Khu vực, sản lượng, chất lượng |
| Kiểm tra bệnh | Khu vực, triệu chứng, ảnh |

---

## 8.9 Màn hình Plans & Tasks

### Plans View
```
┌────────────────────────────────────────────────────────────┐
│ MÙA VỤ XUÂN 2024                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📅 01/01 - 30/04 (120 ngày)   [████████░░] 65%    │ │
│ │ Giai đoạn: Sinh trưởng                              │ │
│ │ Tasks: 45 | Hoàn thành: 29 | Đang làm: 5 | Tạp: 11 │ │
│ │ Milestones:                                       │ │
│ │   ✓ Gieo hạt (01/01)                            │ │
│ │   ✓ Chăm sóc cây con (15/01)                    │ │
│   → Ra hoa dự kiến (01/03)                       │ │
│   → Thu hoạch dự kiến (01/04)                     │ │
│ └─────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### Task Views

| View | Use case |
|------|----------|
| **Kanban** | Quản lý task: To Do → In Progress → Done |
| **List** | Worker: Task list with details |
| **Calendar** | Farm manager: Lịch biểu |
| **Gantt** | Seasonal overview with dependencies |

### Kanban Layout
```
┌────────────┐ ┌────────────┐ ┌────────────┐
│  TO DO    ��� │ IN PROGRESS│ │   DONE    │
├────────────┤ ├────────────┤ ├────────────┤
│ Task 1   │ │ Task 4    │ │ Task 7    │
│ [High]  │ │ [Medium] │ │ [Done @14:]│
├────────────┤ ├────────────┤ ├────────────┤
│ Task 2   │ │ Task 5    │ │ Task 8    │
│ [High]  │ │ [Low]    │ │ [Done @15:]│
├────────────┤ ├────────────┤ ├────────────┤
│ Task 3   │ │          │ │           │
│ [Medium] │ │          │ │           │
├────────────┼────────────┼────────────┤
│ [+ Add]  │ │          │ │           │
└────────────┘ └────────────┘ └────────────┘
```

---

## 8.10 Màn hình IoT

### Device List
```
┌────────────────────────────────────────────────────────────┐
│ DEVICES                                      [+ Add]     │
├────────────────────────────────────────────────────┬─────┤
│ 🌡️ Sensor-001                    [🟢 Online]  │ 28°C │
│ Location: Khu A-1                                   │      │
│ Last seen: 2 phút trước                             │      │
│ Type: Temperature | Signal: -65dBm                   │      │
├────────────────────────────────────────────────────┼─────┤
│ 💧 Sensor-002                    [🟡 Offline] │  --  │
│ Location: Khu B-2                                   │      │
│ Last seen: 2 giờ trước                             │      │
│ Type: Soil Moisture | Battery: 12%                  │      │
├────────────────────────────────────────────────────┼─────┤
│ 🌱 Sensor-003                    [🔴 Error]  │  Error │
│ Location: Khu C-1                                   │      │
│ Last seen: 5 phút trước                             │      │
│ Type: Light | Error: Communication timeout           │      │
└────────────────────────────────────────────────────┴─────┘
```

### Device Status Colors

| Status | Màu | Ý nghĩa |
|--------|-----|---------|
| Online | 🟢 Xanh lá | Bình thường |
| Warning | 🟡 Vàng | Cần chú ý (pin yếu, signal yếu) |
| Offline | ⚪ Xám | Mất kết nối tạm thời |
| Error | 🔴 Đỏ | Lỗi nghiêm trọng |

---

## 8.11 Màn hình AI

> AI screen phải không chỉ là chat. Nó phải là **decision center**.

### AI Recommendations Panel
```
┌────────────────────────────────────────────────────────────┐
│ 🤖 AI DECISION CENTER                          [⚙️ Settings]│
├────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────��┐ ���
│ │ 💧 Tưới nước khu A-1                                │ │
│ │ Confidence: 92%                                     │ │
│ │ Lý do: Độ ẩm đất 28% < ngưỡng tối thiểu 35%        │ │
│ │ Dự kiến: +500L, thời gian 15 phút                  │ │
│ │ Tác động: +5% năng suất                            │ │
│ │ ─────────────────────────────────────────────────── │ │
│ │ [✅ Duyệt] [⏰ Hoãn 2h] [❌ Bỏ qua] [📋 Tạo task]│ │
│ └──────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────┐ │
│ │ 🐛 Cảnh báo bệnh rau muống                          │ │
│ │ Confidence: 78%                                     │ │
│ │ Lý do: Độ ẩm cao + nhiệt độ 30°C = nguy cơ bệnh   │ │
│ │ Khuyến nghị: Kiểm tra khu A-2                       │ │
│ │ ─────────────────────────────────────────────────── │ │
│ │ [✅ Kiểm tra] [⏰ Hoãn] [❌ Bỏ qua]               │ │
│ └──────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ │ 🔵 AI Predictions                                   │ │
│ │ • Yield dự kiến: 45 tấn/ha (+12% vs mùa trước)     │ │
│ │ • Ngày thu hoạch tối ưu: 15/04                   │ │
│ │ • Nguy cơ sâu bệnh: Trung bình                     │ │
└────────────────────────────────────────────────────────────┘
```

### UX Guidelines

| Element | Yêu cầu |
|---------|---------|
| Confidence | Hiển thị % rõ ràng |
| Lý do | Giải thích ngắn gọn |
| Actions | 4 nút: Duyệt, Hoãn, Bỏ qua, Tạo task |
| Explanation | Người dùng phải hiểu vì sao AI đề xuất |

---

## 8.12 Màn hình Traceability

### Trace Search
```
┌────────────────────────────────────────────────────────────┐
│ 🔍 TRACE PRODUCT                                         │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ [Batch Code / QR / Barcode]              [🔍 Search] │ │
│ └──────────────────────────────────────────────────────┘ │
│ Hoặc: [📷 Scan QR]                                      │
└────────────────────────────────────────────────────────────┘
```

### Trace Timeline
```
┌────────────────────────────────────────���─���─────────────────┐
│ 🏷️ BATCH: TB-XU2024-A1-001                             │
│ Product: Rau muống                                  │
│ Farm: EcoSynTech Farm A | Harvest: 25/04/2024         │
│ Status: 🟢 Closed                                   │
├────────────────────────────────────────────────────────────┤
│ TIMELINE:                                            │
│ ────────────────────────────────────────────────── ─  │
│ 📦 28/04 - Đóng gói → Khu đóng gói 1              │
│    Package: PKG-001 (5kg)                          │
│ ─────────────────────────────────────────────────   │
│ 🌾 25/04 - Thu hoạch → Khu A-1                   │
│    Sản lượng: 500kg | Chất lượng: Grade A         │
│ ─────────────────────────────────────────────────   │
│ 💧 20/04 - Tưới nước → Khu A-1                   │
│    Lượng: 500L | Mục đích: Chuẩn bị thu hoạch     │
│ ─────────────────────────────────────────────────   │
│ 🧪 15/04 - Kiểm tra chất lượng                    │
│    Kết quả: Pass | Độ ẩm: 75%                    │
│ ─────────────────────────────────────────────────   │
│ 🌱 01/02 - Gieo hạt → Khu A-1                    │
│    Giống: Rau muống MD                           │
│ ─────────────────────────────────────────────────   │
│ 📦 15/01 - Nhập vật tư                         │
│    Input: Phân bón NPK 46:0:0                   │
└────────────────────────────────────────────────────────────┘
```

### Public Verification Page
```
┌────────────────────────────────────────────────────────────┐
│ 🌾 ECOSYNTECH - TRUY XUẤT NGUỒN GỐC                 │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ✅ Đã xác minh                                   │ │
│ └──────────────────────────────────────────────────────┘ │
│ ────────────────────────────────────────────────────   │
│ Sản phẩm: Rau muống                                │
│ Farm: EcoSynTech Farm A                              │
│ Khu vực: Khu A-1                                   │
│ Ngày gieo: 01/02/2024                             │
│ Ngày thu hoạch: 25/04/2024                        │
│ Chất lượng: Đạt chuẩn                              │
│ ────────────────────────────────────────────────────   │
│ Quét QR để xem chi tiết đầy đủ:                    │
│ [URL: ecosyntech.com/trace/TB-XU2024-A1-001]        │
└────────────────────────────────────────────────────────────┘
```

---

## 8.13 Màn hình Reports

### Report Types

| Báo cáo | Nội dung |
|---------|----------|
| Năng suất mùa | Yield by season/area/crop |
| Chi phí mùa | Cost breakdown |
| ROI | Return on Investment |
| Hiệu suất tưới | Irrigation efficiency |
| Thiết bị | Device uptime/failures |
| Alert trend | Alerts over time |
| Traceability | Batch completeness |
| AI accuracy | AI vs actual |

### Report Layout
```
┌────────────────────────────────────────────────────────────┐
│ 📊 REPORTS                                [📥 Export]   │
├────────────────────────────────────────────────────────────┤
│ Filter: [Farm ▼] [Season ▼] [Date Range ▼]               │
├────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐   │
│ │        📈 YIELD BY SEASON                        │   │
│ │        [Biểu đồ cột]                          │   │
│ └──────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

## 8.14 Màn hình Alerts

### Alert Center
```
┌────────────────────────────────────────────────────────────┐
│ 🔔 ALERTS                  [All] [Open] [Resolved]      │
├────────────────────────────────────────────────────┬────┤
│ 🔴 Độ ẩm đất khu A-12 thấp               │ Open│
│    Created: 14:30 - Assigned: Nguyễn Văn A       │     │
│    Deadline: 16:00 - SLA còn: 1h30            │     │
│     [📋 Assign] [✅ Resolve] [🗑️ Delete]       │     │
├────────────────────────────────────────────────────┼────┤
│ 🟡 Thiết bị #4 mất kết nối              │ Open│
│    Created: 12:15 - Assigned: --                  │     │
│     [📋 Assign] [✅ Ignore] [🗑️ Delete]       │     │
├────────────────────────────────────────────────────┼────┤
│ 🟢 [Đã xử lý] Thiết bị #5 online           │Close│
│    Resolved: 11:00 - By: Tech B               │     │
└────────────────────────────────────────────────────┴────┘
```

### Alert Severity Colors

| Severity | Icon | Màu | Hành động |
|----------|------|-----|-----------|
| Critical | 🔴 | Đỏ | Ngay lập tức |
| Warning | 🟡 | Vàng | Trong ngày |
| Info | 🔵 | Xanh | Khi rảnh |

---

## 8.15 Form design rules

### Nguyên tắc Form

| Nguyên tắc | Mô tả |
|------------|-------|
| Ngắn | Tối đa 5-7 fields/screen |
| Mặc định thông minh | Pre-fill từ context |
| Validate realtime | Hiển thị lỗi ngay khi nhập |
| Chia bước | Multi-step cho form dài |
| Không nhập lại | Auto-complete từ DB |

### Form Components

| Component | Use case |
|------------|----------|
| Dropdown có search | Chọn từ list lớn |
| Date picker | Chọn ngày |
| Quick-select chips | Chọn nhanh |
| Autosave | Lưu draft tự động |
| Confirm dialog | Xác nhận khi quan trọng |

---

## 8.16 QR / Scan UX

### Scan Flow
```
┌────────────────────────────────────────────────────────────┐
│                    📱 SCAN QR                          │
│ ┌────────────────────────────────────────────────────┐   │
│ │                                                    │   │
│ │              [📷 Camera View]                     │   │
│ │                                                    │   │
│ │              [Scan Frame]                        │   │
│ │                                                    │   │
│ └────────────────────────────────────────────────────┘   │
│ ────────────────────────────────────────────────────────   │
│ [⌨️ Nhập mã tay]                                  │
└────────────────────────────────────────────────────┘
```

### Sau khi scan

| Scan target | Action |
|-----------|--------|
| Asset | → Asset detail |
| Batch | → Batch detail |
| Package | → Package trace |
| Task | → Confirm task |
| Public QR | → Public verification |

### UX Requirements
- Tốc độ mở < 1 giây sau scan thành công
- Fallback nhập mã tay nếu camera lỗi
- haptic feedback khi scan thành công

---

## 8.17 Design system

### Color Palette

| Màu | Hex | Sử dụng |
|-----|-----|---------|
| Primary Green | `#0f766e` | Primary actions, brand |
| Green Light | `#10b981` | Success, online status |
| Blue | `#0ea5e9` | Info, links |
| Yellow | `#f59e0b` | Warning, pending |
| Red | `#ef4444` | Error, critical |
| Gray | `#6b7280` | Inactive, neutral |
| White | `#ffffff` | Background |
| Gray Light | `#f3f4f6` | Card backgrounds |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 28px | 700 |
| H2 | Inter | 24px | 600 |
| H3 | Inter | 20px | 600 |
| Body | Inter | 14px | 400 |
| Caption | Inter | 12px | 400 |
| KPI | Inter | 32px | 700 |

### Components

| Component | Mô tả |
|-----------|-------|
| Card | Container với shadow |
| Badge | Status indicator |
| Chip | Tags, filters |
| Modal | Popup dialog |
| Drawer | Side panel |
| Tabs | Navigation |
| Timeline | Event list |
| Stepper | Multi-step |
| Chart | Data visualization |
| Toast | Notifications |

---

## 8.18 Responsive behavior

### Breakpoints

| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | < 640px | Single column, bottom nav |
| Tablet | 640-1024px | Reduced sidebar, 2-col grid |
| Desktop | > 1024px | Full sidebar, multi-col |

### Mobile-first patterns

| Pattern | Desktop → Mobile |
|---------|----------------|
| Table → Card List | |
| Sidebar → Drawer | |
| Multi-col → Single col | |
| Hover → Touch | |

---

## 8.19 Accessibility

| Yêu cầu | Tiêu chuẩn |
|----------|-------------|
| Contrast | ≥ 4.5:1 (text), ≥ 3:1 (UI) |
| Touch target | ≥ 44px |
| Color + Icon | Không phụ thuộc màu |
| Keyboard | Support navigation |
| Labels | Icons có aria-label |

---

## 8.20 Offline/low-connectivity UX

### Offline Features

| Feature | Mô tả |
|--------|-------|
| Draft save | Lưu form khi offline |
| Sync indicator | Hiển thị trạng thái sync |
| Queue priority | Ưu tiên action quan trọng |
| Last synced | Hiển thị thời gian sync cuối |

---

## 8.21 Notification UX

### 3 Layers

| Layer | Kênh | Use case |
|-------|------|----------|
| In-app | UI | Alerts, updates |
| Push/Email/SMS | External | Reminders, critical |
| SMS | Phone | Emergency |

### Guidelines
- Không spam (max 5/day)
- Gộp thông báo trùng
- Ưu tiên action có thể làm ngay

---

## 8.22 User flow mẫu

### Flow 1: Farm Manager buổi sáng
```
1. Mở Dashboard → Xem alerts
2. Đọc AI recommendations → Duyệt/Ignore
3. Task hôm nay → Review
4. Weather → Check forecast
5. Plan progress → Xem milestone
```

### Flow 2: Worker thực địa
```
1. Mobile → Quick log
2. Scan QR khu vực
3. Chọn template log
4. Chụp ảnh → Lưu
5. Xem task tiếp theo
```

### Flow 3: Quality staff truy xuất
```
1. Traceability → Search batch
2. Xem timeline
3. Xem quality checks
4. Export report
```

---

## 8.23 KPI cho UI/UX

| KPI | Target | Mô tả |
|-----|--------|-------|
| Batch lookup time | < 3s | Thời gian tìm batch |
| Log creation time | < 30s | Thời gian tạo log |
| Alert resolution | < 4h | Thời gian xử lý alert |
| Task completion clicks | ≤ 3 | Click để hoàn thành task |
| Mobile usage | > 60% | Tỉ lệ dùng mobile |
| QR scan success | > 95% | Tỉ lệ scan thành công |
| Daily dashboard | > 80% | User quay lại mỗi ngày |

---

## 8.24 UI/UX priorities theo phase

### Phase 1 (MVP)
- ✅ Dashboard
- ✅ Farm Overview
- ✅ Asset/Log basic
- ✅ Auth
- ✅ Mobile quick log

### Phase 2
- ✅ IoT cards
- ⏳ Alert center
- ⏳ Task board
- ⏳ Scan QR

### Phase 3
- ⏳ AI decision center
- ⏳ Traceability timeline
- ⏳ Report center

### Phase 4
- ⏳ Enterprise polish
- ⏳ Theming
- ⏳ Role customization
- ⏳ Usage analytics

---

## 8.25 Kết luận

UI/UX của EcoSynTech FarmOS PRO đi theo triết lý:
- **Ít bước** → Quick actions
- **Nhiều hành động** → Action-first
- **Đúng ngữ cảnh** → Role-based
- **Dùng được ngoài ruộng** → Outdoor optimized
- **Đủ đẹp để bán** → Enterprise ready

### Kết quả khi làm đúng
- ✅ Giảm thời gian vận hành
- ✅ Giảm sai sót
- ✅ Tăng tốc ra quyết định
- ✅ Dễ thương mại hóa

---

## Xem thêm

- [Design System](./src/styles/)
- [Component Library](./src/components/)
- [i18n](./src/i18n/)
- [API Docs](./API.md)