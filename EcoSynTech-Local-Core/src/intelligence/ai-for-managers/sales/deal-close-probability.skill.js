class DealCloseProbabilitySkill {
  static name = 'deal-close-probability';
  static description = 'Tính xác suất deal thành công với AI';

  constructor() {
    this.factors = {
      engagement: { weight: 0.25, factors: ['meeting', 'email', 'call'] },
      readiness: { weight: 0.25, factors: ['budget', 'timeline', 'decision'] },
      fit: { weight: 0.30, factors: ['product-fit', 'company-size', 'industry'] },
      competition: { weight: 0.20, factors: ['competitors', 'win-rate'] }
    };
  }

  async execute(context) {
    const { deal = {}, interactions = [], competitorInfo = {} } = context;

    const factors = this.analyzeAllFactors(deal, interactions, competitorInfo);
    const probability = this.calculateProbability(factors);
    const riskFactors = this.identifyRiskFactors(factors);
    const recommendations = this.generateRecommendations(factors, probability);
    const scenarioAnalysis = this.scenarioAnalysis(deal, probability);

    return {
      probability,
      factors,
      riskFactors,
      recommendations,
      scenarioAnalysis,
      nextSteps: this.suggestNextSteps(factors, probability)
    };
  }

  analyzeAllFactors(deal, interactions, competitorInfo) {
    return {
      engagement: this.scoreEngagement(interactions),
      readiness: this.scoreReadiness(deal),
      fit: this.scoreFit(deal),
      competition: this.scoreCompetition(competitorInfo)
    };
  }

  scoreEngagement(interactions) {
    let score = 0.3;
    const meetingCount = interactions.filter(i => i.type === 'meeting').length;
    const emailCount = interactions.filter(i => i.type === 'email').length;
    const callCount = interactions.filter(i => i.type === 'call').length;
    const lastInteraction = Math.min(...interactions.map(i => i.daysAgo)) || 30;

    score += Math.min(0.25, meetingCount * 0.05);
    score += Math.min(0.25, emailCount * 0.03);
    score += Math.min(0.25, callCount * 0.05);
    if (lastInteraction < 7) score += 0.15;

    return { score: Math.min(1, score), details: { meetingCount, emailCount, callCount, lastInteraction } };
  }

  scoreReadiness(deal) {
    let score = 0.3;
    if (deal.hasBudget) score += 0.3;
    if (deal.hasTimeline) score += 0.2;
    if (deal.decisionMaker) score += 0.2;
    if (deal.buyingStage === 'proposal' || deal.buyingStage === 'negotiation') score += 0.1;

    return { score, details: { hasBudget: deal.hasBudget, hasTimeline: deal.hasTimeline, decisionMaker: deal.decisionMaker } };
  }

  scoreFit(deal) {
    let score = 0.4;
    if (deal.productFit > 0.7) score += 0.3;
    if (deal.companySize >= 100) score += 0.15;
    if (deal.industryMatch) score += 0.15;

    return { score, details: { productFit: deal.productFit, companySize: deal.companySize, industryMatch: deal.industryMatch } };
  }

  scoreCompetition(competitorInfo) {
    let score = 0.5;
    const competitors = competitorInfo.count || 0;
    if (competitors === 0) score += 0.3;
    else if (competitors === 1) score += 0.15;
    
    if (competitorInfo.theirWinRate < 0.3) score += 0.2;

    return { score, details: { competitors, winRate: competitorInfo.theirWinRate } };
  }

  calculateProbability(factors) {
    const totalScore = (
      factors.engagement.score * this.factors.engagement.weight +
      factors.readiness.score * this.factors.readiness.weight +
      factors.fit.score * this.factors.fit.weight +
      factors.competition.score * this.factors.competition.weight
    ) * 100;

    const adjustedScore = totalScore * this.getStageMultiplier(factors);

    return {
      raw: Math.round(totalScore),
      adjusted: Math.round(adjustedScore),
      rating: adjustedScore > 70 ? 'Hot' : adjustedScore > 50 ? 'Warm' : adjustedScore > 30 ? 'Cool' : 'Cold',
      confidence: this.getConfidence(adjustedScore)
    };
  }

  getStageMultiplier(factors) {
    if (factors.readiness.details.decisionMaker) return 1.2;
    if (factors.engagement.details.lastInteraction < 7) return 1.1;
    return 1.0;
  }

  getConfidence(score) {
    const factors = Object.values(this.factors).length;
    return score > 60 ? 'cao' : score > 40 ? 'trung bình' : 'thấp';
  }

  identifyRiskFactors(factors) {
    const risks = [];
    if (factors.engagement.score < 0.4) risks.push({ type: 'engagement', severity: 'high', detail: 'Tương tác thấp' });
    if (factors.readiness.details.buyingStage === 'awareness') risks.push({ type: 'readiness', severity: 'high', detail: 'Chưa sẵn sàng mua' });
    if (factors.competition.details.competitors > 1) risks.push({ type: 'competition', severity: 'medium', detail: 'Nhiều đối thủ' });
    return risks;
  }

  generateRecommendations(factors, probability) {
    const recs = [];
    if (factors.engagement.score < 0.5) recs.push({ priority: 'high', action: 'Tăng tương tác', detail: 'Đặt lịch họp, gọi điện' });
    if (!factors.readiness.details.decisionMaker) recs.push({ priority: 'high', action: 'Tiếp cận decision maker' });
    if (factors.competition.details.competitors > 0) recs.push({ priority: 'medium', action: 'Tạo khác biệt', detail: 'Nhấn mạnh USP' });
    return recs;
  }

  scenarioAnalysis(deal, probability) {
    return [
      { scenario: 'Best', probability: probability.adjusted + 20, revenue: deal.value || 0 },
      { scenario: 'Base', probability: probability.adjusted, revenue: deal.value || 0 },
      { scenario: 'Worst', probability: Math.max(0, probability.adjusted - 30), revenue: (deal.value || 0) * 0.5 }
    ];
  }

  suggestNextSteps(factors, probability) {
    const steps = [];
    if (probability.adjusted > 70) {
      steps.push({ action: 'Đàm phán', priority: 'high' });
      steps.push({ action: 'Xúc tiến close deal', priority: 'high' });
    } else if (probability.adjusted > 40) {
      steps.push({ action: 'Demo sản phẩm', priority: 'medium' });
      steps.push({ action: 'Gửi proposal', priority: 'medium' });
    } else {
      steps.push({ action: 'Nuôi dưỡng', priority: 'low' });
    }
    return steps;
  }
}

module.exports = DealCloseProbabilitySkill;