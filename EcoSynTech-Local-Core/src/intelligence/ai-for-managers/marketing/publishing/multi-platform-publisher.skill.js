/**
 * Multi-Platform Publisher
 * Đăng bài đồng thời lên Facebook, TikTok, Instagram, YouTube
 * 
 * CẤU HÌNH:
 * - config.facebook.pageId: ID Facebook Page
 * - config.facebook.accessToken: Facebook API Token
 * - config.tiktok: TikTok credentials
 * - config.instagram: Instagram credentials
 * - config.youtube: YouTube credentials
 * 
 * CÁCH SỬ DỤNG:
 * const publisher = new MultiPlatformPublisherSkill();
 * await publisher.execute({
 *   content: { title: '...', body: '...', images: [], video: null },
 *   platforms: ['facebook', 'tiktok', 'instagram'],
 *   schedule: 'now' // hoặc '2025-01-15T10:00:00'
 * });
 */

const axios = require('axios');

class MultiPlatformPublisherSkill {
  static name = 'multi-platform-publisher';
  static description = 'Đăng bài đồng thời Facebook, TikTok, Instagram, YouTube';

  constructor() {
    this.platforms = {
      facebook: { name: 'Facebook', api: 'https://graph.facebook.com/v18.0' },
      instagram: { name: 'Instagram', api: 'https://graph.facebook.com/v18.0' },
      tiktok: { name: 'TikTok', api: 'https://api.tiktok.com' },
      youtube: { name: 'YouTube', api: 'https://www.googleapis.com/youtube/v3' }
    };
    
    this.config = {
      facebook: {
        pageId: process.env.FB_PAGE_ID || '',
        accessToken: process.env.FB_ACCESS_TOKEN || '',
        adAccountId: process.env.FB_AD_ACCOUNT_ID || ''
      },
      instagram: {
        accountId: process.env.IG_ACCOUNT_ID || '',
        accessToken: process.env.IG_ACCESS_TOKEN || ''
      },
      tiktok: {
        clientKey: process.env.TIKTOK_CLIENT_KEY || '',
        clientSecret: process.env.TIKTOK_CLIENT_SECRET || '',
        accessToken: process.env.TIKTOK_ACCESS_TOKEN || ''
      },
      youtube: {
        channelId: process.env.YT_CHANNEL_ID || '',
        apiKey: process.env.YT_API_KEY || ''
      }
    };
  }

  async execute(context) {
    const {
      content = {},
      platforms = ['facebook'],
      schedule = 'now',
      options = {}
    } = context;

    const results = {};
    const scheduledTime = schedule === 'now' ? new Date() : new Date(schedule);

    for (const platform of platforms) {
      try {
        results[platform] = await this.publishToPlatform(platform, content, scheduledTime);
      } catch (error) {
        results[platform] = { success: false, error: error.message };
      }
    }

    const summary = this.generateSummary(results);
    const analytics = this.calculateAnalytics(results);

    return {
      content: content.title || 'Untitled',
      platforms,
      results,
      summary,
      analytics,
      scheduledTime: scheduledTime.toISOString(),
      configInstructions: this.getConfigInstructions()
    };
  }

  async publishToPlatform(platform, content, scheduledTime) {
    switch (platform) {
    case 'facebook':
      return await this.publishFacebook(content);
    case 'instagram':
      return await this.publishInstagram(content);
    case 'tiktok':
      return await this.publishTikTok(content);
    case 'youtube':
      return await this.publishYouTube(content);
    default:
      return { success: false, error: `Platform ${platform} not supported` };
    }
  }

  // ========== FACEBOOK ==========
  async publishFacebook(content) {
    if (!this.config.facebook.accessToken || !this.config.facebook.pageId) {
      return {
        success: false,
        error: 'Facebook not configured',
        setup: 'Set FB_PAGE_ID and FB_ACCESS_TOKEN in environment variables',
        postUrl: 'https://developers.facebook.com/apps'
      };
    }

    try {
      const postData = {
        message: this.formatContent(content),
        access_token: this.config.facebook.accessToken
      };

      if (content.images?.length > 0) {
        // Upload photo first
        const photoResponse = await axios.post(
          `${this.platforms.facebook.api}/${this.config.facebook.pageId}/photos`,
          {
            url: content.images[0],
            caption: this.formatContent(content),
            access_token: this.config.facebook.accessToken
          }
        );
        return {
          success: true,
          platform: 'facebook',
          postId: photoResponse.data.id,
          postUrl: `https://facebook.com/${photoResponse.data.id}`,
          message: 'Posted to Facebook successfully'
        };
      }

      // Text post
      const response = await axios.post(
        `${this.platforms.facebook.api}/${this.config.facebook.pageId}/feed`,
        postData
      );

      return {
        success: true,
        platform: 'facebook',
        postId: response.data.id,
        postUrl: `https://facebook.com/${response.data.id}`,
        message: 'Posted to Facebook successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        platform: 'facebook'
      };
    }
  }

