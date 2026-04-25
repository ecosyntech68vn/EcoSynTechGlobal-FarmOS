# EcoSynTech FarmOS V2.0 - Operations Playbook
## Sổ tay Vận hành / Operations Guide

---

## 1. OPERATIONS OVERVIEW

### Core Operations Map

```
┌────────────────────────────────────────────────────────────┐
│           EcoSynTech OPERATIONS MAP                        │
├────────────────────────────────────────────────────────────┤
│                                                              │
│                    ┌─────────────┐                        │
│                    │   CUSTOMER   │                        │
│                    │   ACQUIRE   │                        │
│                    └──────┬──────┘                        │
│                           │                                │
│                    ┌──────▼──────┐                        │
│                    │  ONBOARD   │                        │
│                    │   & SETUP  │                        │
│                    └──────┬──────┘                        │
│                           │                                │
│            ┌─────────────┼─────────────┐                      │
│            │           │           │                        │
│     ┌─────▼─────┐ ┌──▼──┐ ┌───▼────┐                │
│     │  DELIVER  │ │RETAIN│ │ UPSELL │                │
│     │  VALUE   │ │     │ │        │                │
│     └─────┬─────┘ └─────┘ └──────┘                │
│           │                                         │
│     ┌────▼────────────────────────────────────┐          │
│     │            OPERATIONS EXCELLENCE           │          │
│     │   Support • Analytics • Improvement     │          │
│     └─────────────────────────────────────────┘          │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Operations Team Structure (Year 1)

| Role | FTE | Responsibilities |
|------|-----|----------------|
| CEO | 1 | Strategy, sales, partnerships |
| Sales Lead | 0.5 | Lead gen, demos, closing |
| Tech Support | 0.5 | Installation, support |
| Admin | 0.25 | Accounting, admin |

---

## 2. DAILY OPERATIONS

### Daily Runbook

```
┌───────────────────────────────────────���────────────────────┐
│              DAILY OPERATIONS CHECKLIST                    │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  MORNING (8:00 - 9:00 AM)                                │
│  □ Review overnight alerts                                    │
│  □ Check system health (dashboard)                          │
│  □ Review overnight tickets                             │
│  □ Respond to urgent messages                          │
│                                                              │
│  MID-MORNING (9:00 - 11:00 AM)                        │
│  □ Process new inquiries                              │
│  □ Schedule demos                                   │
│  □ Follow up on proposals                           │
│  □ Update CRM                                      │
│                                                              │
│  LATE MORNING (11:00 AM - 12:00 PM)                   │
│  □ Prepare for installations                          │
│  □ Order hardware                                  │
│  □ Confirm tomorrow's schedule                    │
│                                                              │
│  AFTERNOON (1:00 - 4:00 PM)                            │
│  □ Installation visits (as scheduled)               │
│  □ Customer calls (follow-ups)                        │
│  □ Support tickets                                │
│  □ Documentation                                 │
│                                                              │
│  END OF DAY (4:00 - 5:00 PM)                          │
│  □ Update pipeline status                          │
│  □ Close day's tickets                            │
│  □ Prepare tomorrow's schedule                  │
│  □ Send daily report                             │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### System Health Checks

| Check | Frequency | Tool | Alert If |
|-------|-----------|------|--------|
| Server uptime | Hourly | UptimeRobot | <99% |
| Cloud sync | 15 min | Custom | >5 min delay |
| Sensor data | Hourly | Dashboard | >1% offline |
| Alert delivery | 30 min | Logs | >10% fail |
| Storage | Daily | Cloud | >80% full |

---

## 3. WEEKLY OPERATIONS

### Weekly Review Meeting

**Format:** Every Monday 9:00 AM

