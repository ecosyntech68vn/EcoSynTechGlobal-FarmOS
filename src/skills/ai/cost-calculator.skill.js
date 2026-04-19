module.exports = {
  id: 'cost-calculator',
  name: 'Cost Calculator',
  description: 'Tính chi phí đầu tư, vận hành và thời gian thu hồi vốn cho nông dân Việt Nam',
  version: '2.3.2',
  triggers: [
    'event:cost.calculate',
    'event:roi.calculate',
    'event:cost.estimate'
  ],
  riskLevel: 'low',
  canAutoFix: false,
  
  run: function(ctx) {
    var event = ctx.event || {};
    var action = event.action || 'calculate';
    var inputs = event.inputs || event;
    
    var result = {
      ok: true,
      action: action,
      timestamp: new Date().toISOString(),
      version: '2.3.2'
    };
    
    switch (action) {
      case 'calculate':
      case 'estimate':
        result.calculation = this.calculate(inputs);
        break;
        
      case 'roi':
        result.roi = this.calculateROI(inputs);
        break;
        
      case 'breakdown':
        result.breakdown = this.getCostBreakdown(inputs);
        break;
        
      case 'compare':
        result.comparison = this.compareOptions(inputs);
        break;
        
      case 'summary':
        result.summary = this.getSummary(inputs);
        break;
        
      default:
        result.calculation = this.calculate(inputs);
    }
    
    return result;
  },
  
  calculate: function(inputs) {
    var sensorCount = inputs.sensorCount || 5;
    var farmArea = inputs.farmArea || 1000;
    var cropType = inputs.cropType || 'vegetables';
    
    var cost = this.getCosts(sensorCount, farmArea, cropType);
    
    var annualRevenue = this.getAnnualRevenue(farmArea, cropType);
    var annualCost = this.getAnnualOperatingCost(farmArea, cropType);
    var annualProfit = annualRevenue - annualCost;
    var paybackMonths = cost.totalInvestment > 0 && annualProfit > 0 
      ? Math.ceil((cost.totalInvestment / annualProfit) * 12) 
      : 0;
    
    return {
      inputs: { sensorCount, farmArea, cropType },
      costs: cost,
      annualRevenue: annualRevenue,
      annualOperatingCost: annualCost,
      annualProfit: annualProfit,
      paybackPeriod: paybackMonths,
      roi: annualProfit > 0 ? ((annualProfit / cost.totalInvestment) * 100).toFixed(1) + '%' : '0%'
    };
  },
  
  getCosts: function(sensorCount, farmArea, cropType) {
    var sensorPrice = 500000;
    var gatewayPrice = 2000000;
    var installationCost = sensorCount * 100000;
    var softwareFee = 500000;
    var trainingFee = 300000;
    
    var hardware = (sensorPrice * sensorCount) + gatewayPrice;
    var installation = installationCost + softwareFee + trainingFee;
    var totalInvestment = hardware + installation;
    
    var monthlyCloud = 100000;
    var monthlyMaintenance = 200000;
    
    return {
      hardware: hardware,
      installation: installation,
      totalInvestment: totalInvestment,
      monthlyCloud: monthlyCloud,
      monthlyMaintenance: monthlyMaintenance,
      monthlyTotal: monthlyCloud + monthlyMaintenance,
      yearlyTotal: (monthlyCloud + monthlyMaintenance) * 12
    };
  },
  
  getAnnualRevenue: function(farmArea, cropType) {
    var revenuePerSqm = {
      vegetables: 180000,
      fruits: 250000,
      rice: 120000,
      flowers: 350000,
      herbs: 420000
    };
    
    return (revenuePerSqm[cropType] || 180000) * farmArea;
  },
  
  getAnnualOperatingCost: function(farmArea, cropType) {
    var costPerSqm = {
      vegetables: 90000,
      fruits: 130000,
      rice: 70000,
      flowers: 180000,
      herbs: 220000
    };
    
    return (costPerSqm[cropType] || 90000) * farmArea;
  },
  
  calculateROI: function(inputs) {
    var calculation = this.calculate(inputs);
    
    var yearlyProfit = calculation.annualProfit;
    var investment = calculation.costs.totalInvestment;
    var yearlyCost = calculation.costs.yearlyTotal;
    
    var netProfit = yearlyProfit - yearlyCost;
    var roi = investment > 0 ? ((netProfit / investment) * 100).toFixed(1) + '%' : '0%';
    var npv = netProfit > 0 ? 'positive' : 'negative';
    
    return {
      investment: investment,
      yearlyProfit: yearlyProfit,
      yearlyCost: yearlyCost,
      netProfit: netProfit,
      roi: roi,
      paybackPeriod: calculation.paybackPeriod,
      npv: npv,
      recommendation: netProfit > 0 ? 'Nên đầu tư' : 'Cần xem lại'
    };
  },
  
  getCostBreakdown: function(inputs) {
    var cost = this.getCosts(inputs.sensorCount || 5, inputs.farmArea || 1000, inputs.cropType || 'vegetables');
    
    return {
      chiPhíĐầuTư: {
        'Thiết bị cảm biến': cost.hardware,
        'Cài đặt & training': cost.installation,
        'Tổng đầu tư': cost.totalInvestment
      },
      chiPhíVậnHành: {
        'Cloud/tháng': cost.monthlyCloud,
        'Bảo trì/tháng': cost.monthlyMaintenance,
        'Tổng/tháng': cost.monthlyTotal,
        'Tổng/năm': cost.yearlyTotal
      },
      display: ' Viet Nam Đồng (VNĐ)'
    };
  },
  
  compareOptions: function(inputs) {
    var options = [
      { name: 'Cơ bản', sensors: 3, features: ['Giám sát cơ bản', 'Cảnh báo'] },
      { name: 'Tiêu chuẩn', sensors: 5, features: ['Giám sát đầy đủ', 'AI predictions', 'Tự động hóa'] },
      { name: 'Nâng cao', sensors: 10, features: ['Full automation', 'AI RAG', 'Predictive maintenance', 'Blockchain'] }
    ];
    
    var comparisons = options.map(function(opt) {
      var calc = this.calculate({
        sensorCount: opt.sensors,
        farmArea: inputs.farmArea || 1000,
        cropType: inputs.cropType || 'vegetables'
      });
      
      return {
        option: opt.name,
        sensors: opt.sensors,
        features: opt.features,
        investment: calc.costs.totalInvestment,
        yearlyCost: calc.costs.yearlyTotal,
        roi: calc.roi,
        paybackMonths: calc.paybackPeriod
      };
    }.bind(this));
    
    return { options: comparisons };
  },
  
  getSummary: function(inputs) {
    var roi = this.calculateROI(inputs);
    
    return {
      'Tổng đầu tư': roi.investment + ' VNĐ',
      'Lợi nhuận/năm': roi.netProfit + ' VNĐ',
      'ROI': roi.roi,
      'Thời gian thu hồi': roi.paybackPeriod + ' tháng',
      'Khuyến nghị': roi.recommendation
    };
  },
  
  getPresets: function() {
    return {
      vegetables: { areaUnit: 'm²', investmentPerSqm: 2500 },
      fruits: { areaUnit: 'm²', investmentPerSqm: 3500 },
      rice: { areaUnit: 'm²', investmentPerSqm: 1500 },
      flowers: { areaUnit: 'm²', investmentPerSqm: 5000 },
      herbs: { areaUnit: 'm²', investmentPerSqm: 6000 }
    };
  }
};