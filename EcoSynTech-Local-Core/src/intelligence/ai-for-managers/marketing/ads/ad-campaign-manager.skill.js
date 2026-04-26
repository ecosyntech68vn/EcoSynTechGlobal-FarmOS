/**
 * Ad Campaign Manager
 * Quản lý quảng cáo Facebook/Google/TikTok
 * 
 * CẤU HÌNH:
 * - config.facebook.adAccountId: Facebook Ad Account ID
 * - config.facebook.accessToken: FB Ads API Token
 * - config.google.customerId: Google Ads Customer ID
 * - config.google.developerToken: Google Dev Token
 * 
 * CÁCH SỬ DỤNG:
 * const ads = new AdCampaignManagerSkill();
 * await ads.execute({
 *   action: 'create_campaign',  // 'create_campaign' | 'get_stats' | 'optimize'
 *   platform: 'facebook',     // 'facebook' | 'google' | 'tiktok'
 *   campaign: { name: '...', objective: 'CONVERSIONS', budget: 500000 }
 * });
 */

const axios = require('axios');

class AdCampaignManagerSkill {
  static name = 'ad-campaign-manager';
  static description = 'Quản lý quảng cáo Facebook/Google/TikTok';

  constructor() {
    this.config = {
      facebook: {
        adAccountId: process.env.FB_AD_ACCOUNT_ID || '',
        accessToken: process.env.FB_ACCESS_TOKEN || ''
      },
      google: {
        customerId: process.env.GOOGLE_ADS_CUSTOMER_ID || '',
        developerToken: process.env.GOOGLE_DEVELOPER_TOKEN || '',
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN || ''
      },
      tiktok: {
        adAccountId: process.env.TIKTOK_AD_ACCOUNT_ID || '',
        accessToken: process.env.TIKTOK_AD_ACCESS_TOKEN || ''
      }
    };
    
    this.campaigns = new Map();
  }

  async execute(context) {
    const {
      action = 'list_campaigns',
      platform = 'facebook',
      campaign = {},
      platformConfig = {}
    } = context;

    if (platform === 'facebook') {
      return await this.handleFacebook(action, campaign, platformConfig);
    } else if (platform === 'google') {
      return await this.handleGoogle(action, campaign, platformConfig);
    } else if (platform === 'tiktok') {
      return await this.handleTikTok(action, campaign, platformConfig);
    }

    return {
      success: false,
      error: 'Platform not supported',
      platforms: ['facebook', 'google', 'tiktok']
    };
  }

  // ========== FACEBOOK ==========
  async handleFacebook(action, campaign) {
    if (!this.config.facebook.accessToken) {
      return { success: false, error: 'Facebook not configured', config: this.getConfigInstructions(platform='facebook') };
    }

    switch (action) {
      case 'create_campaign':
        return await this.createFBCampaign(campaign);
      case 'list_campaigns':
        return await this.listFBCampaigns();
      case 'get_stats':
        return await this.getFBStats(campaign.id);
      case 'optimize':
        return await this.optimizeFBCampaign(campaign.id);
      case 'pause':
        return await this.toggleFBCampaign(campaign.id, 'PAUSED');
      case 'activate':
        return await this.toggleFBCampaign(campaign.id, 'ACTIVE');
      default:
        return { success: false, error: `Action ${action} not supported` };
    }
  }

  async createFBCampaign(campaign) {
    try {
      const response = await axios.post(
        'https://graph.facebook.com/v18.0/act_' + this.config.facebook.adAccountId + '/campaigns',
        {
          name: campaign.name || 'New Campaign',
          objective: campaign.objective || 'CONVERSIONS',
          status: campaign.status || 'PAUSED',
          daily_budget: campaign.dailyBudget || campaign.budget * 100,
          spend_cap: campaign.spendCap || null,
          promoted_object: campaign.promotedObject || {},
          access_token: this.config.facebook.accessToken
        }
      );

      const campaignId = response.data.id;

      // Create ad set
      if (campaign.adSet) {
        const adSetResponse = await axios.post(
          'https://graph.facebook.com/v18.0/' + campaignId + '/adsets',
          {
            name: campaign.name + ' - Ad Set',
            campaign_id: campaignId,
            daily_budget: campaign.adSet.dailyBudget || campaign.dailyBudget * 100,
            targeting: campaign.adSet.targeting || {},
            optimization_goal: campaign.adSet.optimization || 'CONVERSIONS',
            billing_event: campaign.adSet.billing || 'IMPRESSIONS',
            access_token: this.config.facebook.accessToken
          }
        );

        // Create ad
        if (campaign.creative) {
          await axios.post(
            'https://graph.facebook.com/v18.0/' + adSetResponse.data.id + '/ads',
            {
              name: campaign.name + ' - Ad',
              creative: campaign.creative,
              status: 'PAUSED',
              access_token: this.config.facebook.accessToken
            }
          );
        }
      }

      return {
        success: true,
        campaignId,
        status: 'created',
        message: 'Campaign created successfully'
      };
    } catch (error) {
      return { success: false, error: error.response?.data?.error?.message || error.message };
    }
  }

