# EcoSynTech FarmOS V2.0 - Financial Projection
## Dự báo Tài chính 3 năm / 3-Year Financial Forecast

---

## 1. EXECUTIVE SUMMARY

### Key Projections

| Metric | Year 1 (2026) | Year 2 (2027) | Year 3 (2028) |
|--------|---------------|----------------|---------------|
| **Customers** | 100 | 5,000 | 25,000 |
| **ARR** | 120M | 4.8B | 24B |
| **Hardware Revenue** | 150M | 7.5B | 35B |
| **Total Revenue** | 270M | 12.3B | 59B |
| **Operating Costs** | 241.6M | 9.3B | 44B |
| **Net Profit** | 28.4M | 3B | 15B |
| **Net Margin** | 11% | 24% | 25% |

### Unit Economics

```
┌────────────────────────────────────────────────────────────┐
│                    UNIT ECONOMICS                            │
├────────────────────────────────────────────────────────────┤
│  HARDWARE MARGIN                                            │
│  ├── BASE:       1,299K (COGS: 988K, Margin: 24%)         │
│  ├── PRO:        1,699K (COGS: 1,113K, Margin: 34%)        │
│  ├── PRO MAX:    2,299K (COGS: 1,343K, Margin: 42%)        │
│  └── PREMIUM:   2,999K (COGS: 1,573K, Margin: 48%)        │
│                                                              │
│  SUBSCRIPTION MARGIN                                        │
│  ├── PRO:        99K/mo (Variable: 30K, CM: 70%)          │
│  ├── PRO MAX:    199K/mo (Variable: 30K, CM: 85%)          │
│  └── PREMIUM:   299K/mo (Variable: 30K, CM: 90%)            │
│                                                              │
│  WEIGHTED CONTRIBUTION MARGIN                               │
│  60% PRO + 25% MAX + 10% PREMIUM + 5% BASE                 │
│  = 110,550 VND/customer/month                             │
│                                                              │
│  BREAK-EVEN                                                 │
│  Monthly BEP: 22 customers                                  │
│  Annual BEP: 264 customers                                   │
└────────────────────────────────────────────────────────────┘
```

---

## 2. REVENUE MODEL

### Revenue Streams

| Stream | Description | % of Total |
|--------|-------------|-------------|
| **Hardware** | One-time device sales | 55-60% |
| **Subscription** | Monthly AI/ML services | 35-40% |
| **Services** | Installation, training | 5% |
| **Enterprise** | Custom solutions | TBD |

### Customer Mix

| Tier | Hardware | Monthly | Year 1 Value | Target Mix |
|------|----------|---------|---------------|------------|
| BASE | 1,299K | FREE | 1,299K | 5% |
| PRO | 1,699K | 99K | 2,887K | 60% |
| PRO MAX | 2,299K | 199K | 4,687K | 25% |
| PREMIUM | 2,999K | 299K | 6,587K | 10% |

### Average Revenue Per User (ARPU)

```
Base Case (Weighted Mix):
ARPU/month = (99K × 0.60) + (199K × 0.25) + (299K × 0.10)
           = 59,400 + 49,750 + 29,900
           = 139,050 VND/month

Best Case (100% PREMIUM):
ARPU/month = 299K

Conservative (100% PRO):
ARPU/month = 99K
```

---

## 3. COST STRUCTURE

### Fixed Costs (Monthly)

| Category | Year 1 | Year 2 | Year 3 | Notes |
|----------|--------|--------|--------|-------|
| **Operations** | | | | |
| Server + Domain | 600K | 2M | 5M | Scales with customers |
| Team Salary | 2M | 15M | 40M | 1→5→15 people |
| Office | 0 | 2M | 5M | Home→Coworking→Office |
| **Marketing** | | | | |
| Marketing | 500K | 5M | 15M | Lead generation |
| Events | 0 | 3M | 10M | Farmer fairs |
| **Development** | | | | |
| Hosting/DevOps | 500K | 3M | 10M | Cloud infrastructure |
| APIs & Tools | 500K | 2M | 5M | Third-party services |
| **Admin** | | | | |
| Accounting | 200K | 500K | 1M | Part-time→Full-time |
| Legal | 100K | 500K | 1M | Contracts, compliance |
| **Total Fixed** | **4.4M** | **33M** | **92M** | |

### Variable Costs (Per Customer/Month)

| Item | Cost | Notes |
|------|------|-------|
| Data Storage | 5,000 | Cloud hosting |
| AI/API Calls | 10,000 | ML inference |
| Support | 15,000 | Customer success |
| **Total** | **30,000** | Per active customer |

### Customer Acquisition Cost (CAC)

| Channel | Cost | Conversion Rate | Effective CAC |
|---------|------|-----------------|---------------|
| Referral | 100K | 25% | **400K** ✅ |
| Agco Partner | 200K | 20% | **1M** |
| Farmer Fair | 300K | 15% | **2M** |
| Facebook Ads | 500K | 10% | **5M** |
| **Weighted Average** | - | - | **~1M** |

### Total Cost Structure

