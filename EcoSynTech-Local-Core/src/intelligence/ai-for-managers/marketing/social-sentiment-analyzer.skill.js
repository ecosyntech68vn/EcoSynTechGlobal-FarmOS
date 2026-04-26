class SocialSentimentAnalyzerSkill {
  static name = 'social-sentiment-analyzer-ai';
  static description = 'Phân tích cảm xúc mạng xã hội với AI';

  async execute(context) {
    const { posts = [], brand = '' } = context;

    const sentiment = this.analyzeSentiment(posts);
    const trends = this.identifyTrends(sentiment);
    const alerts = this.generateAlerts(sentiment);
    return {
      sentiment,
      trends,
      alerts,
      recommendations: this.recommendActions(sentiment)
    };
  }

  analyzeSentiment(posts) {
    const positive = posts.filter(p => p.sentiment === 'positive').length;
    const negative = posts.filter(p => p.sentiment === 'negative').length;
    const neutral = posts.filter(p => p.sentiment === 'neutral').length;
    const total = posts.length || 1;
    return {
      positive: ((positive / total) * 100).toFixed(0) + '%',
      negative: ((negative / total) * 100).toFixed(0) + '%',
      neutral: ((neutral / total) * 100).toFixed(0) + '%',
      score: (positive - negative) / total
    };
  }

  identifyTrends(sentiment) {
    if (sentiment.score < -0.2) return ['Negative trend detected'];
    return ['Stable sentiment'];
  }

  generateAlerts(sentiment) {
    if (sentiment.score < -0.3) return [{ level: 'high', alert: 'Negative sentiment spike' }];
    return [];
  }

  recommendActions(sentiment) {
    return [{ action: sentiment.score > 0 ? 'Continue strategy' : 'Review approach' }];
  }
}

module.exports = SocialSentimentAnalyzerSkill;