class ContentGeneratorSkill {
  static name = 'content-generator-ai';
  static description = 'Tạo nội dung marketing với AI';

  constructor() {
    this.templates = {
      social: '🎯 {title}\n\n{body}\n\n#hashtag',
      email: 'Subject: {title}\n\n{body}\n\n- Team',
      blog: '# {title}\n\n{intro}\n\n{body}\n\nKết luận'
    };
  }

  async execute(context) {
    const { topic = '', type = 'social', audience = 'general' } = context;

    const content = this.generateContent(topic, type, audience);
    const variants = this.createVariants(content);
    return {
      content,
      variants,
      hashtags: this.generateHashtags(topic),
      seo: this.optimizeSEO(content, topic)
    };
  }

  generateContent(topic, type, audience) {
    const templates = this.templates[type] || this.templates.social;
    return {
      title: `5 mẹo về ${topic} cho ${audience}`,
      body: `Khám phá cách ${topic} có thể giúp ${audience} đạt được kết quả tốt hơn trong thời gian ngắn.`,
      platform: type,
      tone: 'chuyên nghiệp'
    };
  }

  createVariants(content) {
    return [
      { variant: 'A', content: content.body, style: 'direct' },
      { variant: 'B', content: `Bạn có biết? ${content.body}`, style: 'question' }
    ];
  }

  generateHashtags(topic) {
    return [`#${topic}`, '#marketing', '#tips', '#success'];
  }

  optimizeSEO(content, topic) {
    return { keywords: [topic], density: '2%', score: 85 };
  }
}

module.exports = ContentGeneratorSkill;