| Year | Fixed | Variable | CAC | COGS | Total |
|------|-------|----------|-----|------|-------|
| 2026 | 52.8M | 36M | 100M | 52.8M | **241.6M** |
| 2027 | 396M | 1.8B | 2.5B | 3.6B | **8.3B** |
| 2028 | 1.1B | 9B | 10B | 16B | **36.1B** |

---

## 4. 3-YEAR PROJECTIONS

### Year 1 (2026) - Pilot Phase

| Quarter | Customers | Hardware Rev | Sub Rev | Total Rev | Costs | Profit |
|---------|-----------|--------------|---------|-----------|-------|--------|
| Q1 | 10 | 15M | 0.3M | 15.3M | 55M | (39.7M) |
| Q2 | 30 | 45M | 2.1M | 47.1M | 55M | (7.9M) |
| Q3 | 60 | 75M | 5.4M | 80.4M | 60M | 20.4M |
| Q4 | 100 | 120M | 11.9M | 131.9M | 71.6M | 60.3M |
| **Total** | **100** | **255M** | **19.7M** | **274.7M** | **241.6M** | **33.1M** |

### Year 2 (2027) - Scale Phase

| Quarter | Customers | Hardware Rev | Sub Rev | Total Rev | Costs | Profit |
|---------|-----------|--------------|---------|-----------|-------|--------|
| Q1 | 300 | 450M | 35.7M | 485.7M | 1.5B | (1.0B) |
| Q2 | 800 | 1.2B | 95.2M | 1.3B | 1.8B | (0.5B) |
| Q3 | 2,000 | 3.0B | 238M | 3.2B | 2.2B | 1.0B |
| Q4 | 5,000 | 7.5B | 595M | 8.1B | 2.8B | 5.3B |
| **Total** | **5,000** | **12.15B** | **964M** | **13.1B** | **8.3B** | **4.8B** |

### Year 3 (2028) - Growth Phase

| Quarter | Customers | Hardware Rev | Sub Rev | Total Rev | Costs | Profit |
|---------|-----------|--------------|---------|-----------|-------|--------|
| Q1 | 8,000 | 12B | 953M | 12.95B | 7B | 5.95B |
| Q2 | 12,000 | 18B | 1.43B | 19.43B | 8B | 11.43B |
| Q3 | 18,000 | 27B | 2.14B | 29.14B | 10B | 19.14B |
| Q4 | 25,000 | 37.5B | 2.98B | 40.48B | 11B | 29.48B |
| **Total** | **25,000** | **94.5B** | **7.51B** | **102B** | **36B** | **66B** |

---

## 5. CASHFLOW ANALYSIS

### Monthly Cashflow (Year 1 - Average)

| Item | Amount | Notes |
|------|--------|-------|
| **Inflows** | | |
| Hardware Sales | 21.25M | 15 units × 1.7M |
| Subscription | 1.64M | 100 customers × 139K mix |
| **Total Inflows** | **22.89M** | |
| **Outflows** | | |
| COGS (Hardware) | 14.5M | 15 units × 1.113K |
| Variable Costs | 300K | 100 customers × 30K |
| Fixed Costs | 4.4M | Operations |
| Marketing | 1M | Acquisition |
| **Total Outflows** | **20.2M** | |
| **Net Cashflow** | **+2.69M** | |

### Cash Runway

```
Current Cash (Pre-Seed): ~1.3B VND
Monthly Burn: ~4.4M VND (fixed only)
─────────────────────────────────
Runway: 295+ months (with revenue)

Break-even: 22 customers/month
Time to Break-even: ~6 months
Cash at Break-even: ~1.25B VND ✅
```

---

## 6. SCENARIO ANALYSIS

### Customer Acquisition Scenarios

| Scenario | Year 1 | Year 2 | Year 3 | Risk |
|----------|--------|--------|--------|------|
| **Bear** | 50 | 2,000 | 10,000 | High |
| **Base** | 100 | 5,000 | 25,000 | Medium |
| **Bull** | 200 | 10,000 | 50,000 | Low |
| **Moonshot** | 300 | 20,000 | 100,000 | Very Low |

### Revenue Scenarios

| Scenario | Year 1 | Year 2 | Year 3 |
|----------|--------|--------|--------|
| **Bear** | 137M | 2.5B | 10B |
| **Base** | 270M | 12.3B | 59B |
| **Bull** | 540M | 24.6B | 118B |
| **Moonshot** | 810M | 49.2B | 236B |

### Break-even Scenarios

| Scenario | Monthly BEP | Time to BEP |
|----------|-------------|-------------|
| 100% PRO | 36 customers | 8 months |
| 60% PRO / 40% MAX | 22 customers | 6 months |
| 100% PREMIUM | 10 customers | 4 months |
| 100% BASE | No BEP | N/A |

---

## 7. KEY METRICS TRACKING

### Growth Metrics

