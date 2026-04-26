class BusinessScenarioSimulatorSkill {
  static name = 'business-scenario-simulator-ai';
  static description = 'Mô phỏng kịch bản kinh doanh đa chiều';

  constructor() {
    this.scenarios = ['base', 'optimistic', 'pessimistic', 'best-case', 'worst-case'];
  }

  async execute(context) {
    const {
      businessModel = {},
      variables = {},
      marketConditions = {},
      financialProjections = {}
    } = context;

    const scenarios = this.generateAllScenarios(businessModel, variables, marketConditions);
    const sensitivity = this.analyzeSensitivity(businessModel, variables);
    const monteCarlo = this.runMonteCarlo(businessModel, variables);
    const decisionTree = this.buildDecisionTree(businessModel);
    const recommendations = this.analyzeAndRecommend(scenarios, sensitivity);

    return {
      scenarios,
      sensitivity,
      monteCarlo,
      decisionTree,
      probabilityWeighted: this.calculateProbabilityWeighted(scenarios),
      recommendations,
      optimalStrategy: this.determineOptimalStrategy(scenarios)
    };
  }

  generateAllScenarios(model, variables, market) {
    return [
      {
        name: 'Base Case',
        probability: 0.5,
        revenue: model.revenue || 100000000,
        cost: model.cost || 70000000,
        profit: (model.revenue - model.cost) || 30000000,
        assumptions: this.getBaseAssumptions(variables, market),
        keyDrivers: {
          growth: variables.growthRate || 0.1,
          marketShare: variables.marketShare || 0.15,
          margin: variables.margin || 0.3
        }
      },
      {
        name: 'Optimistic',
        probability: 0.25,
        revenue: (model.revenue || 100000000) * 1.3,
        cost: (model.cost || 70000000) * 1.1,
        profit: ((model.revenue || 100000000) * 1.3 - (model.cost || 70000000) * 1.1),
        assumptions: this.getOptimisticAssumptions(variables, market),
        keyDrivers: {
          growth: (variables.growthRate || 0.1) * 1.5,
          marketShare: (variables.marketShare || 0.15) * 1.3,
          margin: variables.margin || 0.35
        }
      },
      {
        name: 'Pessimistic',
        probability: 0.25,
        revenue: (model.revenue || 100000000) * 0.7,
        cost: (model.cost || 70000000) * 0.95,
        profit: ((model.revenue || 100000000) * 0.7 - (model.cost || 70000000) * 0.95),
        assumptions: this.getPessimisticAssumptions(variables, market),
        keyDrivers: {
          growth: (variables.growthRate || 0.1) * 0.3,
          marketShare: (variables.marketShare || 0.15) * 0.7,
          margin: variables.margin || 0.25
        }
      }
    ];
  }

  getBaseAssumptions(variables, market) {
    return [
      'Tăng trưởng thị trường ổn định',
      'Giữ thị phần hiện tại',
      'Chi phí vận hành ổn định',
      `Giá nguyên liệu: ${market.rawMaterial || 'ổn định'}`
    ];
  }

  getOptimisticAssumptions(variables, market) {
    return [
      'Tăng trưởng vượt trội',
      'Mở rộng thị phần',
      'Tối ưu chi phí',
      'Giá nguyên liệu thuận lợi'
    ];
  }

  getPessimisticAssumptions(variables, market) {
    return [
      'Thị trường suy giảm',
      'Áp lực cạnh tranh tăng',
      'Chi phí tăng cao',
      'Khách hàng giảm'
    ];
  }

  analyzeSensitivity(model, variables) {
    const keyVars = Object.keys(variables);
    const baseProfit = model.revenue - model.cost;
    const results = [];

    keyVars.forEach(varName => {
      const change = 0.1;
      const original = variables[varName];
      const plusValue = original * (1 + change);
      const minusValue = original * (1 - change);
      
      const plusProfit = baseProfit * (1 + change * 0.5);
      const minusProfit = baseProfit * (1 - change * 0.5);
      
      const sensitivity = Math.abs(plusProfit - minusProfit) / baseProfit / (change * 2);
      
      results.push({
        variable: varName,
        baseValue: original,
        sensitivity: (sensitivity * 100).toFixed(0) + '%',
        impact: sensitivity > 0.5 ? 'cao' : sensitivity > 0.2 ? 'trung bình' : 'thấp',
        range: `${minusValue.toFixed(2)} - ${plusValue.toFixed(2)}`,
        recommendation: sensitivity > 0.5 ? 'Quản lý chặt chẽ' : 'Theo dõi định kỳ'
      });
    });

    return results.sort((a, b) => parseInt(b.sensitivity) - parseInt(a.sensitivity));
  }

  runMonteCarlo(model, variables) {
    const iterations = 1000;
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const revenueVariance = (Math.random() - 0.5) * 0.4;
      const costVariance = (Math.random() - 0.5) * 0.2;
      const revenue = (model.revenue || 100000000) * (1 + revenueVariance);
      const cost = (model.cost || 70000000) * (1 + costVariance);
      results.push(revenue - cost);
    }
    
    results.sort((a, b) => a - b);
    
    return {
      mean: results.reduce((a, b) => a + b, 0) / iterations,
      median: results[Math.floor(iterations / 2)],
      p10: results[Math.floor(iterations * 0.1)],
      p25: results[Math.floor(iterations * 0.25)],
      p75: results[Math.floor(iterations * 0.75)],
      p90: results[Math.floor(iterations * 0.9)],
      probabilityPositive: results.filter(r => r > 0).length / iterations * 100
    };
  }

  buildDecisionTree(model) {
    return {
      root: {
        decision: 'Mở rộng / Thu hẹp',
        options: [
          {
            path: 'Mở rộng',
            expectedValue: model.revenue || 100000000,
            probability: 0.6,
            outcomes: [
              { scenario: 'Thành công', value: (model.revenue || 100000000) * 1.5, prob: 0.7 },
              { scenario: 'Thất bại', value: (model.revenue || 100000000) * 0.5, prob: 0.3 }
            ]
          },
          {
            path: 'Thu hẹp',
            expectedValue: (model.revenue || 100000000) * 0.8,
            probability: 0.4,
            outcomes: [
              { scenario: 'Ổn định', value: (model.revenue || 100000000) * 0.8, prob: 0.9 },
              { scenario: 'Rủi ro', value: (model.revenue || 100000000) * 0.6, prob: 0.1 }
            ]
          }
        ]
      }
    };
  }

  calculateProbabilityWeighted(scenarios) {
    let total = 0;
    scenarios.forEach(s => {
      total += s.profit * s.probability;
    });
    return total;
  }

  analyzeAndRecommend(scenarios, sensitivity) {
    const weighted = this.calculateProbabilityWeighted(scenarios);
    const base = scenarios[0].profit;
    const topRisk = sensitivity[0];
    
    return {
      weightedProfit: weighted,
      riskAdjusted: weighted > base ? 'Khuyến khích' : 'Cần thận trọng',
      keyRisk: topRisk?.variable || 'N/A',
      mitigation: topRisk?.recommendation || 'N/A'
    };
  }

  determineOptimalStrategy(scenarios) {
    const weighted = this.calculateProbabilityWeighted(scenarios);
    const base = scenarios[0].profit;
    const improvement = ((weighted - base) / base * 100);
    
    return {
      recommendation: weighted >= base ? 'Tiếp tục chiến lược hiện tại' : 'Điều chỉnh chiến lược',
      expectedImprovement: improvement.toFixed(0) + '%',
      confidence: weighted > 0 ? 'cao' : 'thấp',
      nextReview: 'Trong 3 tháng'
    };
  }
}

module.exports = BusinessScenarioSimulatorSkill;