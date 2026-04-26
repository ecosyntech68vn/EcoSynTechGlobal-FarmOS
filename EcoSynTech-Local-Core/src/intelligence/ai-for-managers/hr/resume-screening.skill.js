class ResumeScreeningSkill {
  static name = 'resume-screening-ai';
  static description = 'Sàng lọc CV tự động với AI';

  constructor() {
    this.scoreWeights = {
      skills: 0.35,
      experience: 0.30,
      education: 0.15,
      cultureFit: 0.20
    };
  }

  async execute(context) {
    const { resumes = [], jobRequirements = {} } = context;

    const screenedResumes = resumes.map(r => this.screenResume(r, jobRequirements));
    const prioritized = screenedResumes.sort((a, b) => b.totalScore - a.totalScore);
    const shortlist = this.createShortlist(prioritized);
    const recommendations = this.generateRecommendations(shortlisted);

    return {
      screenedResumes: prioritized,
      shortlist,
      statistics: this.getStatistics(prioritized),
      recommendations,
      interviewPlan: this.createInterviewPlan(shortlist)
    };
  }

  screenResume(resume, requirements) {
    const scores = {
      skills: this.scoreSkills(resume, requirements.requiredSkills || []),
      experience: this.scoreExperience(resume, requirements.experience),
      education: this.scoreEducation(resume, requirements.education),
      cultureFit: this.scoreCultureFit(resume, requirements.culture)
    };

    const totalScore = (
      scores.skills * this.scoreWeights.skills +
      scores.experience * this.scoreWeights.experience +
      scores.education * this.scoreWeights.education +
      scores.cultureFit * this.scoreWeights.cultureFit
    ) * 100;

    return {
      candidate: resume.name,
      email: resume.email,
      phone: resume.phone,
      scores,
      totalScore: Math.round(totalScore),
      rating: this.getRating(totalScore),
      strengths: this.getStrengths(scores),
      weaknesses: this.getWeaknesses(scores),
      recommendation: totalScore > 70 ? 'phỏng vấn' : totalScore > 50 ? 'xem xét' : 'từ chối'
    };
  }

  scoreSkills(resume, requiredSkills) {
    let score = 0.3;
    const candidateSkills = resume.skills || [];
    requiredSkills.forEach(req => {
      if (candidateSkills.some(s => s.toLowerCase().includes(req.toLowerCase()))) {
        score += 0.15;
      }
    });
    return Math.min(1, score + (candidateSkills.length / 20));
  }

  scoreExperience(resume, required) {
    let score = 0.4;
    const years = resume.yearsExperience || 0;
    if (years >= required) score += 0.4;
    else if (years >= required * 0.7) score += 0.3;
    else if (years >= required * 0.5) score += 0.2;

    if (resume.leadership) score += 0.2;
    return Math.min(1, score);
  }

  scoreEducation(resume, required) {
    let score = 0.3;
    const eduLevels = { 'phd': 1.0, 'thạc sĩ': 0.8, 'đại học': 0.6, 'cao đẳng': 0.4 };
    const candidateLevel = eduLevels[(resume.education || '').toLowerCase()] || 0.3;
    const requiredLevel = eduLevels[(required || 'đại học').toLowerCase()] || 0.6;
    if (candidateLevel >= requiredLevel) score += 0.7;
    return Math.min(1, score);
  }

  scoreCultureFit(resume, culture) {
    let score = 0.5;
    if (resume.remoteWork === culture.remote) score += 0.25;
    if (resume.teamSize >= culture.teamSize) score += 0.25;
    return score;
  }

  getRating(score) {
    if (score >= 80) return 'Xuất sắc';
    if (score >= 70) return 'Tốt';
    if (score >= 50) return 'Khá';
    return 'Trung bình';
  }

  getStrengths(scores) {
    const strengths = [];
    if (scores.skills > 0.7) strengths.push('Kỹ năng phù hợp');
    if (scores.experience > 0.7) strengths.push('Kinh nghiệm dồi dào');
    if (scores.education > 0.7) strengths.push('Học vấn cao');
    return strengths;
  }

  getWeaknesses(scores) {
    const weaknesses = [];
    if (scores.skills < 0.4) weaknesses.push('Thiếu kỹ năng');
    if (scores.experience < 0.4) weaknesses.push('Thiếu kinh nghiệm');
    return weaknesses;
  }

  createShortlist(prioritized) {
    return prioritized
      .filter(r => r.totalScore > 50)
      .slice(0, 10)
      .map(r => ({ ...r, status: 'pending' }));
  }

  getStatistics(resumes) {
    const total = resumes.length;
    const passed = resumes.filter(r => r.totalScore > 50).length;
    const excellent = resumes.filter(r => r.totalScore >= 80).length;
    return {
      total,
      passed,
      rate: ((passed / total) * 100).toFixed(0) + '%',
      excellent,
      averageScore: (resumes.reduce((sum, r) => sum + r.totalScore, 0) / total).toFixed(0)
    };
  }

  generateRecommendations(shortlist) {
    const recs = [];
    shortlist.forEach(c => {
      recs.push({
        candidate: c.candidate,
        score: c.totalScore,
        action: c.recommendation,
        priority: c.totalScore > 70 ? 'cao' : 'trung bình'
      });
    });
    return recs;
  }

  createInterviewPlan(shortlist) {
    const rounds = [
      { round: 1, type: 'Phone Screen', duration: '30 phút', questions: 5 },
      { round: 2, type: 'Technical', duration: '60 phút', questions: 10 },
      { round: 3, type: 'Culture', duration: '45 phút', questions: 8 }
    ];
    return {
      totalRounds: rounds.length,
      estimatedTime: '2.5 giờ/candidate',
      rounds
    };
  }
}

module.exports = ResumeScreeningSkill;