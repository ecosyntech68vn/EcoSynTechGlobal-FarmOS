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
    const event = ctx.event || {};
    const action = event.action || 'calculate';
    const inputs = event.inputs || event;
    
    const result = {
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
    const sensorCount = inputs.sensorCount || 5;
    const farmArea = inputs.farmArea || 1000;
    const cropType = inputs.cropType || 'vegetables';
    
    const cost = this.getCosts(sensorCount, farmArea, cropType);
    
    const annualRevenue = this.getAnnualRevenue(farmArea, cropType);
    const annualCost = this.getAnnualOperatingCost(farmArea, cropType);
    const annualProfit = annualRevenue - annualCost;
    const paybackMonths = cost.totalInvestment > 0 && annualProfit > 0 
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
    const sensorPrice = 500000;
    const gatewayPrice = 2000000;
    const installationCost = sensorCount * 100000;
    const softwareFee = 500000;
    const trainingFee = 300000;
    
    const hardware = (sensorPrice * sensorCount) + gatewayPrice;
    const installation = installationCost + softwareFee + trainingFee;
    const totalInvestment = hardware + installation;
    
    const monthlyCloud = 100000;
    const monthlyMaintenance = 200000;
    
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
    const revenuePerSqm = {
      vegetables: 180000,
      fruits: 250000,
      rice: 120000,
      flowers: 350000,
      herbs: 420000
    };
    
    return (revenuePerSqm[cropType] || 180000) * farmArea;
  },
  
  getAnnualOperatingCost: function(farmArea, cropType) {
    const costPerSqm = {
      vegetables: 90000,
      fruits: 130000,
      rice: 70000,
      flowers: 180000,
      herbs: 220000
    };
    
    return (costPerSqm[cropType] || 90000) * farmArea;
  },
  
  calculateROI: function(inputs) {
    const calculation = this.calculate(inputs);
    
    const yearlyProfit = calculation.annualProfit;
    const investment = calculation.costs.totalInvestment;
    const yearlyCost = calculation.costs.yearlyTotal;
    
    const netProfit = yearlyProfit - yearlyCost;
    const roi = investment > 0 ? ((netProfit / investment) * 100).toFixed(1) + '%' : '0%';
    const npv = netProfit > 0 ? 'positive' : 'negative';
    
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
    const cost = this.getCosts(inputs.sensorCount || 5, inputs.farmArea || 1000, inputs.cropType || 'vegetables');
    
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
    const options = [
      { name: 'Cơ bản', sensors: 3, features: ['Giám sát cơ bản', 'Cảnh báo'] },
      { name: 'Tiêu chuẩn', sensors: 5, features: ['Giám sát đầy đủ', 'AI predictions', 'Tự động hóa'] },
      { name: 'Nâng cao', sensors: 10, features: ['Full automation', 'AI RAG', 'Predictive maintenance', 'Blockchain'] }
    ];
    
    const comparisons = options.map(function(opt) {
      const calc = this.calculate({
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
    const roi = this.calculateROI(inputs);
    
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