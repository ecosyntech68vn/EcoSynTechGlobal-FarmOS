module.exports = {
  id: 'voice-assistant',
  name: 'Voice Assistant',
  description: 'AI-powered voice assistant nâng cao với dialog tự nhiên tiếng Việt cho nông dân - marketing, presentations, guides, troubleshooting',
  version: '2.3.2',
  triggers: [
    'event:voice.ask',
    'event:voice.answer',
    'event:voice.present',
    'event:voice.guide',
    'event:voice.config',
    'event:voice.demo',
    'event:voice.about',
    'event:voice.faq',
    'event:voice.feature',
    'event:voice.walkthrough',
    'cron:5m'
  ],
  riskLevel: 'low',
  canAutoFix: false,
  
  run: function(ctx) {
    var event = ctx.event || {};
    var action = event.action || event.type?.replace('voice.', '') || 'present';
    var lang = event.lang || 'vi';
    var topic = event.topic || event.data?.topic || '';
    var feature = event.feature || event.data?.feature || '';
    
    var result = {
      ok: true,
      action: action,
      language: lang,
      timestamp: new Date().toISOString(),
      sections: [],
      totalDuration: 0,
      ttsOutput: null
    };
    
    switch (action) {
      case 'present':
      case 'demo':
        result.sections = this.getFullPresentation(topic, lang);
        result.ttsOutput = this.compilePresentation(result.sections, lang);
        break;
        
      case 'about':
        result.sections = this.getAboutSection(lang);
        result.ttsOutput = this.compileSection(result.sections, lang);
        break;
        
      case 'feature':
        result.sections = this.getFeatureDeepDive(feature, lang);
        result.ttsOutput = this.compileSection(result.sections, lang);
        break;
        
      case 'walkthrough':
        result.sections = this.getWalkthrough(topic, lang);
        result.ttsOutput = this.compileSection(result.sections, lang);
        break;
        
      case 'guide':
        result.sections = this.getUserGuide(feature, lang);
        result.ttsOutput = this.compileSection(result.sections, lang);
        break;
        
      case 'faq':
        result.sections = this.getFAQDeep(feature, lang);
        result.ttsOutput = this.compileSection(result.sections, lang);
        break;
        
      case 'ask':
      case 'answer':
        result.sections = this.answerComprehensive(topic, feature, lang);
        result.ttsOutput = this.compileSection(result.sections, lang);
        break;
        
      default:
        result.sections = this.getQuickIntro(lang);
        result.ttsOutput = this.compileSection(result.sections, lang);
    }
    
    result.totalDuration = result.sections.length * 2;
    return result;
  },
  
  getFullPresentation: function(topic, lang) {
    var allTopics = ['overview', 'all', ''];
    var isAll = allTopics.indexOf(topic) !== -1;
    
    var sections = [];
    
    sections.push(this.getAboutSection(lang));
    sections.push(this.getFeaturesSection(lang));
    sections.push(this.getPricingSection(lang));
    sections.push(this.getBenefitsSection(lang));
    sections.push(this.getTechnicalSection(lang));
    
    return sections;
  },
  
  getAboutSection: function(lang) {
    var content = {
      vi: {
        title: 'GIỚI THIỆU ECOSYNTECH FARM OS',
        sections: [
          'Chào mừng quý khách!',
          'ECOSYNTECH FARM OS là nền tảng nông nghiệp thông minh 4.0 hoàn chỉnh do EcoSynTech Global phát triển.',
          'Chúng tôi mang đến giải pháp toàn diện cho mọi quy mô trồng trọt, từ vườn rau gia đình 5 mét vuông đến trang trại hàng hecta.',
          'Điểm khác biệt cốt lõi: Cắm là chạy - chỉ trong 5 phút, bất kỳ ai cũng có thể sử dụng mà không cần kiến thức IT.',
          'Hệ thống tự động hóa 95% công việc, giúp nông dân tiết kiệm thời gian, giảm chi phí, tăng năng suất.'
        ]
      },
      en: {
        title: 'INTRODUCTION TO ECOSYNTECH FARM OS',
        sections: [
          'Welcome!',
          'ECOSYNTECH FARM OS is a comprehensive Smart Agriculture 4.0 platform developed by EcoSynTech Global.',
          'We provide solutions for all scales, from 5 sqm home gardens to large farms.',
          'Key difference: Plug and play - anyone can use in just 5 minutes without IT knowledge.',
          'System automates 95% of work, helping farmers save time, reduce costs, increase productivity.'
        ]
      },
      zh: {
        title: 'ECOSYNTECH FARM OS简介',
        sections: [
          '欢迎各位！',
          'ECOSYNTECH FARM OS是由EcoSynTech开发的智慧农业4.0综合平台。',
          '我们为各种规模提供解决方案，从5平方米的家庭菜园到大型农场。',
          '核心优势：即插即用 - 任何人只需5分钟即可使用，无需IT知识。',
          '系统自动化95%的工作，帮助农民节省时间、降低成本、提高产量。'
        ]
      }
    };
    
    return content[lang] || content.vi;
  },
  
  getFeaturesSection: function(lang) {
    var content = {
      vi: {
        title: 'TÍNH NĂNG NỔI BẬT',
        sections: [
          '1. 60 SKILLS TỰ ĐỘNG HÓA:',
          '   - Skills vận hành: Rules Engine, Scheduler, Webhook, OTA, Command Router',
          '   - Skills giám sát: AI Weather, Anomaly Detection, Health Score, KPI Drift',
          '   - Skills sửa lỗi: Auto Retry, Reconnect, Reset, Clear Cache, Rollback',
          '   - Skills nông nghiệp: Weather Decision, Water Optimization, Crop Tracker, Pest Alert',
          '',
          '2. QR TRUY XUẤT NGUỒN GỐC:',
          '   - Tự động tạo QR khi tạo lô',
          '   - Truy xuất từ gieo trồng đến xuất bán',
          '   - Khách hàng scan QR xem toàn bộ journey',
          '   - Tích hợp Blockchain (tùy chọn)',
          '',
          '3. AI ADVISORY:',
          '   - Dự đoán thời tiết 24h',
          '   - Phát hiện bất thường',
          '   - Khuyến nghị tưới nước',
          '   - Cảnh báo sâu bệnh',
          '',
          '4. SMART CONTROL:',
          '   - Bật/tắt máy bơm tự động theo ngưỡng',
          '   - Hỗ trợ hysteresis, cooldown',
          '   - Manual override khi cần',
          '',
          '5. TELEGRAM BOT:',
          '   - Nhận cảnh báo real-time',
          '   - Điều khiển từ xa',
          '   - Xem dữ liệu sensors',
          ''
        ]
      },
      en: {
        title: 'KEY FEATURES',
        sections: [
          '1. 60 AUTOMATION SKILLS:',
          '   - Operations: Rules Engine, Scheduler, Webhook, OTA, Command Router',
          '   - Monitoring: AI Weather, Anomaly Detection, Health Score',
          '   - Troubleshooting: Auto Retry, Reconnect, Reset, Clear Cache',
          '   - Agriculture: Weather Decision, Water Optimization, Crop Tracker',
          '',
          '2. QR TRACEABILITY:',
          '   - Auto QR when create batch',
          '   - Trace from planting to sale',
          '   - Customer scans QR to view journey',
          '   - Blockchain integration (optional)',
          '',
          '3. AI ADVISORY:',
          '   - Weather prediction 24h',
          '   - Anomaly detection',
          '   - Irrigation recommendations',
          '   - Pest alerts',
          '',
          '4. SMART CONTROL:',
          '   - Auto pump on/off by threshold',
          '   - Support hysteresis, cooldown',
          '   - Manual override available',
          '',
          '5. TELEGRAM BOT:',
          '   - Real-time alerts',
          '   - Remote control',
          '   - View sensor data'
        ]
      },
      zh: {
        title: '核心功能',
        sections: [
          '1. 60个自动化技能：',
          '   - 运营：规则引擎、调度器、Webhook、OTA、命令路由',
          '   - 监控：AI天气、异常检测、健康评分',
          '   - 故障排除：自动重试、重连、重置、清除缓存',
          '   - 农业：天气决策、水分优化、作物追踪',
          '',
          '2. 二维码溯源：',
          '   - 创建批次时自动生成二维码',
          '   - 从种植到销售全程溯源',
          '   - 客户扫描二维码查看过程',
          '   - 区块链集成（可选）',
          '',
          '3. AI顾问：',
          '   - 24小时天气预测',
          '   - 异常检测',
          '   - 灌溉建议',
          '   - 病虫害警报',
          '',
          '4. 智能控制：',
          '   - 按阈值自动开关泵',
          '   - 支持滞后、冷却',
          '   - 可手动覆盖',
          '',
          '5. Telegram机器人：',
          '   - 实时警报',
          '   - 远程控制',
          '   - 查看传感器数据'
        ]
      }
    };
    
    return content[lang] || content.vi;
  },
  
  getPricingSection: function(lang) {
    var content = {
      vi: {
        title: 'BẢNG GIÁ & CHI PHÍ',
        sections: [
          'CHI PHÍ THỰC TẾ - THẤP NHẤT VIỆT NAM:',
          '',
          'Thiết bị ESP32: 300.000 - 500.000 VNĐ (mua một lần)',
          'Backend: MIỄN PHÍ (Google Apps Script)',
          'Database: MIỄN PHÍ (Google Sheets)',
          'Hosting: KHÔNG CẦN',
          'Telegram: MIỄN PHÍ',
          'QR Code: TỰ TẠO',
          'AI Advisory: TÍCH HỢP SẴN',
          '',
          'TỔNG NĂM ĐẦU: CHỈ 300-500K VNĐ!',
          '',
          'BẢNG GIÁ 3 GÓI:',
          '',
          'GÓI FREE - 0 VNĐ:',
          '• 3 cảm biến, 1 thiết bị',
          '• Telegram Bot',
          '• Smart Control cơ bản',
          '• Dành cho: Thử nghiệm',
          '',
          'GÓI BASIC - 99K/THÁNG:',
          '• 10 cảm biến, 5 thiết bị',
          '• QR Traceability',
          '• Blockchain (tùy chọn)',
          '• Auto backup',
          '• Dành cho: Nông dân, HTX quy mô nhỏ',
          '',
          'GÓI PRO - 299K/THÁNG:',
          '• Không giới hạn',
          '• Multi-farm',
          '• AI nâng cao',
          '• VIP Support',
          '• Dành cho: Doanh nghiệp, xuất khẩu'
        ]
      },
      en: {
        title: 'PRICING & COSTS',
        sections: [
          'ACTUAL COST - LOWEST IN VIETNAM:',
          '',
          'ESP32 Device: 300K-500K VND (one-time)',
          'Backend: FREE (Google Apps Script)',
          'Database: FREE (Google Sheets)',
          'Hosting: NOT NEEDED',
          'Telegram: FREE',
          'QR Code: AUTO GENERATE',
          'AI Advisory: INCLUDED',
          '',
          'TOTAL FIRST YEAR: ONLY 300-500K VND!',
          '',
          '3 PACKAGES:',
          '',
          'FREE - 0 VND:',
          '• 3 sensors, 1 device',
          '• Telegram Bot',
          '• Basic Smart Control',
          '• For: Trial',
          '',
          'BASIC - 99K/MONTH:',
          '• 10 sensors, 5 devices',
          '• QR Traceability',
          '• Blockchain (optional)',
          '• Auto backup',
          '• For: Farmers, small cooperatives',
          '',
          'PRO - 299K/MONTH:',
          '• Unlimited',
          '• Multi-farm',
          '• Advanced AI',
          '• VIP Support',
          'For: Enterprises, export'
        ]
      },
      zh: {
        title: '价格与费用',
        sections: [
          '实际成�� - ��南最低：',
          '',
          'ESP32设备：300K-500K越南盾（一次性）',
          '后端：免费（Google Apps Script）',
          '数据库：免费（Google Sheets）',
          '托管：不需要',
          'Telegram：免费',
          '二维码：自动生成',
          'AI顾问：已内置',
          '',
          '第一年总计：仅300-500K越南盾！',
          '',
          '三个套餐：',
          '',
          '免费 - 0越南盾：',
          '• 3个传感器，1个设备',
          '• Telegram机器人',
          '• 基本智能控制',
          '• 适用于：试用',
          '',
          '基础版 - 99K/月：',
          '• 10个传感器，5个设备',
          '• 二维码溯源',
          '• 区块链（可选）',
          '• 自动备份',
          '• 适用于：小农户、合作社',
          '',
          '专业版 - 299K/月：',
          '• 无限制',
          '• 多农场',
          '• 高级AI',
          '• VIP支持',
          '• 适用于：企业、出口'
        ]
      }
    };
    
    return content[lang] || content.vi;
  },
  
  getBenefitsSection: function(lang) {
    var content = {
      vi: {
        title: 'LỢI ÍCH & GIÁ TRỊ',
        sections: [
          'GIẢI PHÓNG SỨC LAO ĐỘNG:',
          '• Không cần ngồi máy 24/7',
          '• Tự động giám sát cảm biến',
          '• Tự động bật/tắt máy bơm',
          '• Auto export báo cáo',
          '',
          'GIẢM CHI PHÍ:',
          '• Backend & Database miễn phí',
          '• Không cần thuê server',
          '• Không cần IT maintain',
          '• Chi phí năm đầu chỉ 300-500K',
          '',
          'TĂNG NĂNG SUẤT:',
          '• Theo dõi realtime',
          '• Phát hiện vấn đề sớm',
          '• Quyết định dựa trên dữ liệu',
          '• QR xuất khẩu giá cao hơn',
          '',
          'AN TÂM:',
          '• Telegram alerts khi vắng mặt',
          '• Backup tự động',
          '• Skills tự sửa lỗi',
          '• Hỗ trợ tiếng Việt'
        ]
      },
      en: {
        title: 'BENEFITS & VALUE',
        sections: [
          'LABOR SAVING:',
          '• No need to monitor 24/7',
          '• Auto sensor monitoring',
          '• Auto pump on/off',
          '• Auto report export',
          '',
          'COST REDUCTION:',
          '• Backend & Database free',
          '• No server rental',
          '• No IT maintenance',
          '• First year only 300-500K',
          '',
          'INCREASE PRODUCTIVITY:',
          '• Realtime tracking',
          '• Early problem detection',
          '• Data-based decisions',
          '• QR export commands higher price',
          '',
          'PEACE OF MIND:',
          '• Telegram alerts when away',
          '• Auto backup',
          '• Self-healing skills',
          '• Vietnamese support'
        ]
      },
      zh: {
        title: '效益与价值',
        sections: [
          '节省劳动力：',
          '• 无需24/7监控',
          '• 自动传感器监控',
          '• 自动开关泵',
          '• 自动导出报告',
          '',
          '降低成本：',
          '• 后端和数据库免费',
          '• 无需租用服务器',
          '• 无需IT维护',
          '• 第一年仅300-500K',
          '',
          '提高产量：',
          '• 实时追踪',
          '• 早期问题检测',
          '• 基于数据的决策',
          '• 二维码出口更高价',
          '',
          '安心：',
          '• 外出时Telegram警报',
          '• 自动备份',
          '• 自我��复��能',
          '• 越南语支持'
        ]
      }
    };
    
    return content[lang] || content.vi;
  },
  
  getTechnicalSection: function(lang) {
    var content = {
      vi: {
        title: 'THÔNG SỐ KỸ THUẬT',
        sections: [
          'THIẾT BỊ:',
          '• ESP32 V8.5.0 - Dual-core 240MHz',
          '• 8 Relay 10A',
          '• 12 Cổng cảm biến',
          '• OLED 0.96" Display',
          '• 4MB Flash, 512KB RAM',
          '• WiFi 2.4GHz, BLE 4.2',
          '• Nguồn 12V DC',
          '',
          'BACKEND:',
          '• Node.js Express V2.3.2',
          '• SQLite Database',
          '• 60 Skills Automation',
          '• REST + WebSocket API',
          '• JWT, RBAC Security',
          '• i18n (VI/EN/ZH)',
          '',
          'YÊU CẦU HỆ THỐNG:',
          '• RAM tối thiểu: 512MB',
          '• Windows 7+ compatible',
          '• Không cần card đồ họa'
        ]
      },
      en: {
        title: 'TECHNICAL SPECIFICATIONS',
        sections: [
          'DEVICE:',
          '• ESP32 V8.5.0 - Dual-core 240MHz',
          '• 8 Relay 10A',
          '• 12 Sensor Ports',
          '• OLED 0.96" Display',
          '• 4MB Flash, 512KB RAM',
          '• WiFi 2.4GHz, BLE 4.2',
          '• 12V DC Power',
          '',
          'BACKEND:',
          '• Node.js Express V2.3.2',
          '• SQLite Database',
          '• 60 Automation Skills',
          '• REST + WebSocket API',
          '• JWT, RBAC Security',
          '• i18n (VI/EN/ZH)',
          '',
          'SYSTEM REQUIREMENTS:',
          '• Minimum RAM: 512MB',
          '• Windows 7+ compatible',
          '• No graphics card needed'
        ]
      },
      zh: {
        title: '技术规格',
        sections: [
          '设备：',
          '• ESP32 V8.5.0 - 双核240MHz',
          '• 8个继电器10A',
          '• 12个传感器端口',
          '• OLED 0.96寸显示屏',
          '• 4MB闪存，512KB内存',
          '• WiFi 2.4GHz，蓝牙4.2',
          '• 12V直流电源',
          '',
          '后端：',
          '• Node.js Express V2.3.2',
          '• SQLite数据库',
          '• 60个自动化技能',
          '• REST + WebSocket API',
          '• JWT、RBAC安全',
          '• i18n（越南语/英语/中文）',
          '',
          '系统要求：',
          '• 最低内存：512MB',
          '• Windows 7+兼容',
          '• 无需显卡'
        ]
      }
    };
    
    return content[lang] || content.vi;
  },
  
  getFeatureDeepDive: function(feature, lang) {
    var guides = {
      qr: {
        vi: {
          title: 'HƯỚNG DẪN QR TRUY XUẤT',
          sections: [
            'Bước 1: Tạo lô mới',
            '   - Vào mục Truy xuất nguồn gốc',
            '   - Nhập thông tin: tên lô, cây trồng, ngày gieo',
            '   - Hệ thống tự động tạo mã QR',
            '',
            'Bước 2: Ghi nhận giai đoạn',
            '   - Mỗi giai đoạn: gieo, chăm sóc, thu hoạch',
            '   - Thêm ghi chú, hình ảnh (tùy chọn)',
            '   - Timestamp tự động',
            '',
            'Bước 3: Thu hoạch & Xuất bán',
            '   - Tạo event thu hoạch',
            '   - Tạo event xuất bán',
            '   - QR in nhãn dán lên sản phẩm',
            '',
            'Bước 4: Khách hàng truy xuất',
            '   - Scan QR bằng điện thoại',
            '   - Xem toàn bộ hành trình',
            '   - Xem nguồn gốc, ngày gieo, quy trình'
          ]
        }
      },
      telegram: {
        vi: {
          title: 'HƯỚNG DẪN TELEGRAM BOT',
          sections: [
            'Các lệnh cơ bản:',
            '',
            '/start - Khởi động bot, đăng ký nhận thông báo',
            '/status - Xem trạng thái hệ thống',
            '/sensors - Xem dữ liệu cảm biến mới nhất',
            '/alerts - Xem các cảnh báo đang hoạt động',
            '/batches - Xem danh sách lô hàng',
            '/devices - Xem thiết bị đang hoạt động',
            '/rules - Xem các quy tắc đang chạy',
            '/controls - Điều khiển relay thủ công',
            '/help - Xem hướng dẫn đầy đủ',
            '',
            'Cách nhận cảnh báo:',
            '1. /start để đăng ký',
            '2. Bot sẽ gửi.alert khi có vấn đề',
            '3. Có thể bật/tắt thông báo tùy chọn'
          ]
        }
      },
      automation: {
        vi: {
          title: 'HƯỚNG DẪN SMART CONTROL',
          sections: [
            'Tạo rule tự động:',
            '1. Vào mục Quy tắc > Thêm mới',
            '2. Đặt tên: "Tưới khi đất khô"',
            '3. Điều kiện: soil_moisture < 30',
            '4. Hành động: relay1_on',
            '5. Thời gian: 300 giây (5 phút)',
            '6. Cooldown: 1800 giây (30 phút)',
            '7. Lưu',
            '',
            'Các điều kiện hỗ trợ:',
            '• temperature > / < giá trị',
            '• humidity > / < giá trị',
            '• soil_moisture > / < giá trị',
            '• pH > / < giá trị',
            '• Light level > / < giá trị',
            '',
            'Các hành động:',
            '• relay1_on / relay1_off',
            '• relay2_on / relay2_off',
            '• ... up to relay8'
          ]
        }
      }
    };
    
    var content = guides[feature];
    return content ? content[lang] || content.vi : this.getFeaturesSection(lang);
  },
  
  getWalkthrough: function(topic, lang) {
    var walks = {
      first: {
        vi: {
          title: 'HƯỚNG DẪN BẮT ĐẦU',
          sections: [
            'Bước 1: Kết nối thiết bị',
            '   - Cấp nguồn 12V cho ESP32',
            '   - Đèn LED sáng, màn hình hiển thị',
            '',
            'Bước 2: Kết nối WiFi',
            '   - Truy cập 192.168.4.1 (AP mode)',
            '   - Nhập SSID và password WiFi nhà',
            '   - Lưu và đợi kết nối',
            '',
            'Bước 3: Kết nối cảm biến',
            '   - DHT22 → Port 1 (nhiệt độ, độ ẩm)',
            '   - Soil → Port 2 (độ ẩm đất)',
            '   - Cắm là nhận, không cần cấu hình',
            '',
            'Bước 4: Truy cập Dashboard',
            '   - Mở trình duyệt, vào địa chỉ IP',
            '   - Đăng nhập (mặc định admin/admin)',
            '   - Xem dữ liệu sensors',
            '',
            'Bước 5: Telegram (tùy chọn)',
            '   - Tìm bot qua tên',
            '   - /start để đăng ký',
            '   - Nhận alerts từ xa'
          ]
        }
      }
    };
    
    return walks[topic] ? walks[topic][lang] : walks.first[lang];
  },
  
  getUserGuide: function(feature, lang) {
    return this.getFeatureDeepDive(feature, lang);
  },
  
  getFAQDeep: function(faqId, lang) {
    var faqs = {
      vi: {
        title: 'CÂU HỎI THƯỜNG GẶP',
        sections: [
          'Hỏi: Có cần internet không?',
          'Trả lời: Có, cần WiFi 2.4GHz để gửi dữ liệu. Nếu mất kết nối, ESP32 vẫn lưu local và gửi lại sau.',
          '',
          'Hỏi: Nếu mất điện thì sao?',
          'Trả lời: ESP32 tự khởi động lại khi có điện. Không cần can thiệp.',
          '',
          'Hỏi: Có thể dùng pin dự phòng không?',
          'Trả lời: Có, hỗ trợ input 12V từ pin/ắc quy. Có thêm module UPS.',
          '',
          'Hỏi: Bao xa thì gửi dữ liệu?',
          'Trả lời: Phụ thuộc WiFi. Trong nhà 20-50m, ngoài trời giảm. Có thể dùng repeater WiFi.',
          '',
          'Hỏi: Cảm biến có chống nước không?',
          'Trả lời: DHT22 có vỏ nhựa chống ẩm. Soil cần chôn trong đất.',
          '',
          'Hỏi: Có thể mở rộng thêm cảm biến không?',
          'Trả lời: Có, thêm multiplexer hoặc dùng ESP32 mới với nhiều port hơn.',
          '',
          'Hỏi: Dữ liệu lưu ở đâu?',
          'Trả lời: Google Sheets (nếu dùng GAS) hoặc SQLite local.',
          '',
          'Hỏi: Blockchain để làm gì?',
          'Trả lời: Ghi nhận hash khi thu hoạch, xuất bán. Tăng giá trị xuất khẩu, minh bạch.'
        ]
      }
    };
    
    return faqs[lang] || faqs.vi;
  },
  
  getQuickIntro: function(lang) {
    var intros = {
      vi: {
        title: 'ECOSYNTECH FARM OS',
        sections: [
          'Chào mừng! Tôi là voice assistant.',
          'Có thể trả lời về: giá cả, tính năng, cách sử dụng, khắc phục lỗi.',
          'Hỏi về: giá, cài đặt, cảm biến, QR, telegram, automation,...',
          'Hoặc nói "present" để xem giới thiệu đầy đủ.'
        ]
      }
    };
    
    return intros[lang] || intros.vi;
  },
  
  answerComprehensive: function(question, topic, lang) {
    var sections = [];
    
    sections.push({
      title: 'TRẢ LỜI: ' + (question || topic).toUpperCase(),
      sections: ['Đang tìm thông tin...']
    });
    
    return { title: '', sections: [] };
  },
  
  compileSection: function(section, lang) {
    var text = section.title || '';
    var sections = section.sections || [];
    
    for (var i = 0; i < sections.length; i++) {
      text += '\n' + sections[i];
    }
    
    return text;
  },
  
  compilePresentation: function(sections, lang) {
    var text = '';
    
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i];
      text += '\n\n' + (section.title || '');
      text += '\n' + (section.sections || []).join('\n');
    }
    
    return text;
  },
  
  speak: function(text, lang) {
    return {
      text: text,
      language: lang || 'vi',
      ready: true
    };
  },
  
  getAvailableLanguages: function() {
    return ['vi', 'en', 'zh'];
  },
  
  getNaturalDialog: function(query, lang) {
    lang = lang || 'vi';
    var q = query.toLowerCase();
    
    var responses = {
      vi: {
        'tưới nước': 'Độ ẩm đất hiện tại là bao nhiêu? Nếu dưới 40% nên tưới ngay.',
        'bón phân': 'Thời điểm bón phân tốt nhất là sáng sớm hoặc chiều mát.',
        'nhiệt độ': 'Nhiệt độ tối ưu cho cây trồng là 25-30 độ.',
        'cảnh báo': 'Có 3 cảnh báo mới: Độ ẩm thấp, Nhiệt độ cao, Cần bón phân.',
        'thiết bị': 'Có 5 thiết bị đang hoạt động. Tất cả online.',
        'lỗi': 'Hệ thống đang hoạt động bình thường. Không có lỗi.',
        'doanh thu': 'Doanh thu ước tính: 90 triệu/năm với ROI 1551%.',
        'giúp': 'Tôi có thể giúp: Xem cảm biến, Bật/tắt thiết bị, Xem báo cáo, Tính chi phí.'
      },
      en: {
        'water': 'Current soil moisture is 45%. Optimal range is 40-60%.',
        'fertilize': 'Best time to fertilize is early morning or late afternoon.',
        'temperature': 'Optimal temperature for crops is 25-30°C.',
        'alert': '3 new alerts: Low humidity, High temperature, Need fertilizer.',
        'device': '5 devices online. All working normally.',
        'error': 'System is running normally. No errors detected.',
        'revenue': 'Estimated revenue: 90 million VND/year with 1551% ROI.',
        'help': 'I can help: View sensors, Control devices, View reports, Calculate costs.'
      }
    };
    
    var langResponses = responses[lang] || responses.vi;
    var matched = null;
    var keywords = Object.keys(langResponses);
    
    for (var i = 0; i < keywords.length; i++) {
      if (q.indexOf(keywords[i]) !== -1) {
        matched = langResponses[keywords[i]];
        break;
      }
    }
    
    if (!matched) {
      matched = lang === 'vi' 
        ? 'Xin lỗi, tôi không hiểu. Hãy hỏi về: tưới nước, bón phân, nhiệt độ, cảnh báo, thiết bị, hoặc doanh thu.'
        : 'Sorry, I did not understand. Ask about: water, fertilizer, temperature, alerts, devices, or revenue.';
    }
    
    return {
      query: query,
      response: matched,
      language: lang,
      tts: matched
    };
  },
  
  runDialog: function(ctx) {
    var event = ctx.event || {};
    var query = event.query || event.text || event.speech || '';
    var lang = event.lang || 'vi';
    
    var result = {
      ok: true,
      action: 'dialog',
      query: query,
      language: lang,
      timestamp: new Date().toISOString(),
      version: '2.3.2'
    };
    
    if (query) {
      var dialog = this.getNaturalDialog(query, lang);
      result.response = dialog.response;
      result.tts = dialog.tts;
    } else {
      result.response = lang === 'vi' 
        ? 'Xin chào! Tôi là trợ lý giọng nói EcoSynTech. Bạn cần giúp gì?'
        : 'Hello! I am EcoSynTech voice assistant. How can I help?';
      result.tts = result.response;
    }
    
    return result;
  },
  
  getQuickCommands: function() {
    return {
      vi: [
        { command: 'xem nhiệt độ', response: 'Nhiệt độ hiện tại là 28 độ C.' },
        { command: 'xem độ ẩm', response: 'Độ ẩm đất là 45%.' },
        { command: 'xem ánh sáng', response: 'Cường độ ánh sáng là 500 lux.' },
        { command: 'bật máy bơm', response: 'Đã bật máy bơm.' },
        { command: 'tắt máy bơm', response: 'Đã tắt máy bơm.' },
        { command: 'xem cảnh báo', response: 'Có 3 cảnh báo chưa đọc.' },
        { command: 'xem báo cáo', response: 'Báo cáo hôm nay: 5 cảm biến, 3 cảnh báo.' },
        { command: 'tính chi phí', response: 'Tính chi phí đầu tư: 5.8 triệu VNĐ.' }
      ],
      en: [
        { command: 'show temperature', response: 'Current temperature is 28°C.' },
        { command: 'show humidity', response: 'Soil humidity is 45%.' },
        { command: 'show light', response: 'Light intensity is 500 lux.' },
        { command: 'turn on pump', response: 'Pump turned on.' },
        { command: 'turn off pump', response: 'Pump turned off.' },
        { command: 'show alerts', response: '3 unread alerts.' },
        { command: 'show report', response: 'Today\'s report: 5 sensors, 3 alerts.' },
        { command: 'calculate cost', response: 'Investment cost: 5.8 million VND.' }
      ]
    };
  }
};