# EcoSynTech - Break-Even Analysis & Pricing Optimization
## Phân tích Hoà Vốn & Tối ưu Giá

---

## 1. COST STRUCTURE

### Fixed Costs (Monthly)

| Item | VND/Month | Notes |
|------|-----------|-------|
| Server (VPS 2CPU/4GB) | 500,000 | 139.59.101.136 |
| Domain + SSL | 100,000 | Annual |
| MQTT Broker | 150,000 | Cloud |
| Support Tools | 200,000 | Telegram, CRM |
| Marketing (base) | 500,000 | Content, ads |
| Development | 1,000,000 | Part-time dev |
| **Total Fixed** | **2,450,000** | Per month |

### Variable Costs (Per Customer)

| Item | VND | Notes |
|------|-----|-------|
| Hardware COGS (BASE) | 988,000 | IP67, 2 sensors |
| Hardware COGS (PRO) | 1,113,000 | IP67, 8 sensors |
| Hardware COGS (PRO MAX) | 1,343,000 | IP67, 13 sensors |
| Hardware COGS (PREMIUM) | 1,573,000 | IP67, 19 sensors |
| Data Storage | 5,000 | Per customer/mo |
| API Calls (AI) | 10,000 | Per customer/mo |
| Support Cost | 15,000 | Per customer/mo |

### Customer Acquisition Cost (CAC)

| Channel | VND | Conversion |
|---------|-----|-----------|
| Direct (farmer fairs) | 150,000 | 15% |
| Referral | 100,000 | 25% |
| Agco Partner | 200,000 | 20% |
| Facebook/Zalo | 300,000 | 10% |
| Online Ads | 350,000 | 8% |

---

## 2. UNIFIED PRICING (IP67 All Tiers)

### Hardware Only

| Tier | Price | COGS | Gross Profit | Margin % |
|------|-------|------|-------------|----------|
| BASE | 1,299K | 988K | 311K | 24% |
| PRO | 1,699K | 1,113K | 586K | 34% |
| PRO MAX | 2,299K | 1,343K | 956K | 42% |
| PREMIUM | 2,999K | 1,573K | 1,426K | 48% |

### Year 1 Revenue (Hardware + Subscription)

| Tier | Hardware | Sub Y1 | Total Y1 | COGS | Gross | Margin % |
|------|----------|--------|----------|------|-------|----------|
| BASE | 1,299K | FREE | 1,299K | 988K | 311K | 24% |
| PRO | 1,699K | 1,188K | 2,887K | 1,113K | 1,774K | **61%** |
| PRO MAX | 2,299K | 2,388K | 4,687K | 1,343K | 3,344K | **71%** |
| PREMIUM | 2,999K | 3,588K | 6,587K | 1,573K | 5,014K | **76%** |

**Break-even Analysis (Hardware Only):**

| Tier | Price | COGS+CAC | Customers to Break-even |
|------|-------|---------|------------------------|
| Starter | 1.7M | 960K | 3 customers |
| Pro | 1.7M | 1.2M | 2 customers |
| Max | 2.1M | 1.5M | 2 customers |
| Premium | 2.8M | 2.0M | 1 customers |

---

### SCENARIO B: Hardware + Subscription (RECOMMENDED - Option C)

| Tier | Hardware | Monthly | Yearly | 12-Month Revenue | COGS Y1 | Gross Y1 |
|------|----------|---------|--------|------|-----------------|----------|----------|
| Starter | 1,699,000 | FREE | FREE | 1,699,000 | 1,310,000 | 389,000 |
| Pro | 1,699,000 | 99,000 | 990,000 | 2,887,000 | 1,310,000 | 1,577,000 |
| Max | 2,099,000 | 199,000 | 1,990,000 | 4,487,000 | 1,610,000 | 2,877,000 |
| Premium | 2,799,000 | 299,000 | 2,990,000 | 6,787,000 | 2,310,000 | 4,477,000 |

**12-Month Contribution Margin:**

| Tier | Revenue Y1 | COGS | Contribution | CM % |
|------|-------------|------|---------------|------|
| BASE | 1,299K | 988K | 311K | 24% |
| PRO | 2,887K | 1,113K | 1,774K | 61% |
| PRO MAX | 4,687K | 1,343K | 3,344K | 71% |
| PREMIUM | 6,587K | 1,573K | 5,014K | 76% |

---

### Subscription Only (SaaS)

| Tier | Monthly | Yearly | Annual Revenue | COGS/Year | Contribution | CM % |
|------|---------|--------|---------------|------------|-------------|-------------|------|
| BASE | FREE | FREE | 0 | 0 | 0 | - |
| PRO | 99K | 990K | 990K | 180K | 810K | 82% |
| PRO MAX | 199K | 1.99M | 1,990K | 300K | 1,690K | 85% |
| PREMIUM | 299K | 2.99M | 2,990K | 420K | 2,570K | 86% |

---

## 3. BREAK-EVEN CALCULATIONS (Unified IP67)

