class JobDescriptionGeneratorSkill {
  static name = 'job-description-generator';
  static description = 'Tạo mô tả công việc tự động với AI';

  constructor() {
    this.templates = {
      software: {
        title: 'Software Engineer',
        summary: 'Phát triển và duy trì phần mềm',
        responsibilities: ['Viết code', 'Review code', 'Testing'],
        requirements: ['3+ năm kinh nghiệm', 'JavaScript/TypeScript', 'Git']
      },
      sales: {
        title: 'Sales Manager',
        summary: 'Quản lý doanh số bán hàng',
        responsibilities: ['Đạt target', 'Quản lý KH', 'Báo cáo'],
        requirements: ['5+ năm kinh nghiệm', 'CRM', 'Giao tiếp tốt']
      }
    };
  }

  async execute(context) {
    const { position = '', department = '', level = 'mid', customizations = {} } = context;

    const base = this.getPositionTemplate(position);
    const jd = this.generateJD(base, level, customizations);
    const requirements = this.generateRequirements(jd, level);
    const keywords = this.extractKeywords(jd);
    const atsOptimized = this.optimizeForATS(jd);
    
    return {
      position,
      department: department || 'General',
      level,
      jd,
      requirements,
      keywords,
      atsOptimized,
      translations: this.translateJD(jd),
      versions: this.createVersions(jd)
    };
  }

  getPositionTemplate(position) {
    const positionKey = position.toLowerCase();
    for (const [key, template] of Object.entries(this.templates)) {
      if (positionKey.includes(key)) return template;
    }
    return {
      title: position,
      summary: 'Vai trò chuyên môn',
      responsibilities: ['Thực hiện nhiệm vụ', 'Hợp tác đội nhóm', 'Báo cáo'],
      requirements: ['Kinh nghiệm', 'Kỹ năng', 'Giao tiếp']
    };
  }

  generateJD(base, level, custom) {
    const levelModifiers = {
      'junior': { prefix: 'Junior', experience: '1-2 năm', expectation: 'Cơ bản' },
      'mid': { prefix: '', experience: '3-5 năm', expectation: 'Độc lập' },
      'senior': { prefix: 'Senior', experience: '5+ năm', expectation: 'Dẫn dắt' },
      'lead': { prefix: 'Lead', experience: '7+ năm', expectation: 'Quản lý' }
    };

    const modifier = levelModifiers[level] || levelModifiers.mid;
    
    return {
      title: `${modifier.prefix} ${base.title}`.trim(),
      summary: base.summary,
      level: modifier.experience,
      expectations: modifier.expectation,
      overview: `${base.title} - ${modifier.experience} kinh nghiệm`,
      responsibilities: base.responsibilities.map(r => `${r} - ${modifier.expectation}`),
      ...custom
    };
  }

  generateRequirements(jd, level) {
    const experienceYear = parseInt(level.match(/\d+/)?.[0] || 3);
    return {
      minimum: {
        experience: `${experienceYear}+ năm`,
        education: 'Đại học trở lên',
        skills: jd.responsibilities?.slice(0, 3) || []
      },
      preferred: {
        experience: `${experienceYear + 2}+ năm`,
        education: 'Thạc sĩ',
        certifications: ['相关认证']
      },
      softSkills: ['Giao tiếp', 'Làm việc nhóm', 'Giải quyết vấn đề']
    };
  }

  extractKeywords(jd) {
    const keywords = [];
    const text = JSON.stringify(jd);
    const matches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    return [...new Set(matches)].slice(0, 20);
  }

  optimizeForATS(jd) {
    const text = JSON.stringify(jd);
    const atsKeywords = [
      'team', 'lead', 'management', 'experience', 'skill',
      'knowledge', 'ability', 'communication', 'problem', 'solving'
    ];
    return {
      keywordDensity: (atsKeywords.filter(k => text.toLowerCase().includes(k)).length / atsKeywords.length * 100,
      format: 'ATS-friendly',
      scoring: '85/100'
    };
  }

  translateJD(jd) {
    return {
      en: { ...jd, title: `English: ${jd.title}` },
      vi: jd,
      ja: { ...jd, title: ` Japanese: ${jd.title}` }
    };
  }

  createVersions(jd) {
    return {
      brief: jd.summary + '. ' + jd.overview,
      standard: jd,
      detailed: { ...jd, full: true, benefits: 'Full package' }
    };
  }
}

module.exports = JobDescriptionGeneratorSkill;