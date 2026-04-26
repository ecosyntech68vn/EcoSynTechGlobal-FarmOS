class LeadScoringSkill {
  static name = 'lead-scoring-ai';
  static description = 'Chấm điểm khách hàng tiềm năng với AI';

  constructor() {
    this.scoreWeights = {
      demographics: 0.25,
      behavior: 0.30,
      engagement: 0.25,
      firmographics: 0.20
    };
  }

  async execute(context) {
    const { leads = [], idealCustomer = {} } = context;

    const scoredLeads = leads.map(lead => this.scoreLead(lead, idealCustomer));
    const prioritized = scoredLeads.sort((a, b) => b.totalScore - a.totalScore);
    const distribution = this.analyzeDistribution(prioritized);
    const recommendations = this.generateRecommendations(prioritized);

    return {
      scoredLeads: prioritized,
      distribution,
      topLeads: prioritized.slice(0, 10),
      recommendations,
      nextActions: this.suggestActions(prioritized)
    };
  }

  scoreLead(lead, ideal) {
    const scores = {
      demographics: this.scoreDemographics(lead, ideal),
      behavior: this.scoreBehavior(lead),
      engagement: this.scoreEngagement(lead),
      firmographics: this.scoreFirmographics(lead, ideal)
    };

    const totalScore = (
      scores.demographics * this.scoreWeights.demographics +
      scores.behavior * this.scoreWeights.behavior +
      scores.engagement * this.scoreWeights.engagement +
      scores.firmographics * this.scoreWeights.firmographics
    ) * 100;

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      scores,
      totalScore: Math.round(totalScore),
      rating: this.getRating(totalScore),
      reason: this.getScoreReason(scores)
    };
  }

  scoreDemographics(lead, ideal) {
    let score = 0.5;
    if (lead.role === ideal.role || lead.title === ideal.title) score += 0.3;
    if (lead.companySize >= (ideal.minCompanySize || 10)) score += 0.2;
    return Math.min(1, score);
  }

  scoreBehavior(lead) {
    let score = 0.3;
    if (lead.visits > 5) score += 0.2;
    if (lead.downloads > 0) score += 0.2;
    if (lead.webinars > 0) score += 0.2;
    if (lead.emailsOpened > 3) score += 0.1;
    return Math.min(1, score);
  }

  scoreEngagement(lead) {
    let score = 0.3;
    if (lead.lastActive === 'recent') score += 0.3;
    if (lead.responseTime < 24) score += 0.2;
    if (lead.avgSessionDuration > 300) score += 0.2;
    return Math.min(1, score);
  }

  scoreFirmographics(lead, ideal) {
    let score = 0.5;
    if (ideal.industries?.includes(lead.industry)) score += 0.3;
    if (ideal.locations?.includes(lead.location)) score += 0.2;
    return Math.min(1, score);
  }

  getRating(score) {
    if (score >= 80) return 'Hot';
    if (score >= 60) return 'Warm';
    if (score >= 40) return 'Cool';
    return 'Cold';
  }

  getScoreReason(scores) {
    const reasons = [];
    if (scores.behavior > 0.7) reasons.push('Hành vi tích cực');
    if (scores.engagement > 0.7) reasons.push('Tương tác cao');
    if (scores.demographics > 0.7) reasons.push('Đối tượng lý tưởng');
    if (scores.firmographics > 0.7) reasons.push('Doanh nghiệp phù hợp');
    return reasons.length > 0 ? reasons.join(', ') : 'Cần nuôi dưỡng thêm';
  }

  analyzeDistribution(leads) {
    const ratingCounts = { Hot: 0, Warm: 0, Cool: 0, Cold: 0 };
    leads.forEach(l => ratingCounts[l.rating]++);
    
    return {
      total: leads.length,
      byRating: ratingCounts,
      percentage: Object.fromEntries(
        Object.entries(ratingCounts).map(([k, v]) => [k, ((v / leads.length) * 100).toFixed(1) + '%'])
      ),
      averageScore: (leads.reduce((sum, l) => sum + l.totalScore, 0) / leads.length).toFixed(0)
    };
  }

  generateRecommendations(leads) {
    const recs = [];
    const hot = leads.filter(l => l.rating === 'Hot');
    const warm = leads.filter(l => l.rating === 'Warm');
    
    if (hot.length > 0) {
      recs.push({ priority: 'high', action: 'Liên hệ ngay', count: hot.length });
    }
    if (warm.length > 0) {
      recs.push({ priority: 'medium', action: 'Nuôi dưỡng', count: warm.length });
    }
    
    return recs;
  }

  suggestActions(leads) {
    return leads.slice(0, 5).map(lead => ({
      name: lead.name,
      score: lead.totalScore,
      rating: lead.rating,
      action: lead.rating === 'Hot' ? 'Gọi điện ngay' : 
        lead.rating === 'Warm' ? 'Gửi email cá nhân' : 'Thêm vào sequence'
    }));
  }
}

module.exports = LeadScoringSkill;