  async listFBCampaigns() {
    try {
      const response = await axios.get(
        'https://graph.facebook.com/v18.0/act_' + this.config.facebook.adAccountId + '/campaigns',
        {
          params: {
            access_token: this.config.facebook.accessToken,
            fields: 'id,name,status,objective,daily_budget,created_time',
            limit: 50
          }
        }
      );

      return {
        success: true,
        campaigns: response.data.data || [],
        total: response.data.data?.length || 0
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getFBStats(campaignId) {
    try {
      const response = await axios.get(
        'https://graph.facebook.com/v18.0/' + campaignId + '/insights',
        {
          params: {
            access_token: this.config.facebook.accessToken,
            date_preset: 'last_30d',
            fields: 'impressions,clicks,reach,cpc,spend,conversions,ctr'
          }
        }
      );

      const data = response.data.data?.[0] || {};
      return {
        success: true,
        stats: {
          impressions: parseInt(data.impressions || 0),
          clicks: parseInt(data.clicks || 0),
          reach: parseInt(data.reach || 0),
          spend: parseFloat(data.spend || 0),
          cpc: parseFloat(data.cpc || 0),
          ctr: data.ctr,
          conversions: parseInt(data.conversions || 0)
        },
        roi: this.calculateROI(parseFloat(data.spend || 0), parseInt(data.conversions || 0))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async toggleFBCampaign(campaignId, status) {
    try {
      await axios.post(
        'https://graph.facebook.com/v18.0/' + campaignId,
        {
          status,
          access_token: this.config.facebook.accessToken
        }
      );

      return { success: true, campaignId, status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async optimizeFBCampaign(campaignId) {
    const stats = await this.getFBStats(campaignId);
    if (!stats.success) return stats;

    const cpc = stats.stats.cpc;
    const conversions = stats.stats.conversions;
    
    let recommendations = [];
    
    if (cpc > 50000) {
      recommendations.push({ type: 'reduce_bid', suggestion: 'Giảm bid để giảm CPC' });
    }
    if (conversions < 10 && stats.stats.clicks > 1000) {
      recommendations.push({ type: 'improve_creative', suggestion: 'Thay đổi creative mới' });
    }
    if (stats.stats.ctr < 1) {
      recommendations.push({ type: 'improve_creative', suggestion: 'Cải thiện CTR' });
    }

    return {
      success: true,
      campaignId,
      recommendations,
      stats: stats.stats
    };
  }

  // ========== GOOGLE ==========
  async handleGoogle(action, campaign) {
    return { success: false, note: 'Google Ads API - cần OAuth setup', ...this.getConfigInstructions('google') };
  }

  // ========== TIKTOK ==========
  async handleTikTok(action, campaign) {
    return { success: false, note: 'TikTok Ads API - cần business account', ...this.getConfigInstructions('tiktok') };
  }

  // ========== ROI ==========
  calculateROI(spend, conversions) {
    const avgValue = 500000; // Giá trị trung bình mỗi conversion
    const revenue = conversions * avgValue;
    return {
      spend: spend,
      revenue: revenue,
      roi: spend > 0 ? ((revenue - spend) / spend * 100).toFixed(0) + '%' : '0%'
    };
  }

  getConfigInstructions(platform) {
    return {
      facebook: {
        env: ['FB_AD_ACCOUNT_ID', 'FB_ACCESS_TOKEN'],
        getToken: 'Marketing API → Tools → Graph API Explorer',
        docs: 'https://developers.facebook.com/docs/marketing-api'
      },
      google: {
        env: ['GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_DEVELOPER_TOKEN'],
        docs: 'https://developers.google.com/google-ads/api'
      },
      tiktok: {
        env: ['TIKTOK_AD_ACCOUNT_ID', 'TIKTOK_AD_ACCESS_TOKEN'],
        docs: 'https://business-api.tiktok.com'
      }
    };
  }
}

module.exports = AdCampaignManagerSkill;