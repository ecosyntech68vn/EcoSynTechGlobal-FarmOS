class CompetitiveIntelligenceSkill {
  static name = 'competitive-intelligence-ai';
  static description = 'Theo dõi & phân tích đối thủ cạnh tranh';

  constructor() {
    this.competitors = new Map();
    this.insights = [];
  }

  async execute(context) {
    const {
      competitors = [],
      marketData = {},
      myStrengths = [],
      myWeaknesses = []
    } = context;

    const competitorProfiles = this.buildCompetitorProfiles(competitors);
    const marketPosition = this.analyzeMarketPosition(competitorProfiles);
    const strengthsMatrix = this.compareStrengths(competitorProfiles, myStrengths, myWeaknesses);
    const opportunities = this.identifyOpportunities(competitorProfiles, marketData);
    const battleCards = this.generateBattleCards(strengthsMatrix);

    return {
      competitorProfiles,
      marketPosition,
      competitiveAdvantages: strengthsMatrix,
      opportunities,
      battleCards,
      strategicRecommendations: this.generateRecommendations(strengthsMatrix, opportunities)
    };
  }

  buildCompetitorProfiles(competitors) {
    return competitors.map(c => ({
      name: c.name,
      marketShare: c.marketShare || 0,
      pricing: c.pricing || 'trung bình',
      positioning: c.positioning || 'trung cấp',
      strengths: c.strengths || [],
      weaknesses: c.weaknesses || [],
      threats: c.threats || [],
      recentActions: c.recentActions || [],
      aiScore: this.calculateAIScore(c)
    }));
  }

  calculateAIScore(competitor) {
    let score = 50;
    if (competitor.marketShare > 0.2) score += 20;
    if (competitor.pricing === 'thấp') score += 15;
    if (competitor.strengths?.length > 3) score += 15;
    return Math.min(score, 100);
  }

  analyzeMarketPosition(profiles) {
    const sorted = [...profiles].sort((a, b) => b.marketShare - a.marketShare);
    const totalShare = profiles.reduce((sum, p) => sum + p.marketShare, 0);
    
    return profiles.map(p => ({
      name: p.name,
      rank: sorted.findIndex(s => s.name === p.name) + 1,
      marketShare: (p.marketShare * 100).toFixed(1) + '%',
      shareOfTotal: totalShare > 0 ? ((p.marketShare / totalShare) * 100).toFixed(1) + '%' : 'N/A',
      position: p.marketShare > 0.3 ? 'leader' : p.marketShare > 0.1 ? 'challenger' : 'niche',
      dynamics: this.analyzeDynamics(p)
    }));
  }

  analyzeDynamics(competitor) {
    const dynamics = [];
    if (competitor.recentActions?.length > 0) {
      dynamics.push({ type: 'expansion', detail: 'Đang mở rộng' });
    }
    if (competitor.threats?.length > 2) {
      dynamics.push({ type: 'aggressive', detail: 'Chiến lược gây áp lực' });
    }
    return dynamics.length > 0 ? dynamics : [{ type: 'stable', detail: 'Ổn định' }];
  }

  compareStrengths(profiles, myStrengths, myWeaknesses) {
    return profiles.map(p => {
      const comparison = {
        competitor: p.name,
        myAdvantages: [],
        myDisadvantages: [],
        neutral: []
      };

      myStrengths.forEach(s => {
        if (!p.strengths.includes(s)) {
          comparison.myAdvantages.push(s);
        } else {
          comparison.neutral.push(s);
        }
      });

      myWeaknesses.forEach(w => {
        if (p.strengths.includes(w)) {
          comparison.myDisadvantages.push(w);
        }
      });

      comparison.winRate = comparison.myAdvantages.length / 
        (comparison.myAdvantages.length + comparison.myDisadvantages.length || 1);
      
      return comparison;
    });
  }

  identifyOpportunities(profiles, marketData) {
    const opportunities = [];
    
    profiles.forEach(p => {
      p.weaknesses?.forEach(w => {
        if (!opportunities.find(o => o.area === w)) {
          opportunities.push({
            area: w,
            competitor: p.name,
            action: `Khai thác ${w} trước ${p.name}`,
            potential: 'cao'
          });
        }
      });
    });

    if (marketData.gaps) {
      marketData.gaps.forEach(g => {
        opportunities.push({
          area: g.segment,
          competitor: 'Thị trường',
          action: `Đáp ứng nhu cầu ${g.segment}`,
          potential: g.potential || 'trung bình'
        });
      });
    }

    return opportunities.sort((a, b) => (b.potential === 'cao' ? 1 : 0) - (a.potential === 'cao' ? 1 : 0));
  }

  generateBattleCards(matrix) {
    return matrix.map(m => ({
      competitor: m.competitor,
      winSituation: m.myAdvantages.slice(0, 3),
      loseSituation: m.myDisadvantages.slice(0, 3),
      talkTrack: this.generateTalkTrack(m),
      winProbability: (m.winRate * 100).toFixed(0) + '%'
    }));
  }

  generateTalkTrack(comparison) {
    const tracks = [];
    if (comparison.myAdvantages.length > 0) {
      tracks.push({
        situation: 'Khách hàng quan tâm',
        script: `Chúng tôi có ${comparison.myAdvantages[0]} - điểm mà ${comparison.competitor} không có`
      });
    }
    return tracks;
  }

  generateRecommendations(strengthsMatrix, opportunities) {
    const recs = [];
    
    const highWinRate = strengthsMatrix.filter(s => s.winRate > 0.6);
    if (highWinRate.length > 0) {
      recs.push({
        type: 'offensive',
        priority: 'cao',
        action: `Tấn công ${highWinRate[0].competitor} trong các khách hàng ưu tiên`
      });
    }

    if (opportunities.length > 0) {
      recs.push({
        type: 'market',
        priority: 'trung bình',
        action: opportunities[0].action
      });
    }

    return recs;
  }
}

module.exports = CompetitiveIntelligenceSkill;