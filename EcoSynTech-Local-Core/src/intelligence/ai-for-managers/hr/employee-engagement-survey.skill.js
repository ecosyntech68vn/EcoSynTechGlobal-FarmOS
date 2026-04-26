class EmployeeEngagementSurveySkill {
  static name = 'employee-engagement-survey';
  static description = 'Khảo sát mức độ gắn kết nhân viên tự động';

  constructor() {
    this.metrics = [
      'job_satisfaction', 'relationship_manager', 'growth_opportunity',
      'compensation', 'work_life_balance', 'company_culture'
    ];
  }

  async execute(context) {
    const { employees = [], department = '', period = 'quarter' } = context;

    const survey = this.createSurvey();
    const questions = this.generateQuestions(survey);
    const distribution = this.distributeSurvey(questions, employees);
    const analytics = this.analyzeResults(distribution);
    const actionPlan = this.generateActionPlan(analytics);
    
    return {
      survey,
      questions,
      distribution,
      analytics,
      actionPlan,
      benchmarks: this.getBenchmarks(analytics)
    };
  }

  createSurvey() {
    return {
      id: 'EMP-' + Date.now(),
      title: 'Employee Engagement Survey',
      period: 'Q1 2025',
      metrics: this.metrics.map(m => ({ metric: m, weight: 1 })),
      questions: this.metrics.length,
      estimatedTime: '10 phút',
      anonymity: true,
      distribution: 'all'
    };
  }

  generateQuestions(survey) {
    const questionBank = {
      job_satisfaction: [
        { id: 'q1', text: 'Bạn có hài lòng với công việc hiện tại?', type: 'scale', scale: 5 },
        { id: 'q2', text: 'Bạn có thể giới thiệu công việc cho bạn bè?', type: 'nps', category: 'nps' }
      ],
      relationship_manager: [
        { id: 'q3', text: 'Bạn có tin tưởng quản lý?', type: 'scale', scale: 5 },
        { id: 'q4', text: 'Quản lý có hỗ trợ bạn?', type: 'scale', scale: 5 }
      ],
      growth_opportunity: [
        { id: 'q5', text: 'Cơ hội phát triển rõ ràng?', type: 'scale', scale: 5 },
        { id: 'q6', text: 'Bạn có được đào tạo?', type: 'yes_no' }
      ],
      compensation: [
        { id: 'q7', text: 'Lương xứng đáng với công việc?', type: 'scale', scale: 5 },
        { id: 'q8', text: 'Phúc lợi đầy đủ?', type: 'yes_no' }
      ],
      work_life_balance: [
        { id: 'q9', text: 'Cân bằng cuộc sống và công việc?', type: 'scale', scale: 5 },
        { id: 'q10', text: 'Giờ làm việc linh hoạt?', type: 'yes_no' }
      ],
      company_culture: [
        { id: 'q11', text: 'Bạn tự hào là thành viên?', type: 'scale', scale: 5 },
        { id: 'q12', text: 'Văn hóa công ty phù hợp?', type: 'scale', scale: 5 }
      ]
    };

    const allQuestions = [];
    Object.entries(questionBank).forEach(([category, questions]) => {
      questions.forEach(q => {
        allQuestions.push({ ...q, category, metric: category });
      });
    });

    return allQuestions;
  }

  distributeSurvey(questions, employees) {
    return {
      totalRecipients: employees.length,
      questionsCount: questions.length,
      deliveryMethods: ['email', 'slack', 'portal'],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      reminders: [3, 1, 0],
      link: `/survey/${this.createSurvey().id}`
    };
  }

  analyzeResults(distribution) {
    const mockResults = {
      job_satisfaction: { score: 3.8, nps: 45, trend: '+5%' },
      relationship_manager: { score: 4.1, nps: 52, trend: '+3%' },
      growth_opportunity: { score: 3.2, nps: 28, trend: '-2%' },
      compensation: { score: 2.9, nps: 15, trend: '-5%' },
      work_life_balance: { score: 3.5, nps: 38, trend: '+1%' },
      company_culture: { score: 4.2, nps: 58, trend: '+8%' }
    };

    const avgScore = Object.values(mockResults).reduce((sum, r) => sum + r.score, 0) / Object.keys(mockResults).length;
    const avgNPS = Object.values(mockResults).reduce((sum, r) => sum + r.nps, 0) / Object.keys(mockResults).length;

    return {
      results: mockResults,
      summary: {
        avgScore: avgScore.toFixed(1),
        avgNPS: Math.round(avgNPS),
        engagementLevel: avgScore > 3.5 ? 'Cao' : avgScore > 3 ? 'Trung bình' : 'Thấp',
        responseRate: '75%'
      },
      byDepartment: this.getDepartmentBreakdown(mockResults),
      actionAreas: this.identifyActionAreas(mockResults)
    };
  }

  getDepartmentBreakdown(results) {
    return {
      'Engineering': { score: 3.9, status: 'Tốt' },
      'Sales': { score: 3.7, status: 'Khá' },
      'Marketing': { score: 3.5, status: 'Trung bình' },
      'HR': { score: 4.0, status: 'Tốt' }
    };
  }

  identifyActionAreas(results) {
    return Object.entries(results)
      .filter(([key, r]) => r.score < 3.3)
      .map(([key, r]) => ({ area: key, current: r.score, target: 3.5, priority: 'cao' }));
  }

  generateActionPlan(analytics) {
    const actions = [];
    
    if (analytics.actionAreas.length > 0) {
      actions.push({
        area: 'Compensation',
        actions: [
          'Rà soát lương',
          'Cải thiện phúc lợi',
          'Thêm bonus'
        ],
        timeline: '30 ngày',
        owner: 'HR Director'
      });
    }

    if (analytics.summary.engagementLevel !== 'Cao') {
      actions.push({
        area: 'Company Culture',
        actions: [
          'Team building',
          'Recognition program'
        ],
        timeline: '60 ngày',
        owner: 'CEO'
      });
    }

    return actions;
  }

  getBenchmarks(analytics) {
    return {
      industry: {
        avgScore: 3.4,
        avgNPS: 32,
        topPerformer: 4.2
      },
      target: {
        score: 4.0,
        nps: 50,
        responseRate: '80%'
      }
    };
  }
}

module.exports = EmployeeEngagementSurveySkill;