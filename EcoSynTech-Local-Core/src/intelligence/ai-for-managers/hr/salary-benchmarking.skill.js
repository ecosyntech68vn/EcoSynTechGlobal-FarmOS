class SalaryBenchmarkingSkill {
  static name = 'salary-benchmarking';
  static description = 'So sánh lương thị trường nội bộ và ngoại vi';

  constructor() {
    this.marketDataSources = ['internal', 'survey', 'external'];
  }

  async execute(context) {
    const { position = '', location = '', experience = 0, skills = [] } = context;

    const marketData = await this.fetchMarketData(position, location);
    const internalData = this.getInternalData(position);
    const comparison = this.compareData(marketData, internalData);
    const recommendation = this.generateRecommendation(comparison, experience);
    
    return {
      position,
      location,
      marketSalary: marketData,
      internalSalary: internalData,
      comparison,
      recommendation,
      charts: this.generateCharts(comparison)
    };
  }

  async fetchMarketData(position, location) {
    const mockMarketData = {
      'software engineer': { min: 50000000, median: 80000000, max: 150000000 },
      'designer': { min: 40000000, median: 60000000, max: 100000000 },
      'sales manager': { min: 45000000, median: 70000000, max: 120000000 },
      'marketing': { min: 40000000, median: 60000000, max: 100000000 },
      'HR': { min: 35000000, median: 50000000, max: 80000000 }
    };

    const positionKey = position.toLowerCase();
    const data = mockMarketData[positionKey] || { min: 30000000, median: 50000000, max: 80000000 };

    const locationMultiplier = {
      'hcm': 1.1, 'hanoi': 1.05, 'dn': 1.0, 'default': 1.0
    };
    const multiplier = locationMultiplier[location?.toLowerCase().substring(0, 2)] || 1;

    return {
      min: Math.round(data.min * multiplier),
      median: Math.round(data.median * multiplier),
      max: Math.round(data.max * multiplier),
      currency: 'VND',
      source: 'Market Survey 2024',
      percentile25: Math.round(data.median * 0.85),
      percentile75: Math.round(data.median * 1.2)
    };
  }

  getInternalData(position) {
    return {
      min: 45000000,
      median: 65000000,
      max: 100000000,
      currency: 'VND',
      source: 'Internal Data',
      headcount: 25,
      avgExperience: 3
    };
  }

  compareData(marketData, internalData) {
    const gap = internalData.median - marketData.median;
    const gapPercent = (gap / marketData.median * 100);
    
    return {
      internalVsMarket: gapPercent.toFixed(1) + '%',
      gap,
      position: gapPercent > 10 ? 'Above Market' : gapPercent < -10 ? 'Below Market' : 'At Market',
      competitiveness: Math.abs(gapPercent) < 10 ? 'Tốt' : 'Cần điều chỉnh',
      detailed: {
        min: { diff: internalData.min - marketData.min, percent: ((internalData.min - marketData.min) / marketData.min * 100).toFixed(1) + '%' },
        median: { diff: internalData.median - marketData.median, percent: gapPercent.toFixed(1) + '%' },
        max: { diff: internalData.max - marketData.max, percent: ((internalData.max - marketData.max) / marketData.max * 100).toFixed(1) + '%' }
      }
    };
  }

  generateRecommendation(comparison, experience) {
    const recommendations = [];
    
    if (parseFloat(comparison.internalVsMarket) < -15) {
      recommendations.push({
        type: 'increase',
        priority: 'high',
        reason: 'Lương thấp hơn thị trường 15%+',
        suggestedIncrease: '15-20%'
      });
    } else if (parseFloat(comparison.internalVsMarket) < -5) {
      recommendations.push({
        type: 'adjust',
        priority: 'medium',
        reason: 'Lương hơi thấp hơn thị trường',
        suggestedIncrease: '5-10%'
      });
    } else {
      recommendations.push({
        type: 'maintain',
        priority: 'low',
        reason: 'Lương cạnh tranh',
        suggestedIncrease: '0%'
      });
    }

    if (experience > 5) {
      recommendations.push({
        type: 'senior',
        priority: 'medium',
        reason: 'Nhân sự senior',
        suggestedBonus: '20-30%'
      });
    }

    return recommendations;
  }

  generateCharts(comparison) {
    return {
      chart1: {
        type: 'bar',
        title: 'Internal vs Market Salary',
        data: [comparison.detailed.min, comparison.detailed.median, comparison.detailed.max]
      },
      chart2: {
        type: 'boxplot',
        title: 'Salary Range Distribution',
        ranges: [0, 25, 50, 75, 100]
      }
    };
  }
}

module.exports = SalaryBenchmarkingSkill;