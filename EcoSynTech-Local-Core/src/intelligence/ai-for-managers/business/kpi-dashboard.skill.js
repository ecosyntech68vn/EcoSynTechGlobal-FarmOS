class KpiDashboardSkill {
  static name = 'kpi-dashboard-ai';
  static description = 'Theo dõi & báo cáo KPI tự động real-time';

  constructor() {
    this.kpis = new Map();
    this.history = [];
  }

  async execute(context) {
    const { metrics, targets, period = 'month' } = context;
    
    const results = {
      actual: {},
      target: {},
      achievement: {},
      trend: {},
      alerts: []
    };

    for (const [key, data] of Object.entries(metrics)) {
      const actual = data.actual;
      const target = targets[key];
      results.actual[key] = actual;
      results.target[key] = target;
      
      const achievement = (actual / target) * 100;
      results.achievement[key] = {
        value: achievement.toFixed(1) + '%',
        status: achievement >= 100 ? 'đạt' : achievement >= 80 ? 'cần cải thiện' : 'chưa đạt'
      };
      
      const trend = this.calculateTrend(key, data.values);
      results.trend[key] = trend;
      
      if (achievement < 80) {
        results.alerts.push({
          metric: key,
          level: achievement < 50 ? 'critical' : 'warning',
          message: `${key} chỉ đạt ${achievement.toFixed(1)}% - cần hành động ngay`
        });
      }
    }

    results.summary = this.generateSummary(results);
    results.recommendations = this.generateRecommendations(results);
    
    return results;
  }

  calculateTrend(key, values) {
    if (values.length < 2) return 'stable';
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const older = values.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const change = ((recent - older) / older) * 100;
    return change > 5 ? 'tăng' : change < -5 ? 'giảm' : 'stable';
  }

  generateSummary(results) {
    const total = Object.keys(results.achievement).length;
    const achieved = Object.values(results.achievement).filter(a => a.status === 'đạt').length;
    return {
      totalKpis: total,
      achieved,
      rate: ((achieved / total) * 100).toFixed(1) + '%',
      period
    };
  }

  generateRecommendations(results) {
    const recs = [];
    Object.entries(results.achievement).forEach(([key, data]) => {
      if (data.status === 'chưa đạt') {
        recs.push({ metric: key, action: `Kiểm tra quy trình ${key}`, priority: 'high' });
      } else if (data.status === 'cần cải thiện') {
        recs.push({ metric: key, action: `Tối ưu hóa ${key}`, priority: 'medium' });
      }
    });
    return recs;
  }
}

module.exports = KpiDashboardSkill;