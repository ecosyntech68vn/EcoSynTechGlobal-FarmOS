/**
 * Content Calendar
 * Lên lịch content marketing đa nền tảng
 * 
 * CÁCH SỬ DỤNG:
 * const calendar = new ContentCalendarSkill();
 * await calendar.execute({
 *   action: 'schedule',  // 'schedule' | 'get_calendar' | 'suggest'
 *   content: { title: '...', platforms: ['facebook', 'tiktok'] },
 *   schedule: '2025-01-15T10:00:00'
 * });
 */

class ContentCalendarSkill {
  static name = 'content-calendar';
  static description = 'Lên lịch content marketing đa nền tảng';

  constructor() {
    this.schedule = new Map();
    this.templates = this.getDefaultTemplates();
    this.themes = ['Product Launch', 'Testimonial', 'Tips', 'Behind the Scenes', 'Customer Story'];
  }

  async execute(context) {
    const {
      action = 'get_calendar',
      content = {},
      schedule = null,
      platform = 'all'
    } = context;

    switch (action) {
    case 'schedule':
      return await this.scheduleContent(content, schedule);
    case 'get_calendar':
      return this.getCalendar(platform);
    case 'suggest':
      return this.suggestContent();
    case 'analyze':
      return this.analyzePerformance();
    default:
      return { success: false, error: 'Unknown action' };
    }
  }

  async scheduleContent(content, scheduleTime) {
    const id = 'CONTENT-' + Date.now();
    const scheduledAt = scheduleTime ? new Date(scheduleTime) : new Date();
    
    const entry = {
      id,
      ...content,
      platforms: content.platforms || ['facebook'],
      scheduledAt: scheduledAt.toISOString(),
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    this.schedule.set(id, entry);

    return {
      success: true,
      content: entry,
      message: `Scheduled for ${scheduledAt.toLocaleString('vi-VN')}`
    };
  }

  getCalendar(platform = 'all') {
    const entries = Array.from(this.schedule.values());
    
    const filtered = platform === 'all' 
      ? entries 
      : entries.filter(e => e.platforms.includes(platform));

    const byPlatform = {};
    filtered.forEach(entry => {
      entry.platforms.forEach(p => {
        byPlatform[p] = (byPlatform[p] || []).concat(entry);
      });
    });

    return {
      success: true,
      total: filtered.length,
      byPlatform,
      upcoming: filtered.slice(0, 10),
      calendarView: this.generateCalendarView(filtered)
    };
  }

  suggestContent() {
    const suggestions = [];
    const dayOfWeek = new Date().getDay();
    
    // Theme recommendations by day
    const themeByDay = {
      0: ['Customer Story', 'Behind the Scenes'],
      1: ['Tips', 'Motivational'],
      2: ['Product Feature', 'How-to'],
      3: ['Testimonial', 'Case Study'],
      4: ['Tips', 'Q&A'],
      5: ['Behind the Scenes', 'Team'],
      6: ['Customer Story', 'Weekend']
    };

    const todayThemes = themeByDay[dayOfWeek] || this.themes;

    todayThemes.forEach(theme => {
      suggestions.push({
        theme,
        title: this.generateTitle(theme),
        suggestedPlatforms: this.getPlatformForTheme(theme),
        bestTime: this.getBestTime(theme)
      });
    });

    return {
      success: true,
      suggestions,
      day: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dayOfWeek],
      tips: this.getTips()
    };
  }

  analyzePerformance() {
    const entries = Array.from(this.schedule.values());
    
    return {
      success: true,
      total: entries.length,
      byPlatform: entries.reduce((acc, e) => {
        e.platforms.forEach(p => acc[p] = (acc[p] || 0) + 1);
        return acc;
      }, {}),
      stats: {
        scheduled: entries.filter(e => e.status === 'scheduled').length,
        published: entries.filter(e => e.status === 'published').length,
        draft: entries.filter(e => e.status === 'draft').length
      }
    };
  }

  generateTitle(theme) {
    const templates = {
      'Customer Story': 'Khách hàng nói gì về chúng tôi',
      'Tips': '5 mẹo hay cho bạn',
      'Product Launch': 'Ra mắt sản phẩm mới',
      'Testimonial': 'Đánh giá từ khách hàng',
      'Behind the Scenes': 'Hậu trường'
    };
    return templates[theme] || theme;
  }

  getPlatformForTheme(theme) {
    const mapping = {
      'Customer Story': ['facebook', 'instagram'],
      'Tips': ['facebook', 'tiktok'],
      'Product Launch': ['facebook', 'youtube'],
      'Testimonial': ['facebook', 'instagram'],
      'Behind the Scenes': ['tiktok', 'instagram']
    };
    return mapping[theme] || ['facebook'];
  }

  getBestTime(theme) {
    const times = {
      'facebook': { day: '09:00', evening: '19:00' },
      'instagram': { day: '12:00', evening: '20:00' },
      'tiktok': { morning: '06:00', afternoon: '15:00', evening: '21:00' },
      'youtube': { evening: '19:00' }
    };
    return times[theme] || times['facebook'];
  }

  getTips() {
    return [
      'Sử dụng hashtags phổ biến',
      'Đăng bài vào giờ cao điểm',
      'Kết hợp hình ảnh +Video',
      'CTA rõ ràng'
    ];
  }

  generateCalendarView(entries) {
    const view = {};
    entries.forEach(entry => {
      const date = entry.scheduledAt.split('T')[0];
      if (!view[date]) view[date] = [];
      view[date].push(entry);
    });
    return view;
  }

  getDefaultTemplates() {
    return [
      { name: 'Product Demo', platform: ['facebook', 'youtube'], duration: '5p' },
      { name: 'Customer Testimonial', platform: ['facebook', 'instagram'], duration: '1p' },
      { name: 'Tips & Tricks', platform: ['tiktok', 'facebook'], duration: '30s' }
    ];
  }
}

module.exports = ContentCalendarSkill;