/**
 * AI Content Generator
 * Tự động tạo nội dung mới dựa trên AI và dữ liệu có sẵn
 * 
 * Chức năng:
 * - Tạo bài mới từ prompt/sản phẩm
 * - Repurpose nội dung cũ thành nhiều bài mới
 * - Sinh content theo template
 * - A/B test variations
 * 
 * CÁCH SỬ DỤNG:
 * const generator = new AIContentGeneratorSkill();
 * await generator.execute({
 *   action: 'generate',       // 'generate' | 'repurpose' | 'variations' | 'ideas'
 *   input: { type: 'product', data: { name: 'Sản phẩm A', features: ['...'] } },
 *   platforms: ['facebook', 'tiktok'],
 *   tone: 'professional'   // 'professional' | 'casual' | 'funny'
 * });
 */

class AIContentGeneratorSkill {
  static name = 'ai-content-generator';
  static description = 'Tự động tạo nội dung mới với AI';

  constructor() {
    this.templates = {
      product_launch: {
        structure: ['hook', 'problem', 'solution', 'benefits', 'cta'],
        examples: ['🚀 GIỚI THIỆU sản phẩm MỚI!']
      },
      testimonial: {
        structure: ['hook', 'story', 'result', 'quote', 'cta'],
        examples: ['⭐ Khách hàng nói gì...']
      },
      tips: {
        structure: ['hook', 'tip1', 'tip2', 'tip3', 'cta'],
        examples: ['💡 5 mẹo hay nhất...']
      },
      behind_scenes: {
        structure: ['hook', 'process', 'team', 'fun_moment'],
        examples: ['🎬 Hậu trường...']
      }
    };
    
    this.hooks = [
      'Bạn có biết...',
      '97% người không biết điều này',
      'Đừng bỏ lỡ!',
      'Cực shock!',
      'Miễn phí 100%',
      'Giảm 50%',
      'Chỉ hôm nay!',
      'Tặng ngay khi...'
    ];
    
    this.cta = [
      '📩 Inbox ngay!',
      '💬 Comment ngay!',
      '🔗 Click vào link!',
      '📱 Liên hệ ngay!',
      '🛒 Đặt ngay!'
    ];
  }

  async execute(context) {
    const {
      action = 'generate',
      input = {},
      platforms = ['facebook'],
      tone = 'professional',
      count = 3
    } = context;

    switch (action) {
    case 'generate':
      return await this.generateContent(input, platforms, tone, count);
    case 'repurpose':
      return await this.repurposeContent(input, platforms);
    case 'variations':
      return await this.generateVariations(input, count);
    case 'ideas':
      return this.generateIdeas(input);
    default:
      return { success: false, error: 'Unknown action' };
    }
  }

  // ========== GENERATE NEW CONTENT ==========
  async generateContent(input, platforms, tone, count) {
    const results = [];
    
    for (let i = 0; i < count; i++) {
      const platform = platforms[i % platforms.length];
      const content = this.createContentForPlatform(input, platform, tone);
      results.push(content);
    }

    const optimized = this.optimizeForPlatform(results, platforms);
    const scheduled = this.scheduleContent(optimized);

    return {
      success: true,
      generated: results.length,
      contents: results,
      optimized,
      scheduled,
      recommendations: this.getRecommendations(results)
    };
  }

  createContentForPlatform(input, platform, tone) {
    const type = input.type || 'product';
    let content = {};

    switch (type) {
    case 'product':
      content = this.generateProductContent(input, platform, tone);
      break;
    case 'promotion':
      content = this.generatePromotionContent(input, platform, tone);
      break;
    case 'tips':
      content = this.generateTipsContent(input, platform, tone);
      break;
    case 'story':
      content = this.generateStoryContent(input, platform, tone);
      break;
    default:
      content = this.generateGenericContent(input, platform, tone);
    }

    return {
      ...content,
      platform,
      tone,
      wordCount: content.body?.split(' ').length || 0,
      hashtags: this.generateHashtags(input),
      score: this.calculateContentScore(content)
    };
  }