### Monthly Break-Even (Subscription Model)

**Fixed Costs:** 2,450,000 VND/month

| Tier | Contribution/Customer | Break-Even Customers |
|------|----------------------|---------------------|
| BASE | 0 (free) | ∞ |
| PRO | 69,000 (99K - 30K var) | 36 customers |
| PRO MAX | 169,000 (199K - 30K) | 15 customers |
| PREMIUM | 269,000 (299K - 30K) | 10 customers |

### Mixed Portfolio Break-Even (60% PRO, 25% MAX, 10% PREMIUM, 5% BASE)

**Weighted Average Contribution:**

```
PRO (60%):  69,000 x 0.60 = 41,400
MAX (25%):  169,000 x 0.25 = 42,250
PREMIUM (10%): 269,000 x 0.10 = 26,900
BASE (5%):  0 x 0.05 = 0
────────────────────────────────────
Weighted CM: 110,550 VND/customer/month
```

**Monthly Break-Even:**

```
2,450,000 ÷ 110,550 = 22.2 ≈ 22 customers

Monthly Recurring Target: 22 active subscriptions
Annual Target: 264 customers
```
PRO (60%):  84,000 x 0.60 = 50,400
MAX (25%):  184,000 x 0.25 = 46,000
PREMIUM (10%): 284,000 x 0.10 = 28,400
BASE (5%):  0 x 0.05 = 0
─────────────────────────────────────
Weighted CM: 124,800 VND/customer/month
```

**Monthly Break-Even:**

```
2,450,000 ÷ 124,800 = 19.6 ≈ 20 customers

