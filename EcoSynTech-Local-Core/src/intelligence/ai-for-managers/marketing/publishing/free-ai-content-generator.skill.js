/**
 * AI Content Generator - Multi-Provider Support
 * Tự động tạo nội dung sử dụng AI miễn phí
 * 
 * Các providers miễn phí:
 * - DeepSeek (free API) - Khuyến nghị!
 * - Ollama (local) - Miễn phí hoàn toàn
 * - OpenAI (free tier)
 * - Google Gemini (free tier)
 * 
 * CẤU HÌNH:
 * Set biến môi trường AI_PROVIDER=deepseek|ollama|openai|gemini
 * 
 * CÁCH SỬ DỤNG:
 * const ai = new FreeAIContentSkill();
 * await ai.execute({
 *   prompt: 'Tạo bài quảng cáo sản phẩm ABC',
 *   provider: 'deepseek', // hoặc 'ollama'
 *   style: 'professional'
 * });
 */

const axios = require('axios');

class FreeAIContentSkill {
  static name = 'free-ai-content-generator';
  static description = 'Tạo nội dung miễn phí với AI (DeepSeek, Ollama, etc)';

  constructor() {
    this.config = {
      provider: process.env.AI_PROVIDER || 'deepseek',
      deepseek: {
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        baseUrl: 'https://api.deepseek.com/v1'
      },
      ollama: {
        baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3'
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1'
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || ''
      }
    };
  }

  async execute(context) {
    const {
      prompt = '',
      provider = this.config.provider,
      model = null,
      systemPrompt = 'Bạn là chuyên gia marketing Việt Nam. Viết nội dung hấp dẫn, thu hút.',
      options = {}
    } = context;

    // Kiểm tra API key và chuyển sang fallback nếu không có
    const actualProvider = this.checkAndSwitchProvider(provider);
    
    if (!actualProvider) {
      // Không có API nào → Dùng template fallback
      return {
        success: true,
        provider: 'fallback',
        mode: 'template',
        content: this.getTemplateContent(prompt),
        suggestions: this.getSuggestions(''),
        note: 'Không có API - dùng template có sẵn'
      };
    }

    let result;
    try {
      switch (actualProvider) {
        case 'deepseek':
          result = await this.callDeepSeek(prompt, systemPrompt, model);
          break;
        case 'ollama':
          result = await this.callOllama(prompt, systemPrompt, model);
          // Nếu Ollama trả về lỗi hoặc không có response → template
          if (!result.content || result.content.includes('error')) {
            throw new Error('Ollama not available');
          }
          break;
        case 'openai':
          result = await this.callOpenAI(prompt, systemPrompt, model);
          break;
        case 'gemini':
          result = await this.callGemini(prompt, systemPrompt);
          break;
        default:
          result = await this.callDeepSeek(prompt, systemPrompt, model);
      }
    } catch (error) {
      // Lỗi bất kỳ → Dùng template fallback
      console.log(`[AI] ${actualProvider} failed: ${error.message}. Using template...`);
      return {
        success: true,
        provider: actualProvider,
        mode: 'fallback',
        content: this.getTemplateContent(prompt),
        suggestions: this.getSuggestions(''),
        note: `${actualProvider} không khả dụng - dùng template`
      };
    }

    return {
      success: true,
      provider: actualProvider,
      model: model || this.getDefaultModel(actualProvider),
      content: result.content,
      usage: result.usage,
      time: result.time,
      suggestions: this.getSuggestions(result.content)
    };
  }

  // ========== CHECK AND SWITCH PROVIDER ==========
  checkAndSwitchProvider(requestedProvider) {
    // Nếu request provider cụ thể
    if (requestedProvider !== 'auto') {
      // Kiểm tra có API key không
      switch (requestedProvider) {
        case 'deepseek':
          return this.config.deepseek.apiKey ? 'deepseek' : null;
        case 'ollama':
          return 'ollama'; // Ollama sẽ tự fallback nếu không chạy
        case 'openai':
          return this.config.openai.apiKey ? 'openai' : null;
        case 'gemini':
          return this.config.gemini.apiKey ? 'gemini' : null;
      }
    }

    // Auto mode - tìm provider theo thứ tự ưu tiên
    // 1. DeepSeek (nếu có API key)
    if (this.config.deepseek.apiKey) return 'deepseek';
    
    // 2. Ollama/Llama 3 (local - miễn phí hoàn toàn)
    if (this.config.ollama.baseUrl) return 'ollama';
    
    // 3. OpenAI (nếu có API key)
    if (this.config.openai.apiKey) return 'openai';
    
    // 4. Gemini (nếu có API key)
    if (this.config.gemini.apiKey) return 'gemini';
    
    // 5. Ollama fallback (thử kết nối dù không có config)
    return 'ollama'; // Thử Ollama trước template
  }