  // ========== PRODUCT CONTENT ==========
  generateProductContent(input, platform, tone) {
    const name = input.name || 'Sản phẩm';
    const features = input.features || [];
    const benefits = input.benefits || [];
    const price = input.price || 'Liên hệ';
    
    const hooks = [
      `${name} - Giải pháp hoàn hảo cho bạn!`,
      `🎁 ${name} - Đáng để thử!`,
      `🔥 ${name} - Deal chỉ có hôm nay!`
    ];

    let body = '';
    const toneStyles = {
      professional: `Chúng tôi tự hào giới thiệu ${name}. `,
      casual: `Hey! ${name} đây! `,
      funny: `Đậu phộng ơi! ${name} chất lắm! `
    };
    
    body += toneStyles[tone] || toneStyles.professional;
    
    if (features.length > 0) {
      body += '\n\n✨ Điểm nổi bật:\n';
      features.forEach((f, i) => {
        body += `${i + 1}. ${f}\n`;
      });
    }
    
    if (benefits.length > 0) {
      body += '\n💪 Lợi ích:\n';
      benefits.forEach((b, i) => {
        body += `• ${b}\n`;
      });
    }
    
    body += `\n💰 Giá: ${price}`;
    body += `\n\n${this.getRandomCTA()}`;

    // Shorten for TikTok
    const shortBody = platform === 'tiktok' 
      ? body.substring(0, 150) + '...'
      : body;

    return {
      type: 'product',
      title: this.getRandomHook() + ' ' + name,
      body: platform === 'tiktok' ? shortBody : body,
      hook: hooks[Math.floor(Math.random() * hooks.length)],
      videoScript: this.generateVideoScript(input, platform)
    };
  }

  // ========== PROMOTION CONTENT ==========
  generatePromotionContent(input, platform, tone) {
    const discount = input.discount || '50%';
    const product = input.product || 'sản phẩm';
    const deadline = input.deadline || 'hôm nay';

    const hooks = [
      `🎉 GIẢM ${discount} - ${deadline}!`,
      `⚡ FLASH SALE ${discount}!`,
      `🔥 CHỈ ${discount} - ĐỪNG BỎ LỠ!`
    ];

    let body = '';
    const toneStyles = {
      professional: 'Khuyến mãi đặc biệt! ',
      casual: 'Ôi trời ơi deal khủng! ',
      funny: 'Sập giá rồi máy ơi! '
    };
    
    body += toneStyles[tone] || toneStyles.professional;
    body += `${discount} GIẢM giá ${product}!\n`;
    body += `\n⏰ Chỉ đến hết ${deadline}\n`;
    body += `\n${this.getRandomCTA()}`;

    return {
      type: 'promotion',
      title: hooks[Math.floor(Math.random() * hooks.length)],
      body,
      urgency: deadline,
      discount
    };
  }

  // ========== TIPS CONTENT ==========
  generateTipsContent(input, platform, tone) {
    const tips = input.tips || [
      'Kiểm tra thường xuyên',
      'Lắng nghe khách hàng',
      'Cập nhật liên tục'
    ];

    const hook = this.getRandomHook();
    let body = '';

    const toneStyles = {
      professional: 'Dưới đây là những mẹo hữu ích:\n\n',
      casual: 'Mấy mẹo này xịn lắm!\n\n',
      funny: 'Bí kíp thành công đây!\n\n'
    };
    
    body += toneStyles[tone] || toneStyles.professional;
    
    tips.forEach((tip, i) => {
      body += `${i + 1}. ${tip}\n`;
      if (i === 0) body += '   ✨ Most important!\n';
    });
    
    body += '\n' + this.getRandomCTA();

    return {
      type: 'tips',
      title: hook + ' ' + tips.length + ' mẹo hay!',
      body,
      tips
    };
  }

  // ========== STORY CONTENT ==========
  generateStoryContent(input, platform, tone) {
    const story = input.story || 'Khách hàng';
    const result = input.result || 'thành công';

    const hooks = [
      'Câu chuyện thành công!',
      'Từ không có gì...',
      'Biến đổi hoàn toàn!'
    ];

    let body = '';
    const toneStyles = {
      professional: `${story} đã ${result}.\n\n`,
      casual: 'Bạn ơi, câu chuyện này hay lắm!\n\n',
      funny: 'Giấu nè! Câu chuyện khó tin!\n\n'
    };
    
    body += toneStyles[tone] || toneStyles.professional;
    body += '👉 Xem chi tiết trong video!\n';
    body += '\n' + this.getRandomCTA();

    return {
      type: 'story',
      title: hooks[Math.floor(Math.random() * hooks.length)] + ' ' + story,
      body,
      story,
      result
    };
  }

  generateGenericContent(input, platform, tone) {
    const topic = input.topic || 'Cập nhật mới';
    return {
      type: 'generic',
      title: topic,
      body: topic + ' - ' + this.getRandomCTA(),
      topic
    };
  }

  // ========== VIDEO SCRIPT ==========
  generateVideoScript(input, platform) {
    const name = input.name || 'Sản phẩm';
    return {
      intro: '0-3s: Hey! Giới thiệu ' + name,
      body: '3-30s: Điểm nổi bật',
      demo: '30-45s: Demo sản phẩm',
      cta: '45-60s: ' + this.getRandomCTA(),
      totalDuration: platform === 'tiktok' ? '60s' : '3-5p'
    };
  }