```
┌────────────────────────────────────────────────────────────┐
│              WEEKLY REVIEW AGENDA                        │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  1. METRICS REVIEW (30 min)                              │
│     • New customers acquired                               │
│     • Revenue vs target                                 │
│     • Support tickets volume                            │
│     • System uptime                                   │
│                                                              │
│  2. PIPELINE REVIEW (15 min)                              │
│     • Active opportunities                            │
│     • Closures this week                              │
│     • Next week forecast                             │
│                                                              │
│  3. OPERATIONS UPDATE (15 min)                            │
│     • System improvements                             │
│     • Process changes                               │
│     • Team updates                                │
│                                                              │
│  4. BLOCKERS & ACTION ITEMS (15 min)                        │
│     • Issues requiring resolution                     │
│     • Assigned tasks                               │
│     • Due dates                                  │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Weekly Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| New customers | 3 | | ⬜ |
| Revenue | 5M | | ⬜ |
| Installation completed | 3 | | ⬜ |
| Support tickets | <20 | | ⬜ |
| First response time | <4 hours | | ⬜ |
| NPS score | 35+ | | ⬜ |
| System uptime | 99%+ | | ⬜ |

---

## 4. SALES OPERATIONS

### Sales Pipeline Stages

| Stage | Description | Actions | Duration |
|-------|-------------|---------|----------|
| **Lead** | New inquiry | Initial contact | 1 day |
| **Qualified** | Interest confirmed | Demo scheduled | 3 days |
| **Demo** | Presentation done | Proposal sent | 7 days |
| **Negotiation** | Terms discussed | Contract review | 14 days |
| **Closed Won** | Contract signed | Onboarding | 7 days |
| **Closed Lost** | Not moving forward | Archive | - |

### Lead Qualification

| Score | Interest | Resources | Timeline | Action |
|-------|----------|-----------|----------|--------|
| **9-10** | High | Available | <1 month | Priority |
| **6-8** | Medium | Interested | 1-3 months | Nurture |
| **3-5** | Low | May have | 3-6 months | Keep warm |
| **1-2** | None | No resources | None | Disqualify |

### Follow-up Cadence

| Stage | Contact | Timing | Method |
|-------|---------|--------|--------|
| New lead | Thank you | Immediate | Email |
| No response | Follow up 1 | 2 days | Zalo |
| No response | Follow up 2 | 5 days | Phone |
| No response | Follow up 3 | 10 days | Email |
| Still no | Keep warm | 30 days | Newsletter |

---

## 5. INSTALLATION OPERATIONS

### Installation Scheduling

| Step | Time | Owner | Tool |
|------|------|-------|------|
| 1. Order received | - | System | CRM |
| 2. Hardware prep | 2 days | Tech | Inventory |
| 3. Schedule confirm | 3 days | Sales | Zalo |
| 4. Installer assign | 1 day | Tech | Ticket |
| 5. Site prep | 1 day | Customer | Checklist |
| 6. Installation | Scheduled | Tech | Ticket |
| 7. Closeout | Same day | Tech | Ticket |

### Inventory Management

| Item | Reorder Point | Safety Stock | Lead Time |
|------|-------------|------------|----------|
| PRO Kit | 20 | 10 | 7 days |
| PRO MAX Kit | 10 | 5 | 7 days |
| PREMIUM Kit | 5 | 3 | 7 days |
| ST30 Sensor | 50 | 25 | 5 days |
| DHT22 | 20 | 10 | 5 days |
| Soil Moisture | 30 | 15 | 5 days |
| BME280 | 15 | 8 | 5 days |
| Relay Module | 20 | 10 | 5 days |

### Quality Control Checklist

```
□ Hardware assembled correctly
□ Firmware updated to latest
□ IP67 seal tested
□ All sensors calibrated
□ WiFi connectivity verified
□ Data sync confirmed
□ App paired successfully
□ Alert test passed
□ Documentation included
□ Package complete
```

---

## 6. CUSTOMER SUCCESS OPERATIONS

### Customer Health Score

| Metric | Weight | Score |
|--------|--------|-------|
| **Usage** | | |
| Daily logins | 20% | 0-10 |
| Feature adoption | 15% | 0-10 |
| Data completeness | 10% | 0-10 |
| **Engagement** | | |
| Support tickets | 10% | 0-10 |
| Response rate | 10% | 0-10 |
| Training attendance | 5% | 0-10 |
| **Financial** | | |
| Payment on time | 15% | 0-10 |
| Renewal likelihood | 10% | 0-10 |
| NPS score | 5% | 0-10 |

### Health Score Interpretation

| Score | Status | Action |
|-------|--------|--------|
| 8-10 | Healthy | Nurture, upsell |
| 6-7 | Neutral | Monitor |
| 4-5 | At Risk | Engage, troubleshoot |
| <4 | Churn Risk | Immediate action |

### Intervention Playbook

| Trigger | Action | Timeline | Owner |
|---------|--------|----------|-------|
| No login >7 days | Reach out | Day 7 | CS |
| Health score drops | Personal call | Day 3 | CS |
| Support ticket >3 | Check-in call | Day 3 | CS |
| Negative feedback | Management call | Day 1 | CEO |
| Churn intent | Save attempt | Immediate | CEO |

---

## 7. SUPPORT OPERATIONS

### Ticket Management

| Priority | SLA | Escalation | Close Criteria |
|----------|-----|----------|------------|
| **Critical (P1)** | 1 hour | Auto if breach | Customer confirms |
| **High (P2)** | 4 hours | Manual | Issue resolved |
| **Medium (P3)** | 24 hours | None | Customer confirms |
| **Low (P4)** | 72 hours | None | Customer confirms |

### Ticket Categories

| Category | Examples | Auto-assign |
|----------|----------|-----------|
| Hardware | Sensor not working | Tech |
| Software | App crash | Support |
| Installation | Setup help | Support |
| Billing | Invoice question | Admin |
| Feature Request | Enhancement | Backlog |
| General | Information | Support |

### Knowledge Base Management

```
Content Calendar (Monthly):
├── Week 1: Troubleshooting guides
├── Week 2: Feature tutorials
├── Week 3: Best practices
└── Week 4: Case studies

