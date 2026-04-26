class StrategicPlannerSkill {
  static name = 'strategic-planner-ai';
  static description = 'Phân tích SWOT & đề xuất chiến lược kinh doanh';

  async execute(context) {
    const { industry, competitors, resources, marketTrends } = context;
    
    const swot = {
      strengths: this.analyzeStrengths(resources),
      weaknesses: this.analyzeWeaknesses(resources),
      opportunities: this.analyzeOpportunities(marketTrends),
      threats: this.analyzeThreats(competitors)
    };
    
    const strategies = this.generateStrategies(swot);
    const prioritized = strategies.sort((a, b) => b.impact - a.impact);
    
    return {
      swot,
      recommendedStrategies: prioritized.slice(0, 5),
      riskAssessment: this.assessRisk(prioritized),
      timeline: this.generateTimeline(prioritized)
    };
  }

  analyzeStrengths(resources) {
    return resources.map(r => ({
      factor: r.name,
      score: r.capability * r.efficiency,
      insight: `${r.name} đạt ${(r.capability * r.efficiency * 100).toFixed(0)}% hiệu suất`
    }));
  }

  analyzeWeaknesses(resources) {
    return resources.filter(r => r.efficiency < 0.7).map(r => ({
      factor: r.name,
      gap: (1 - r.efficiency) * 100,
      recommendation: `Cần cải thiện ${r.name} thêm ${((1 - r.efficiency) * 100).toFixed(0)}%`
    }));
  }

  analyzeOpportunities(trends) {
    return trends.filter(t => t.growth > 0.2).map(t => ({
      opportunity: t.name,
      growth: (t.growth * 100).toFixed(1) + '%',
      timing: t.timing
    }));
  }

  analyzeThreats(competitors) {
    return competitors.map(c => ({
      threat: c.name,
      severity: c.marketShare * 100,
      action: c.threatLevel
    }));
  }

  generateStrategies(swot) {
    const strategies = [];
    swot.strengths.forEach(s => {
      swot.opportunities.forEach(o => {
        strategies.push({
          name: `Khai thác ${s.factor} → ${o.opportunity}`,
          impact: s.score * o.growth,
          type: 'offensive'
        });
      });
    });
    swot.weaknesses.forEach(w => {
      strategies.push({
        name: `Khắc phục ${w.factor}`,
        impact: w.gap * 0.5,
        type: 'defensive'
      });
    });
    return strategies;
  }

  assessRisk(strategies) {
    return strategies.map(s => ({
      strategy: s.name,
      riskLevel: s.impact > 0.7 ? 'cao' : s.impact > 0.4 ? 'trung bình' : 'thấp',
      mitigation: s.type === 'offensive' ? 'Đa dạng hóa nguồn lực' : 'Tăng cường đào tạo'
    }));
  }

  generateTimeline(strategies) {
    return strategies.slice(0, 5).map((s, i) => ({
      phase: i + 1,
      strategy: s.name,
      duration: `${(i + 1) * 3} tháng`
    }));
  }
}

module.exports = StrategicPlannerSkill;