  // ========== REPURPOSE CONTENT ==========
  async repurposingContent(input, platforms) {
    const sourceContent = input.content || '';
    
    const repurposed = {
      facebook: sourceContent.substring(0, 5000),
      facebookShort: sourceContent.substring(0, 200) + '...',
      instagram: this.createInstagramCaption(sourceContent),
      tiktok: this.createTikTokCaption(sourceContent),
      youtube: this.createYouTubeDescription(sourceContent),
      email: this.createEmailBody(sourceContent)
    };

    return {
      success: true,
      sourceLength: sourceContent.length,
      repurposedFor: platforms,
      contents: repurposed
    };
  }

  createInstagramCaption(content) {
    const short = content.substring(0, 125);
    const hashtags = this.generateHashtags({});
    return short + '...\n\n' + hashtags.slice(0, 5).join(' ');
  }

  createTikTokCaption(content) {
    return content.substring(0, 150) + '... #fyp #viral';
  }

  createYouTubeDescription(content) {
    return content + '\n\n📌LINKS:\n- Website: ...\n- Contact: ...\n\n#' + content.split(' ')[0];
  }

  createEmailBody(content) {
    return `Chào bạn!\n\n${content}\n\nBest regards,\nTeam`;
  }

  // ========== VARIATIONS ==========
  async generateVariations(input, count) {
    const variations = [];
    const tones = ['professional', 'casual', 'funny', 'emotional'];
    
    for (let i = 0; i < count; i++) {
      const tone = tones[i % tones.length];
      const variation = this.createContentForPlatform(input, 'facebook', tone);
      variations.push(variation);
    }

    const scored = variations.map(v => ({
      ...v,
      predictedEngagement: Math.floor(Math.random() * 100)
    }));

    return {
      success: true,
      variations: scored.sort((a, b) => b.predictedEngagement - a.predictedEngagement),
      bestVariation: scored[0],
      testing: count > 1
    };
  }

  // ========== IDEAS ==========
  generateIdeas(input) {
    const topics = [
      'Hướng dẫn sử dụng sản phẩm',
      'So sánh với đối thủ',
      'Câu hỏi thường gặp',
      'Behind the scenes',
      'Team showcase',
      'Customer story',
      'Industry trends',
      'Tips & Tricks',
      'New features',
      'Seasonal content'
    ];

    const ideas = topics.map((topic, i) => ({
      id: i + 1,
      topic,
      suggestedFormat: this.suggestFormat(topic),
      suggestedTone: this.suggestTone(topic)
    }));

    return {
      success: true,
      ideas,
      total: ideas.length
    };
  }

  suggestFormat(topic) {
    const formats = {
      'Hướng dẫn': 'Video tutorial',
      'So sánh': 'Carousel',
      'Câu hỏi': 'Q&A post',
      'Behind the scenes': 'Reels',
      'Team showcase': 'Photo series',
      'Customer story': 'Testimonial video',
      'Trends': 'Infographic'
    };
    return formats[topic] || 'Post';
  }

  suggestTone(topic) {
    const tones = {
      'Hướng dẫn': 'professional',
      'So sánh': 'professional',
      'Câu hỏi': 'casual',
      'Behind the scenes': 'casual',
      'Team showcase': 'emotional',
      'Customer story': 'emotional'
    };
    return tones[topic] || 'professional';
  }

  // ========== HELPER FUNCTIONS ==========
  getRandomHook() {
    return this.hooks[Math.floor(Math.random() * this.hooks.length)];
  }

  getRandomCTA() {
    return this.cta[Math.floor(Math.random() * this.cta.length)];
  }

  generateHashtags(input) {
    const base = ['#ecosyntech', '#tech', '#innovation'];
    if (input?.name) base.push('#' + input.name.toLowerCase().replace(/\s+/g, ''));
    return base;
  }

  calculateContentScore(content) {
    let score = 50;
    if (content.body?.length > 100) score += 20;
    if (content.hashtags?.length > 2) score += 15;
    if (content.cta) score += 15;
    return score;
  }

  optimizeForPlatform(contents, platforms) {
    return contents.map(c => {
      if (c.platform === 'tiktok') {
        c.body = c.body.substring(0, 2200);
        c.hashtags = [...c.hashtags, '#fyp', '#viral'].slice(0, 5);
      }
      return c;
    });
  }

  scheduleContent(contents) {
    return contents.map((c, i) => ({
      ...c,
      scheduled: new Date(Date.now() + i * 86400000).toISOString(),
      ready: true
    }));
  }

  getRecommendations(contents) {
    return [
      'Test với A/B để tìm best performing',
      'Theo dõi engagement sau 24h',
      'Repost content tốt với ngân sách quảng cáo'
    ];
  }
}

module.exports = AIContentGeneratorSkill;