| Metric | Q1 | Q2 | Q3 | Q4 | Y1 Target |
|--------|----|----|----|----|-----------|
| **Customers** | | | | | | |
| New Customers | 10 | 20 | 30 | 40 | 100 |
| Churned | 0 | 1 | 2 | 3 | 6 |
| Active | 10 | 29 | 57 | 94 | 100 |
| **Revenue** | | | | | | |
| Monthly Rev | 15M | 25M | 35M | 50M | 22.5M avg |
| ARR | 180M | 300M | 420M | 600M | 270M |
| **Costs** | | | | | |
| CAC | 1M | 800K | 600K | 500K | Decreasing |
| LTV | - | 300K | 400K | 500K | Increasing |
| LTV:CAC | - | 0.4:1 | 0.7:1 | 1:1 | 3:1 by Y2 |
| **Efficiency** | | | | | | |
| NRR | - | 95% | 97% | 98% | 95% |
| NPS | 30 | 35 | 40 | 45 | 40+ |
| Support Tickets | 5 | 8 | 10 | 12 | <20/mo |

### Unit Economics Metrics

| Metric | Definition | Year 1 | Year 2 | Year 3 |
|--------|------------|--------|--------|--------|
| **CAC** | Cost to acquire | 1M | 500K | 300K |
| **LTV** | Lifetime value (3yr) | 500K | 800K | 1.2M |
| **LTV:CAC** | Efficiency ratio | 0.5:1 | 1.6:1 | 4:1 |
| **Payback** | Months to recover CAC | 18 | 6 | 4 |
| **ARPU** | Average revenue/user | 139K | 160K | 200K |
| **Churn** | Monthly attrition | 2% | 1.5% | 1% |

---

## 8. FINANCIAL ASSUMPTIONS

### Key Assumptions

| Assumption | Value | Source/Basis |
|------------|-------|--------------|
| **Pricing** | | |
| BASE tier | 1,299K + FREE | Entry-level |
| PRO tier | 1,699K + 99K/mo | Primary offering |
| PRO MAX tier | 2,299K + 199K/mo | Mid-market |
| PREMIUM tier | 2,999K + 299K/mo | Enterprise |
| **Costs** | | |
| COGS (PRO) | 1,113K | BOM analysis |
| Variable/user | 30K/mo | Infrastructure |
| CAC (weighted) | 1M | Channel mix |
| **Growth** | | |
| Monthly churn | 1.5% | Conservative |
| Viral coefficient | 0.2 | Referral effect |
| Agco conversion | 20% | Partner channel |
| **Market** | | | |
| SAM penetration | 1% by Year 3 | 25K of 2M |
| Price elasticity | -0.5 | Vietnam market |

### External Factors

| Factor | Assumption | Impact |
|--------|------------|--------|
| Competition | No major change | Monitor |
| Regulation | Agri-tech support | Positive |
| Weather | Normal patterns | Baseline |
| Economy | 6% GDP growth | Neutral |
| Exchange Rate | 24,000 VND/USD | Stable |

---

## 9. INVESTMENT REQUIREMENTS

### Funding Timeline

| Round | Amount | Timing | Purpose |
|-------|--------|--------|---------|
| **Pre-Seed** | $50K (1.3B) | Q2 2026 | Pilot 100 |
| **Seed** | $200K (5B) | Q1 2027 | Scale 1,000 |
| **Series A** | $1M (25B) | Q4 2027 | 10,000 customers |

### Use of Funds (Pre-Seed)

| Category | Amount | % | Notes |
|----------|--------|---|-------|
| Pilot Hardware | 300M | 23% | 100 units |
| Inventory | 250M | 19% | Buffer stock |
| Marketing | 300M | 23% | Lead gen |
| Team | 350M | 27% | 2 people |
| Operations | 100M | 8% | Tools, admin |
| **Total** | **1.3B** | 100% | |

### Milestones for Next Round

| Milestone | Target | Value Unlock |
|----------|--------|------------|
| First customer | Month 1 | Validate |
| 25 customers | Month 3 | Traction |
| Break-even | Month 6 | Unit economics |
| 100 customers | Month 9 | Market proof |
| Agco partners (5) | Month 6 | Distribution |
| Case studies (10) | Month 9 | Social proof |

---

## 10. APPENDIX: SENSITIVITY ANALYSIS

### Revenue Sensitivity

| Factor | -20% | Base | +20% |
|--------|------|------|------|
| Customer growth | 80 | 100 | 120 |
| Hardware margin | 28% | 34% | 40% |
| Sub price | 111K | 139K | 167K |
| Churn rate | 2.5% | 1.5% | 0.5% |
| **Revenue impact** | (54M) | 270M | 324M |

### Cost Sensitivity

| Factor | -20% | Base | +20% |
|--------|------|------|------|
| COGS | 890K | 1,113K | 1,336K |
| CAC | 800K | 1M | 1.2M |
| Fixed costs | 41.8M | 52.3M | 62.8M |
| Variable | 24K | 30K | 36K |
| **Profit impact** | +9M | 33M | (9M) |

---

**Document:** Financial Projection V1.0
**Version:** 1.0 - 3-Year Forecast
**Date:** 2026-04-25
**Prepared for:** CEO & Investors

(End of file - total 429 lines)