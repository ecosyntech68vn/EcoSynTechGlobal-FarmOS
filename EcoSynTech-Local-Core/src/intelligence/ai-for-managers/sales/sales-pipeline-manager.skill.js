class SalesPipelineManagerSkill {
  static name = 'sales-pipeline-manager';
  static description = 'Quản lý pipeline bán hàng tự động với AI';

  constructor() {
    this.stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
  }

  async execute(context) {
    const { deals = [], targets = {} } = context;

    const pipeline = this.buildPipeline(deals);
    const metrics = this.calculateMetrics(pipeline, targets);
    const forecasts = this.forecastRevenue(pipeline, metrics);
    const bottlenecks = this.identifyBottlenecks(pipeline);
    const recommendations = this.generateRecommendations(pipeline, metrics, bottlenecks);

    return {
      pipeline,
      metrics,
      forecasts,
      bottlenecks,
      recommendations,
      nextActions: this.suggestNextActions(pipeline, metrics)
    };
  }

  buildPipeline(deals) {
    const pipeline = {};
    this.stages.forEach(stage => pipeline[stage] = []);
    
    deals.forEach(deal => {
      const stage = deal.stage || 'lead';
      if (pipeline[stage]) pipeline[stage].push(deal);
    });

    return pipeline;
  }

  calculateMetrics(pipeline, targets) {
    const totalValue = Object.values(pipeline)
      .flat()
      .reduce((sum, d) => sum + (d.value || 0), 0);
    
    const byStage = this.stages.map(stage => {
      const stageDeals = pipeline[stage] || [];
      const value = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
      const count = stageDeals.length;
      
      return {
        stage,
        count,
        value,
        avgDeal: count > 0 ? value / count : 0,
        conversion: this.calculateStageConversion(stage, pipeline)
      };
    });

    const conversionRates = byStage.map((s, i) => {
      if (i === 0) return { from: s.stage, to: byStage[1]?.stage || '-', rate: 0 };
      const prev = byStage[i - 1];
      const rate = prev.count > 0 ? ((s.count / prev.count) * 100) : 0;
      return { from: prev.stage, to: s.stage, rate: rate.toFixed(0) + '%' };
    });

    return {
      totalValue,
      totalDeals: Object.values(pipeline).flat().length,
      byStage,
      conversionRates,
      targetValue: targets.revenue || totalValue,
      achievement: ((totalValue / (targets.revenue || 1)) * 100).toFixed(0) + '%'
    };
  }

  calculateStageConversion(stage, pipeline) {
    const stageIndex = this.stages.indexOf(stage);
    if (stageIndex === this.stages.length - 1) return 100;
    
    const currentCount = (pipeline[stage] || []).length;
    const nextCount = (pipeline[this.stages[stageIndex + 1]] || []).length;
    
    return currentCount > 0 ? ((nextCount / currentCount) * 100).toFixed(0) + '%' : 'N/A';
  }

  forecastRevenue(pipeline, metrics) {
    const weighted = {};
    const baseForecast = {};
    
    this.stages.slice(0, -2).forEach((stage, i) => {
      const stageDeals = pipeline[stage] || [];
      const avgProb = [15, 30, 50, 70, 85][i] || 0;
      
      weighted[stage] = stageDeals.reduce((sum, d) => sum + (d.value || 0) * avgProb / 100, 0);
      baseForecast[stage] = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    });

    const bestCase = Object.values(weighted).reduce((a, b) => a + b, 0);
    const conservative = bestCase * 0.7;
    const optimistic = bestCase * 1.3;

    return {
      weighted: bestCase,
      conservative,
      optimistic,
      breakdown: {
        weighted,
        baseForecast
      }
    };
  }

  identifyBottlenecks(pipeline) {
    const bottlenecks = [];
    
    this.stages.slice(0, -2).forEach((stage, i) => {
      const stageDeals = pipeline[stage] || [];
      const nextStageDeals = pipeline[this.stages[i + 1]] || [];
      const conversion = stageDeals.length > 0 ? 
        (nextStageDeals.length / stageDeals.length) : 0;
      
      if (conversion < 0.2 && stageDeals.length > 0) {
        bottlenecks.push({
          stage,
          issue: `Chỉ ${(conversion * 100).toFixed(0)}% chuyển đổi`,
          severity: conversion < 0.1 ? 'high' : 'medium',
          recommendation: `Cần cải thiện quy trình chuyển đổi từ ${stage}`
        });
      }
    });

    return bottlenecks;
  }

  generateRecommendations(pipeline, metrics, bottlenecks) {
    const recs = [];
    
    if (parseFloat(metrics.achievement) < 50) {
      recs.push({
        type: 'volume',
        priority: 'high',
        action: 'Cần thêm deal mới vào pipeline',
        amount: metrics.targetValue * 0.5
      });
    }

    bottlenecks.forEach(b => {
      recs.push({
        type: 'conversion',
        priority: b.severity,
        action: b.recommendation,
        stage: b.stage
      });
    });

    const stuckDeals = Object.values(pipeline)
      .flat()
      .filter(d => d.daysInStage > 30);
    
    if (stuckDeals.length > 0) {
      recs.push({
        type: 'stuck',
        priority: 'medium',
        action: `Xử lý ${stuckDeals.length} deal bị kẹt`,
        deals: stuckDeals.map(d => d.name)
      });
    }

    return recs;
  }

  suggestNextActions(pipeline, metrics) {
    const actions = [];
    
    const hotDeals = Object.values(pipeline)
      .flat()
      .filter(d => d.probability > 70)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3);
    
    hotDeals.forEach(d => {
      actions.push({
        deal: d.name,
        value: d.value,
        action: 'Gặp khách hàng ngay',
        priority: 'high'
      });
    });

    const staleDeals = Object.values(pipeline)
      .flat()
      .filter(d => d.daysInStage > 14 && d.probability < 50);
    
    if (staleDeals.length > 0) {
      actions.push({
        count: staleDeals.length,
        action: 'Follow-up các deal cũ',
        priority: 'medium'
      });
    }

    return actions;
  }
}

module.exports = SalesPipelineManagerSkill;