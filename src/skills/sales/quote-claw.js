module.exports = {
  id: 'quote-claw',
  name: 'Quote Claw',
  description: 'Báo giá tự động với chi tiết và ROI',
  
  process: function(context) {
    const packageId = context.packageId || 'standard';
    const farmSize = context.farmSize || 1000;
    const cropType = context.cropType || 'vegetables';
    const lead = context.lead || {};
    
    const quote = this.generateQuote(packageId, farmSize, cropType, lead);
    
    return {
      quote: quote,
      formatted: this.formatQuote(quote),
      nextStep: 'contract-claw'
    };
  },
  
  generateQuote: function(packageId, farmSize, cropType, lead) {
    const packages = {
      basic: {
        id: 'basic',
        name: 'Gói Cơ bản',
        price: 5800000,
        sensors: 5,
        features: ['Giám sát cơ bản', 'Cảnh báo SMS', 'Dashboard'],
        gatePrice: 2000000,
        installFee: 500000,
        trainingFee: 300000
      },
      standard: {
        id: 'standard',
        name: 'Gói Tiêu chuẩn',
        price: 9800000,
        sensors: 10,
        features: ['Giám sát đầy đủ', 'AI Predictions', 'Tự động hóa', 'API'],
        gatePrice: 2000000,
        installFee: 800000,
        trainingFee: 500000
      },
      premium: {
        id: 'premium',
        name: 'Gói Nâng cao',
        price: 18000000,
        sensors: 20,
        features: ['Full Automation', 'AI RAG', 'Predictive', 'Blockchain', 'VIP Support'],
        gatePrice: 2500000,
        installFee: 1200000,
        trainingFee: 800000
      }
    };
    
    const pkg = packages[packageId] || packages.standard;
    
    const hardware = pkg.price;
    const installation = pkg.installFee + pkg.trainingFee;
    const total = hardware + installation;
    const monthlyCloud = 100000;
    const monthlyMaintenance = 200000;
    const yearlyOperating = (monthlyCloud + monthlyMaintenance) * 12;
    
    const revenuePerSqm = {
      vegetables: 180000,
      fruits: 250000,
      rice: 120000,
      flowers: 350000
    };
    
    const annualRevenue = (revenuePerSqm[cropType] || 180000) * farmSize;
    const annualProfit = annualRevenue - (farmSize * 90000);
    const roi = ((annualProfit - yearlyOperating) / total * 100).toFixed(0);
    const paybackMonths = Math.ceil(total / (annualProfit - yearlyOperating) * 12);
    
    return {
      id: 'QT-' + Date.now(),
      package: pkg,
      customer: {
        farmSize: farmSize,
        cropType: cropType
      },
      pricing: {
        hardware: hardware,
        installation: installation,
        total: total,
        monthlyCloud: monthlyCloud,
        monthlyMaintenance: monthlyMaintenance,
        yearlyOperating: yearlyOperating
      },
      roi: {
        annualRevenue: annualRevenue,
        annualProfit: annualProfit,
        roi: roi + '%',
        paybackMonths: paybackMonths,
        recommendation: paybackMonths <= 12 ? 'Nên đầu tư' : 'Cần cân nhắc'
      },
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      terms: [
        'Báo giá có hiệu lực 7 ngày',
        'Thanh toán 50% trước khi lắp đặt',
        'Bảo hành 24 tháng',
        'Hỗ trợ kỹ thuật 24/7'
      ]
    };
  },
  
  formatPrice: function(vnd) {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0 
    }).format(vnd);
  },
  
  formatQuote: function(quote) {
    const qt = quote;
    return {
      header: `📋 **BÁO GIÁ - ${qt.package.name}**\n` +
        `Mã: ${qt.id}\n` +
        `Ngày: ${new Date().toLocaleDateString('vi-VN')}`,
      
      investment: `💰 **CHI PHÍ ĐẦU TƯ**
- Thiết bị: ${this.formatPrice(qt.pricing.hardware)}
- Lắp đặt: ${this.formatPrice(qt.pricing.installation)}
- **Tổng cộng: ${this.formatPrice(qt.pricing.total)}**`,
      
      operating: `📊 **CHI PHÍ VẬN HÀNH**
- Cloud/tháng: ${this.formatPrice(qt.pricing.monthlyCloud)}
- Bảo trì/tháng: ${this.formatPrice(qt.pricing.monthlyMaintenance)}
- Tổng/năm: ${this.formatPrice(qt.pricing.yearlyOperating)}`,
      
      roi: `📈 **HIỆU QUẢ**
- Doanh thu năm: ${this.formatPrice(qt.roi.annualRevenue)}
- Lợi nhuận: ${this.formatPrice(qt.roi.annualProfit)}
- **ROI: ${qt.roi.roi}**
- **Thu hồi vốn: ${qt.roi.paybackMonths} tháng**
- ${qt.roi.recommendation}`,
      
      valid: `⏰ Báo giá còn hiệu lực đến ${new Date(qt.validUntil).toLocaleDateString('vi-VN')}`
    };
  },
  
  getPDFData: function(quote) {
    return {
      title: 'BÁO GIÁ - EcoSynTech',
      company: 'Công ty TNHH EcoSynTech',
      quote: quote,
      footer: 'Cảm ơn quý khách đã tin tưởng EcoSynTech!'
    };
  }
};