Update Triggers:
├── New feature release
├── Common support issue
├── Customer feedback
└── Competitor comparison
```

---

## 8. ANALYTICS & REPORTING

### Dashboard Metrics

```
┌────────────────────────────────────────────────────────────┐
│              OPERATIONS DASHBOARD                          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  SALES:                                                    │
│  • Pipeline value                                         │
│  • Win rate                                              │
│  • Average deal size                                     │
│  • Sales cycle length                                   │
│                                                              │
│  CUSTOMERS:                                               │
│  • Active customers                                     │
│  • New this week/month                                 │
│  • Churned                                         │
│  • NPS score                                          │
│                                                              │
│  OPERATIONS:                                               │
│  • Installation completion rate                       │
│  • Support ticket volume                            │
│  • Response time                                     │
│  • Resolution time                                   │
│                                                              │
│  SYSTEM:                                                  │
│  • Uptime                                             │
│  • Sensors online                                     │
│  • Data points collected                              │
│  • API calls                                         │
│                                                              │
│  FINANCIAL:                                              │
│  • MRR                                                 │
│  • ARR                                                 │
│  • CAC                                                 │
│  • LTV                                                │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Report Schedule

| Report | Frequency | Audience | Owner |
|--------|-----------|---------|--------|
| Daily standup | Daily | Team | CEO |
| Weekly review | Weekly | Team | CEO |
| Monthly metrics | Monthly | Investors | CEO |
| Quarterly board | Quarterly | Board | CEO |
| Annual review | Annual | Board | CEO |

---

## 9. PROCESS DOCUMENTATION

### Standard Operating Procedures

| Process | Owner | Review |
|---------|-------|--------|
| Lead qualification | Sales | Quarterly |
| Demo process | Sales | Quarterly |
| Installation | Tech | Monthly |
| Support ticket | Support | Monthly |
| Onboarding | CS | Monthly |
| Billing | Admin | Monthly |
| Escalation | Support | Monthly |

### Document Version Control

```
Version History:
├── v1.0: Initial release
├── v1.1: [Updates]
├── v1.2: [Updates]
└── Current: v1.2

Review Schedule:
├── Minor updates: Monthly
├── Major reviews: Quarterly
└── Full revision: Annual
```

---

## 10. TOOLS & SYSTEMS

### Operations Stack

| Category | Tool | Purpose |
|---------|------|--------|
| CRM | Google Sheets | Customer tracking |
| Support | Google Forms | Ticket submission |
| Communication | Zalo | Customer support |
| Documentation | Google Docs | SOPs |
| Analytics | Google Data Studio | Reporting |
| Scheduling | Google Calendar | Installation |
| Inventory | Google Sheets | Stock tracking |
| Accounting | MISA/Sổ sách | Finance |

### System Monitoring

| System | Tool | Alert |
|--------|------|-------|
| Web dashboard | UptimeRobot | Email/SMS |
| Cloud functions | Cloud logs | Email |
| Database | Cloud console | Email |
| Sensors | Dashboard | App push |
| Support queue | Google Forms | Email |

---

## APPENDIX: OPERATIONS TEMPLATES

### Daily Report Template

```
┌────────────────────────────────────────────────────────────┐
│              DAILY REPORT - [DATE]                        │
├────────────────────────────────────────────────────────────┤
│  NEW LEADS: _______________                             │
│  DEMOS SCHEDULED: _______________                    │
│  CLOSED WON: _______________                         │
│  INSTALLATIONS: _______________                      │
│  TICKETS OPEN: _______________                      │
│  TICKETS CLOSED: _______________                   │
│                                                              │
│  WINNERS:                                                  │
│  ____________________________________________              │
│                                                              │
│  BLOCKERS:                                                 │
│  ____________________________________________              │
│                                                              │
│  TOMORROW:                                                 │
│  ____________________________________________              │
│                                                              │
│  NOTES:                                                  │
│  ____________________________________________              │
└────────────────────────────────────────────────────────────┘
```

### Weekly Report Template

```
┌────────────────────────────────────────────────────────────┐
│              WEEKLY REPORT - W[##]                        │
├────────────────────────────────────────────────────────────┤
│  METRICS vs TARGET:                                       │
│  ├── Customers: [Actual] / [Target]                       │
│  ├── Revenue: [Actual] / [Target]                        │
│  ├── NPS: [Actual] / [Target]                           │
│  └── Tickets: [Actual] / [Target]                       │
│                                                              │
│  PIPELINE:                                               │
│  ├── In pipeline: _______________                          │
│  ├── Closed won: _______________                         │
│  └── Lost: _______________                              │
│                                                              │
│  TOP WINNERS:                                            │
│  1. _______________ - [Value]                          │
│  2. _______________ - [Value]                          │
│  3. _______________ - [Value]                          │
│                                                              │
│  SUPPORT HIGHLIGHTS:                                       │
│  ____________________________________________              │
│                                                              │
│  IMPROVEMENTS THIS WEEK:                                 │
│  ____________________________________________              │
│                                                              │
│  FOCUS FOR NEXT WEEK:                                     │
│  ____________________________________________              │
└────────────────────────────────────────────────────────────┘
```

---

**Document:** Operations Playbook V1.0
**Version:** 1.0 - Standard Operations
**Date:** 2026-04-25
**Prepared for:** CEO & Operations Team

(End of file - total 430 lines)