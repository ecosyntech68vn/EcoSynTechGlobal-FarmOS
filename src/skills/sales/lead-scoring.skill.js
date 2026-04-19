module.exports = {
  id: 'lead-scoring',
  name: 'Lead Scoring Engine',
  description: 'Tự động chấm điểm lead dựa trên criteria',
  version: '2.3.2',

  SCORE_WEIGHTS: {
    FARM_SIZE: {
      large: { min: 10, score: 25 },
      medium: { min: 3, score: 15 },
      small: { min: 1, score: 10 },
      micro: { min: 0, score: 5 }
    },
    INDUSTRY: {
      aquaculture: 20,
      fruit: 18,
      vegetable: 15,
      herb: 15,
      flower: 12,
      rice: 10,
      livestock: 8
    },
    SOURCE: {
      referral: 20,
      partner: 18,
      tradeshow: 15,
      organic: 12,
      ads: 8,
      cold_call: 5
    },
    BEHAVIOR: {
      visited_pricing: 15,
      downloaded_brochure: 12,
      requested_demo: 15,
      attended_event: 10,
      multiple_visits: 15,
     _short_visit: -5,
      no_activity_30d: -10
    },
    BUDGET: {
      high: { min: 100000000, score: 20 },
      medium: { min: 50000000, score: 15 },
      low: { min: 20000000, score: 10 },
      none: { min: 0, score: 0 }
    }
  },

  process: function(context) {
    const lead = context.lead || context;
    const behavior = context.behavior || {};

    const scoreBreakdown = {
      farmSize: this.scoreFarmSize(lead.farmSize),
      industry: this.scoreIndustry(lead.industry),
      source: this.scoreSource(lead.source),
      behavior: this.scoreBehavior(behavior),
      budget: this.scoreBudget(lead.budget)
    };

    const totalScore = this.calculateTotalScore(scoreBreakdown);
    const rating = this.getRating(totalScore);

    return {
      score: totalScore,
      rating: rating,
      breakdown: scoreBreakdown,
      recommendation: this.getRecommendation(rating),
      nextAction: this.getNextAction(rating, lead.status)
    };
  },

  scoreFarmSize: function(farmSize) {
    const size = farmSize || 0;
    if (size >= 10) return this.SCORE_WEIGHTS.FARM_SIZE.large;
    if (size >= 3) return this.SCORE_WEIGHTS.FARM_SIZE.medium;
    if (size >= 1) return this.SCORE_WEIGHTS.FARM_SIZE.small;
    return this.SCORE_WEIGHTS.FARM_SIZE.micro;
  },

  scoreIndustry: function(industry) {
    const ind = industry || 'vegetable';
    return {
      value: this.SCORE_WEIGHTS.INDUSTRY[ind] || 10,
      label: ind
    };
  },

  scoreSource: function(source) {
    const src = source || 'website';
    return {
      value: this.SCORE_WEIGHTS.SOURCE[src] || 5,
      label: src
    };
  },

  scoreBehavior: function(behavior) {
    let score = 0;
    const labels = [];

    if (behavior.visitedPricing) {
      score += this.SCORE_WEIGHTS.BEHAVIOR.visited_pricing;
      labels.push('Xem bảng giá');
    }
    if (behavior.downloadedBrochure) {
      score += this.SCORE_WEIGHTS.BEHAVIOR.downloaded_brochure;
      labels.push('Tải brochure');
    }
    if (behavior.requestedDemo) {
      score += this.SCORE_WEIGHTS.BEHAVIOR.requested_demo;
      labels.push('Yêu cầu demo');
    }
    if (behavior.attendedEvent) {
      score += this.SCORE_WEIGHTS.BEHAVIOR.attended_event;
      labels.push('Tham gia event');
    }
    if (behavior.multipleVisits > 2) {
      score += this.SCORE_WEIGHTS.BEHAVIOR.multiple_visits;
      labels.push('Nhiều lượt truy cập');
    }
    if (behavior.noActivityDays > 30) {
      score += this.SCORE_WEIGHTS.BEHAVIOR.no_activity_30d;
      labels.push('Không hoạt động 30+ ngày');
    }

    return { value: score, labels };
  },

  scoreBudget: function(budget) {
    const b = budget || 0;
    if (b >= 100000000) return this.SCORE_WEIGHTS.BUDGET.high;
    if (b >= 50000000) return this.SCORE_WEIGHTS.BUDGET.medium;
    if (b >= 20000000) return this.SCORE_WEIGHTS.BUDGET.low;
    return this.SCORE_WEIGHTS.BUDGET.none;
  },

  calculateTotalScore: function(breakdown) {
    return (
      (breakdown.farmSize?.score || 0) +
      (breakdown.industry?.value || 0) +
      (breakdown.source?.value || 0) +
      (breakdown.behavior?.value || 0) +
      (breakdown.budget?.score || 0)
    );
  },

  getRating: function(score) {
    if (score >= 80) return { grade: 'A', label: 'Hot', priority: 1 };
    if (score >= 60) return { grade: 'B', label: 'Warm', priority: 2 };
    if (score >= 40) return { grade: 'C', label: 'Neutral', priority: 3 };
    return { grade: 'D', label: 'Cold', priority: 4 };
  },

  getRecommendation: function(rating) {
    const recs = {
      A: {
        action: 'Gọi điện ngay trong 24h',
        approach: 'Demo nhanh, chốt deal',
        discount: 'Có thể giảm 5%',
        escalate: true
      },
      B: {
        action: 'Tiếp cận trong 48h',
        approach: 'Gửi case study, ROI calculator',
        discount: 'Không giảm giá',
        escalate: false
      },
      C: {
        action: 'Nurture trong 2 tuần',
        approach: 'Gửi nội dung giá trị',
        discount: 'Không giảm giá',
        escalate: false
      },
      D: {
        action: 'Đưa vào nurture sequence',
        approach: 'Email series, Retargeting',
        discount: 'Không áp dụng',
        escalate: false
      }
    };
    return recs[rating.grade] || recs.D;
  },

  getNextAction: function(rating, currentStatus) {
    if (rating.grade === 'A' && currentStatus === 'new') {
      return { type: 'call', urgency: 'high', template: 'hot-lead-call' };
    }
    if (rating.grade === 'B' && currentStatus === 'contacted') {
      return { type: 'email', urgency: 'medium', template: 'send-case-study' };
    }
    return { type: 'nurture', urgency: 'low', template: 'weekly-content' };
  },

  batchScore: function(leads) {
    return leads.map(lead => ({
      leadId: lead.id,
      ...this.process(lead)
    }));
  },

  getPriorityLeads: function(leads, minRating = 'B') {
    const ratings = ['A', 'B', 'C', 'D'];
    const minIndex = ratings.indexOf(minRating);

    return this.batchScore(leads)
      .filter(r => ratings.indexOf(r.rating.grade) <= minIndex)
      .sort((a, b) => b.score - a.score);
  }
};