const salesModule = require('./sales-integration');

module.exports = {
  version: '2.3.2',
  
  verifyWebhook: function(mode, token) {
    return mode === 'subscribe' && token === process.env.MESSENGER_VERIFY_TOKEN;
  },
  
  handleMessage: async function(event) {
    const message = event.message?.text || '';
    const senderId = event.sender.id;
    
    if (event.message?.quick_reply) {
      return this.handleQuickReply(event.message.quick_reply.payload, senderId);
    }
    
    const response = await salesModule.processChat({
      message: message,
      customerId: senderId,
      sessionId: 'messenger-' + senderId
    });
    
    return this.formatMessengerResponse(response, senderId);
  },
  
  handleQuickReply: async function(payload, senderId) {
    const responses = {
      'view_products': {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: this.getProductCards()
          }
        }
      },
      'calculate_roi': {
        text: 'Hay cho biet dien tich trang trai (m2) va loai cay trong cua ban?'
      },
      'contact_support': {
        text: 'Lien he ho tro: 1900 xxxx - Ho tro 24/7'
      }
    };
    
    return responses[payload] || { text: 'Cam on!' };
  },
  
  getProductCards: function() {
    return [
      {
        title: 'Goi Co Ban - 5.8M VNĐ',
        image_url: 'https://ecosyntech-farm-os.netlify.app/icons/icon-512.png',
        subtitle: '5 cam bien + Gateway + App mobile',
        buttons: [
          { title: 'Mua ngay', type: 'postback', payload: 'buy_basic' },
          { title: 'Xem chi tiet', type: 'postback', payload: 'info_basic' }
        ]
      },
      {
        title: 'Goi Tieu Chuan - 9.8M VNĐ',
        image_url: 'https://ecosyntech-farm-os.netlify.app/icons/icon-512.png',
        subtitle: '10 cam bien + AI Predictions + Tu dong hoa',
        buttons: [
          { title: 'Mua ngay', type: 'postback', payload: 'buy_standard' },
          { title: 'Xem chi tiet', type: 'postback', payload: 'info_standard' }
        ]
      },
      {
        title: 'Goi Nang Cao - 18M VNĐ',
        image_url: 'https://ecosyntech-farm-os.netlify.app/icons/icon-512.png',
        subtitle: '20 cam bien + AI RAG + Blockchain',
        buttons: [
          { title: 'Mua ngay', type: 'postback', payload: 'buy_premium' },
          { title: 'Xem chi tiet', type: 'postback', payload: 'info_premium' }
        ]
      }
    ];
  },
  
  formatMessengerResponse: function(response, senderId) {
    return {
      recipient: { id: senderId },
      message: {
        text: response.message || response.text || 'Cam on! EcoSynTech se tro loi ngay.'
      }
    };
  },
  
  getPersistentMenu: function() {
    return {
      persistent_menu: [
        {
          locale: 'default',
          composer_input_disabled: false,
          call_to_actions: [
            { title: 'San pham', type: 'postback', payload: 'view_products' },
            { title: 'Tinh ROI', type: 'postback', payload: 'calculate_roi' },
            { title: 'Lien he', type: 'postback', payload: 'contact_support' }
          ]
        }
      ]
    };
  },
  
  getStartedPayload: function() {
    return {
      get_started: {
        payload: 'get_started'
      }
    };
  },
  
  sendProductCarousel: async function(senderId) {
    return {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: this.getProductCards()
          }
        }
      }
    };
  },
  
  sendQuote: async function(senderId, quote) {
    return {
      recipient: { id: senderId },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'receipt',
            recipient_name: 'Quy khach',
            order_number: quote.id,
            elements: [
              { title: quote.package.name, price: quote.total },
              { title: 'Lắp đặt', price: quote.installation }
            ],
            summary: {
              total_cost: quote.total
            }
          }
        }
      }
    };
  }
};