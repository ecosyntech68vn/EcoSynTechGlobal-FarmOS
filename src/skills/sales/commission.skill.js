module.exports = {
  id: 'commission',
  name: 'Commission Calculator',
  description: 'Tính hoa hồng theo tier và deal size',
  version: '2.3.2',

  TIER_CONFIG: {
    base: {
      name: 'Base',
      minQuotaAchieved: 0,
      rate: 0.05
    },
    accelerator: {
      name: 'Accelerator',
      minQuotaAchieved: 80,
      rate: 0.08
    },
    super: {
      name: 'Super',
      minQuotaAchieved: 120,
      rate: 0.12
    }
  },

  DEAL_TIERS: {
    micro: { min: 0, rate: 0.03, cap: 5000000 },
    small: { min: 20000000, rate: 0.04, cap: 15000000 },
    medium: { min: 50000000, rate: 0.05, cap: 50000000 },
    large: { min: 100000000, rate: 0.07, cap: 100000000 },
    enterprise: { min: 250000000, rate: 0.10, cap: null }
  },

  BONUSES: {
    new_logo: { threshold: 3, bonus: 5000000, description: 'Bonus khách hàng mới' },
    renewal: { threshold: 0.9, bonus: 2000000, description: 'Bonus gia hạn' },
    upsell: { threshold: 0.3, bonus: 3000000, description: 'Bonus upsell' },
    team: { amount: 1000000, description: 'Team bonus chia đều' }
  },

  DEDUCTIONS: {
    churn: { rate: 0.5, description: 'Phạt churn trong 12 tháng' },
    discount_abuse: { rate: 0.25, description: 'Phạt discount > 20%' },
    late_payment: { rate: 0.1, description: 'Phạt thanh toán chậm' }
  },

  SPECIAL_RULES: {
    deal_size_discount_approval: 100000000,
    manager_approval_required: 200000000,
    accelerator_requires_won: true,
    clawback_months: 12
  },

  process: function(context) {
    const deal = context.deal || context;
    const user = context.user || {};
    const salesRepQuota = context.quota || 0;
    const wonDealsThisMonth = context.wonDeals || [];

    const dealCommission = this.calculateDealCommission(deal);
    const tierRate = this.getTierRate(salesRepQuota);
    const bonus = this.calculateBonus(deal, wonDealsThisMonth);
    const total = dealCommission + bonus;

    return {
      breakdown: this.getBreakdown(deal, dealCommission, tierRate, bonus),
      dealCommission,
      tierRate,
      bonus,
      totalCommission: total,
      applicableDeductions: this.checkDeductions(deal),
      netPayable: this.calculateNetPayable(total, deal),
      payout: this.getPayoutSchedule(total)
    };
  },

  calculateDealCommission: function(deal) {
    const tier = this.getDealTier(deal.value);
    const commission = deal.value * tier.rate;
    return tier.cap ? Math.min(commission, tier.cap) : commission;
  },

  getDealTier: function(value) {
    if (value >= 250000000) return this.DEAL_TIERS.enterprise;
    if (value >= 100000000) return this.DEAL_TIERS.large;
    if (value >= 50000000) return this.DEAL_TIERS.medium;
    if (value >= 20000000) return this.DEAL_TIERS.small;
    return this.DEAL_TIERS.micro;
  },

  getTierRate: function(quotaAchieved) {
    if (quotaAchieved >= 120) return this.TIER_CONFIG.super;
    if (quotaAchieved >= 80) return this.TIER_CONFIG.accelerator;
    return this.TIER_CONFIG.base;
  },

  calculateBonus: function(deal, wonDeals) {
    let bonus = 0;
    const bonuses = [];

    if (deal.isNewLogo || wonDeals.length <= 2) {
      const newLogoBonus = this.BONUSES.new_logo;
      bonus += newLogoBonus.bonus;
      bonuses.push({ type: 'new_logo', amount: newLogoBonus.bonus, reason: newLogoBonus.description });
    }

    if (deal.isRenewal) {
      bonus += this.BONUSES.renewal.bonus;
      bonuses.push({ type: 'renewal', amount: this.BONUSES.renewal.bonus, reason: this.BONUSES.renewal.description });
    }

    if (deal.upsellAmount && deal.upsellAmount / deal.value > 0.3) {
      bonus += this.BONUSES.upsell.bonus;
      bonuses.push({ type: 'upsell', amount: this.BONUSES.upsell.bonus, reason: this.BONUSES.upsell.description });
    }

    return { total: bonus, breakdown: bonuses };
  },

  checkDeductions: function(deal) {
    const deductions = [];

    if (deal.churnedWithinMonths && deal.churnedWithinMonths <= 12) {
      const clawback = deal.value * this.DEDUCTIONS.churn.rate;
      deductions.push({ type: 'churn', amount: clawback, reason: this.DEDUCTIONS.churn.description });
    }

    if (deal.discountPercent > 20) {
      const penalty = deal.commissionEarned * this.DEDUCTIONS.discount_abuse.rate;
      deductions.push({ type: 'discount_abuse', amount: penalty, reason: this.DEDUCTIONS.discount_abuse.description });
    }

    if (deal.paymentStatus === 'late') {
      const penalty = deal.commissionEarned * this.DEDUCTIONS.late_payment.rate;
      deductions.push({ type: 'late_payment', amount: penalty, reason: this.DEDUCTIONS.late_payment.description });
    }

    return deductions;
  },

  calculateNetPayable: function(grossCommission, deal) {
    const deductions = this.checkDeductions(deal);
    const deductionTotal = deductions.reduce((sum, d) => sum + d.amount, 0);
    return Math.max(0, grossCommission - deductionTotal);
  },

  getBreakdown: function(deal, dealCommission, tierRate, bonus) {
    return {
      deal: {
        id: deal.id,
        value: deal.value,
        stage: deal.stage,
        discount: deal.discountPercent || 0
      },
      tier: {
        name: tierRate.name,
        rate: tierRate.rate,
        quotaAchieved: deal.quotaAchieved || 0
      },
      commission: {
        base: dealCommission,
        tierBonus: dealCommission * (tierRate.rate - 0.05),
        bonuses: bonus.breakdown,
        gross: dealCommission + bonus.total
      }
    };
  },

  getPayoutSchedule: function(totalCommission) {
    const baseAmount = totalCommission * 0.7;
    const deferredAmount = totalCommission * 0.3;

    return {
      immediate: {
        amount: baseAmount,
        percentage: 70,
        trigger: 'Deal closed',
        timeline: 'Within 5 days'
      },
      deferred: {
        amount: deferredAmount,
        percentage: 30,
        trigger: 'Payment received',
        timeline: 'Within 30 days after customer payment'
      },
      total: totalCommission
    };
  },

  requiresApproval: function(deal) {
    if (deal.value >= this.SPECIAL_RULES.manager_approval_required) return 'director';
    if (deal.discountPercent > 20) return 'manager';
    if (deal.value >= this.SPECIAL_RULES.deal_size_discount_approval) return 'manager';
    return null;
  },

  calculateAnnualCommission: function(deals, quota) {
    const totalDeals = deals.reduce((sum, d) => sum + d.value, 0);
    const quotaAchieved = (totalDeals / quota * 100).toFixed(0);
    const tierRate = this.getTierRate(quotaAchieved);

    const commissions = deals.map(d => this.calculateDealCommission(d));
    const totalCommission = commissions.reduce((sum, c) => sum + c, 0);

    return {
      totalDeals,
      quota,
      quotaAchieved: parseFloat(quotaAchieved),
      tier: tierRate.name,
      totalCommission,
      averageDealSize: totalDeals / deals.length
    };
  }
};