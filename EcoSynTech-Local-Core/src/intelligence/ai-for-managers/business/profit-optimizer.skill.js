class ProfitOptimizerSkill {
  static name = 'profit-optimizer-ai';
  static description = 'Tối ưu lợi nhuận theo thời gian thực với AI';

  constructor() {
    this.pricingModels = ['cost-plus', 'value-based', 'competitive', 'dynamic'];
    this.optimizationCycles = 0;
  }

  async execute(context) {
    const {
      products = [],
      costs = {},
      prices = {},
      demand = {},
      competitors = []
    } = context;

    const currentProfit = this.calculateCurrentProfit(products, costs, prices);
    const optimizationOptions = this.generateOptions(products, costs, demand, competitors);
    const priceStrategy = this.determinePriceStrategy(products, demand, competitors);
    const mixOptimization = this.optimizeProductMix(products, costs, demand);
    const scenarios = this.simulateScenarios(mixOptimization, priceStrategy);

    return {
      currentProfit,
      priceStrategy,
      mixOptimization,
      optimizationOptions,
      bestScenario: this.selectBestScenario(scenarios),
      actionPlan: this.generateActionPlan(scenarios),
      projectedGains: this.calculateProjectedGains(scenarios)
    };
  }

  calculateCurrentProfit(products, costs, prices) {
    return products.map(p => {
      const cost = costs[p.id] || 0;
      const price = prices[p.id] || 0;
      const volume = p.volume || 100;
      const profit = (price - cost) * volume;
      const margin = ((price - cost) / price * 100) || 0;
      
      return {
        product: p.name,
        cost,
        price,
        volume,
        profit,
        margin: margin.toFixed(1) + '%'
      };
    });
  }

  generateOptions(products, costs, demand, competitors) {
    const options = [];
    
    options.push({
      name: 'Tăng giá 5%',
      impact: 'increase',
      effect: this.simulatePriceChange(products, costs, demand, 1.05),
      risk: 'thấp'
    });
    
    options.push({
      name: 'Giảm giá 10%',
      impact: 'volume',
      effect: this.simulatePriceChange(products, costs, demand, 0.90),
      risk: 'trung bình'
    });
    
    options.push({
      name: 'Tối ưu chi phí 15%',
      impact: 'cost',
      effect: this.simulateCostReduction(products, costs, demand, 0.85),
      risk: 'trung bình'
    });
    
    options.push({
      name: 'Tăng giá + Tối ưu chi phí',
      impact: 'combined',
      effect: this.simulateCombined(products, costs, demand, 1.03, 0.90),
      risk: 'thấp'
    });

    return options.sort((a, b) => b.effect.totalProfit - a.effect.totalProfit);
  }

  simulatePriceChange(products, costs, demand, priceFactor) {
    let totalProfit = 0;
    let totalRevenue = 0;
    let totalCost = 0;
    
    products.forEach(p => {
      const cost = costs[p.id] || 0;
      const basePrice = p.basePrice || 100;
      const newPrice = basePrice * priceFactor;
      const volumeFactor = priceFactor > 1 ? 0.95 : 1.15;
      const volume = (demand[p.id] || 100) * volumeFactor;
      
      totalRevenue += newPrice * volume;
      totalCost += cost * volume;
      totalProfit += (newPrice - cost) * volume;
    });

    return { totalProfit, totalRevenue, totalCost, strategy: 'pricing' };
  }

  simulateCostReduction(products, costs, demand, costFactor) {
    let totalProfit = 0;
    
    products.forEach(p => {
      const cost = costs[p.id] || 0;
      const price = p.basePrice || 100;
      const volume = demand[p.id] || 100;
      const newCost = cost * costFactor;
      
      totalProfit += (price - newCost) * volume;
    });

    return { totalProfit, strategy: 'cost' };
  }

  simulateCombined(products, costs, demand, priceFactor, costFactor) {
    let totalProfit = 0;
    
    products.forEach(p => {
      const cost = costs[p.id] || 0;
      const price = p.basePrice || 100;
      const volume = demand[p.id] || 100;
      const newPrice = price * priceFactor;
      const newCost = cost * costFactor;
      
      totalProfit += (newPrice - newCost) * volume;
    });

    return { totalProfit, strategy: 'combined' };
  }

  determinePriceStrategy(products, demand, competitors) {
    const avgDemand = Object.values(demand).reduce((a, b) => a + b, 0) / Object.keys(demand).length;
    const priceRange = competitors.map(c => c.price);
    const avgCompetitorPrice = priceRange.reduce((a, b) => a + b, 0) / priceRange.length;
    
    const myPrice = products[0]?.basePrice || 100;
    const priceRatio = myPrice / avgCompetitorPrice;
    
    let recommendedStrategy;
    let reason;
    
    if (priceRatio > 1.2) {
      recommendedStrategy = 'value-based';
      reason = 'Giá cao hơn đối thủ 20%+ - cần chứng minh giá trị';
    } else if (priceRatio < 0.8) {
      recommendedStrategy = 'competitive';
      reason = 'Giá thấp - có thể tăng giá';
    } else {
      recommendedStrategy = 'dynamic';
      reason = 'Giá cạnh tranh - tối ưu theo thời gian thực';
    }

    return {
      recommendedStrategy,
      reason,
      currentGap: ((priceRatio - 1) * 100).toFixed(0) + '%',
      recommendation: recommendedStrategy === 'dynamic' ? 
        'Điều chỉnh giá theo mùa và đối thủ' : 
        `Theo dõi ${recommendedStrategy} pricing`
    };
  }

  optimizeProductMix(products, costs, demand) {
    const capacities = products.map(p => p.capacity || 1000);
    const profits = products.map(p => {
      const cost = costs[p.id] || 0;
      const price = p.basePrice || 100;
      return price - cost;
    });
    
    const optimal = this.linearProgramming(profits, capacities, 5000);
    
    return products.map((p, i) => ({
      product: p.name,
      currentVolume: p.volume || 100,
      optimizedVolume: optimal[i],
      change: optimal[i] - (p.volume || 100),
      priority: profits[i] > profits.reduce((a, b) => Math.max(a, b)) * 0.8 ? 'cao' : 'trung bình'
    }));
  }

  linearProgramming(profits, capacities, maxCapacity) {
    const totalCapacity = capacities.reduce((a, b) => a + b, 0);
    if (totalCapacity <= maxCapacity) return capacities;
    
    const sorted = profits.map((p, i) => ({ profit: p, index: i }))
      .sort((a, b) => b.profit - a.profit);
    
    const result = new Array(profits.length).fill(0);
    let remaining = maxCapacity;
    
    sorted.forEach(({ profit, index }) => {
      result[index] = Math.min(capacities[index], remaining);
      remaining -= result[index];
    });
    
    return result;
  }

  simulateScenarios(mixOptimization, priceStrategy) {
    return [
      {
        name: 'Base Case',
        profit: mixOptimization.reduce((sum, m) => sum + m.currentVolume * 50, 0),
        risk: 'thấp'
      },
      {
        name: 'Optimized',
        profit: mixOptimization.reduce((sum, m) => sum + m.optimizedVolume * 50, 0),
        risk: 'trung bình'
      },
      {
        name: 'Aggressive',
        profit: mixOptimization.reduce((sum, m) => sum + (m.optimizedVolume * 1.2) * 50, 0),
        risk: 'cao'
      }
    ];
  }

  selectBestScenario(scenarios) {
    return scenarios.reduce((best, s) => 
      s.profit > best.profit ? s : best, scenarios[0]);
  }

  generateActionPlan(scenarios) {
    const best = this.selectBestScenario(scenarios);
    return {
      immediate: [
        'Điều chỉnh giá theo chiến lược mới',
        'Tối ưu mix sản phẩm'
      ],
      shortTerm: [
        'Giảm chi phí sản xuất 10%',
        'Tăng sản lượng sản phẩm lợi nhuận cao'
      ],
      longTerm: [
        'Tự động hóa quy trình sản xuất',
        'Đa dạng hóa sản phẩm'
      ],
      expectedImprovement: ((best.profit / scenarios[0].profit - 1) * 100).toFixed(0) + '%'
    };
  }

  calculateProjectedGains(scenarios) {
    const best = this.selectBestScenario(scenarios);
    const base = scenarios[0].profit;
    return {
      monthly: best.profit - base,
      yearly: (best.profit - base) * 12,
      roi: ((best.profit - base) / base * 100).toFixed(0) + '%'
    };
  }
}

module.exports = ProfitOptimizerSkill;