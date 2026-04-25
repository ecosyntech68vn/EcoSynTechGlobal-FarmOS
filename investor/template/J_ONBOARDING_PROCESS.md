# EcoSynTech FarmOS V2.0 - Onboarding Process
## Quy trình Onboarding Khách hàng / Customer Onboarding Guide

---

## 1. ONBOARDING OVERVIEW

### Onboarding Journey

```
┌────────────────────────────────────────────────────────────┐
│              CUSTOMER ONBOARDING JOURNEY                    │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  AWARENESS → INTEREST → DEMO → PURCHASE → ONBOARD → VALUE   │
│      │           │        │        │         │          │     │
│      ▼           ▼        ▼        ��         ▼          ▼      │
│   Marketing   15-min   30-min  Payment   1-2 hrs   ROI     │
│    Touch      Call      Demo    & Order   Install    30 days │
│                                                              │
│  TOTAL TIME: 2-3 weeks (average)                            │
│  COMPLETION RATE TARGET: >90%                              │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Onboarding Timeline

| Phase | Duration | Activities | Owner |
|-------|----------|-----------|-------|
| **Pre-Onboarding** | 1-3 days | Payment, scheduling | Sales |
| **Installation** | 1-2 hours | Hardware setup | Tech Support |
| **Configuration** | 30 min | App setup | Customer (self-service) |
| **Training** | 30 min | Walk-through | Tech Support |
| **First Value** | 7 days | First insights | AI/ML |
| **Check-in** | 14 days | Support call | Customer Success |

---

## 2. PRE-ONBOARDING CHECKLIST

### Post-Purchase Actions

| # | Action | Timeline | Owner | Status |
|---|--------|----------|-------|--------|
| 1 | Confirm payment received | Day 0 | Finance | ⬜ |
| 2 | Send welcome email | Day 0 | Sales | ⬜ |
| 3 | Schedule installation | Day 1 | Sales | ⬜ |
| 4 | Send pre-install survey | Day 1 | Sales | ⬜ |
| 5 | Prepare hardware | Day 2-3 | Tech | ⬜ |
| 6 | Confirm installer | Day 3 | Tech | ⬜ |
| 7 | Send prep checklist | Day 3 | Sales | ⬜ |

### Welcome Email Template

```
Subject: Chào mừng đến EcoSynTech FarmOS! 🌾

Xin chào [Customer Name],

Cảm ơn bạn đã tin tưởng EcoSynTech!

SẢN PHẨM CỦA BẠN:
• PRO Kit (8 sensors)
• 1 năm subscription PRO

BƯỚC TIẾP THEO:
1. Nhấn đây để xác nhận lịch: [Calendar Link]
2. Chuẩn bị vị trí lắp đặt (điện + WiFi)
3. Đọc Quick Start Guide

ĐỘI NGŨ HỖ TRỢ:
• Hotline: [Phone]
• Zalo: [Zalo Link]
• Email: support@ecosyntech.vn

