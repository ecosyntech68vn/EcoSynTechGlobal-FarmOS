/**
 * Facebook Lead Crawler
 * Thu thập leads từ Facebook Page, Groups, Ads
 * 
 * CẤU HÌNH:
 * - config.accessToken: Facebook API Token
 * - config.pageId: Facebook Page ID
 * - config.targets:Groups/Pages cần thu thập
 * 
 * CÁCH SỬ DỤNG:
 * const crawler = new FacebookLeadCrawlerSkill();
 * const result = await crawler.execute({
 *   type: 'page_leads',  // 'page_leads' | 'group_members' | 'ad_audience'
 *   target: 'PAGE_ID',
 *   limit: 100
 * });
 */

const axios = require('axios');

class FacebookLeadCrawlerSkill {
  static name = 'facebook-lead-crawler';
  static description = 'Thu thập leads từ Facebook Page, Groups, Ads';

  constructor() {
    this.config = {
      accessToken: process.env.FB_ACCESS_TOKEN || '',
      pageId: process.env.FB_PAGE_ID || '',
      appId: process.env.FB_APP_ID || '',
      appSecret: process.env.FB_APP_SECRET || ''
    };
    this.api = 'https://graph.facebook.com/v18.0';
  }

  async execute(context) {
    const {
      type = 'page_leads',
      target = this.config.pageId,
      limit = 50,
      fields = ['name', 'email', 'phone']
    } = context;

    if (!this.config.accessToken) {
      return {
        success: false,
        error: 'Facebook access token not configured',
        config: this.getConfigInstructions()
      };
    }

    let leads = [];
    try {
      switch (type) {
      case 'page_leads':
        leads = await this.getPageLeads(target, limit, fields);
        break;
      case 'group_members':
        leads = await this.getGroupMembers(target, limit);
        break;
      case 'ad_audience':
        leads = await this.getAdAudience(target, limit);
        break;
      case 'messenger':
        leads = await this.getMessengerLeads(target, limit);
        break;
      default:
        return { success: false, error: `Type ${type} not supported` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }

    const enriched = this.enrichLeads(leads);
    const deduplicated = this.deduplicateLeads(enriched);

    return {
      success: true,
      type,
      target,
      totalFound: leads.length,
      uniqueLeads: deduplicated.length,
      leads: deduplicated,
      analytics: this.analyzeLeads(deduplicated),
      configInstructions: this.getConfigInstructions()
    };
  }

  // ========== PAGE LEADS (from Lead Gen Forms) ==========
  async getPageLeads(pageId, limit, fields) {
    try {
      const response = await axios.get(`${this.api}/${pageId}/leadgen_forms`, {
        params: {
          access_token: this.config.accessToken,
          fields: 'id,name',
          limit: 10
        }
      });

      const forms = response.data.data || [];
      const allLeads = [];

      for (const form of forms) {
        const leadsResponse = await axios.get(`${this.api}/${form.id}/leads`, {
          params: {
            access_token: this.config.accessToken,
            limit: limit / forms.length
          }
        });

        for (const lead of leadsResponse.data.data || []) {
          const leadData = {
            source: 'lead_form',
            formName: form.name,
            formId: form.id,
            createdAt: lead.created_time,
            answers: []
          };

          // Extract field answers
          for (const field of lead.field_data || []) {
            if (field.name === 'email') leadData.email = field.values[0];
            if (field.name === 'phone') leadData.phone = field.values[0];
            if (field.name === 'full_name') leadData.name = field.values[0];
            leadData.answers.push({ field: field.name, value: field.values[0] });
          }

          allLeads.push(leadData);
        }
      }

      return allLeads;
    } catch (error) {
      console.error('Page leads error:', error.message);
      return [];
    }
  }

  // ========== GROUP MEMBERS ==========
  async getGroupMembers(groupId, limit) {
    try {
      const response = await axios.get(`${this.api}/${groupId}/members`, {
        params: {
          access_token: this.config.accessToken,
          limit: limit
        }
      });

      return (response.data.data || []).map(member => ({
        source: 'group',
        groupId,
        id: member.id,
        name: member.name,
        profileUrl: `https://facebook.com/${member.id}`,
        extractedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Group members error:', error.message);
      return [];
    }
  }

  // ========== MESSENGER LEADS ==========
  async getMessengerLeads(pageId, limit) {
    try {
      const conversations = await axios.get(`${this.api}/${pageId}/conversations`, {
        params: {
          access_token: this.config.accessToken,
          limit: limit
        }
      });

      const leads = [];
      for (const conv of conversations.data.data || []) {
        const messages = await axios.get(`${this.api}/${conv.id}/messages`, {
          params: {
            access_token: this.config.accessToken,
            limit: 10
          }
        });

        const firstMessage = messages.data.data?.[messages.data.data.length - 1];
        if (firstMessage?.message) {
          leads.push({
            source: 'messenger',
            pageId,
            conversationId: conv.id,
            message: firstMessage.message,
            userId: firstMessage.from?.id,
            name: firstMessage.from?.name,
            extractedAt: new Date().toISOString()
          });
        }
      }

      return leads;
    } catch (error) {
      console.error('Messenger leads error:', error.message);
      return [];
    }
  }

  // ========== AD AUDIENCE ==========
  async getAdAudience(adAccountId, limit) {
    try {
      const response = await axios.get(`${this.api}/act_${adAccountId}/users`, {
        params: {
          access_token: this.config.accessToken,
          limit: limit
        }
      });

      return (response.data.data || []).map(user => ({
        source: 'ad_audience',
        adAccountId,
        id: user.id,
        country: user.country,
        age: user.age,
        extractedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Ad audience error:', error.message);
      return [];
    }
  }

  // ========== ENRICHE LEADS ==========
  enrichLeads(leads) {
    return leads.map(lead => ({
      ...lead,
      score: this.calculateLeadScore(lead),
      tags: this.extractTags(lead),
      qualified: this.isQualified(lead)
    }));
  }

  calculateLeadScore(lead) {
    let score = 0;
    if (lead.name) score += 20;
    if (lead.email) score += 30;
    if (lead.phone) score += 30;
    if (lead.message?.length > 10) score += 20;
    return score;
  }

  extractTags(lead) {
    const tags = [];
    if (lead.source === 'lead_form') tags.push('lead_form');
    if (lead.message?.toLowerCase().includes('mua')) tags.push('hot_lead');
    if (lead.score > 70) tags.push('high_priority');
    return tags;
  }

  isQualified(lead) {
    return lead.email && lead.score > 50;
  }

  // ========== DEDUPLICATE ==========
  deduplicateLeads(leads) {
    const seen = new Set();
    return leads.filter(lead => {
      const key = lead.email || lead.phone || lead.userId || lead.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // ========== ANALYTICS ==========
  analyzeLeads(leads) {
    const bySource = {};
    const byScore = { high: 0, medium: 0, low: 0 };
    
    leads.forEach(lead => {
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      if (lead.score > 70) byScore.high++;
      else if (lead.score > 40) byScore.medium++;
      else byScore.low++;
    });

    return {
      bySource,
      byQuality: byScore,
      total: leads.length,
      qualified: leads.filter(l => l.qualified).length,
      averageScore: (leads.reduce((s, l) => s + l.score, 0) / leads.length).toFixed(0)
    };
  }

  getConfigInstructions() {
    return {
      step1: 'Tạo Facebook Developer Account',
      step2: 'Tạo App mới tại developers.facebook.com',
      step3: 'Thêm sản phẩm "Marketing API"',
      step4: 'Generate Access Token với quyền pages_read_leads, groups_read_member',
      step5: 'Set env: FB_ACCESS_TOKEN, FB_PAGE_ID'
    };
  }
}

module.exports = FacebookLeadCrawlerSkill;