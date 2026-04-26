class CampaignOptimizerSkill {
  static name = 'campaign-optimizer-ai';
  static description = 'Tối ưu chiến dịch marketing với AI';

  async execute(context) {
    const { campaigns = [], performance = {} } = context;

    const optimization = this.optimizeCampaigns(campaigns, performance);
    const budget = this.optimizeBudget(campaigns, performance);
    return {
      campaigns: optimization,
      budget,
      recommendations: this.recommendActions(campaigns),
      projectedROI: this.projectROI(campaigns)
    };
  }

  optimizeCampaigns(campaigns, performance) {
    return campaigns.map(c => ({
      name: c.name,
      currentROI: performance[c.id] || 0,
      optimization: performance[c.id] > 0.3 ? 'Tăng budget' : 'Giảm budget',
      suggestedBudget: this.calculateBudget(c, performance[c.id])
    }));
  }

  calculateBudget(campaign, roi) {
    const base = campaign.budget || 1000;
    return roi > 0.3 ? base * 1.3 : base * 0.7;
  }

  optimizeBudget(campaigns, performance) {
    const total = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    return { total, recommended: total * 1.15 };
  }

  recommendActions(campaigns) {
    return campaigns.map(c => ({ campaign: c.name, action: c.optimization }));
  }

  projectROI(campaigns) {
    return { expected: '25% increase', confidence: 'trung bình' };
  }
}

module.exports = CampaignOptimizerSkill;