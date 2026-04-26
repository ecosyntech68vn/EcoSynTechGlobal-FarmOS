/**
 * Telegram Sales Bot
 * Bot tự động tư vấn & bán hàng trên Telegram
 * 
 * CẤU HÌNH:
 * - config.botToken: Telegram Bot Token (lấy từ @BotFather)
 * - config.adminChatIds: Danh sách chat ID admin nhận thông báo
 * - config.productCatalog: Danh sách sản phẩm
 * - config.responses: Câu trả lời tự động theo từ khóa
 * 
 * CÁCH SỬ DỤNG:
 * const bot = new TelegramSalesBotSkill();
 * await bot.execute({
 *   message: { text: ' Xin chào, tôi muốn mua sản phẩm' },
 *   chatId: '123456789',
 *   mode: 'handle' // 'handle' hoặc 'setup'
 * });
 */

const axios = require('axios');

class TelegramSalesBotSkill {
  static name = 'telegram-sales-bot';
  static description = 'Bot Telegram tự động tư vấn & bán hàng';

  constructor() {
    this.config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      adminChatIds: (process.env.ADMIN_CHAT_IDS || '').split(',').filter(Boolean),
      welcomeMessage: process.env.BOT_WELCOME || 'Xin chào! 👋\n\nTôi là trợ lý ảo của EcoSynTech. Bạn cần hỗ trợ gì?',
      catalog: [],
      keywordResponses: {}
    };
    