Trân trọng,
Đội ngũ EcoSynTech
```

### Pre-Install Survey

```
┌────────────────────────────────────────────────────────────┐
│              PRE-INSTALL SURVEY                          │
├────────────────────────────────────────────────────────────┤
│  FARM INFORMATION:                                       │
│  1. Loại cây trồng: _______________                     │
│  2. Diện tích: _______________ ha/m²                  │
│  3. Nguồn nước: □ Giếng  □ Sông  □ Mưa  □ Khác      │
│  4. Hệ thống tưới: □ Nhỏ giọt  □ Phun  □ Tưới tự động │
│                                                              │
│  INFRASTRUCTURE:                                             │
│  5. Nguồn điện: □ 220V  □ 12V DC  □ Pin năng lượng mặt trời │
│  6. WiFi/Router: □ Có (_________)  □ Không               │
│  7. Smartphone: □ Android  □ iOS  □ Cả hai               │
│                                                              │
│  PREFERENCES:                                              │
│  8. Thời gian mong muốn: _______________                  │
│  9. Người sử dụng chính: _______________                │
│  10. Câu hỏi đặc biệt: _______________                  │
└────────────────────────────────────────────────────────────┘
```

---

## 3. INSTALLATION PROCESS

### Installation Day Checklist

| # | Task | Time | Notes |
|---|------|------|-------|
| **PRE-INSTALLATION (30 min)** | | | |
| 1 | Arrive & greet | 5 min | Professional arrival |
| 2 | Site survey | 10 min | Confirm sensor locations |
| 3 | Power check | 5 min | 220V outlet or battery |
| 4 | WiFi check | 10 min | Signal strength test |
| **INSTALLATION (60-90 min)** | | | |
| 5 | Mount controller | 15 min | IP67 enclosure |
| 6 | Install sensors | 30 min | Per tier config |
| 7 | Connect irrigation | 15 min | Relay setup |
| 8 | Power on | 5 min | Initial boot |
| **CONFIGURATION (30 min)** | | | |
| 9 | App setup | 10 min | WiFi, account |
| 10 | Sensor calibration | 10 min | Soil pH, baseline |
| 11 | Irrigation rules | 10 min | Initial schedule |
| **VALIDATION (20 min)** | | | |
| 12 | Data verification | 10 min | Cloud sync |
| 13 | Alert test | 5 min | SMS/Zalo notification |
| 14 | Customer demo | 5 min | Show value immediately |
| **CLOSE (15 min)** | | | |
| 15 | Training | 10 min | Basic operation |
| 16 | Documentation | 5 min | Photos, sign-off |

### Sensor Installation by Tier

#### BASE Tier (2 sensors)

```
Location Plan:
├── Controller: Near power outlet (shaded)
├── Sensor 1: Soil moisture (root zone, 15cm depth)
└── Sensor 2: ST30 temperature (canopy level)

Installation Time: 60 minutes
Installers Required: 1 person
```

#### PRO Tier (8 sensors)

```
Location Plan:
├── Controller: IP67 box, wall mount
├── 2× ST30: Water temp + Air temp
├── 1× DHT22: Humidity (shaded)
├── 2× Soil Moisture: Different zones
├── 1× BME280: Precision temp/hum
├── 1× Light: Canopy level (north-facing)
└── Relay: Irrigation valve connection

Installation Time: 90 minutes
Installers Required: 1 person
```

#### PRO MAX Tier (13 sensors)

```
Additional Sensors:
├── +1× ST30: Second zone
├── +1× DHT22: Second zone
├── +1× Soil Moisture: Third zone
├── +1× pH: Soil pH monitoring
├── +1× EC: Electrical conductivity
└── +1× Rain: Rain gauge

