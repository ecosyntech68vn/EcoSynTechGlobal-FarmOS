class UpsellCrosssellEngineSkill {
  static name = 'upsell-crosssell-engine';
  static description = 'Gợi ý bán thêm & bán kèm sản phẩm với AI';

  constructor() {
    this.rules = {
      bundle: ['product A + product B giảm 15%'],
      upgrade: ['plan Basic → Pro giảm 20%'],
      complement: ['mua X tặng Y']
    };
  }

  async execute(context) {
    const { customerHistory = [], products = [], currentCart = [] } = context;

    const recommendations = this.generateRecommendations(customerHistory, products, currentCart);
    const scoring = this.scoreRecommendations(recommendations);
    const personalization = this.personalizeOffers(scoring, customerHistory);
    return {
      recommendations: scoring,
      personalizedOffers: personalization,
      actionPlan: this.createActionPlan(personalization),
      projectedUplift: this.calculateUplift(personalization)
    };
  }

  generateRecommendations(customerHistory, products, currentCart) {
    const recs = [];
    customerHistory.forEach(cust => {
      const purchased = cust.purchased || [];
      const category = cust.category || 'standard';
      
      products.forEach(prod => {
        if (!purchased.includes(prod.id)) {
          const score = this.calculateMatchScore(purchased, prod, category);
          if (score > 0.3) {
            recs.push({
              customerId: cust.id,
              product: prod,
              score,
              type: this.determineType(purchased, prod),
              reason: this.getReason(purchased, prod)
            });
          }
        }
      });
    });
    return recs.sort((a, b) => b.score - a.score);
  }

  calculateMatchScore(purchased, product, category) {
    let score = 0.3;
    const categoryMatch = purchased.filter(p => p.category === product.category);
    if (categoryMatch.length > 0) score += 0.3;
    if (product.tags?.some(t => purchased.flatMap(p => p.tags || []).includes(t))) score += 0.2;
    if (category === 'enterprise' && product.tier === 'premium') score += 0.2;
    return score;
  }

  determineType(purchased, product) {
    const hasSameCategory = purchased.some(p => p.category === product.category);
    return hasSameCategory ? 'upsell' : 'crosssell';
  }

  getReason(purchased, product) {
    const reasons = {
      upsell: ['Đã quen thuộc danh mục', 'Sẵn sàng nâng cấp', 'Cần tính năng cao cấp'],
      crosssell: ['Sản phẩm bổ sung', 'Giải pháp toàn diện', 'Khuyến khích sử dụng']
    };
    return reasons[this.determineType(purchased, product)][0];
  }

  scoreRecommendations(recommendations) {
    return recommendations.slice(0, 20).map(r => ({
      ...r,
      priority: r.score > 0.7 ? 'high' : r.score > 0.5 ? 'medium' : 'low',
      offerValue: (r.product.price * (r.type === 'upsell' ? 0.15 : 0.10)).toFixed(0)
    }));
  }

  personalizeOffers(scoring, customerHistory) {
    return scoring.slice(0, 10).map(offer => {
      const cust = customerHistory.find(c => c.id === offer.customerId);
      const personalizedOffer = {
        ...offer,
        customMessage: this.generateMessage(offer, cust),
        discount: offer.type === 'upsell' ? '15%' : '10%',
        urgency: cust?.lastPurchase > 60 ? 'high' : 'medium'
      };
      return personalizedOffer;
    });
  }

  generateMessage(offer, customer) {
    const messages = {
      upsell: [
        `Xin chào ${customer?.name}, nâng cấp lên ${offer.product.name} ngay hôm nay!`,
        `Bạn đã sử dụng ${offer.product.category} - hãy trải nghiệm phiên bản Pro!`
      ],
      crosssell: [
        `Kết hợp hoàn hảo với ${customer?.name || 'sản phẩm bạn đã mua'}!`,
        `Sản ph���m bổ sung mà ${customer?.name || 'bạn'} có thể thích`
      ]
    };
    return messages[offer.type][0];
  }

  createActionPlan(personalizedOffers) {
    const highPriority = personalizedOffers.filter(o => o.priority === 'high');
    return {
      forSales: highPriority.slice(0, 5).map(o => ({
        customer: o.customerId,
        product: o.product.name,
        message: o.customMessage,
        offer: o.discount
      })),
      automated: personalizedOffers.filter(o => o.urgency === 'high').map(o => ({
        type: 'email',
        template: o.type === 'upsell' ? 'upsell_template' : 'crosssell_template',
        product: o.product.name
      })),
      timeline: 'Triển khai trong 48 giờ'
    };
  }

  calculateUplift(personalizedOffers) {
    const totalValue = personalizedOffers.reduce((sum, o) => sum + parseInt(o.offerValue), 0);
    return {
      potentialRevenue: totalValue,
      averageOrderValue: Math.round(totalValue / personalizedOffers.length),
      conversionExpected: Math.round(personalizedOffers.length * 0.15),
      projectedUplift: (totalValue * 0.15).toFixed(0)
    };
  }
}

module.exports = UpsellCrosssellEngineSkill;