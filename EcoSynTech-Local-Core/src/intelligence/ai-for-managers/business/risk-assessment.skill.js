class RiskAssessmentSkill {
  static name = 'risk-assessment-engine';
  static description = 'Đánh giá rủi ro kinh doanh toàn diện';

  constructor() {
    this.riskCategories = ['financial', 'operational', 'market', 'regulatory', 'reputational'];
    this.riskMatrix = this.initializeRiskMatrix();
  }

  initializeRiskMatrix() {
    return {
      financial: { likelihood: 0.3, impact: 0.8, mitigation: [] },
      operational: { likelihood: 0.4, impact: 0.6, mitigation: [] },
      market: { likelihood: 0.5, impact: 0.7, mitigation: [] },
      regulatory: { likelihood: 0.2, impact: 0.9, mitigation: [] },
      reputational: { likelihood: 0.1, impact: 0.9, mitigation: [] }
    };
  }

  async execute(context) {
    const {
      businessType = 'general',
      currentRisks = [],
      marketConditions = {},
      financialData = {},
      operationsData = {}
    } = context;

    const identifiedRisks = this.identifyAllRisks(context);
    const riskScores = this.calculateRiskScores(identifiedRisks);
    const prioritized = this.prioritizeRisks(identifiedRisks);
    const mitigationPlans = this.generateMitigationPlans(prioritized);
    const overallScore = this.calculateOverallRiskScore(prioritized);

    return {
      identifiedRisks,
      riskScores,
      prioritized: prioritized.slice(0, 10),
      mitigationPlans,
      overallScore,
      riskAppetite: this.assessRiskAppetite(overallScore),
      recommendations: this.generateRecommendations(prioritized),
      monitoringPlan: this.createMonitoringPlan(prioritized)
    };
  }

  identifyAllRisks(context) {
    const risks = [];

    this.riskCategories.forEach(category => {
      const categoryRisks = this.getCategoryRisks(category, context);
      risks.push(...categoryRisks);
    });

    if (context.currentRisks) {
      risks.push(...context.currentRisks);
    }

    return risks;
  }

  getCategoryRisks(category, context) {
    const riskTemplates = {
      financial: [
        { name: 'Rủi ro tín dụng', description: 'Khách hàng không trả tiền', factor: context.accountsReceivable || 0.1 },
        { name: 'Rủi ro thanh khoản', description: 'Thiếu tiền mặt vận hành', factor: context.currentRatio || 0.2 },
        { name: 'Rủi ro tỷ giá', description: 'Biến động ngoại tệ', factor: context.foreignExposure || 0.1 }
      ],
      operational: [
        { name: 'Rủi ro chuỗi cung ứng', description: 'Nhà cung cấp không giao hàng', factor: context.supplierCount || 0.3 },
        { name: 'Rủi ro vận hành', description: 'Máy móc hỏng hóc', factor: context.equipmentAge || 0.2 },
        { name: 'Rủi ro nhân sự', description: 'Thiếu nhân viên chủ chốt', factor: context.keyPersonRisk || 0.15 }
      ],
      market: [
        { name: 'Rủi ro cạnh tranh', description: 'Đối thủ chiếm thị phần', factor: context.competitorStrength || 0.4 },
        { name: 'Rủi ro giá', description: 'Giá nguyên liệu tăng', factor: context.rawMaterialRisk || 0.3 },
        { name: 'Rủi ro nhu cầu', description: 'Nhu cầu thị trường giảm', factor: context.demandVolatility || 0.2 }
      ],
      regulatory: [
        { name: 'Rủi ro pháp lý', description: 'Vi phạm quy định', factor: context.regulatoryRisk || 0.1 },
        { name: 'Rủi ro thuế', description: 'Sai sót kê khai thuế', factor: context.taxRisk || 0.15 },
        { name: 'Rủi ro môi trường', description: 'Vi phạm môi trường', factor: context.environmentalRisk || 0.05 }
      ],
      reputational: [
        { name: 'Rủi ro thương hiệu', description: '负面新闻 ảnh hưởng', factor: context.mediaRisk || 0.1 },
        { name: 'Rủi ro mạng xã hội', description: 'Phản ứng tiêu cực', factor: context.socialMediaRisk || 0.2 },
        { name: 'Rủi ro chất lượng', description: 'Sản phẩm kém chất lượng', factor: context.qualityRisk || 0.15 }
      ]
    };

    return (riskTemplates[category] || []).map(r => ({
      category,
      name: r.name,
      description: r.description,
      likelihood: Math.min(r.factor * 2, 1),
      impact: this.riskMatrix[category]?.impact || 0.5,
      riskScore: (r.factor * 2) * (this.riskMatrix[category]?.impact || 0.5)
    }));
  }

  calculateRiskScores(risks) {
    return risks.map(r => ({
      name: r.name,
      category: r.category,
      likelihood: (r.likelihood * 100).toFixed(0) + '%',
      impact: (r.impact * 100).toFixed(0) + '%',
      score: (r.riskScore * 100).toFixed(0),
      level: r.riskScore > 0.6 ? 'cao' : r.riskScore > 0.3 ? 'trung bình' : 'thấp'
    }));
  }

  prioritizeRisks(risks) {
    return risks.sort((a, b) => b.riskScore - a.riskScore);
  }

  generateMitigationPlans(risks) {
    return risks.slice(0, 5).map(r => {
      const plans = {
        financial: [
          'Kiểm tra tín dụng khách hàng',
          'Đa dạng nguồn vốn',
          'Mua bảo hiểm tín dụng'
        ],
        operational: [
          'Nhà cung cấp dự phòng',
          'Bảo trì phòng ngừa',
          'Đào tạo nhân viên dự phòng'
        ],
        market: [
          'Đa dạng sản phẩm',
          'Xây dựng thương hiệu',
          'Theo dõi đối thủ'
        ],
        regulatory: [
          'Tuân thủ pháp luật',
          'Tư vấn pháp lý',
          'Hệ thống quản lý nội bộ'
        ],
        reputational: [
          'Quản lý truyền thông',
          'Chính sách chất lượng',
          'Chương trình CSR'
        ]
      };

      return {
        risk: r.name,
        category: r.category,
        level: r.riskScore > 0.6 ? 'cao' : 'trung bình',
        actions: plans[r.category] || []
      };
    });
  }

  calculateOverallRiskScore(risks) {
    if (risks.length === 0) return 0;
    const weightedSum = risks.reduce((sum, r) => sum + r.riskScore * r.impact, 0);
    const maxPossible = risks.reduce((sum, r) => sum + r.impact, 0);
    return weightedSum / maxPossible;
  }

  assessRiskAppetite(score) {
    if (score < 0.2) return { level: 'thấp', action: 'Có thể mở rộng rủi ro' };
    if (score < 0.4) return { level: 'trung bình', action: 'Duy trì hiện tại' };
    if (score < 0.6) return { level: 'cao', action: 'Cần giảm rủi ro' };
    return { level: 'nghiêm trọng', action: 'Hành động ngay lập tức' };
  }

  generateRecommendations(prioritized) {
    const recommendations = [];
    const highRisks = prioritized.filter(r => r.riskScore > 0.5);
    
    highRisks.forEach(r => {
      recommendations.push({
        risk: r.name,
        priority: 'cao',
        timeline: 'Trong vòng 30 ngày',
        owner: `${r.category} Manager`
      });
    });
    
    return recommendations;
  }

  createMonitoringPlan(risks) {
    return {
      frequency: 'hàng tuần',
      metrics: risks.slice(0, 5).map(r => ({
        metric: r.name,
        threshold: r.riskScore > 0.5 ? 0.3 : 0.6,
        alertLevel: r.riskScore > 0.5 ? 'immediate' : 'scheduled'
      })),
      reporting: {
        to: 'Board',
        frequency: 'hàng tháng'
      }
    };
  }
}

module.exports = RiskAssessmentSkill;