Monthly Recurring Target: 20 active subscriptions
Annual Target: 240 customers
```

---

### Break-Even Timeline

| Phase | Month | Customers | Revenue/Month | Status |
|-------|-------|-----------|---------------|--------|
| **Pilot** | 1-3 | 10 | 990K | Pre-revenue |
| **Launch** | 4-6 | 25 | 2.5M | Near BEP |
| **Growth** | 7-9 | 50 | 5.0M | > BEP |
| **Scale** | 10-12 | 100 | 10M | Profitable |

---

## 4. LTV & CAC ANALYSIS

### Lifetime Value Calculation

| Tier | Monthly Revenue | Gross Margin | Churn Rate | LTV |
|------|----------------|-------------|------------|-----------|-----|
| PRO | 99,000 | 82% | 15% | 655,200 |
| MAX | 199,000 | 85% | 10% | 1,693,850 |
| PREMIUM | 299,000 | 86% | 5% | 3,419,540 |

**LTV Formula:**
```
LTV = (Monthly Revenue × Gross Margin) ÷ Churn Rate
```

### CAC & LTV:CAC Ratio

| Channel | CAC | PRO LTV | LTV:CAC | Recommendation |
|---------|-----|---------|---------|------------|
| Referral | 100K | 655K | 6.6:1 | ✅ BEST |
| Direct | 150K | 655K | 4.4:1 | ✅ Good |
| Agco | 200K | 655K | 3.3:1 | ✅ Good |
| Facebook | 300K | 655K | 2.2:1 | ⚠️ Marginal |
| Online | 350K | 655K | 1.9:1 | ❌ Don't |

**Optimal CAC Target:** <200K (LTV:CAC > 3:1)

---

## 5. BREAK-EVEN MATRIX (COMPREHENSIVE)

### Monthly Financial Model

| Metric | Conservative | Target | Aggressive |
|--------|-------------|--------|------------|
| **Customers** | 20 | 50 | 100 |
| PRO (60%) | 12 | 30 | 60 |
| MAX (25%) | 5 | 12 | 25 |
| PREMIUM (10%) | 2 | 5 | 10 |
| BASE (5%) | 1 | 3 | 5 |
| **Revenue** | | | |
| Subscription | 2,078,000 | 5,195,000 | 10,390,000 |
| Hardware (new) | 3,500,000 | 8,750,000 | 17,500,000 |
| **Total Revenue** | 5,578,000 | 13,945,000 | 27,890,000 |
| **COGS** | | | |
| Hardware | 2,100,000 | 5,250,000 | 10,500,000 |
| Data/API | 300,000 | 750,000 | 1,500,000 |
| Support | 300,000 | 750,000 | 1,500,000 |
| **Gross Profit** | 2,878,000 | 7,195,000 | 14,390,000 |
| **Fixed Costs** | 2,450,000 | 2,450,000 | 2,950,000 |
| **Net Profit** | 428,000 | 4,745,000 | 11,440,000 |
| **Margin %** | 8% | 34% | 41% |

---

## 6. SCENARIO COMPARISON

### Revenue Model Comparison (Annual)

| Model | Year 1 Revenue | Year 2 Revenue | Year 3 Revenue |
|-------|----------------|----------------|----------------|
| **Hardware Only** | | | |
| 50 customers | 100M | 0 | 0 |
| 100 customers | 200M | 0 | 0 |
| **Hardware + Sub** | | | |
| 50 customers | 80M | 60M | 60M |
| 100 customers | 160M | 120M | 120M |
| **SaaS Only** | | | |
| 50 customers | 5.9M | 5.9M | 5.9M |
| 100 customers | 11.9M | 11.9M | 11.9M |

### 3-Year Cumulative Revenue

| Model | 50 cust | 100 cust | 500 cust | 1000 cust |
|-------|---------|---------|----------|----------|
| Hardware Only | 100M | 200M | 1B | 2B |
| Hardware+Sub | 200M | 400M | 2B | 4B |
| SaaS Only | 18M | 36M | 180M | 360M |

**Winner: Hardware + Subscription (Hybrid Model)**

---

## 7. OPTIMAL PRICING RECOMMENDATION

### Recommended Tier Mix

| Tier | Price | Target | % of Sales |
|------|-------|--------|-----------|
| **Starter** | 1,500K (hw) | Demo | 10% |
| **Pro** | 1,500K + 99K/mo | SME | 60% |
| **Max** | 1,800K + 199K/mo | Growth | 25% |
| **Premium** | 2,500K + 299K/mo | Enterprise | 5% |

### Why This Mix?

1. **Pro (60%)**: Sweet spot - 99K/month affordable, 47% margin
2. **Max (25%)**: Upsell for growth farms, 58% margin
3. **Starter (10%)**: Market penetration, demo
4. **Premium (5%)**: Enterprise reference customers

### Break-Even Point

| Metric | Target |
|--------|--------|
| Monthly BEP | 20 customers |
| Annual BEP | 240 customers |
| Time to BEP | 6-9 months |
| Runway to BEP | $50K (~$1.3B VND) |

---

## 8. SENSITIVITY ANALYSIS

### Price Sensitivity

| Price Change | Impact on BEP | Impact on Revenue |
|--------------|---------------|-------------------|
| -20% (80K) | +8 customers | -12% |
| -10% (89K) | +3 customers | -4% |
| **Base (99K)** | **20 cust** | **100%** |
| +10% (109K) | -2 customers | +8% |
| +20% (119K) | -4 customers | +16% |

### Cost Sensitivity

| COGS Change | Impact on Margin |
|--------------|-----------------|
| -10% (hardware) | +3% margin |
| **Base** | **47% margin** |
| +10% (hardware) | -3% margin |
| +20% (hardware) | -6% margin |

### Churn Sensitivity

| Churn Rate | Impact on LTV |
|------------|----------------|
| 10% | 812K LTV |
| 15% (base) | 655K LTV |
| 20% | 492K LTV |
| 25% | 393K LTV |

---

## 9. RISK ANALYSIS

### Break-Even Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low acquisition | Medium | High | Referral program |
| Price war | Medium | Medium | Value differentiation |
| Churn too high | High | High | Focus on PRO |
| Hardware cost | Low | Medium | Bulk orders |
| Support overcapacity | Medium | Low | Tiered support |

### Contingency Plans

| Scenario | Response |
|----------|----------|
| Competitor lowers 50% | Add features, not price |
| Churn >20% | Improve CS, loyalty program |
| CAC >300K | Switch to referral channel |
| Hardware cost +20% | Negotiate bulk, redesign |

---

## 10. FINAL RECOMMENDATION

### Optimal Strategy

```
┌─────────────────────────────────────────────────────────────┐
│               RECOMMENDED PRICING STRATEGY                    │
├─────────────────────────────────────────────────────────────┤
│  TIER: PRO (60%) + MAX (25%) + Premium (5%) + Starter (10%) │
│                                                            │
│  HARDWARE: 1.5M-2.5M (one-time)                           │
│  SUBSCRIPTION: 99K-299K/month                             │
│                                                            │
│  MODEL: Hardware + Subscription (Hybrid)                │
│                                                            │
│  BREAK-EVEN: 20 customers/month                            │
│  TARGET: 50 customers by Month 6                          │
│  12-MONTH GOAL: 300 customers                              │
│                                                            │
│  LTV:CAC RATIO: 4.4:1 (target: >3:1)                       │
│  GROSS MARGIN: 47-58%                                      │
│  NET MARGIN: 34% (at scale)                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Metrics Summary

| Metric | Minimum | Target | Stretch |
|--------|---------|--------|---------|
| **Customers** | 20/mo | 50/mo | 100/mo |
| **Revenue** | 2.5M/mo | 6M/mo | 12M/mo |
| **Gross Margin** | 40% | 47% | 55% |
| **Net Margin** | 5% | 30% | 40% |
| **LTV:CAC** | 3:1 | 4.4:1 | 6:1 |
| **Churn** | <20% | <15% | <10% |

### Next Steps

1. **Month 1-3**: Acquire 25 customers (Pilot)
2. **Month 4-6**: Reach 50 customers (BEP)
3. **Month 7-12**: Scale to 300 customers
4. **Year 2**: Expand to 1,000 customers

---

**Document:** Break-Even Analysis V1.0
**Created:** 2026-04-25
**Status:** Final