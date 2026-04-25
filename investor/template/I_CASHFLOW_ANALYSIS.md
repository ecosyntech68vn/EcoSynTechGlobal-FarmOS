# EcoSynTech FarmOS V2.0 - Cashflow Analysis
## Phân tích Dòng tiền / Cash Flow Management

---

## 1. CASHFLOW OVERVIEW

### Monthly Cashflow Model

```
┌────────────────────────────────────────────────────────────┐
│                 CASHFLOW EQUATION                            │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  Cash Balance = Previous Balance                              │
│               + Hardware Revenue                          │
│               + Subscription Revenue                     │
│               - COGS (Hardware)                          │
│               - Variable Costs                           │
│               - Fixed Costs                            │
│               - Marketing/CAC                          │
│               - Loan Repayments                        │
│                                                              │
│  Break-even: Revenue ≥ All Costs                           │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Cashflow Summary (Year 1)

| Month | Hardware | Sub | Total In | COGS | Variable | Fixed | Mktg | Net |
|-------|----------|-----|----------|------|----------|-------|------|-----|
| 1 | 0 | 0 | 0 | 0 | 0 | 4.4M | 50M | (54.4M) |
| 2 | 0 | 0 | 0 | 0 | 0 | 4.4M | 30M | (34.4M) |
| 3 | 15M | 0.3M | 15.3M | 0 | 0 | 4.4M | 20M | (9.1M) |
| 4 | 15M | 0.9M | 15.9M | 0 | 300K | 4.4M | 20M | (8.8M) |
| 5 | 15M | 1.5M | 16.5M | 0 | 600K | 4.4M | 15M | (3.5M) |
| 6 | 30M | 2.1M | 32.1M | 16.7M | 900K | 4.4M | 15M | (4.9M) |
| 7 | 30M | 2.7M | 32.7M | 16.7M | 1.2M | 4.4M | 10M | 0.4M ✅ |
| 8 | 30M | 3.3M | 33.3M | 16.7M | 1.5M | 4.4M | 10M | 4.7M |
| 9 | 30M | 3.9M | 33.9M | 16.7M | 1.8M | 4.4M | 10M | 5.0M |
| 10 | 30M | 4.5M | 34.5M | 16.7M | 2.1M | 4.4M | 5M | 10.3M |
| 11 | 30M | 5.1M | 35.1M | 16.7M | 2.4M | 4.4M | 5M | 11.0M |
| 12 | 45M | 5.9M | 50.9M | 25M | 2.7M | 4.4M | 5M | 13.8M |
| **TOTAL** | **270M** | **31.2M** | **301.2M** | **91.8M** | **13.5M** | **52.8M** | **195M** | **(51.9M)** |

---

## 2. INFLOW ANALYSIS

### Revenue Streams

| Stream | Monthly (Avg Y1) | Annual | % of Total |
|--------|------------------|--------|------------|
| **Hardware Sales** | | | | |
| PRO units | 15M | 180M | 60% |
| PRO MAX units | 5M | 60M | 20% |
| PREMIUM units | 1.7M | 20M | 7% |
| BASE units | 0.3M | 4M | 1% |
| **Subscription** | | | | |
| Monthly recurring | 1.6M | 19.2M | 6% |
| Annual upfront | 1.5M | 18M | 6% |
| **TOTAL** | **25.1M** | **301.2M** | **100%** |

### Inflow by Customer Segment

| Segment | Units/Mo | Hardware | Sub | Total |
|--------|----------|----------|-----|-------|
| New customers | 8 | 11.3M | 0.8M | 12.1M |
| Existing (sub renewal) | 20 | 0 | 2.0M | 2.0M |
| Annual upsells | 2 | 5.7M | 0 | 5.7M |
| Add-on sensors | 5 | 1.0M | 0.1M | 1.1M |
| **TOTAL** | **35** | **18M** | **2.9M** | **20.9M** |

### Cash Collection Timeline

```
Hardware Revenue:
├── Order received: Day 0
├── Payment (cash): Day 0 (retail) / Day 30 (enterprise)
└── Delivery: Day 7-14

Subscription Revenue:
├── Monthly: Auto-charge Day 1
├── Annual: Received upfront
└── Collection rate: 98%

