module.exports = {
  id: 'roi-calculator',
  name: 'ROI Calculator',
  description: 'Calculate and display ROI for IoT Agriculture investment',
  triggers: [
    'event:roi.calculate',
    'event:roi.show',
    'event:roi.compare',
    'cron:1h'
  ],
  riskLevel: 'low',
  canAutoFix: false,
  
  run: function(ctx) {
    const event = ctx.event || {};
    const action = event.action || 'calculate';
    
    const result = {
      ok: true,
      action: action,
      timestamp: new Date().toISOString(),
      roi: null,
      payback: null,
      savings: null
    };
    
    switch (action) {
    case 'calculate':
    case 'show':
      result.roi = this.calculateROI(event.params);
      result.payback = this.calculatePayback(event.params);
      result.savings = this.calculateSavings(event.params);
      break;
        
    case 'compare':
      result.comparison = this.compareOptions(event.params);
      break;
        
    default:
      result.roi = this.getDefaultROI();
    }
    
    return result;
  },
  
  calculateROI: function(params) {
    params = params || {};
    
    const sensorCount = params.sensorCount || 10;
    const deviceCost = params.deviceCost || 400000;
    
    const monthlyWaterSaved = 150000;
    const monthlyFertilizerSaved = 100000;
    const monthlyYieldIncrease = 200000;
    const monthlyErrorReduced = 50000;
    const monthlyTotalSaved = monthlyWaterSaved + monthlyFertilizerSaved + monthlyYieldIncrease + monthlyErrorReduced;
    
    const yearlySavings = monthlyTotalSaved * 12;
    const yearlyROI = Math.round(((yearlySavings - deviceCost) / deviceCost) * 100);
    
    return {
      deviceCost: deviceCost,
      monthlySavings: monthlyTotalSaved,
      yearlySavings: yearlySavings,
      roi: yearlyROI,
      breakdown: {
        water: monthlyWaterSaved,
        fertilizer: monthlyFertilizerSaved,
        yield: monthlyYieldIncrease,
        error_reduction: monthlyErrorReduced
      }
    };
  },
  
  calculatePayback: function(params) {
    const roi = this.calculateROI(params);
    const months = Math.ceil(roi.deviceCost / roi.monthlySavings);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    return {
      months: months,
      years: years,
      remainingMonths: remainingMonths,
      paybackPeriod: years > 0 ? years + ' năm ' + remainingMonths + ' tháng' : months + ' tháng'
    };
  },
  
  calculateSavings: function(params) {
    params = params || {};
    
    const sensorCount = params.sensorCount || 10;
    const waterSavedPerDay = 50 * sensorCount;
    const waterCost = 10000;
    const yearlyWater = waterSavedPerDay * 365 * waterCost / 1000;
    
    const fertilizerSaved = 200000;
    const laborHoursSaved = sensorCount * 0.5 * 30;
    const laborCost = 50000;
    const yearlyLabor = laborHoursSaved * 12 * laborCost;
    
    return {
      yearly: {
        water: yearlyWater,
        fertilizer: fertilizerSaved * 12,
        labor: yearlyLabor,
        total: yearlyWater + fertilizerSaved * 12 + yearlyLabor
      },
      savings: {
        waterPercent: 30,
        fertilizerPercent: 25,
        laborPercent: 40
      }
    };
  },
  
  getDefaultROI: function() {
    return this.calculateROI({
      farmSize: 1,
      sensorCount: 10,
      monthlyLabor: 3000000,
      deviceCost: 400000
    });
  },
  
  compareOptions: function(params) {
    return {
      basic: this.calculateROI({ ...params, deviceCost: 300000 }),
      standard: this.calculateROI({ ...params, deviceCost: 500000 }),
      pro: this.calculateROI({ ...params, deviceCost: 1000000 })
    };
  },
  
  formatCurrency: function(amount) {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0 
    }).format(amount);
  },
  
  getBreakdown: function(params) {
    const roi = this.calculateROI(params);
    const payback = this.calculatePayback(params);
    const savings = this.calculateSavings(params);
    
    return {
      investment: this.formatCurrency(roi.deviceCost),
      monthlySavings: this.formatCurrency(roi.monthlySavings),
      yearlySavings: this.formatCurrency(roi.yearlySavings),
      roi: roi.roi + '%',
      paybackPeriod: payback.paybackPeriod,
      laborSaved: this.formatCurrency(savings.yearly.labor),
      waterSaved: this.formatCurrency(savings.yearly.water)
    };
  }
};