Installation Time: 2 hours
Installers Required: 1-2 people
```

### Installation Quality Checklist

```
□ Controller mounted securely
□ IP67 seal intact
□ Cable glands tightened
□ All sensor cables connected
□ Power supply working
□ WiFi connected
□ Data streaming to cloud
□ App synced
□ Alerts tested
□ Customer trained
□ Site photos taken
□ Sign-off completed
```

---

## 4. APP CONFIGURATION

### Mobile App Setup (Customer)

| Step | Screen | Action | Time |
|------|--------|--------|------|
| 1 | Download | Install FarmOS app | 2 min |
| 2 | Sign Up | Create account | 3 min |
| 3 | WiFi | Connect to FarmOS | 2 min |
| 4 | Pair | Link sensors | 5 min |
| 5 | Farm Info | Enter details | 3 min |
| 6 | Alerts | Configure notifications | 5 min |
| 7 | Dashboard | Review home screen | 5 min |
| **Total** | | | **25 min** |

### Web Dashboard Setup

```
┌────────────────────────────────────────────────────────────┐
│              WEB DASHBOARD SETUP                        │
├────────────────────────────────────────────────────────────┤
│  STEP 1: FARM PROFILE                                  │
│  ├── Farm name: _______________                        │
│  ├── Location: GPS coordinates                        │
│  ├── Crops: _______________                        │
│  └── Size: _______________                        │
│                                                              │
│  STEP 2: SENSOR MAPPING                                 │
│  ├── [Sensor 1] → Zone A - Moisture                    │
│  ├── [Sensor 2] → Zone A - Temp                       │
│  ├── [Sensor 3] → Zone B - Moisture                    │
│  └── ...                                             │
│                                                              │
│  STEP 3: IRRIGATION SCHEDULE                           │
│  ├── Default: Daily 6:00 AM                           │
│  ├── Duration: 15 minutes                            │
│  ├── Trigger: <30% moisture                          │
│  └── Manual override: Enabled                        │
│                                                              │
│  STEP 4: ALERTS & NOTIFICATIONS                        │
│  ├── Low moisture: Zalo message                       │
│  ├── High temp: SMS + Zalo                           │
│  ├── Rain delay: Auto-enabled                        │
│  └── Daily summary: Email 7:00 AM                    │
└────────────────────────────────────────────────────────────┘
```

### AI/ML Configuration

| Model | Setup | Time | Notes |
|-------|-------|------|-------|
| **LightGBM (Irrigation)** | Enable | 5 min | Auto-tune 7 days |
| **LSTM (Yield)** | Crop input | 3 min | Historical data |
| **Disease Detection** | Enable | 2 min | Photo upload |
| **Weather Forecast** | Auto | - | Integrated |

---

## 5. TRAINING

### Training Agenda (30 min)

| # | Topic | Duration | Notes |
|---|-------|----------|-------|
| 1 | Dashboard Overview | 5 min | Main screens |
| 2 | Real-time Monitoring | 5 min | Live data |
| 3 | Alerts & Notifications | 5 min | Zalo setup |
| 4 | Manual Control | 5 min | Override irrigation |
| 5 | Basic Troubleshooting | 5 min | Common issues |
| 6 | Q&A | 5 min | Open questions |

### Training Materials

```
┌────────────────────────────────────────────────────────────┐
│              QUICK REFERENCE CARD                         │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  🌡️ VIEW SENSORS: Dashboard → Sensors                      │
│  💧 MANUAL WATER: Dashboard → Control → Irrigation ON      │
│  🔔 MANAGE ALERTS: Settings → Alerts → Add/Edit           │
│  📊 VIEW HISTORY: Dashboard → Charts                       │
│  📸 REPORT ISSUE: App → Help → Report Problem              │
│                                                              │
│  📞 SUPPORT:                                               │
│  • Zalo: [QR Code]                                        │
│  • Hotline: [Phone]                                        │
│  • Email: support@ecosyntech.vn                           │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Customer Training Checklist

```
□ Can access dashboard
□ Can view sensor data
□ Can interpret alerts
□ Can manually control irrigation
□ Knows how to contact support
□ Has downloaded app
□ Has joined Zalo group
□ Understands ROI timeline
```

---

## 6. POST-ONBOARDING

### Day 1 Follow-up

| Time | Action | Channel | Owner |
|------|--------|---------|-------|
| +4 hours | Installation confirmation | Zalo | Sales |
| +4 hours | Training resources | Email | Sales |
| +1 day | Data check | Dashboard | Tech |
| +1 day | First alert test | Zalo | Tech |

### Week 1 Check-in

| Day | Activity | Purpose |
|-----|----------|---------|
| Day 3 | Support call | Ensure understanding |
| Day 5 | Data review | Verify AI working |
| Day 7 | Value assessment | First ROI report |

### Week 2 Follow-up

| Activity | Timing | Owner |
|----------|--------|-------|
| Onboarding survey | Day 10 | Sales |
| NPS collection | Day 14 | Sales |
| Case study request | Day 14 | Sales |
| Referral request | Day 14 | Sales |

### First Value Report (Day 7)

