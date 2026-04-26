class SeoAutoOptimizerSkill {
  static name = 'seo-auto-optimizer-ai';
  static description = 'Tối ưu SEO tự động với AI';

  constructor() {
    this.checklist = ['title', 'meta', 'content', 'links', 'speed'];
  }

  async execute(context) {
    const { pages = [], keywords = [] } = context;

    const analysis = this.analyzePages(pages, keywords);
    const scores = this.calculateScores(analysis);
    const recommendations = this.generateRecommendations(scores);
    return {
      analysis,
      scores,
      recommendations,
      actionPlan: this.createActionPlan(recommendations)
    };
  }

  analyzePages(pages, keywords) {
    return pages.map(page => {
      const issues = [];
      if (!page.title || page.title.length < 30) issues.push('title');
      if (!page.metaDescription) issues.push('meta');
      if (page.wordCount < 300) issues.push('content');
      return { url: page.url, issues, score: this.calculatePageScore(page, issues) };
    });
  }

  calculatePageScore(page, issues) {
    let score = 100;
    issues.forEach(() => score -= 20);
    return Math.max(0, score);
  }

  calculateScores(analysis) {
    const avg = analysis.reduce((sum, p) => sum + p.score, 0) / analysis.length;
    return { average: avg.toFixed(0), pages: analysis };
  }

  generateRecommendations(scores) {
    return scores.pages.map(p => ({
      url: p.url,
      action: p.issues.join(', '),
      priority: p.score < 50 ? 'cao' : 'trung bình'
    }));
  }

  createActionPlan(recommendations) {
    return { tasks: recommendations, timeline: '2 tuần' };
  }
}

module.exports = SeoAutoOptimizerSkill;