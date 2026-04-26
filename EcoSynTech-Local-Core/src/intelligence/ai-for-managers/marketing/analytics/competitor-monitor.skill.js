/**
 * Competitor Monitor
 * Theo dõi đối thủ cạnh tranh trên mạng xã hội
 * 
 * CÁCH SỬ DỤNG:
 * const monitor = new CompetitorMonitorSkill();
 * await monitor.execute({
 *   action: 'monitor',  // 'monitor' | 'analyze' | 'alert'
 *   competitors: ['Công ty A', 'Công ty B'],
 *   platforms: ['facebook', 'tiktok']
 * });
 */

class CompetitorMonitorSkill {
  static name = 'competitor-monitor';
  static description = 'Theo dõi đối thủ cạnh tranh trên mạng xã hội';

  constructor() {
    this.competitors = new Map();
    this.alerts = [];
  }

  async execute(context) {
    const {
      action = 'monitor',
      competitors = [],
      platforms = ['facebook']
    } = context;

    switch (action) {
    case 'monitor':
      return await this.monitorCompetitors(competitors, platforms);
    case 'analyze':
      return this.analyzeCompetitors(competitors);
    case 'alerts':
      return this.getAlerts();
    case 'report':
      return this.generateReport(competitors);
    default:
      return { success: false, error: 'Unknown action' };
    }
  }

  async monitorCompetitors(competitors, platforms) {
    const results = [];

    for (const competitor of competitors) {
      const data = await this.getCompetitorData(competitor, platforms);
      results.push(data);
      this.competitors.set(competitor, data);
    }

    // Check for alerts
    this.checkForAlerts(results);

    return {
      success: true,
      competitors: results,
      summary: this.generateSummary(results),
      lastUpdated: new Date().toISOString()
    };
  }

  async getCompetitorData(competitor, platforms) {
    const now = new Date();
    
    // Mock data - thực tế sẽ crawl từ social API
    const data = {
      name: competitor,
      platforms: {},
      lastPost: null,
      engagement: 0,
      followers: 0,
      posts: []
    };

    for (const platform of platforms) {
      data.platforms[platform] = {
        followers: Math.floor(Math.random() * 50000) + 10000,
        posts: Math.floor(Math.random() * 30) + 10,
        avgEngagement: Math.floor(Math.random() * 5) + 2,
        lastPost: now.toISOString()
      };
      
      data.engagement += data.platforms[platform].followers * data.platforms[platform].avgEngagement / 100;
    }

    data.lastPost = now.toISOString();

    return data;
  }

  analyzeCompetitors(competitors) {
    const data = competitors.map(c => this.competitors.get(c) || {});
    
    // Sort by engagement
    data.sort((a, b) => b.engagement - a.engagement);

    const comparison = data.map((c, i) => ({
      rank: i + 1,
      name: c.name,
      totalEngagement: c.engagement,
      totalFollowers: Object.values(c.platforms || {}).reduce((s, p) => s + (p.followers || 0), 0),
      activity: c.posts?.length || 0,
      strength: c.engagement > 1000 ? 'cao' : c.engagement > 500 ? 'trung bình' : 'thấp'
    }));

    const threats = data.filter(c => c.engagement > 1000);
    const opportunities = data.length > 1 ? data.slice(-1) : [];

    return {
      success: true,
      comparison,
      threats: threats.map(t => t.name),
      opportunities: opportunities.map(t => t.name),
      recommendations: this.generateRecommendations(comparison)
    };
  }

  checkForAlerts(results) {
    const newAlerts = [];
    
    results.forEach(c => {
      const lastPost = new Date(c.lastPost);
      const hoursSince = (Date.now() - lastPost.getTime()) / (1000 * 60 * 60);
      
      if (hoursSince < 24) {
        newAlerts.push({
          type: 'new_post',
          competitor: c.name,
          severity: 'medium',
          message: `${c.name} vừa đăng bài mới`,
          timestamp: c.lastPost
        });
      }

      if (c.engagement > 1000) {
        newAlerts.push({
          type: 'high_engagement',
          competitor: c.name,
          severity: 'high',
          message: `${c.name} có engagement cao: ${c.engagement}`,
          timestamp: new Date().toISOString()
        });
      }
    });

    this.alerts = newAlerts;
    return newAlerts;
  }

  getAlerts() {
    return {
      success: true,
      alerts: this.alerts,
      unread: this.alerts.filter(a => !a.read).length,
      lastCheck: new Date().toISOString()
    };
  }

  generateReport(competitors) {
    const data = competitors.map(c => this.competitors.get(c)).filter(Boolean);
    
    return {
      success: true,
      report: {
        generatedAt: new Date().toISOString(),
        competitors: data.length,
        summary: data.map(c => ({
          name: c.name,
          totalEngagement: c.engagement,
          platforms: Object.keys(c.platforms)
        }))
      },
      exportFormats: ['PDF', 'Excel', 'JSON']
    };
  }

  generateSummary(results) {
    const totalEngagement = results.reduce((s, c) => s + (c.engagement || 0), 0);
    const totalFollowers = results.reduce((s, c) => {
      return s + Object.values(c.platforms || {}).reduce((sum, p) => sum + (p.followers || 0), 0);
    }, 0);

    return {
      totalCompetitors: results.length,
      totalEngagement,
      totalFollowers,
      mostActive: results.reduce((most, c) => 
        c.engagement > (most?.engagement || 0) ? c : most, results[0])?.name
    };
  }

  generateRecommendations(comparison) {
    const recs = [];
    
    if (comparison[0]) {
      recs.push({
        competitor: comparison[0].name,
        action: 'Theo dõi chiến lược',
        reason: 'Đối thủ mạnh nhất'
      });
    }

    if (comparison.length > 1) {
      recs.push({
        competitor: comparison[comparison.length - 1].name,
        action: 'Tập trung',
        reason: 'Cơ hội chiếm thị phần'
      });
    }

    return recs;
  }
}

module.exports = CompetitorMonitorSkill;