    this.apiBase = 'https://api.telegram.org/bot';
    this.conversations = new Map();
    this.products = this.getDefaultProducts();
    this.intents = this.getDefaultIntents();
  }

  async execute(context) {
    const {
      message = {},
      chatId = '',
      mode = 'handle'
    } = context;

    if (mode === 'setup') {
      return this.setupBot();
    }

    if (mode === 'handle' && message.text && chatId) {
      return await this.handleMessage(message, chatId);
    }

    return {
      status: 'ready',
      configInstructions: this.getConfigInstructions(),
      testMode: 'Run with mode: handle + message + chatId'
    };
  }

  // ========== HANDLE INCOMING MESSAGE ==========
  async handleMessage(message, chatId) {
    const text = message.text?.toLowerCase() || '';
    const userId = chatId;

    // Get or create conversation
    let conversation = this.conversations.get(userId) || {
      step: 'greeting',
      data: {},
      history: []
    };

    // Detect intent
    const intent = this.detectIntent(text);
    
    // Generate response
    let response = '';
    let actions = [];

    switch (intent) {
      case 'greeting':
        response = `Xin chào! 👋\n\nTôi là trợ lý ảo của EcoSynTech.\n\nBạn cần hỗ trợ gì?\n\n📋 <b>Các lựa chọn:</b>\n\n1️⃣ Xem sản phẩm\n2️⃣ Báo giá\n3️⃣ Liên hệ tư vấn\n4️⃣ Đặt lịch\n5️⃣ Hỗ trợ kỹ thuật`;
        conversation.step = 'menu';
        break;

      case 'products':
        response = this.formatProductList();
        conversation.step = 'product_selected';
        break;

      case 'pricing':
        response = '📊 <b>Báo giá chi tiết:</b>\n\nVui lòng cho tôi biết:\n- Số lượng người dùng\n-需求的功\u001d呢\n- Yêu cầu đặc biệt\n\nTôi sẽ gửi báo giá trong 24h!';
        conversation.step = 'pricing';
        break;

      case 'contact':
        response = '📞 <b>Liên hệ tư vấn:</b>\n\n- 📧 Email: support@ecosyntech.com\n- 📱 Zalo: 0123 456 789\n- 🌐 Website: ecosyntech.com\n\nAdmin sẽ liên hệ bạn trong giây lát!';
        this.notifyAdmin(chatId, message.text);
        conversation.step = 'contacted';
        break;

      case 'order':
        response = '🛒 <b>Đặt hàng:</b>\n\nBạn quan tâm sản phẩm nào?\n\nGõ số hoặc tên sản phẩm để tiếp tục!';
        conversation.step = 'ordering';
        break;

      case 'support':
        response = '🔧 <b>Hỗ trợ kỹ thuật:</b>\n\nBạn gặp vấn đề gì?\n\n1️⃣ Lỗi đăng nhập\n2️⃣ Lỗi tính năng\n3️⃣ Cần hướng dẫn\n4️⃣ Vấn đề khác';
        conversation.step = 'support';
        break;

      case 'default':
        response = 'Cảm ơn bạn! Tôi đã ghi nhận và sẽ phản hồi sớm nhất.\n\n📞 Hoặc liên hệ: 0123 456 789';
        this.notifyAdmin(chatId, text);
        conversation.step = 'default';
        break;
    }

    // Save conversation
    conversation.history.push({ user: text, bot: response });
    this.conversations.set(userId, conversation);

    // Send response to Telegram
    const sent = await this.sendMessage(chatId, response);

    return {
      intent,
      response,
      conversation: conversation.step,
      sent: sent?.ok || false,
      adminNotified: intent === 'contact' || intent === 'default'
    };
  }

  // ========== DETECT INTENT ==========
  detectIntent(text) {
    const keywords = {
      greeting: ['xin chào', 'hi', 'hello', 'hey', 'start', 'bắt đầu'],
      products: ['sản phẩm', 'product', 'xem', 'catalog', 'danh sách', 'giới thiệu'],
      pricing: ['giá', 'price', 'báo giá', 'chi phí', 'cost', 'bao nhiêu'],
      contact: ['liên hệ', 'contact', 'support', 'hỗ trợ', 'gọi', 'zalo'],
      order: ['đặt', 'mua', 'order', 'purchase', 'buy', 'thanh toán'],
      support: ['lỗi', 'bug', 'error', 'hỗ trợ', 'kỹ thuật', 'help']
    };

    for (const [intent, words] of Object.entries(keywords)) {
      if (words.some(w => text.includes(w))) return intent;
    }
    return 'default';
  }

  // ========== SEND MESSAGE TO TELEGRAM ==========
  async sendMessage(chatId, text) {
    if (!this.config.botToken) {
      console.log('[TELEGRAM] Bot token not configured');
      return { ok: false };
    }

    try {
      const response = await axios.post(
        `${this.apiBase}${this.config.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: this.getKeyboard()
        }
      );
      return response.data;
    } catch (error) {
      console.error('[TELEGRAM] Send error:', error.message);
      return { ok: false, error: error.message };
    }
  }

  // ========== NOTIFY ADMIN ==========
  async notifyAdmin(userChatId, message) {
    if (this.config.adminChatIds.length === 0) return;

    const adminMessage = `📨 <b>Lead mới!</b>\n\n👤 Chat ID: ${userChatId}\n💬 Tin nhắn: ${message}`;
    
    for (const adminId of this.config.adminChatIds) {
      await this.sendMessage(adminId, adminMessage);
    }
  }

  // ========== KEYBOARDS ==========
  getKeyboard() {
    return {
      keyboard: [
        [{ text: '📦 Xem sản phẩm' }, { text: '💰 Báo giá' }],
        [{ text: '📞 Liên hệ' }, { text: '🛒 Đặt hàng' }],
        [{ text: '🔧 Hỗ trợ' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    };
  }

  // ========== PRODUCT LIST ==========
  getDefaultProducts() {
    return [
      { id: 1, name: 'EcoSynTech Suite', price: 'Liên hệ', description: 'Giải pháp toàn diện' },
      { id: 2, name: 'AI Assistant', price: 'Liên hệ', description: 'Trợ lý AI' },
      { id: 3, name: 'Analytics Pro', price: 'Liên hệ', description: 'Phân tích dữ liệu' }
    ];
  }

  formatProductList() {
    let list = '📦 <b>DANH SÁCH SẢN PHẨM</b>\n\n';
    this.products.forEach(p => {
      list += `🔹 <b>${p.name}</b>\n${p.description}\n💵 Giá: ${p.price}\n\n`;
    });
    list += '\n📩 Gõ tên sản phẩm để biết thêm chi tiết!';
    return list;
  }

  getDefaultIntents() {
    return [
      { name: 'greeting', patterns: ['xin chào', 'hi', 'hello'] },
      { name: 'products', patterns: ['sản phẩm', 'xem'] },
      { name: 'pricing', patterns: ['giá', 'báo giá'] }
    ];
  }

  // ========== SETUP ==========
  setupBot() {
    return {
      status: 'Bot ready',
      webhookUrl: `YOUR_SERVER/webhook/telegram`,
      commands: [
        { command: 'start', description: 'Bắt đầu' },
        { command: 'products', description: 'Xem sản phẩm' },
        { command: 'help', description: 'Trợ giúp' }
      ],
      config: this.getConfigInstructions()
    };
  }

  getConfigInstructions() {
    return {
      step1: 'Mở @BotFather trên Telegram',
      step2: 'Gõ /newbot để tạo bot mới',
      step3: 'Copy bot token',
      step4: 'Đặt biến môi trường TELEGRAM_BOT_TOKEN',
      step5: 'Enable webhook trỏ đến server của bạn'
    };
  }
}

module.exports = TelegramSalesBotSkill;