  // ========== DEEPSEEK (KHUYẾN NGHỊ!) ==========
  async callDeepSeek(prompt, systemPrompt, model) {
    const startTime = Date.now();
    
    // Nếu không có API key, dùng mock
    if (!this.config.deepseek.apiKey) {
      return this.mockAIResponse(prompt, 'DeepSeek');
    }

    const response = await axios.post(
      `${this.config.deepseek.baseUrl}/chat/completions`,
      {
        model: model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.deepseek.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      time: Date.now() - startTime
    };
  }

  // ========== OLLAMA (CHẠY LOCAL - MIỄN PHÍ HOÀN TOÀN) ==========
  async callOllama(prompt, systemPrompt, model) {
    const startTime = Date.now();
    const modelName = model || this.config.ollama.model;

    // Kiểm tra Ollama có đang chạy không
    try {
      const healthCheck = await axios.get(
        `${this.config.ollama.baseUrl}/api/tags`,
        { timeout: 5000 }
      );
      
      // Kiểm model có sẵn không
      const availableModels = healthCheck.data.models?.map(m => m.name) || [];
      if (!availableModels.includes(modelName)) {
        console.log(`[Ollama] Model ${modelName} not found. Available: ${availableModels.join(', ')}`);
        // Thử model mặc định
        throw new Error('Model not available');
      }
    } catch (healthError) {
      // Ollama không chạy → Throw để fallback
      throw new Error('Ollama not running. Please install: curl -fsSL https://ollama.com/install.sh | sh');
    }

    // Ollama đang chạy → Gọi API
    try {
      const response = await axios.post(
        `${this.config.ollama.baseUrl}/api/generate`,
        {
          model: modelName,
          prompt: `System: ${systemPrompt}\n\nUser: ${prompt}\n\nViết bài marketing bằng tiếng Việt, ngắn gọn, hấp dẫn, có hashtag.`,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9
          }
        },
        { timeout: 120000 }
      );

      return {
        content: response.data.response,
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        time: Date.now() - startTime
      };
    } catch (error) {
      // Lỗi khi gọi → Fallback
      throw new Error('Ollama call failed: ' + error.message);
    }
  }

