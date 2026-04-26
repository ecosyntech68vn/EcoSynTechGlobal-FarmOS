class SalesForecastingSkill {
  static name = 'sales-forecasting-ai';
  static description = 'Dự báo doanh số chính xác với AI';

  constructor() {
    this.forecastPeriods = 12;
  }

  async execute(context) {
    const { deals = [], history = [], targets = {} } = context;

    const forecast = this.calculateForecast(deals, history);
    const scenarios = this.simulateScenarios(forecast);
    const accuracy = this.measureAccuracy(forecast, history);
    const recommendations = this.generateRecommendations(forecast, scenarios);

    return {
      forecast,
      scenarios,
      accuracy,
      recommendations,
      confidence: this.calculateConfidence(forecast, scenarios)
    };
  }

  calculateForecast(deals, history) {
    const pipelineValue = deals.reduce((sum, d) => sum + (d.value || 0) * (d.probability || 0.5), 0);
    const historicalTrend = this.analyzeTrend(history);
    const seasonalFactors = this.calculateSeasonality(history);
    
    const monthlyForecast = [];
    for (let i = 1; i <= this.forecastPeriods; i++) {
      const seasonal = seasonalFactors[(i - 1) % 12] || 1;
      const trend = Math.pow(1 + historicalTrend, i / 12);
      const monthly = (pipelineValue / 12) * trend * seasonal;
      monthlyForecast.push({
        month: this.getMonthName(i),
        forecast: Math.round(monthly),
        cumulative: Math.round(monthlyForecast.reduce((sum, m) => sum + m.forecast, 0) + monthly)
      });
    }

    return {
      monthly: monthlyForecast,
      total: monthlyForecast.reduce((sum, m) => sum + m.forecast, 0),
      pipelineValue,
      weighted: pipelineValue
    };
  }

  analyzeTrend(history) {
    if (history.length < 3) return 0.1;
    const recent = history.slice(-6).reduce((a, b) => a + b.revenue, 0) / 6;
    const older = history.slice(0, 6).reduce((a, b) => a + b.revenue, 0) / 6;
    return (recent / older - 1);
  }

  calculateSeasonality(history) {
    const monthly = Array(12).fill(1);
    if (history.length === 0) return monthly;
    
    history.forEach(h => {
      const month = new Date(h.date).getMonth();
      monthly[month] = (monthly[month] + h.revenue) / 2;
    });
    
    const avg = monthly.reduce((a, b) => a + b, 0) / 12;
    return monthly.map(m => m / avg);
  }

  simulateScenarios(forecast) {
    return [
      { name: 'Conservative', value: forecast.total * 0.7, probability: 0.25 },
      { name: 'Base', value: forecast.total, probability: 0.5 },
      { name: 'Optimistic', value: forecast.total * 1.3, probability: 0.25 }
    ];
  }

  measureAccuracy(forecast, history) {
    if (history.length < 2) return { accuracy: 'N/A', lastMonth: 0 };
    const lastMonth = history[history.length - 1];
    const lastForecast = forecast.monthly[0]?.forecast || 0;
    const accuracy = lastMonth.revenue > 0 ? 100 - Math.abs((lastForecast - lastMonth.revenue) / lastMonth.revenue * 100) : 0;
    return { accuracy: accuracy.toFixed(0) + '%', lastMonth: lastMonth.revenue, forecast: lastForecast };
  }

  generateRecommendations(forecast, scenarios) {
    const best = scenarios.reduce((b, s) => s.value > b.value ? s : b);
    const recs = [];
    if (forecast.total < (targets.revenue || forecast.total)) {
      recs.push({ priority: 'high', action: 'Cần thêm ' + Math.round((targets.revenue - forecast.total) / 12) + '/tháng' });
    }
    return recs;
  }

  calculateConfidence(forecast, scenarios) {
    const variance = scenarios.reduce((sum, s) => sum + Math.pow(s.value - scenarios[1].value, 2), 0) / scenarios.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, 100 - (stdDev / scenarios[1].value * 100));
    return { level: confidence > 70 ? 'cao' : confidence > 50 ? 'trung bình' : 'thấp', value: confidence.toFixed(0) + '%' };
  }

  getMonthName(i) {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return months[(new Date().getMonth() + i - 1) % 12];
  }
}

module.exports = SalesForecastingSkill;