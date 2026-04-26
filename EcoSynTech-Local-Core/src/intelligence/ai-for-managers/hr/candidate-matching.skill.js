class CandidateMatchingSkill {
  static name = 'candidate-matching-ai';
  static description = 'Ghép điểm ứng viên - vị trí tối ưu với AI';

  constructor() {
    this.matchCriteria = ['skills', 'experience', 'location', 'salary', 'culture'];
  }

  async execute(context) {
    const { candidates = [], jobs = [] } = context;

    const matches = this.findMatches(candidates, jobs);
    const ranked = this.rankMatches(matches);
    const insights = this.generateInsights(ranked);
    return {
      matches: ranked,
      insights,
      recommendations: this.recommendActions(ranked)
    };
  }

  findMatches(candidates, jobs) {
    const matches = [];
    jobs.forEach(job => {
      candidates.forEach(candidate => {
        const scores = this.calculateMatch(candidate, job);
        if (scores.total > 50) {
          matches.push({ candidate, job, scores });
        }
      });
    });
    return matches;
  }

  calculateMatch(candidate, job) {
    const skills = this.matchSkills(candidate, job);
    const experience = this.matchExperience(candidate, job);
    const location = this.matchLocation(candidate, job);
    const salary = this.matchSalary(candidate, job);
    const culture = this.matchCulture(candidate, job);

    return {
      skills: skills * 0.30,
      experience: experience * 0.25,
      location: location * 0.15,
      salary: salary * 0.15,
      culture: culture * 0.15,
      total: skills * 0.30 + experience * 0.25 + location * 0.15 + salary * 0.15 + culture * 0.15
    };
  }

  matchSkills(candidate, job) {
    const jobSkills = job.requiredSkills || [];
    const candSkills = candidate.skills || [];
    let match = 0;
    jobSkills.forEach(js => {
      if (candSkills.some(cs => cs.toLowerCase().includes(js.toLowerCase()))) match++;
    });
    return jobSkills.length > 0 ? match / jobSkills.length : 0.5;
  }

  matchExperience(candidate, job) {
    const required = job.experience || 0;
    const actual = candidate.yearsExperience || 0;
    if (actual >= required) return 1;
    if (actual >= required * 0.7) return 0.7;
    return actual / required;
  }

  matchLocation(candidate, job) {
    if (!job.location) return 1;
    if (candidate.location === job.location) return 1;
    if (candidate.remote) return 0.9;
    return 0.3;
  }

  matchSalary(candidate, job) {
    const expected = candidate.salaryExpectation || 50000;
    const offered = job.salary || 50000;
    if (offered >= expected) return 1;
    if (offered >= expected * 0.9) return 0.8;
    return 0.5;
  }

  matchCulture(candidate, job) {
    let score = 0.5;
    if (candidate.workStyle === job.workStyle) score += 0.25;
    if (candidate.values?.some(v => job.cultureValues?.includes(v))) score += 0.25;
    return score;
  }

  rankMatches(matches) {
    return matches
      .sort((a, b) => b.scores.total - a.scores.total)
      .slice(0, 20)
      .map(m => ({
        ...m,
        matchLevel: m.scores.total > 0.8 ? 'Xuất sắc' : m.scores.total > 0.6 ? 'Tốt' : 'Khá'
      }));
  }

  generateInsights(matches) {
    const skillsGaps = [];
    matches.forEach(m => {
      if (m.scores.skills < 0.5) {
        skillsGaps.push({ job: m.job.title, skill: 'Thiếu kỹ năng' });
      }
    });
    return {
      totalMatches: matches.length,
      skillGaps: skillsGaps.slice(0, 5)
    };
  }

  recommendActions(matches) {
    return matches.slice(0, 5).map(m => ({
      candidate: m.candidate.name,
      job: m.job.title,
      score: Math.round(m.scores.total * 100),
      action: 'Liên hệ ngay'
    }));
  }
}

module.exports = CandidateMatchingSkill;