  // ========== OPENAI ==========
  async callOpenAI(prompt, systemPrompt, model) {
    const startTime = Date.now();
    
    if (!this.config.openai.apiKey) {
      return this.mockAIResponse(prompt, 'OpenAI');
    }

    const response = await axios.post(
      `${this.config.openai.baseUrl}/chat/completions`,
      {
        model: model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.openai.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      content: response.data.choices[0].message.content,
      usage: response.data.usage,
      time: Date.now() - startTime
    };
  }

  // ========== GOOGLE GEMINI ==========
  async callGemini(prompt, systemPrompt) {
    const startTime = Date.now();
    
    if (!this.config.gemini.apiKey) {
      return this.mockAIResponse(prompt, 'Gemini');
    }

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.config.gemini.apiKey}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      }
    );

    return {
      content: response.data.candidates[0].content.parts[0].text,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      time: Date.now() - startTime
    };
  }

  // ========== MOCK RESPONSE (FALLBACK) ==========
  mockAIResponse(prompt, provider) {
    const content = this.generateMockContent(prompt);
    return {
      content,
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
      time: 100,
      note: `Mock - Set ${provider}_API_KEY for real AI`
    };
  }

  generateMockContent(prompt) {
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('quảng cáo') || promptLower.includes('sản phẩm')) {
      return `🚀 SẢN PHẨM MỚI - GIỚI THIỆU NGAY!

Chào mọi người! 

Hôm nay chúng tôi vui mừng được giới thiệu sản phẩm mới nhất của EcoSynTech.

✨ Điểm nổi bật:
• Chất lượng cao, giá hợp lý
• Dễ sử dụng, tiện lợi
• Hỗ trợ 24/7

💰 LIÊN HỆ NGAY để được tư vấn!

📩 Inbox hoặc comment bên dưới
📞 Hotline: 0123 456 789

#EcoSynTech #SanPhamMoi #UuDai`;
    }
    
    if (promptLower.includes('khuyến mãi') || promptLower.includes('sale')) {
      return `🎉 FLASH SALE - GIẢM GIÁ SỐC!

⚡️ Chỉ hôm nay và ngày mai thôi!

🔥 GIẢM ĐẾN 50% tất cả sản phẩm

⏰ Thời gian có hạn - Đặt ngay kẻo hết!

🛒 Đặt hàng ngay: [Link]

#FlashSale #GiamGia #DealHot`;
    }

    return `📝 NỘI DUNG MARKETING

${prompt}

---

Liên hệ để biết thêm chi tiết:
📧 Email: contact@ecosyntech.com
📱 Zalo: 0123 456 789

#EcoSynTech`;
  }

  getDefaultModel(provider) {
    const defaults = {
      deepseek: 'deepseek-chat',
      ollama: 'llama3',
      openai: 'gpt-3.5-turbo',
      gemini: 'gemini-pro'
    };
    return defaults[provider] || 'deepseek-chat';
  }

  getSuggestions(content) {
    return [
      'Thêm hình ảnh sản phẩm',
      'Thêm hashtags phổ biến',
      'Test với A/B content',
      'Theo dõi engagement sau 24h'
    ];
  }

  getFallbackContent(prompt) {
    return this.generateMockContent(prompt);
  }

  // ========== SMART TEMPLATE CONTENT (FALLBACK) ==========
  getTemplateContent(prompt) {
    const p = prompt.toLowerCase();
    let template = '';
    let title = '';
    
    // Phân tích prompt để chọn template phù hợp
    if (p.includes('sản phẩm') || p.includes('ra mắt') || p.includes('giới thiệu')) {
      template = this.getProductTemplate(prompt);
    } else if (p.includes('khuyến mãi') || p.includes('sale') || p.includes('giảm giá') || p.includes('flash')) {
      template = this.getPromotionTemplate(prompt);
    } else if (p.includes('tips') || p.includes('mẹo') || p.includes('hướng dẫn')) {
      template = this.getTipsTemplate(prompt);
    } else if (p.includes('tuyển dụng') || p.includes('tuyển') || p.includes('việc làm')) {
      template = this.getRecruitmentTemplate(prompt);
    } else if (p.includes('sự kiện') || p.includes('event')) {
      template = this.getEventTemplate(prompt);
    } else if (p.includes('review') || p.includes('đánh giá') || p.includes('testimonial')) {
      template = this.getTestimonialTemplate(prompt);
    } else {
      // Default template
      template = this.getDefaultTemplate(prompt);
    }

    return template;
  }

  // Template: Sản phẩm
  getProductTemplate(prompt) {
    // Trích xuất tên sản phẩm từ prompt
    const name = this.extractName(prompt) || 'Sản phẩm của chúng tôi';
    const price = this.extractPrice(prompt) || 'Liên hệ';
    const features = this.extractFeatures(prompt);
    
    return `🚀 ${name.toUpperCase()} - RA MẮT!

Chào mọi người! 👋

Chúng tôi vui mừng giới thiệu ${name} - giải pháp hoàn hảo dành cho bạn!

✨ ĐIỂM NỔI BẬT:
${features.map((f, i) => `${i+1}. ${f}`).join('\n')}

💰 GIÁ: ${price}

✅ Bảo hành 12 tháng
✅ Hỗ trợ 24/7
✅ Giao hàng toàn quốc

📩 QUAN TÂM? Inbox ngay!

📞 Hotline: 0123 456 789
📧 Email: contact@ecosyntech.com

#${name.replace(/\s+/g, '')} #SanPhamMoi #EcoSynTech`;
  }

  // Template: Khuyến mãi
  getPromotionTemplate(prompt) {
    const discount = this.extractDiscount(prompt) || '50%';
    const product = this.extractName(prompt) || 'sản phẩm';
    const deadline = this.extractDeadline(prompt) || 'hôm nay và ngày mai';
    
    return `🎉 FLASH SALE - GIẢM GIÁ SỐC!

⚡ ${discount} OFF - ${product.toUpperCase()}!

⏰ Chỉ ${deadline} thôi!

🔥 Deal cực hot - Đừng bỏ lỡ!

🛒 Đặt ngay: [Link]

💳 Giảm thêm 10% cho thành viên

📦 Free ship đơn từ 500K

#FlashSale #GiamGia #DealHot #EcoSynTech`;
  }

  // Template: Tips/Mẹo
  getTipsTemplate(prompt) {
    return `💡 MẸO HAY CHO BẠN!

Chào mọi người! Hôm nay chia sẻ vài mẹo nhỏ:

1. Làm việc thông minh hơn
2. Tiết kiệm thời gian hiệu quả  
3. Đạt kết quả nhanh hơn

📌 Lưu lại ngay để không bỏ lỡ!

Bạn có mẹo nào hay? Comment chia sẻ nhé! 👇

#MeoHay #Tips #EcoSynTech`;
  }

  // Template: Tuyển dụng
  getRecruitmentTemplate(prompt) {
    const position = this.extractPosition(prompt) || 'Nhân viên';
    const location = this.extractLocation(prompt) || 'Hồ Chí Minh';
    
    return `📢 TUYỂN DỤNG ${position.toUpperCase()}

🏢 EcoSynTech tuyển dụng!

📍 Địa điểm: ${location}
💰 Lương: Theo năng lực
📋 Yêu cầu:
- Năng động, chăm chỉ
- Kỹ năng tốt
- Làm việc nhóm tốt

📩 Gửi CV: hr@ecosyntech.com

#TuyenDung #ViecLam #EcoSynTech`;
  }

  // Template: Sự kiện
  getEventTemplate(prompt) {
    const eventName = this.extractName(prompt) || 'Sự kiện đặc biệt';
    const date = this.extractDate(prompt) || 'sắp tới';
    
    return `📅 SỰ KIỆN: ${eventName.toUpperCase()}

🗓️ Thời gian: ${date}
📍 Địa điểm: [Địa chỉ]

🎯 Nội dung:
- Chia sẻ kinh nghiệm
- Giao lưu networking
- Quà tặng hấp dẫn

✅ Đăng ký ngay: [Link]

#SuKien #EcoSynTech`;
  }

  // Template: Testimonial
  getTestimonialTemplate(prompt) {
    return `⭐ KHÁCH HÀNG NÓI GÌ?

"${this.getRandomTestimonial()}"

- Khách hàng EcoSynTech ⭐⭐⭐⭐⭐

Cảm ơn quý khách đã tin tưởng!

Bạn muốn trải nghiệm? Liên hệ ngay!

#Testimonial #Review #KhachHang #EcoSynTech`;
  }

  // Template: Default
  getDefaultTemplate(prompt) {
    return `📣 THÔNG BÁO

${prompt.slice(0, 200)}

📩 Liên hệ để biết thêm chi tiết!

#EcoSynTech #ThongBao`;
  }

  // ========== HELPER FUNCTIONS ==========
  extractName(prompt) {
    // Trích xuất tên từ prompt
    const match = prompt.match(/(?:sản phẩm|sp|tên)[:\s]+([A-Za-zÀ-ỹ\s]+?)(?:\s|,|$)/i);
    if (match) return match[1].trim();
    
    // Lấy từ đầu prompt
    const words = prompt.split(/[\s,]+/).filter(w => w.length > 3);
    return words[0] || 'Sản phẩm';
  }

  extractPrice(prompt) {
    const match = prompt.match(/(\d+[\d.,]*)\s*(?:k|đ|vnđ|nghìn|triệu)/i);
    if (match) return match[1] + ' VND';
    return 'Liên hệ';
  }

  extractDiscount(prompt) {
    const match = prompt.match(/(\d+)\s*%/);
    if (match) return match[1] + '%';
    const words = ['20%', '30%', '40%', '50%'];
    return words[Math.floor(Math.random() * words.length)];
  }

  extractFeatures(prompt) {
    // Mặc định features
    return [
      'Chất lượng cao',
      'Giá hợp lý',
      'Dễ sử dụng',
      'Hỗ trợ nhanh chóng'
    ];
  }

  extractDeadline(prompt) {
    const p = prompt.toLowerCase();
    if (p.includes('hôm nay')) return 'hôm nay';
    if (p.includes('ngày mai')) return 'ngày mai';
    if (p.includes('tuần')) return 'cuối tuần';
    return 'hôm nay và ngày mai';
  }

  extractPosition(prompt) {
    const match = prompt.match(/(?:position|vị trí)[:\s]+([A-Za-zÀ-ỹ\s]+?)(?:\s|,|$)/i);
    return match ? match[1].trim() : 'Nhân viên';
  }

  extractLocation(prompt) {
    const locations = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'];
    const p = prompt.toLowerCase();
    for (const loc of locations) {
      if (p.includes(loc.toLowerCase())) return loc;
    }
    return 'Hồ Chí Minh';
  }

  extractDate(prompt) {
    return 'sắp tới';
  }

  getRandomTestimonial() {
    const quotes = [
      'Sản phẩm rất tốt, hỗ trợ nhanh chóng!',
      'Dịch vụ chuyên nghiệp, đáng tin cậy!',
      'Rất hài lòng với sản phẩm!',
      'Đội ngũ nhiệt tình, tận tâm!'
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  }
}

module.exports = FreeAIContentSkill;