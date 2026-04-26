class AdSpendOptimizerSkill {
  static name = 'ad-spend-optimizer-ai';
  static description = 'Tối giá quảng cáo với AI';

  async execute(context) {
    const { ads = [], results = {} } = context;

    const optimization = this.optimizeAdSpend(ads, results);
    const recommendations = this.generateRecommendations(optimization);
    return {
      optimization,
      recommendations,
      projectedSavings: this.calculateSavings(optimization)
    };
  }

  optimizeAdSpend(ads, results) {
    return ads.map(ad => ({
      name: ad.name,
      currentSpend: ad.spend,
      optimalSpend: this.calculateOptimal(ad, results[ad.id]),
      recommendation: results[ad.id] > 0.2 ? 'increase' : 'decrease',
      cpa: results[ad.id] || 0
    }));
  }

  calculateOptimal(ad, roi) {
    const base = ad.spend || 1000;
    return roi > 0.2 ? base * 1.3 : base * 0.7;
  }

  calculateSavings(optimization) {
    const current = optimization.reduce((sum, a) => sum + a.currentSpend, 0);
    const optimal = optimization.reduce((sum, a) => sum + a.optimalSpend, 0);
    return { current, optimal, savings: current - optimal };
  }

  generateRecommendations(optimization) {
    return optimization.map(a => ({
      ad: a.name,
      action: a.recommendation,
      amount: a.optimalSpend
    }));
  }
}

module.exports = AdSpendOptimizerSkill;