class AttritionRiskDetectorSkill {
  static name = 'attrition-risk-detector-ai';
  static description = 'Phát hiện rủi ro nghỉ việc với AI';

  async execute(context) {
    const { employees = [], signals = {} } = context;

    const risks = this.detectRisks(employees, signals);
    const alerts = this.generateAlerts(risks);
    const prevention = this.createPreventionPlan(risks);
    return {
      risks,
      alerts,
      prevention,
      recommendations: this.recommendActions(risks)
    };
  }

  detectRisks(employees, signals) {
    return employees.map(emp => {
      const empSignals = signals[emp.id] || [];
      const risk = this.calculateRisk(empSignals);
      return {
        employee: emp.name,
        department: emp.department,
        riskLevel: risk > 0.7 ? 'cao' : risk > 0.4 ? 'trung bình' : 'thấp',
        risk,
        triggers: empSignals
      };
    }).filter(r => r.risk > 0.4);
  }

  calculateRisk(signals) {
    return signals.length > 2 ? Math.min(0.9, signals.length * 0.25) : 0.2;
  }

  generateAlerts(risks) {
    return risks.map(r => ({
      alert: r.riskLevel === 'cao' ? 'URGENT' : 'Warning',
      employee: r.employee,
      department: r.department
    }));
  }

  createPreventionPlan(risks) {
    return risks.map(r => ({
      employee: r.employee,
      actions: ['1-on-1 meeting', 'Retention bonus', 'Project mới']
    }));
  }

  recommendActions(risks) {
    return risks.map(r => ({
      employee: r.employee,
      action: r.riskLevel === 'cao' ? 'Hành động ngay' : 'Theo dõi'
    }));
  }
}

module.exports = AttritionRiskDetectorSkill;