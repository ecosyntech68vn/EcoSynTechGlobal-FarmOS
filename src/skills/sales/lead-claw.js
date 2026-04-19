module.exports = {
  id: 'lead-claw',
  name: 'Lead Claw',
  description: 'Tiếp nhận và phân loại khách hàng',
  
  process: function(context) {
    const message = context.message || '';
    const customer = context.customer || {};
    
    const lead = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      source: customer.source || 'website',
      status: 'new'
    };
    
    const classification = this.classify(message);
    lead.segment = classification.segment;
    lead.intent = classification.intent;
    lead.products = classification.products;
    lead.urgency = classification.urgency;
    lead.score = classification.score;
    
    const greeting = this.getGreeting(classification);
    const questions = this.getQuestions(classification);
    const response = {
      lead: lead,
      greeting: greeting,
      questions: questions,
      nextStep: 'product-claw'
    };
    
    return response;
  },
  
  generateId: function() {
    return 'LEAD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
  },
  
  classify: function(message) {
    const msg = message.toLowerCase();
    
    let segment = 'unknown';
    let intent = 'inquiry';
    let products = [];
    let urgency = 'medium';
    let score = 50;
    
    if (msg.includes('iot') || msg.includes('cảm biến') || msg.includes('nông nghiệp')) {
      segment = 'agriculture';
      products.push('iot-package');
      score += 20;
    }
    
    if (msg.includes('trang trại') || msg.includes('rau') || msg.includes('cây trồng')) {
      products.push('farm-basic');
      segment = 'farmer';
    }
    
    if (msg.includes('giá') || msg.includes('bao nhiêu') || msg.includes('chi phí')) {
      intent = 'pricing';
    }
    
    if (msg.includes('mua') || msg.includes('đặt') || msg.includes('luôn')) {
      intent = 'purchase';
      urgency = 'high';
      score += 20;
    }
    
    if (msg.includes('gấp') || msg.includes('ngay') || msg.includes('tuần này')) {
      urgency = 'high';
    }
    
    if (msg.includes('lần đầu') || msg.includes('tìm hiểu')) {
      segment = 'prospect';
    }
    
    if (msg.includes('lại') || msg.includes('tham khảo')) {
      segment = 'returning';
    }
    
    return {
      segment: segment,
      intent: intent,
      products: products,
      urgency: urgency,
      score: Math.min(score, 100)
    };
  },
  
  getGreeting: function(classification) {
    const greetings = {
      agriculture: '🌱 Chào anh/chị! Em là trợ lý bán hàng EcoSynTech. Rất vui được hỗ trợ!',
      farmer: '🌾 Chào anh/chị nông dân! EcoSynTech sẵn sàng giúp trang trại của anh/chị!',
      returning: '👋 Chào anh/chị! Cảm ơn anh/chị đã quay lại! Em sẽ hỗ trợ ngay!',
      unknown: '👋 Chào anh/chị! Em là trợ lý EcoSynTech. Anh/chị cần tư vấn gì ạ?'
    };
    return greetings[classification.segment] || greetings.unknown;
  },
  
  getQuestions: function(classification) {
    const questions = [];
    
    if (classification.intent === 'pricing') {
      questions.push({
        question: 'Anh/chị quan tâm gói sản phẩm nào ạ?',
        options: [
          { label: 'Gói Cơ bản (5 cảm biến)', value: 'basic' },
          { label: 'Gói Tiêu chuẩn (10 cảm biến)', value: 'standard' },
          { label: 'Gói Nâng cao (20 cảm biến)', value: 'premium' }
        ]
      });
    }
    
    if (classification.products.length === 0) {
      questions.push({
        question: 'Anh/chị đang quan tâm sản phẩm nào ạ?',
        options: [
          { label: 'Hệ thống IoT Nông nghiệp', value: 'iot' },
          { label: 'QR Code Truy xuất nguồn gốc', value: 'qr' },
          { label: 'AI Assistant', value: 'ai' },
          { label: 'Tất cả', value: 'all' }
        ]
      });
    }
    
    questions.push({
      question: 'Anh/chị có thể cho em biết diện tích trang trại ạ?',
      field: 'farmSize',
      unit: 'm²'
    });
    
    return questions;
  }
};