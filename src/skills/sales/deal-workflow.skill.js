module.exports = {
  id: 'deal-workflow',
  name: 'Deal Workflow Automation',
  description: 'Tự động hóa quy trình deal từ lead đến chốt',
  version: '2.3.2',

  STAGES: {
    DISCOVERY: 'discovery',
    QUALIFICATION: 'qualification',
    PROPOSAL: 'proposal',
    NEGOTIATION: 'negotiation',
    CLOSED_WON: 'closed_won',
    CLOSED_LOST: 'closed_lost'
  },

  TRANSITIONS: {
    discovery: {
      next: 'qualification',
      criteria: ['budget_confirmed', 'need_identified', 'stakeholder_meted'],
      autoAdvance: false
    },
    qualification: {
      next: 'proposal',
      criteria: ['qualified', 'budget_approved', 'decision_maker_identified'],
      autoAdvance: false
    },
    proposal: {
      next: 'negotiation',
      criteria: ['quote_sent', 'objection_handled'],
      autoAdvance: false
    },
    negotiation: {
      next: 'closed_won',
      criteria: ['contract_signed', 'payment_received'],
      autoAdvance: true
    }
  },

  MILESTONES: {
    discovery: [
      { id: 'intro_call', name: 'Gọi giới thiệu', dueIn: 1, owner: 'sales' },
      { id: 'needs_analysis', name: 'Phân tích nhu cầu', dueIn: 3, owner: 'sales' },
      { id: 'site_visit', name: 'Khảo sát farm', dueIn: 7, owner: 'sales' },
      { id: 'proposal_request', name: 'Yêu cầu báo giá', dueIn: 10, owner: 'sales' }
    ],
    qualification: [
      { id: 'budget_qualify', name: 'Xác nhận ngân sách', dueIn: 2, owner: 'customer' },
      { id: 'stakeholder_map', name: 'Map stakeholder', dueIn: 3, owner: 'sales' },
      { id: 'competition_check', name: 'Kiểm tra đối thủ', dueIn: 5, owner: 'sales' },
      { id: 'technical_fit', name: 'Xác nhận kỹ thuật', dueIn: 7, owner: 'engineer' }
    ],
    proposal: [
      { id: 'quote_prepare', name: 'Lập báo giá', dueIn: 2, owner: 'sales' },
      { id: 'quote_review', name: 'Review báo giá', dueIn: 3, owner: 'manager' },
      { id: 'quote_send', name: 'Gửi báo giá', dueIn: 5, owner: 'sales' },
      { id: 'presentation', name: 'Present cho KH', dueIn: 10, owner: 'sales' }
    ],
    negotiation: [
      { id: 'objection_list', name: 'List objection', dueIn: 2, owner: 'sales' },
      { id: 'negotiation_call', name: 'Đàm phán', dueIn: 5, owner: 'sales' },
      { id: 'discount_approval', name: 'Approve discount', dueIn: 7, owner: 'manager' },
      { id: 'contract_draft', name: 'Soạn HĐ', dueIn: 10, owner: 'legal' }
    ]
  },

  ALERTS: {
    no_activity_7d: { level: 'warning', message: 'Deal không hoạt động 7 ngày' },
    stage_stuck_14d: { level: 'danger', message: 'Deal stuck 14 ngày' },
    overdue_milestone: { level: 'danger', message: 'Milestone quá hạn' },
    no_followup_3d: { level: 'warning', message: 'Không follow-up 3 ngày sau meeting' }
  },

  process: function(context) {
    const deal = context.deal || context;
    const daysSinceUpdate = this.getDaysSinceUpdate(deal.updatedAt);

    const alerts = this.checkAlerts(deal, daysSinceUpdate);
    const nextMilestones = this.getNextMilestones(deal.stage);
    const recommendations = this.getRecommendations(deal, alerts);

    return {
      alerts,
      nextMilestones,
      recommendations,
      health: this.getHealthScore(deal, alerts),
      shouldEscalate: this.shouldEscalate(deal, alerts)
    };
  },

  getDaysSinceUpdate: function(updatedAt) {
    if (!updatedAt) return 999;
    const updated = new Date(updatedAt);
    const now = new Date();
    return Math.floor((now - updated) / (1000 * 60 * 60 * 24));
  },

  checkAlerts: function(deal, daysSinceUpdate) {
    const alerts = [];

    if (daysSinceUpdate >= 7) {
      alerts.push({
        ...this.ALERTS.no_activity_7d,
        dealId: deal.id,
        days: daysSinceUpdate
      });
    }

    if (daysSinceUpdate >= 14) {
      alerts.push({
        ...this.ALERTS.stage_stuck_14d,
        dealId: deal.id,
        stage: deal.stage,
        days: daysSinceUpdate
      });
    }

    if (deal.expectedClose) {
      const daysUntilClose = this.getDaysUntilClose(deal.expectedClose);
      if (daysUntilClose < 0) {
        alerts.push({
          level: 'danger',
          message: 'Deal quá hạn đóng dự kiến',
          dealId: deal.id,
          days: Math.abs(daysUntilClose)
        });
      }
    }

    return alerts;
  },

  getDaysUntilClose: function(expectedClose) {
    if (!expectedClose) return 999;
    const close = new Date(expectedClose);
    const now = new Date();
    return Math.floor((close - now) / (1000 * 60 * 60 * 24));
  },

  getNextMilestones: function(stage) {
    return this.MILESTONES[stage] || [];
  },

  getRecommendations: function(deal, alerts) {
    const recs = [];
    const stage = deal.stage;

    if (alerts.some(a => a.level === 'danger')) {
      recs.push({
        priority: 1,
        action: 'Escalate to manager',
        reason: 'Deal có alerts nghiêm trọng'
      });
    }

    if (deal.probability < 30 && stage === 'discovery') {
      recs.push({
        priority: 2,
        action: 'Push for qualification',
        reason: 'Cần qualify rõ hơn'
      });
    }

    if (deal.probability > 60 && stage === 'proposal') {
      recs.push({
        priority: 2,
        action: 'Schedule negotiation meeting',
        reason: 'Sẵn sàng đàm phán'
      });
    }

    if (deal.value > 100000000 && stage !== 'negotiation') {
      recs.push({
        priority: 1,
        action: 'Request manager involvement',
        reason: 'Deal lớn cần manager support'
      });
    }

    return recs;
  },

  getHealthScore: function(deal, alerts) {
    let score = 100;

    const dangerCount = alerts.filter(a => a.level === 'danger').length;
    const warningCount = alerts.filter(a => a.level === 'warning').length;

    score -= dangerCount * 30;
    score -= warningCount * 15;

    if (deal.probability > 70) score += 10;
    if (deal.probability > 40 && deal.probability <= 70) score += 5;

    return Math.max(0, Math.min(100, score));
  },

  shouldEscalate: function(deal, alerts) {
    if (deal.value >= 100000000) return true;
    if (alerts.some(a => a.level === 'danger')) return true;
    if (deal.daysSinceUpdate >= 30) return true;

    return false;
  },

  createActionPlan: function(deal) {
    const stage = deal.stage || this.STAGES.DISCOVERY;
    const milestones = this.MILESTONES[stage] || [];

    return {
      dealId: deal.id,
      stage,
      actions: milestones.map(m => ({
        ...m,
        status: 'pending',
        createdAt: new Date().toISOString()
      }))
    };
  },

  canAdvance: function(deal, criteria) {
    const transition = this.TRANSITIONS[deal.stage];
    if (!transition) return false;

    return transition.criteria.every(c => criteria.includes(c));
  },

  getNextStage: function(currentStage) {
    const transition = this.TRANSITIONS[currentStage];
    return transition?.next || null;
  }
};