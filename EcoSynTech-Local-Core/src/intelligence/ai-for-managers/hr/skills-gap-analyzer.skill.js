class SkillsGapAnalyzerSkill {
  static name = 'skills-gap-analyzer-ai';
  static description = 'Phân tích khoảng trống kỹ năng với AI';

  async execute(context) {
    const { employees = [], targetSkills = {} } = context;

    const gaps = this.analyzeGaps(employees, targetSkills);
    const priorities = this.prioritizeGaps(gaps);
    const developmentPlan = this.createDevelopmentPlan(priorities);
    return {
      gaps,
      priorities,
      developmentPlan,
      recommendations: this.recommendActions(priorities)
    };
  }

  analyzeGaps(employees, targetSkills) {
    const allGaps = [];
    employees.forEach(emp => {
      const current = emp.skills || [];
      const target = targetSkills[emp.role] || [];
      const missing = target.filter(s => !current.includes(s));
      if (missing.length > 0) {
        allGaps.push({
          employee: emp.name,
          role: emp.role,
          current,
          missing,
          gapCount: missing.length
        });
      }
    });
    return allGaps;
  }

  prioritizeGaps(gaps) {
    return gaps.sort((a, b) => b.gapCount - a.gapCount).slice(0, 10);
  }

  createDevelopmentPlan(priorities) {
    return priorities.map(p => ({
      employee: p.employee,
      skills: p.missing,
      plan: 'Training 2 giờ/tuần',
      timeline: '3 tháng'
    }));
  }

  recommendActions(priorities) {
    return priorities.slice(0, 5).map(p => ({
      employee: p.employee,
      action: `Đào tạo ${p.missing.join(', ')}`
    }));
  }
}

module.exports = SkillsGapAnalyzerSkill;