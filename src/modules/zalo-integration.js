const salesModule = require('./sales-integration');

module.exports = {
  version: '2.3.2',
  
  handleWebhook: async function(event) {
    const message = event.message || '';
    const userId = event.userId || event.from;
    
    const response = await salesModule.processChat({
      message: message,
      customerId: userId,
      sessionId: 'zalo-' + userId
    });
    
    return this.formatZaloResponse(response);
  },
  
  formatZaloResponse: function(response) {
    if (typeof response === 'string') {
      return {
        type: 'text',
        message: response
      };
    }
    
    return {
      type: 'text',
      message: response.message || response.text || 'Cam on! Em se tro loI ngay.'
    };
  },
  
  getQuickReplies: function() {
    return [
      { label: 'Xem san pham', action: 'products' },
      { label: 'Tinh ROI', action: 'roi' },
      { label: 'Lien he', action: 'contact' },
      { label: 'Huong dan', action: 'help' }
    ];
  },
  
  getRichMenu: function() {
    return {
      type: 'richmenu',
      richmenu: {
        size: { width: 1200, height: 405 },
        selected: true,
        name: 'EcoSynTech Menu',
        chatBarText: 'EcoSynTech',
        areas: [
          {
            bounds: { x: 0, y: 0, width: 400, height: 405 },
            action: { type: 'message', text: 'Xem san pham' }
          },
          {
            bounds: { x: 400, y: 0, width: 400, height: 405 },
            action: { type: 'message', text: 'Tinh ROI' }
          },
          {
            bounds: { x: 800, y: 0, width: 400, height: 405 },
            action: { type: 'message', text: 'Lien he ho tro' }
          }
        ]
      }
    };
  },
  
  sendRichMessage: async function(userId, data) {
    const messages = [];
    
    if (data.products) {
      messages.push({
        type: 'template',
        template: {
          type: 'button',
          text: '📦 San pham EcoSynTech',
          actions: [
            { label: 'Goi Co Ban (5.8M)', type: 'message', text: 'Mua goi Co Ban' },
            { label: 'Goi Tieu Chuan (9.8M)', type: 'message', text: 'Mua goi Tieu Chuan' },
            { label: 'Goi Nang Cao (18M)', type: 'message', text: 'Mua goi Nang Cao' }
          ]
        }
      });
    }
    
    if (data.quote) {
      messages.push({
        type: 'text',
        text: `💰 Bao gia: ${data.quote.total} VNĐ\nROI: ${data.quote.roi}`
      });
    }
    
    return messages;
  }
};