class FinancialForecastingSkill {
  static name = 'financial-forecasting-ai';
  static description = 'Dự báo tài chính, dòng tiền và xu hướng kinh doanh';

  constructor() {
    this.historicalData = [];
    this.forecastPeriods = 12;
  }

  async execute(context) {
    const { 
      revenueHistory = [],
      expenseHistory = [],
      currentAssets = 0,
      currentLiabilities = 0,
      growthRate = 0.1,
      seasonalFactors = []
    } = context;

    const revenueForecast = this.forecastRevenue(revenueHistory, growthRate, seasonalFactors);
    const expenseForecast = this.forecastExpense(expenseHistory, growthRate);
    const cashflowForecast = this.forecastCashflow(revenueForecast, expenseForecast);
    const breakEvenAnalysis = this.calculateBreakEven(revenueHistory, expenseHistory);
    const ratioAnalysis = this.analyzeRatios(currentAssets, currentLiabilities, revenueForecast[0]);

    return {
      revenue: revenueForecast,
      expenses: expenseForecast,
      cashflow: cashflowForecast,
      breakEven: breakEvenAnalysis,
      ratios: ratioAnalysis,
      recommendations: this.generateRecommendations(cashflowForecast, ratioAnalysis),
      riskIndicators: this.identifyRisks(cashflowForecast)
    };
  }

  forecastRevenue(history, growthRate, seasonalFactors) {
    const forecast = [];
    const baseRevenue = history[history.length - 1] || 100000000;
    
    for (let i = 1; i <= this.forecastPeriods; i++) {
      const seasonalMultiplier = seasonalFactors[(i - 1) % 12] || 1;
      const trendFactor = Math.pow(1 + growthRate, i / 12);
      const predicted = baseRevenue * trendFactor * seasonalMultiplier;
      
      forecast.push({
        period: i,
        month: this.getMonthName((new Date().getMonth() + i) % 12),
        revenue: Math.round(predicted),
        growth: (trendFactor - 1) * 100
      });
    }
    return forecast;
  }

  forecastExpense(history, growthRate) {
    const forecast = [];
    const baseExpense = history[history.length - 1] || 70000000;
    const expenseRatio = baseExpense / (history[0] || 100000000);
    
    for (let i = 1; i <= this.forecastPeriods; i++) {
      const trendFactor = Math.pow(1 + growthRate * 0.8, i / 12);
      const predicted = baseExpense * trendFactor;
      
      forecast.push({
        period: i,
        expense: Math.round(predicted)
      });
    }
    return forecast;
  }

  forecastCashflow(revenueForecast, expenseForecast) {
    return revenueForecast.map((rev, i) => ({
      period: rev.period,
      month: rev.month,
      inflow: rev.revenue,
      outflow: expenseForecast[i].expense,
      netCashflow: rev.revenue - expenseForecast[i].expense,
      cumulative: revenueForecast.slice(0, i + 1).reduce((sum, r, j) => 
        sum + r.revenue - expenseForecast[j].expense, 0)
    }));
  }

  calculateBreakEven(revenue, expense) {
    const avgRevenue = revenue.reduce((a, b) => a + b, 0) / revenue.length;
    const avgExpense = expense.reduce((a, b) => a + b, 0) / expense.length;
    const fixedCosts = avgExpense * 0.6;
    const variableCosts = avgExpense * 0.4;
    const contributionMargin = (avgRevenue - variableCosts) / avgRevenue;
    
    return {
      fixedCosts: Math.round(fixedCosts),
      variableCosts: Math.round(variableCosts),
      contributionMargin: (contributionMargin * 100).toFixed(1) + '%',
      breakEvenPoint: Math.round(fixedCosts / contributionMargin),
      currentMargin: ((avgRevenue - avgExpense) / avgRevenue * 100).toFixed(1) + '%'
    };
  }

  analyzeRatios(currentAssets, currentLiabilities, revenue) {
    const currentRatio = currentAssets / currentLiabilities;
    const quickRatio = (currentAssets * 0.8) / currentLiabilities;
    const dso = 45;
    
    return {
      currentRatio: currentRatio.toFixed(2),
      quickRatio: quickRatio.toFixed(2),
      daysSalesOutstanding: dso,
      workingCapital: currentAssets - currentLiabilities,
      assessment: currentRatio > 2 ? 'tốt' : currentRatio > 1 ? 'khá' : 'cần cải thiện'
    };
  }

  generateRecommendations(cashflow, ratios) {
    const recs = [];
    const latestCashflow = cashflow[cashflow.length - 1];
    
    if (latestCashflow.netCashflow < 0) {
      recs.push({
        type: 'cashflow',
        priority: 'high',
        action: 'Kiểm tra chi phí hoặc tăng doanh thu'
      });
    }
    
    if (parseFloat(ratios.currentRatio) < 1.5) {
      recs.push({
        type: 'liquidity',
        priority: 'high',
        action: 'Cải thiện hệ số thanh toán'
      });
    }
    
    if (cashflow.slice(-3).every(c => c.netCashflow > 0)) {
      recs.push({
        type: 'investment',
        priority: 'medium',
        action: 'Xem xét mở rộng kinh doanh'
      });
    }
    
    return recs;
  }

  identifyRisks(cashflow) {
    const risks = [];
    const negativeMonths = cashflow.filter(c => c.netCashflow < 0);
    
    if (negativeMonths.length > 3) {
      risks.push({ level: 'high', issue: 'Nhiều tháng âm dòng tiền' });
    }
    
    const decliningTrend = cashflow.slice(-3).every((c, i, arr) => 
      i === 0 || c.netCashflow < arr[i-1].netCashflow);
    
    if (decliningTrend) {
      risks.push({ level: 'medium', issue: 'Xu hướng dòng tiền giảm' });
    }
    
    return risks;
  }

  getMonthName(month) {
    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return months[month];
  }
}

module.exports = FinancialForecastingSkill;