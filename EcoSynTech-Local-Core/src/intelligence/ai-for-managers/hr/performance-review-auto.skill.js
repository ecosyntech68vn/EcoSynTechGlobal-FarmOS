class PerformanceReviewAutoSkill {
  static name = 'performance-review-auto-ai';
  static description = 'Đánh giá hiệu suất tự động với AI';

  constructor() {
    this.reviewPeriods = ['quarterly', 'half-yearly', 'yearly'];
  }

  async execute(context) {
    const { employees = [], kpis = {}, reviewPeriod = 'quarterly' } = context;

    const reviews = this.generateReviews(employees, kpis);
    const rankings = this.rankEmployees(reviews);
    const insights = this.getInsights(rankings);
    return {
      reviews,
      rankings,
      insights,
      recommendations: this.suggestActions(rankings)
    };
  }

  generateReviews(employees, kpis) {
    return employees.map(emp => {
      const kpi = kpis[emp.id] || {};
      const scores = this.calculateScores(emp, kpi);
      const rating = this.getPerformanceRating(scores);
      return {
        employee: emp.name,
        department: emp.department,
        kpis: { ...kpi },
        scores,
        rating,
        strengths: this.identifyStrengths(scores),
        improvements: this.identifyImprovements(scores)
      };
    });
  }

  calculateScores(emp, kpi) {
    return {
      output: kpi.output || 75,
      quality: kpi.quality || 80,
      teamwork: kpi.teamwork || 70,
      initiative: kpi.initiative || 65,
      overall: ((kpi.output || 75) + (kpi.quality || 80) + (kpi.teamwork || 70) + (kpi.initiative || 65)) / 4
    };
  }

  getPerformanceRating(scores) {
    if (scores.overall >= 90) return 'Xuất sắc';
    if (scores.overall >= 75) return 'Tốt';
    if (scores.overall >= 60) return 'Đạt kỳ vọng';
    return 'Cần cải thiện';
  }

  identifyStrengths(scores) {
    const strengths = [];
    if (scores.quality >= 85) strengths.push('Chất lượng cao');
    if (scores.teamwork >= 80) strengths.push('Làm việc nhóm tốt');
    if (scores.initiative >= 80) strengths.push('Chủ động sáng tạo');
    return strengths;
  }

  identifyImprovements(scores) {
    const improvements = [];
    if (scores.output < 70) improvements.push('Cần tăng sản lượng');
    if (scores.initiative < 60) improvements.push('Cần chủ động hơn');
    return improvements;
  }

  rankEmployees(reviews) {
    return reviews.sort((a, b) => b.scores.overall - a.scores.overall);
  }

  getInsights(rankings) {
    const top = rankings.slice(0, 5).map(r => r.employee);
    const bottom = rankings.slice(-5).map(r => r.employee);
    const avgScore = rankings.reduce((sum, r) => sum + r.scores.overall, 0) / rankings.length;
    return { topPerformers: top, needsImprovement: bottom, averageScore: avgScore.toFixed(1) };
  }

  suggestActions(rankings) {
    const actions = [];
    rankings.slice(-5).forEach(r => {
      actions.push({ employee: r.employee, action: 'Kế hoạch phát triển', priority: 'cao' });
    });
    rankings.slice(0, 5).forEach(r => {
      actions.push({ employee: r.employee, action: 'Thăng chức/bonus', priority: 'high' });
    });
    return actions;
  }
}

module.exports = PerformanceReviewAutoSkill;