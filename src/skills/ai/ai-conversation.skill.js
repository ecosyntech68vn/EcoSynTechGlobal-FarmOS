module.exports = {
  id: 'ai-conversation',
  name: 'AI Context Conversation',
  description: 'Multi-turn conversation with context memory and smart follow-ups',
  triggers: [
    'event:ai.chat',
    'event:ai.talk',
    'event:ai.ask',
    'event:ai.reply',
    'cron:1m'
  ],
  riskLevel: 'low',
  canAutoFix: false,
  
  conversationHistory: {},
  maxHistoryPerUser: 10,
  
  run: function(ctx) {
    var event = ctx.event || {};
    var action = event.action || 'chat';
    var userId = event.userId || 'default';
    var message = event.message || event.text || '';
    var stateStore = ctx.stateStore;
    
    var result = {
      ok: true,
      action: action,
      userId: userId,
      timestamp: new Date().toISOString(),
      reply: null,
      suggestions: [],
      contextUsed: 0
    };
    
    switch (action) {
      case 'chat':
      case 'talk':
      case 'ask':
        var history = this.getHistory(userId, stateStore);
        var context = this.buildContext(history);
        var intent = this.detectIntent(message, context);
        
        result.intent = intent.type;
        result.entities = intent.entities;
        result.reply = this.generateReply(message, intent, context, event.lang || 'vi');
        result.suggestions = this.getSuggestions(intent.type, message, event.lang || 'vi');
        result.contextUsed = history.length;
        
        this.addToHistory(userId, message, result.reply, stateStore);
        break;
        
      case 'reply':
        result.reply = this.generateReply(message, {type: 'general'}, [], event.lang || 'vi');
        break;
        
      case 'clear':
        this.clearHistory(userId, stateStore);
        result.reply = 'Đã xóa lịch sử cuộc trò chuyện.';
        break;
        
      case 'history':
        var hist = this.getHistory(userId, stateStore);
        result.history = hist;
        result.reply = 'Có ' + hist.length + ' tin nhắn trong lịch sử.';
        break;
        
      default:
        result.reply = 'Có thể nói chuyện với tôi. Hỏi về ECOSYNTECH nhé!';
    }
    
    return result;
  },
  
  detectIntent: function(message, context) {
    var msgLower = message.toLowerCase();
    var intent = { type: 'general', entities: {} };
    
    if (msgLower.indexOf('giá') !== -1 || msgLower.indexOf('bao nhiêu') !== -1 || msgLower.indexOf('tiền') !== -1) {
      intent.type = 'pricing';
    } else if (msgLower.indexOf('cài') !== -1 || msgLower.indexOf('cài đặt') !== -1 || msgLower.indexOf('setup') !== -1) {
      intent.type = 'setup';
    } else if (msgLower.indexOf('cảm biến') !== -1 || msgLower.indexOf('sensor') !== -1) {
      intent.type = 'sensor';
    } else if (msgLower.indexOf('qr') !== -1 || msgLower.indexOf('truy xuất') !== -1) {
      intent.type = 'qr';
    } else if (msgLower.indexOf('telegram') !== -1 || msgLower.indexOf('bot') !== -1) {
      intent.type = 'telegram';
    } else if (msgLower.indexOf('cấu hình') !== -1 || msgLower.indexOf('config') !== -1 || msgLower.indexOf('thiết lập') !== -1) {
      intent.type = 'config';
    } else if (msgLower.indexOf('lỗi') !== -1 || msgLower.indexOf('help') !== -1 || msgLower.indexOf('khắc phục') !== -1) {
      intent.type = 'troubleshoot';
    } else if (msgLower.indexOf('automation') !== -1 || msgLower.indexOf('tự động') !== -1 || msgLower.indexOf('smart') !== -1) {
      intent.type = 'automation';
    } else if (/xin chào|chào|hi|hello/.test(msgLower)) {
      intent.type = 'greeting';
    } else if (/cảm ơn|thanks|thank/.test(msgLower)) {
      intent.type = 'thanks';
    } else if (msgLower.indexOf('AI') !== -1 || msgLower.indexOf('thông minh') !== -1) {
      intent.type = 'ai';
    } else if (context.length > 0) {
      var lastIntent = context[context.length - 1]?.intent;
      if (lastIntent && msgLower.indexOf('?') === -1 && msgLower.length < 50) {
        intent.type = 'answer_to_previous';
        intent.previousIntent = lastIntent;
      }
    }
    
    var cropMatch = message.match(/(rau muống|rau cải|cà chua|dưa leo|cá|thịt)/i);
    if (cropMatch) {
      intent.entities.crop = cropMatch[1];
    }
    
    var deviceMatch = message.match(/(máy bơm|đèn|quạt|relay)/i);
    if (deviceMatch) {
      intent.entities.device = deviceMatch[1];
    }
    
    var thresholdMatch = message.match(/(\d+)(%|độ)?/);
    if (thresholdMatch) {
      intent.entities.threshold = thresholdMatch[1];
    }
    
    return intent;
  },
  
  generateReply: function(message, intent, context, lang) {
    var replies = {
      vi: {
        greeting: 'Chào quý khách! Tôi là trợ lý ảo của ECOSYNTECH. Có thể giúp gì về hệ thống nông nghiệp thông minh?',
        pricing: 'Giá ECOSYNTECH: Free (0đ), Basic 99K/tháng, Pro 299K/tháng. Năm đầu chỉ cần mua thiết bị 300-500K. Khác biệt là backend và database hoàn toàn miễn phí!',
        setup: 'Cài đặt rất đơn giản: git clone, npm install, npm start. Xem hướng dẫn chi tiết trong README.md nhé!',
        sensor: 'Hỗ trợ nhiều loại cảm biến: DHT22 (nhiệt/ẩm), DS18B20 (nhiệt), Soil moisture (đất), pH, EC, Light. Cắm vào port tương ứng là nhận.',
        qr: 'QR tự tạo khi bạn tạo lô hàng. Vào mục Truy xuất, tạo lô mới, QR in tự động. Khách scan là xem toàn bộ journey.',
        telegram: 'Telegram bot: /start /status /sensors /alerts /devices /rules /controls /help. Rất tiện!',
        config: 'Cấu hình trong file .env hoặc dashboard. Cơ bản chỉ cần WiFi và sensors.',
        troubleshoot: 'Có vấn đề? Thử restart: npm start. Xem logs trong folder logs/. Hoặc hỏi cụ thể vấn đề gì?',
        automation: 'Automation qua Smart Control: Tạo rule trong dashboard với điều kiện và hành động. Ví dụ: soil < 30 → bật máy bơm trong 5 phút.',
        thanks: 'Không có chi! Cần gì cứ hỏi nhé. Chúc vui!',
        ai: 'AI trong ECOSYNTECH gồm: AI Advisory dự đoán thời tiết, Anomaly phát hiện bất thường, Predictive Maintenance dự đoán hỏng thiết bị.',
        answer_to_previous: 'Bạn muốn biết thêm về điểm đó? Cứ hỏi nhé!',
        general: 'Câu hỏi hay! ECOSYNTECH là nền tảng nông nghiệp thông minh với 60 skills tự động. Bạn quan tâm điểm nào nhất?'
      },
      en: {
        greeting: 'Hello! I am ECOSYNTECH virtual assistant. How can I help with the smart agriculture system?',
        pricing: 'ECOSYNTECH pricing: Free (0), Basic 99K/month, Pro 299K/month. First year only device cost 300-500K. Free backend and database!',
        setup: 'Setup is simple: git clone, npm install, npm start. See README.md for details!',
        sensor: 'Supported sensors: DHT22 (temp/humidity), DS18B20 (temp), Soil moisture, pH, EC, Light. Plug into port.',
        qr: 'QR auto-generated when creating batch. Go to Traceability, create batch, print QR. Customer scans to view journey.',
        telegram: 'Telegram commands: /start /status /sensors /alerts /devices /rules /controls /help. Very convenient!',
        config: 'Configure in .env file or dashboard. Basic just needs WiFi and sensors.',
        troubleshoot: 'Problem? Try restart: npm start. Check logs in logs/. Or ask specific issue.',
        automation: 'Automation via Smart Control: Create rule with condition and action. Example: soil < 30 → pump on for 5 min.',
        thanks: 'You are welcome! Feel free to ask. Have a nice day!',
        ai: 'AI in ECOSYNTECH: Advisory (weather), Anomaly (detection), Predictive Maintenance.',
        answer_to_previous: 'Want more about that? Just ask!',
        general: 'Interesting question! ECOSYNTECH is a smart agriculture platform with 60 automation skills. What interests you most?'
      },
      zh: {
        greeting: '你好！我是ECOSYNTECH虚拟助手。可以帮助智慧农业系统方面的问题吗？',
        pricing: 'ECOSYNTECH价格：免费、基础版99K/月、专业版299K/月。第一年只需设备费300-500K。后端和数据库免费！',
        setup: '安装简单：git clone, npm install, npm start。详见README.md！',
        sensor: '支持的传感器：DHT22（温湿度）、DS18B20（温度）、土壤湿度、pH、EC、光。插入端口即可。',
        qr: '创建批次时自动生成二维码。去溯源，创建批次，打印二维码。客户扫描查看流程。',
        telegram: 'Telegram命令：/start /status /sensors /alerts /devices /rules /controls /help。非常方便！',
        config: '在.env文件或仪表板配置。基本只需要WiFi和传感器。',
        troubleshoot: '有问题？尝试重启：npm start。查看logs/中的日志。或询问具体问题。',
        automation: '自动化通过智能控制：创建规则并设置条件和动作。例如：土壤<30→水泵开启5分钟。',
        thanks: '不客气！有需要随时问。祝您愉快！',
        ai: 'ECOSYNTECH的AI包括：顾问（天气）、异常检测、预测性维护。',
        answer_to_previous: '想了解更多吗？请问！',
        general: '有趣的问题！ECOSYNTECH是具有60个自动化技能的智慧农业平台。您最关心什么？'
      }
    };
    
    var langReplies = replies[lang] || replies.vi;
    
    if (intent.type === 'general' && intent.entities.crop) {
      return langReplies[lang].crop;
    }
    
    return langReplies[intent.type] || langReplies.general;
  },
  
  getSuggestions: function(intentType, message, lang) {
    var suggestions = {
      vi: [
        'Giá bao nhiêu?',
        'Cách cài đặt?',
        'Hỗ trợ cảm biến nào?',
        'QR hoạt động sao?',
        'Telegram bot là gì?'
      ],
      en: [
        'How much does it cost?',
        'How to install?',
        'What sensors are supported?',
        'How does QR work?',
        'What is Telegram bot?'
      ],
      zh: [
        '要多少钱？',
        '如何安装？',
        '支持哪些传感器？',
        '二维码如何工作？',
        'Telegram机器人是什么？'
      ]
    };
    
    return suggestions[lang] || suggestions.vi;
  },
  
  getHistory: function(userId, stateStore) {
    if (stateStore) {
      var allHistory = stateStore.get('ai_conversation_history') || {};
      return allHistory[userId] || [];
    }
    return this.conversationHistory[userId] || [];
  },
  
  addToHistory: function(userId, userMsg, botReply, stateStore) {
    var history = this.getHistory(userId, stateStore);
    
    history.push({
      user: userMsg,
      bot: botReply,
      timestamp: Date.now(),
      intent: this.detectIntent(userMsg, history).type
    });
    
    if (history.length > this.maxHistoryPerUser) {
      history = history.slice(-this.maxHistoryPerUser);
    }
    
    if (stateStore) {
      var allHistory = stateStore.get('ai_conversation_history') || {};
      allHistory[userId] = history;
      stateStore.set('ai_conversation_history', allHistory);
    } else {
      this.conversationHistory[userId] = history;
    }
  },
  
  clearHistory: function(userId, stateStore) {
    if (stateStore) {
      var allHistory = stateStore.get('ai_conversation_history') || {};
      delete allHistory[userId];
      stateStore.set('ai_conversation_history', allHistory);
    } else {
      this.conversationHistory[userId] = [];
    }
  },
  
  buildContext: function(history) {
    return history.slice(-3);
  },
  
  getAvailableLanguages: function() {
    return ['vi', 'en', 'zh'];
  }
};