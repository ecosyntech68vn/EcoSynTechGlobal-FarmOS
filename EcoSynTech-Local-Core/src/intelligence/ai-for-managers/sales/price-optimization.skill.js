class PriceOptimizationSkill {
  static name = 'price-optimization-ai';
  static description = 'Tối giá bán theo thị trường & nhu cầu với AI';

  async execute(context) {
    const { products = [], demand = {}, competitors = {} } = context;

    const priceAnalysis = this.analyzePricing(products, demand, competitors);
    const elasticities = this.calculateElasticities(products, demand);
    const optimalPrices = this.determineOptimalPrices(products, demand, elasticities);
    const scenarios = this.simulatePriceScenarios(products, optimalPrices);
    const recommendations = this.generateRecommendations(optimalPrices, scenarios);

    return {
      priceAnalysis,
      elasticities,
      optimalPrices,
      scenarios,
      actionPlan: this.createActionPlan(optimalPrices, scenarios),
      projectedRevenue: this.calculateProjectedRevenue(scenarios)
    };
  }

  analyzePricing(products, demand, competitors) {
    return products.map(p => {
      const compPrices = competitors[p.category] || [];
      const avgCompPrice = compPrices.length > 0 ? 
        compPrices.reduce((a, b) => a + b, 0) / compPrices.length : p.price;
      const myPrice = p.price;
      const gap = ((myPrice - avgCompPrice) / avgCompPrice * 100);
      
      return {
        product: p.name,
        myPrice,
        compAvg: avgCompPrice,
        compRange: compPrices.length > 0 ? 
          `${Math.min(...compPrices)} - ${Math.max(...compPrices)}` : 'N/A',
        gap: gap.toFixed(1) + '%',
        position: gap > 10 ? 'cao cấp' : gap < -10 ? 'giá rẻ' : 'trung cấp',
        demand: demand[p.id] || 'stable'
      };
    });
  }

  calculateElasticities(products, demand) {
    return products.map(p => {
      let elasticity = 1.5;
      if (p.category === 'commodity') elasticity = 2.5;
      if (p.category === 'luxury') elasticity = 0.5;
      if (p.hasUniqueFeatures) elasticity -= 0.5;
      return {
        product: p.name,
        elasticity: elasticity.toFixed(1),
        interpretation: elasticity > 2 ? 'nhạy cảm giá' : 
                      elasticity > 1 ? 'bình thường' : 'không nhạy cảm',
        strategy: elasticity > 1.5 ? 'cạnh tranh' : 'giá trị'
      };
    });
  }

  determineOptimalPrices(products, demand, elasticities) {
    return products.map((p, i) => {
      const elasticity = parseFloat(elasticities[i].elasticity);
      const currentPrice = p.price;
      const currentVolume = demand[p.id] || 100;
      const marginalCost = p.cost || currentPrice * 0.6;
      
      const optimalMarkup = 1 / (elasticity - 1);
      const optimalPrice = marginalCost * (1 + optimalMarkup);
      
      const volumeChange = Math.pow(optimalPrice / currentPrice, -elasticity);
      const newVolume = currentVolume * volumeChange;
      const profitChange = (optimalPrice - marginalCost) * newVolume - 
                         (currentPrice - marginalCost) * currentVolume;
      
      return {
        product: p.name,
        currentPrice,
        optimalPrice: Math.round(optimalPrice),
        change: ((optimalPrice / currentPrice - 1) * 100).toFixed(1) + '%',
        recommendation: optimalPrice > currentPrice ? 'Tăng giá' : 'Giảm giá',
        expectedVolume: Math.round(newVolume),
        profitImpact: profitChange > 0 ? '+' + Math.round(profitChange) : Math.round(profitChange),
        confidence: Math.abs(optimalMarkup) < 1 ? 'cao' : 'trung bình'
      };
    });
  }

  simulatePriceScenarios(products, optimalPrices) {
    return [
      {
        name: 'Giảm 10%',
        revenue: products.reduce((sum, p, i) => 
          sum + p.price * 0.9 * (demand[p.id] || 100) * 1.3, 0),
        profit: products.reduce((sum, p, i) => 
          sum + (p.price * 0.9 - p.cost) * (demand[p.id] || 100) * 1.3, 0),
        risk: 'medium'
      },
      {
        name: 'Hiện tại',
        revenue: products.reduce((sum, p) => 
          sum + p.price * (demand[p.id] || 100), 0),
        profit: products.reduce((sum, p) => 
          sum + (p.price - p.cost) * (demand[p.id] || 100), 0),
        risk: 'low'
      },
      {
        name: 'Tăng 5%',
        revenue: products.reduce((sum, p, i) => 
          sum + p.price * 1.05 * (demand[p.id] || 100) * 0.9, 0),
        profit: products.reduce((sum, p, i) => 
          sum + (p.price * 1.05 - p.cost) * (demand[p.id] || 100) * 0.9, 0),
        risk: 'medium'
      },
      {
        name: 'Tối ưu AI',
        revenue: products.reduce((sum, p, i) => 
          sum + optimalPrices[i].optimalPrice * optimalPrices[i].expectedVolume, 0),
        profit: products.reduce((sum, p, i) => 
          sum + (optimalPrices[i].optimalPrice - p.cost) * optimalPrices[i].expectedVolume, 0),
        risk: 'low'
      }
    ].sort((a, b) => b.profit - a.profit);
  }

  generateRecommendations(optimalPrices, scenarios) {
    const best = scenarios[0];
    const recs = optimalPrices.map(p => ({
      product: p.product,
      action: p.recommendation,
      newPrice: p.optimalPrice,
      reason: p.profitImpact > 0 ? 'Tăng lợi nhuận' : 'Giảm lợi nhuận',
      priority: Math.abs(parseFloat(p.change)) > 10 ? 'high' : 'medium'
    }));
    recs.push({ 
      overall: `Chiến lược tốt nhất: ${best.name}`,
      expectedGain: best.profit > scenarios[1].profit ? 
        '+' + Math.round(best.profit - scenarios[1].profit) : 0
    });
    return recs;
  }

  createActionPlan(optimalPrices, scenarios) {
    const best = scenarios[0];
    return {
      immediate: optimalPrices.filter(p => p.change !== '0.0%').slice(0, 3).map(p => ({
        product: p.product,
        action: p.recommendation,
        price: p.optimalPrice
      })),
      testPhase: 'A/B test với 20% khách hàng',
      timeline: 'Triển khai trong 30 ngày',
      expectedImprovement: best.name === 'Tối ưu AI' ? 
        ((best.profit / scenarios[1].profit - 1) * 100).toFixed(0) + '%' : '0%'
    };
  }

  calculateProjectedRevenue(scenarios) {
    const best = scenarios[0];
    const base = scenarios.find(s => s.name === 'Hiện tại')?.revenue || 1;
    return {
      current: base,
      projected: best.revenue,
      improvement: ((best.revenue / base - 1) * 100).toFixed(0) + '%',
      monthly: best.revenue / 12,
      yearly: best.revenue
    };
  }
}

module.exports = PriceOptimizationSkill;