Average Days to Cash: 7 days (retail) / 30 days (enterprise)
```

---

## 3. OUTFLOW ANALYSIS

### Cost Categories

| Category | Monthly | Annual | % of Outflow |
|----------|---------|--------|-------------|
| **Hardware Costs (COGS)** | | | | |
| Device production | 7.65M | 91.8M | 28% |
| **Variable Costs** | | | | |
| Per customer | 1.125M | 13.5M | 4% |
| **Fixed Costs** | | | |
| Team salary | 2M | 24M | 7% |
| Server/hosting | 600K | 7.2M | 2% |
| Office/tools | 500K | 6M | 2% |
| Admin | 350K | 4.2M | 1% |
| Travel | 500K | 6M | 2% |
| **Marketing/CAC** | | | | |
| Customer acquisition | 16.25M | 195M | 59% |
| **TOTAL** | **29M** | **347.7M** | **100%** |

### Outflow Timing

| Cost Type | Timing | Terms |
|----------|--------|-------|
| **Hardware** | | |
| Components | Pre-order | Net 30 |
| Assembly | On delivery | COD |
| **Variable** | | |
| Cloud/hosting | Monthly | Prepaid |
| Support | Monthly | Prepaid |
| **Fixed** | | |
| Salaries | Monthly (1st) | Prepaid |
| Rent/tools | Monthly (1st) | Prepaid |
| **Marketing** | | |
| Ads | Daily | Credit card |
| Events | Pre-event | Deposit + COD |
| Referral | On referral | Immediate |

### Payment Terms by Vendor

| Vendor | Amount | Terms | Impact |
|-------|--------|-------|--------|
| Component suppliers | 50M/mo | Net 30 | Cash timing |
| Assembly partner | 10M/mo | COD | Immediate |
| Cloud hosting | 600K/mo | Monthly | Prepaid |
| AI APIs | 500K/mo | Monthly | Prepaid |
| Team salaries | 2M/mo | Monthly | 1st |
| Marketing agencies | 5M/mo | Net 15 | 15-day delay |

---

## 4. WORKING CAPITAL

### Operating Cycle

```
┌──────────────────────────────────────────────────────────���─┐
│                 OPERATING CYCLE (Days)                      │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  Inventory Days:        14 (components to assembly)           │
│  + Work in Process:     3 (assembly + QC)                   │
│  - Days Payable Outstanding: 30 (supplier terms)            │
│  - Days Sales Outstanding:   7 (customer payment)             │
│  ═══════════════════════════════════════════════               │
│  Cash Conversion Cycle:   0 days                           │
│                                                              │
│  Net Effect: Cash released BEFORE payment due               │
│  Cash Advantage: ~23 days float                            │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Working Capital Requirements

| Component | Calculation | Amount |
|-----------|-------------|--------|
| **Current Assets** | | |
| Cash reserve | 2 months burn | 8.8M |
| Accounts receivable | 7 days revenue | 1.8M |
| Inventory buffer | 25 units | 27.8M |
| **Total Current Assets** | | **38.4M** |
| **Current Liabilities** | | |
| Accounts payable | 30 days COGS | 16.7M |
| Accrued expenses | 1 month fixed | 4.4M |
| **Total Current Liabilities** | | **21.1M** |
| **Working Capital** | | **17.3M** |

### Cash Reserve Policy

| Reserve Level | Amount | Purpose |
|-------------|--------|---------|
| Minimum | 10M | Survival |
| Target | 20M | 2 months operations |
| Maximum | 50M | Growth buffer |
| Excess | >50M | Reinvest |

---

## 5. CASHFLOW PROJECTIONS

### 3-Year Cashflow Forecast

| Year | Inflows | Outflows | Net | Cumulative |
|------|---------|---------|-----|------------|
| 2026 | 301M | 347.7M | (46.7M) | (946.7M) |
| 2027 | 13.1B | 8.3B | 4.8B | 3.85B |
| 2028 | 102B | 36B | 66B | 69.85B |
| 2029 | 226B | 100B | 126B | 195.85B |

### Monthly Cashflow (Year 2)

| Quarter | Customers | Revenue | Costs | Net Cash | Balance |
|---------|-----------|---------|-------|---------|---------|
| Q1 | 300-800 | 485M | 1.5B | (1.0B) | 2.8B |
| Q2 | 800-2,000 | 1.3B | 1.8B | (0.5B) | 2.3B |
| Q3 | 2,000-5,000 | 3.2B | 2.2B | 1.0B | 3.3B |
| Q4 | 5,000 | 8.1B | 2.8B | 5.3B | 8.6B |
| **TOTAL** | **5,000** | **13.1B** | **8.3B** | **4.8B** | |

### Cash runway

```
Starting Cash (Seed): 5B VND
─────────────────────────────────────────────
Month 1-6 (Scale): (1.5B)
Month 7-12 (Growth): 3.3B
─────────────────────────────────────────────
End of Year 2: 6.8B VND ✅

Cash positive from Month 8
```

---

## 6. SCENARIO ANALYSIS

### Best Case (Bull)

| Month | Inflows | Outflows | Net Cash |
|-------|---------|----------|----------|
| 6 | 50M | 20M | 30M |
| 12 | 100M | 30M | 70M |
| **Year 1** | **600M** | **300M** | **300M** |

### Base Case

| Month | Inflows | Outflows | Net Cash |
|-------|---------|----------|----------|
| 6 | 32M | 25M | 7M |
| 12 | 50M | 40M | 10M |
| **Year 1** | **301M** | **348M** | **(47M)** |

### Worst Case (Bear)

| Month | Inflows | Outflows | Net Cash |
|-------|---------|----------|----------|
| 6 | 15M | 25M | (10M) |
| 12 | 30M | 40M | (10M) |
| **Year 1** | **150M** | **348M** | **(198M)** |

### Contingency Plans

