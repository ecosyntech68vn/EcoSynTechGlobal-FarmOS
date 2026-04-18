module.exports = {
  id: 'product-claw',
  name: 'Product Claw',
  description: 'Tư vấn sản phẩm phù hợp với nhu cầu khách hàng',
  
  process: function(context) {
    const lead = context.lead || {};
    const farmSize = context.farmSize || 1000;
    const cropType = context.cropType || 'vegetables';
    const budget = context.budget || null;
    
    const recommendations = this.getRecommendations(lead, farmSize, cropType, budget);
    const comparison = this.getComparison(recommendations);
    const benefits = this.getBenefits(lead.segment);
    
    return {
      recommendations: recommendations,
      comparison: comparison,
      benefits: benefits,
      nextStep: 'quote-claw'
    };
  },
  
  getRecommendations: function(lead, farmSize, cropType, budget) {
    const packages = [
      {
        id: 'basic',
        name: 'Gói Cơ bản',
        price: 5800000,
        sensors: 5,
        features: ['Giám sát cơ bản', 'Cảnh báo SMS', 'Dashboard'],
        suitable: 'Diện tích < 2000m²'
      },
      {
        id: 'standard',
        name: 'Gói Tiêu chuẩn',
        price: 9800000,
        sensors: 10,
        features: ['Giám sát đầy đủ', 'AI Predictions', 'Tự động hóa', 'API'],
        suitable: 'Diện tích < 10000m²'
      },
      {
        id: 'premium',
        name: 'Gói Nâng cao',
        price: 18000000,
        sensors: 20,
        features: ['Full Automation', 'AI RAG', 'Predictive', 'Blockchain', 'VIP Support'],
        suitable: 'Mọi diện tích'
      }
    ];
    
    let selected = [];
    const size = farmSize || 1000;
    
    if (size < 2000) {
      selected = [packages[0], packages[1]];
    } else if (size < 10000) {
      selected = [packages[1], packages[2]];
    } else {
      selected = [packages[2]];
    }
    
    if (budget && budget < 10000000) {
      selected = selected.filter(p => p.price <= budget);
    }
    
    if (lead.intent === 'purchase') {
      selected = selected.slice(0, 1);
    }
    
    return selected;
  },
  
  getComparison: function(recommendations) {
    return recommendations.map(pkg => ({
      package: pkg.name,
      price: pkg.price,
      priceFormatted: this.formatPrice(pkg.price),
      sensors: pkg.sensors,
      features: pkg.features.length,
      roi: this.calculateROI(pkg.price, pkg.sensors),
      payback: this.calculatePayback(pkg.price, pkg.sensors),
      highlight: pkg.id === 'standard'
    }));
  },
  
  calculateROI: function(price, sensors) {
    const revenuePerSensor = 18000000;
    const annualRevenue = sensors * revenuePerSensor;
    const annualCost = sensors * 3000000;
    const netProfit = annualRevenue - annualCost - price;
    const roi = ((netProfit / price) * 100).toFixed(0);
    return roi + '%';
  },
  
  calculatePayback: function(price, sensors) {
    const monthlyProfit = (sensors * 1500000) - (sensors * 250000);
    const months = Math.ceil(price / monthlyProfit);
    return months < 1 ? '< 1 tháng' : months + ' tháng';
  },
  
  formatPrice: function(vnd) {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0 
    }).format(vnd);
  },
  
  getBenefits: function(segment) {
    const allBenefits = [
      { icon: '📊', title: 'Tăng năng suất 30%', desc: 'Giám sát chính xác giúp tối ưu chăm sóc' },
      { icon: '💰', title: 'ROI 1551%', desc: 'Thu hồi vốn trong 1 tháng' },
      { icon: '📱', title: 'Quản lý từ xa', desc: 'Xem dữ liệu mọi lúc mọn nơi' },
      { icon: '🔔', title: 'Cảnh báo thông minh', desc: 'Nhận thông báo khi có vấn đề' },
      { icon: '🌱', title: 'Tiết kiệm nước 40%', desc: 'Tưới tự động theo độ ẩm' },
      { icon: '🛡️', title: 'Bảo hành 2 năm', desc: 'Hỗ trợ kỹ thuật 24/7' }
    ];
    
    if (segment === 'farmer') {
      return allBenefits.filter(b => !['📊', '📱'].includes(b.icon));
    }
    
    return allBenefits.slice(0, 4);
  },
  
  getResponse: function(recommendations) {
    const pkg = recommendations[0];
    return {
      message: `🌱 **Gói ${pkg.name}** được khuyên cho anh/chị!\n\n` +
        `📡 ${pkg.sensors} cảm biến\n` +
        `💰 ${this.formatPrice(pkg.price)}\n` +
        `⏱️ Thu hồi vốn: ${this.calculatePayback(pkg.price, pkg.sensors)}\n\n` +
        `Anh/chị có muốn xem chi tiết không?`,
      package: pkg,
      nextAction: 'Xem chi tiết / Báo giá / Đặt hàng'
    };
  }
};