```
Subject: [Farm Name] - Báo cáo tuần đầu tiên

TUẦN QUA:
• Tưới tiết kiệm: 15% (so với trung bình)
• Thời gian tưới: 3 giờ (tự động)
• Cảnh báo: 2 lần (độ ẩm thấp)

TUẦN TỚI:
• Dự báo: Trời mưa, tạm dừng tưới ngày 3-5
• AI khuyến nghị: Tăng thời gian tưới 2 phút

💡 TIP: Kiểm tra cảm biến độ ẩm Zone B hàng ngày
```

---

## 7. ONBOARDING TIMELINE (PER TIER)

### BASE Tier

| Day | Activity | Duration | Format |
|-----|----------|----------|--------|
| 0 | Purchase | - | Online |
| 1 | Shipping | - | Delivery |
| 2-5 | Self-install | 30 min | DIY |
| 7 | Check-in call | 15 min | Phone |
| 14 | Success review | 10 min | App |

### PRO Tier

| Day | Activity | Duration | Format |
|-----|----------|----------|--------|
| 0 | Purchase | - | Online |
| 1 | Payment confirmed | - | Email |
| 2 | Installation scheduled | - | Zalo |
| 3 | On-site installation | 90 min | In-person |
| 7 | Training + First value | 30 min | In-person |
| 14 | Check-in + Referral | 20 min | Phone |
| 30 | Case study | - | Interview |

### PRO MAX / PREMIUM Tier

| Day | Activity | Duration | Format |
|-----|----------|----------|--------|
| 0 | Purchase | - | Online/Call |
| 1 | Kick-off call | 30 min | Video |
| 2 | Site survey | 60 min | On-site |
| 3 | Installation | 2-3 hours | On-site |
| 5 | Configuration complete | 30 min | Remote |
| 7 | Training (advanced) | 60 min | In-person |
| 14 | Value report | 30 min | Video |
| 21 | Strategy review | 45 min | Video |
| 30 | Monthly review | 60 min | On-site |

---

## 8. ONBOARDING SUCCESS METRICS

### Completion Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Installation completion | >95% | Scheduled vs completed |
| Configuration success | >90% | App sync rate |
| Training completion | >85% | Training checklist |
| First value delivered | 7 days | First ROI report |
| Customer satisfaction | NPS 40+ | Survey |

### Activity Metrics

| Metric | Target | Tool |
|--------|--------|------|
| Time to install | <90 min | Job ticket |
| Time to configure | <30 min | Job ticket |
| First alert test | Day 1 | Alert log |
| Dashboard login | Day 1 | Analytics |
| First manual override | Day 3 | Activity log |
| Support contact | <5% | Support ticket |

---

## 9. TROUBLESHOOTING GUIDE

### Common Issues

| Issue | Diagnosis | Solution | Time |
|-------|-----------|----------|------|
| WiFi not connecting | Signal weak | Move router/antenna | 10 min |
| Sensor not reading | Cable loose | Re-connect | 5 min |
| No data to cloud | Power issue | Check adapter | 5 min |
| App sync failed | Server down | Retry in 5 min | 5 min |
| Alert not working | Settings | Check Zalo permissions | 5 min |

### Escalation Path

```
Level 1: Self-help → FAQ, video tutorials
Level 2: Support → Zalo, phone (Day 1-7)
Level 3: Technician → Remote access (Day 1-7)
Level 4: On-site visit → Return visit (Day 3-7)
```

---

## APPENDIX: ONBOARDING CHECKLIST

### Customer Checklist (Self-service)

```
□ Order placed
□ Payment confirmed
□ Welcome email received
□ Installation scheduled
□ Pre-install survey completed
□ Site prepared (power + WiFi)
□ App downloaded
□ Account created
□ Installation completed
□ Training received
□ First value achieved
□ Support contacts saved
```

### Internal Checklist

```
□ Order confirmed
□ Hardware prepared
□ Installer assigned
□ Installation completed
□ Data validated
□ Customer trained
□ Documentation filed
□ Case study opportunity identified
□ Referral requested
□ NPS collected
```

---

**Document:** Onboarding Process V1.0
**Version:** 1.0 - Standard Onboarding
**Date:** 2026-04-25
**Prepared for:** CEO, Sales & Support Teams

(End of file - total 433 lines)