| Scenario | Trigger | Action |
|----------|---------|--------|
| Cash < 10M | Minimum reserve | Pause hiring |
| Cash < 5M | Critical | Reduce marketing |
| Revenue -30% | 3 consecutive months | Negotiate AP terms |
| COGS +20% | Supplier increase | Find alternate vendors |

---

## 7. CASH MANAGEMENT

### Banking Strategy

| Account | Purpose | Balance Target |
|---------|---------|----------------|
| Operating | Day-to-day | 10-20M |
| Reserve | 6-month buffer | 50M |
| Marketing | Campaign funds | As needed |
| Payroll | Salaries | 3M monthly |

### Cash Controls

```
┌────────────────────────────────────────────────────────────┐
│                 CASH CONTROLS                              │
├────────────────────────────────────────────────────────────┤
│  APPROVAL AUTHORITY:                                      │
│  ├── <5M:    Sales/Support Lead                         │
│  ├── 5-20M:  CEO                                         │
│  └── >20M:   Board/Partner                               │
│                                                              │
│  APPROVAL TIMELINE:                                        │
│  ├── <1M:     Same day                                   │
│  ├── 1-5M:    2 days                                     │
│  └── >5M:    1 week                                     │
│                                                              │
│  REQUIRED DOCUMENTATION:                                    │
│  ├── Invoice/Receipt                                      │
│  ├── Purchase order                                       │
│  └── Approval email                                       │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Payment Priority

| Priority | Item | Timeline |
|----------|------|----------|
| 1 | Payroll | Day 1 monthly |
| 2 | Cloud/hosting | Day 1 monthly |
| 3 | Supplier COGS | Net 30 |
| 4 | Marketing | Net 15 |
| 5 | Discretionary | As approved |

---

## 8. FINANCIAL METRICS

### Cash Health Indicators

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Cash runway | 12+ months | 6 months | 3 months |
| Burn rate | < Revenue | > Revenue | 2x Revenue |
| Collection days | < 7 | 7-14 | > 14 |
| Payment terms | 30 days | 30-45 | > 45 |
| AR/AP ratio | > 1 | 0.5-1 | < 0.5 |

### Cash Efficiency Ratios

| Ratio | Calculation | Target | Actual |
|-------|-------------|--------|--------|
| Cash conversion cycle | DSO + DIO - DPO | 0 days | 0 days |
| Operating cash ratio | OCF / Revenue | > 0.8 | 0.85 |
| Current ratio | Current Assets / CL | > 1.5 | 1.8 |
| Quick ratio | (Cash + AR) / CL | > 1.0 | 1.2 |

---

## 9. CASHFLOW FORECAST TOOL

### Monthly Forecast Template

```
┌────────────────────────────────────────────────────────────┐
│                 MONTHLY CASHFLOW TEMPLATE                   │
├────────────────────────────────────────────────────────────┤
│  BEGINNING CASH: _______________ VND                        │
│                                                              │
│  INFLOWS:                                                    │
│  ├── Hardware Revenue:      ____VND                        │
│  ├── Subscription:          ____VND                        │
│  └── Other:                ____VND                        │
│  TOTAL INFLOWS:            ____VND                        │
│                                                              │
│  OUTFLOWS:                                                  │
│  ├── COGS:                 ____VND                        │
│  ├── Variable Costs:       ____VND                        │
│  ├── Fixed Costs:         ____VND                        │
│  ├── Marketing:           ____VND                        │
│  └── Other:               ____VND                        │
│  TOTAL OUTFLOWS:          ____VND                        │
│                                                              │
│  NET CASHFLOW:         ____VND                            │
│  ENDING CASH:          ____VND                            │
│                                                              │
│  PROJECTED NEXT MONTH:    ____VND                          │
│  STATUS: □ Green  □ Yellow  □ Red                          │
└────────────────────────────────────────────────────────────┘
```

### Variance Analysis

| Category | Budget | Actual | Variance | % |
|----------|--------|--------|----------|---|
| Hardware Revenue | 21.25M | | | |
| Subscription | 1.64M | | | |
| COGS | 7.65M | | | |
| Variable | 1.125M | | | |
| Fixed | 4.4M | | | |
| Marketing | 16.25M | | | |
| **Net** | **(6.3M)** | | | |

---

## 10. APPENDIX: FINANCIAL CHECKLIST

### Monthly Cashflow Review

```
□ Beginning balance verified
□ All inflows recorded
□ All outflows categorized
□ Variances explained
□下一个 month forecast updated
□ Cash reserve policy checked
□ Payment schedule confirmed
□ Issues escalated if needed
```

### Quarterly Cashflow Review

```
□ Cashflow trends analyzed
□ Seasonal patterns identified
□ Working capital optimized
□ Banking relationships reviewed
□ Financing options evaluated
□ Investor updates prepared
```

---

**Document:** Cashflow Analysis V1.0
**Version:** 1.0 - Cashflow Management
**Date:** 2026-04-25
**Prepared for:** CEO & Investors

(End of file - total 434 lines)