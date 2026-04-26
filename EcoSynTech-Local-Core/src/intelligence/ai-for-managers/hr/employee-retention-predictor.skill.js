class EmployeeRetentionPredictorSkill {
  static name = 'employee-retention-predictor-ai';
  static description = 'Dự đoán nhân viên nghỉ việc với AI';

  constructor() {
    this.riskSignals = ['low-engagement', 'no-promotion', 'market-pressure', 'burnout'];
  }

  async execute(context) {
    const { employees = [], engagementData = {} } = context;

    const predictions = this.predictRetention(employees, engagementData);
    const riskProfiles = this.createRiskProfiles(predictions);
    const interventionPlans = this.generateIntervention(riskProfiles);
    return {
      predictions,
      riskProfiles,
      interventionPlans,
      recommendations: this.recommendActions(predictions)
    };
  }

  predictRetention(employees, engagementData) {
    return employees.map(emp => {
      const signals = this.analyzeSignals(emp, engagementData);
      const riskScore = this.calculateRiskScore(signals);
      return {
        employee: emp.name,
        department: emp.department,
        tenure: emp.tenure,
        signals,
        riskScore: Math.round(riskScore * 100),
        riskLevel: riskScore > 0.7 ? 'cao' : riskScore > 0.4 ? 'trung bình' : 'thấp'
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }

  analyzeSignals(emp, engagementData) {
    const signals = [];
    const data = engagementData[emp.id] || {};
    
    if (data.engagementScore < 50) signals.push({ type: 'engagement', score: 0.8, detail: 'Engagement thấp' });
    if (data.promotionWait > 24) signals.push({ type: 'promotion', score: 0.7, detail: '2 năm chưa thăng tiến' });
    if (data.salaryBelowMarket) signals.push({ type: 'salary', score: 0.8, detail: 'Lương dưới thị trường' });
    if (data.remoteWork && !data.teamConnection) signals.push({ type: 'isolation', score: 0.6, detail: 'Làm việc từ xa cô đơn' });
    if (data.competitorVisit) signals.push({ type: 'market', score: 0.7, detail: 'Truy cập đối thủ' });

    return signals;
  }

  calculateRiskScore(signals) {
    if (signals.length === 0) return 0.1;
    const weightedSum = signals.reduce((sum, s) => sum + s.score, 0);
    return Math.min(0.95, weightedSum / signals.length * 1.2);
  }

  createRiskProfiles(predictions) {
    const high = predictions.filter(p => p.riskLevel === 'cao');
    const medium = predictions.filter(p => p.riskLevel === 'trung bình');
    const low = predictions.filter(p => p.riskLevel === 'thấp');
    return { high, medium, low, totalAtRisk: high.length + medium.length };
  }

  generateIntervention(riskProfiles) {
    return [
      { level: 'cao', actions: ['Tăng lương', 'Thăng chức', '1-on-1 hàng tuần'], timeline: '7 ngày' },
      { level: 'trung bình', actions: ['Mentor program', 'Training', 'Team building'], timeline: '30 ngày' }
    ];
  }

  recommendActions(predictions) {
    return predictions.slice(0, 10).map(p => ({
      employee: p.employee,
      risk: p.riskLevel,
      action: p.riskLevel === 'cao' ? 'Liên hệ ngay' : 'Follow-up'
    }));
  }
}

module.exports = EmployeeRetentionPredictorSkill;