  // ========== INSTAGRAM ==========
  async publishInstagram(content) {
    if (!this.config.instagram.accessToken || !this.config.instagram.accountId) {
      return {
        success: false,
        error: 'Instagram not configured',
        setup: 'Set IG_ACCOUNT_ID and link with Facebook Page'
      };
    }

    try {
      const containerResponse = await axios.post(
        `${this.platforms.instagram.api}/${this.config.instagram.accountId}/media`,
        {
          image_url: content.images?.[0] || content.video,
          caption: this.formatContent(content),
          access_token: this.config.instagram.accessToken
        }
      );

      // Publish container
      const publishResponse = await axios.post(
        `${this.platforms.instagram.api}/${this.config.instagram.accountId}/media_publish`,
        {
          creation_id: containerResponse.data.id,
          access_token: this.config.instagram.accessToken
        }
      );

      return {
        success: true,
        platform: 'instagram',
        mediaId: publishResponse.data.id,
        message: 'Posted to Instagram successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        platform: 'instagram'
      };
    }
  }

  // ========== TIKTOK ==========
  async publishTikTok(content) {
    if (!this.config.tiktok.accessToken) {
      return {
        success: false,
        error: 'TikTok not configured',
        setup: 'Set TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_ACCESS_TOKEN'
      };
    }

    try {
      // TikTok requires video upload in multiple steps
      const response = await axios.post(
        'https://open.tiktok.io/v2/video/submit/',
        {
          video_url: content.video,
          title: content.title,
          description: content.body,
          privacy_level: 'PUBLIC',
          allow_comment: true,
          allow_duet: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.tiktok.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        platform: 'tiktok',
        videoId: response.data.data?.video_id,
        message: 'Submitted to TikTok successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        platform: 'tiktok',
        note: 'TikTok API requires business account approval'
      };
    }
  }

  // ========== YOUTUBE ==========
  async publishYouTube(content) {
    if (!this.config.youtube.apiKey || !content.video) {
      return {
        success: false,
        error: 'YouTube not configured or no video',
        setup: 'Set YT_API_KEY and provide video URL'
      };
    }

    try {
      const response = await axios.post(
        `${this.platforms.youtube.api}/videos`,
        {
          part: 'snippet,status',
          snippet: {
            title: content.title,
            description: content.body,
            tags: content.tags || [],
            categoryId: '22' // People & Blogs
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false
          }
        },
        {
          params: { part: 'snippet,status' },
          headers: { Authorization: `Bearer ${this.config.youtube.apiKey}` }
        }
      );

      return {
        success: true,
        platform: 'youtube',
        videoId: response.data.items[0].id,
        videoUrl: `https://youtube.com/watch?v=${response.data.items[0].id}`,
        message: 'Uploaded to YouTube successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        platform: 'youtube'
      };
    }
  }

  formatContent(content) {
    let formatted = '';
    if (content.title) formatted += `**${content.title}**\n\n`;
    if (content.body) formatted += `${content.body}\n\n`;
    if (content.hashtags) formatted += content.hashtags.join(' ');
    return formatted;
  }

  generateSummary(results) {
    const successful = Object.values(results).filter(r => r.success).length;
    const total = Object.keys(results).length;
    return {
      total: total,
      successful,
      failed: total - successful,
      successRate: `${((successful / total) * 100).toFixed(0)}%`
    };
  }

  calculateAnalytics(results) {
    return {
      trackClicks: true,
      trackEngagement: true,
      metrics: ['impressions', 'clicks', 'engagement', 'conversions']
    };
  }

  getConfigInstructions() {
    return {
      facebook: {
        env: ['FB_PAGE_ID', 'FB_ACCESS_TOKEN'],
        getToken: 'https://developers.facebook.com → My Apps → Tools → Graph API Explorer',
        getPageId: 'Facebook Page Settings → About'
      },
      tiktok: {
        env: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_ACCESS_TOKEN'],
        getCredentials: 'https://developers.tiktok.com'
      },
      instagram: {
        note: 'Link Instagram Business to Facebook Page',
        env: ['IG_ACCOUNT_ID'],
        getId: 'Facebook Developer → Instagram Business'
      },
      youtube: {
        env: ['YT_API_KEY'],
        getKey: 'https://console.cloud.google.com → YouTube Data API v3'
      }
    };
  }
}

module.exports = MultiPlatformPublisherSkill;