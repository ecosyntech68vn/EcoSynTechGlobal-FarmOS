class WorkforcePlanningSkill {
  static name = 'workforce-planning-ai';
  static description = 'Lập kế hoạch nhân sự với AI';

  async execute(context) {
    const { currentStaff = {}, projections = {}, businessGoals = {} } = context;

    const analysis = this.analyzeCurrentStaff(currentStaff);
    const forecasts = this.forecastNeeds(projections, businessGoals);
    const plan = this.createHiringPlan(forecasts);
    return {
      analysis,
      forecasts,
      plan,
      recommendations: this.recommendActions(plan)
    };
  }

  analyzeCurrentStaff(currentStaff) {
    const byDepartment = {};
    currentStaff.forEach(emp => {
      byDepartment[emp.department] = (byDepartment[emp.department] || 0) + 1;
    });
    return { total: currentStaff.length, byDepartment };
  }

  forecastNeeds(projections, goals) {
    const growth = goals.growthRate || 0.2;
    return {
      headcount: Math.ceil(currentStaff.length * (1 + growth)),
      newRoles: ['AI Engineer', 'Data Scientist', 'Product Manager'],
      timeline: '12 tháng'
    };
  }

  createHiringPlan(forecasts) {
    return forecasts.newRoles.map(role => ({
      role,
      quantity: 2,
      priority: 'cao',
      timeline: 'Q2'
    }));
  }

  recommendActions(plan) {
    return plan.map(p => ({
      role: p.role,
      action: 'Tuyển dụng',
      priority: p.priority
    }));
  }
}

module.exports = WorkforcePlanningSkill;