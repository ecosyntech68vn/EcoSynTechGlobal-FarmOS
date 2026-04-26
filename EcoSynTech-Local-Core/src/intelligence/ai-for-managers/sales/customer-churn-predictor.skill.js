class CustomerChurnPredictorSkill {
  static name = 'customer-churn-predictor-ai';
  static description = 'Dự đoán khách hàng rời bỏ với AI';

  constructor() {
    this.churnSignals = [
      'giảm sử dụng', 'khiếu nại', 'không gia hạn', 'chuyển đổi đối thủ'
    ];
  }

  async execute(context) {
    const { customers = [], history = {} } = context;

    const predictions = this.predictChurn(customers, history);
    const riskProfiles = this.createRiskProfiles(predictions);
    const interventionPlans = this.generateIntervention(riskProfiles);
    const recommendations = this.generateRecommendations(predictions, interventionPlans);

    return {
      predictions,
      riskProfiles,
      interventionPlans,
      recommendations,
      actionableInsights: this.getActionableInsights(predictions, interventionPlans)
    };
  }

  predictChurn(customers, history) {
    return customers.map(cust => {
      const signals = this.analyzeSignals(cust, history);
      const riskScore = this.calculateRiskScore(signals);
      
      return {
        id: cust.id,
        name: cust.name,
        signals,
        riskScore: Math.round(riskScore * 100),
        riskLevel: riskScore > 0.7 ? 'cao' : riskScore > 0.4 ? 'trung bình' : 'thấp',
        predictions: this.predictTiming(signals),
        value: cust.value || 0
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }

  analyzeSignals(customer, history) {
    const signals = [];
    const custHistory = history[customer.id] || {};
    
    if (custHistory.activityDecline > 0.3) {
      signals.push({ type: 'usage', score: 0.8, detail: 'Giảm 30%+ hoạt động' });
    }
    if (custHistory.supportTickets > 3) {
      signals.push({ type: 'complaint', score: 0.7, detail: 'Nhiều khiếu nại' });
    }
    if (custHistory.npsResponses?.includes('không hài lòng')) {
      signals.push({ type: 'nps', score: 0.9, detail: 'NPS tiêu cực' });
    }
    if (!custHistory.renewed && custHistory.contractEnd < 90) {
      signals.push({ type: 'renewal', score: 0.8, detail: 'Sắp hết hợp đồng' });
    }
    if (custHistory.paymentIssues > 0) {
      signals.push({ type: 'payment', score: 0.6, detail: 'Vấn đề thanh toán' });
    }
    if (custHistory.competitorVisits > 2) {
      signals.push({ type: 'competitor', score: 0.7, detail: 'Truy cập đối thủ' });
    }
    
    return signals;
  }

  calculateRiskScore(signals) {
    if (signals.length === 0) return 0.1;
    const weightedSum = signals.reduce((sum, s) => sum + s.score, 0);
    const avgScore = weightedSum / signals.length;
    const multiplier = Math.min(1.5, 1 + (signals.length - 1) * 0.2);
    return Math.min(0.95, avgScore * multiplier);
  }

  predictTiming(signals) {
    const highSignals = signals.filter(s => s.score > 0.7);
    if (highSignals.length >= 2) return { timeline: '30 ngày', confidence: 'cao' };
    if (highSignals.length === 1) return { timeline: '90 ngày', confidence: 'trung bình' };
    return { timeline: '180 ngày', confidence: 'thấp' };
  }

  createRiskProfiles(predictions) {
    const high = predictions.filter(p => p.riskLevel === 'cao');
    const medium = predictions.filter(p => p.riskLevel === 'trung bình');
    const low = predictions.filter(p => p.riskLevel === 'thấp');
    
    return {
      high: { count: high.length, value: high.reduce((sum, p) => sum + p.value, 0) },
      medium: { count: medium.length, value: medium.reduce((sum, p) => sum + p.value, 0) },
      low: { count: low.length, value: low.reduce((sum, p) => sum + p.value, 0) },
      totalAtRisk: high.length + medium.length,
      valueAtRisk: [...high, ...medium].reduce((sum, p) => sum + p.value, 0)
    };
  }

  generateIntervention(riskProfiles) {
    return [
      {
        riskLevel: 'cao',
        actions: [
          'Gặp trực tiếp khách hàng',
          'Cung cấp giải pháp cá nhân hóa',
          'Ưu đãi gia hạn đặc biệt',
          'Escalate lên cấp quản lý'
        ],
        timeline: 'Trong 7 ngày',
        successRate: '60%'
      },
      {
        riskLevel: 'trung bình',
        actions: [
          'Gọi điện check-in',
          'Gửi tài liệu giá trị gia tăng',
          'Mời tham gia sự kiện'
        ],
        timeline: 'Trong 30 ngày',
        successRate: '40%'
      },
      {
        riskLevel: 'thấp',
        actions: [
          'Email newsletter',
          'Tự động nurture'
        ],
        timeline: 'Định kỳ',
        successRate: '20%'
      }
    ];
  }

  generateRecommendations(predictions, interventionPlans) {
    const highRisk = predictions.filter(p => p.riskLevel === 'cao').slice(0, 10);
    const recs = [];
    
    highRisk.forEach(p => {
      recs.push({
        customer: p.name,
        risk: p.riskLevel,
        timeline: p.predictions.timeline,
        action: interventionPlans.find(i => i.riskLevel === p.riskLevel)?.actions[0]
      });
    });
    
    return recs;
  }

  getActionableInsights(predictions, interventionPlans) {
    const highRisk = predictions.filter(p => p.riskLevel === 'cao');
    const totalValue = highRisk.reduce((sum, p) => sum + p.value, 0);
    
    return {
      urgent: highRisk.length,
      valueAtRisk: totalValue,
      recommendation: `Ưu tiên liên hệ ${highRisk.length} khách hàng rủi ro cao`,
      projectedSaving: totalValue * 0.6
    };
  }
}

module.exports = CustomerChurnPredictorSkill;