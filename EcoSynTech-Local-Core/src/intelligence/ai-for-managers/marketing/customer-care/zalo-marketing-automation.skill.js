/**
 * Zalo Marketing Automation
 * Tin nhắn Zalo tự động qua Zalo API
 * 
 * CẤU HÌNH:
 * - config.accessToken: Zalo OA Access Token
 * - config.oaId: Zalo Official Account ID
 * - config.secretKey: Zalo Secret Key
 * 
 * CÁCH SỬ DỤNG:
 * const zalo = new ZaloMarketingAutomationSkill();
 * await zalo.execute({
 *   action: 'send_message',  // 'send_message' | 'send_broadcast' | 'create_button'
 *   userId: 'USER_ZALO_ID',
 *   message: { text: 'Xin chào!' },
 *   payload: { template_id: 'xxx', parameters: {} }
 * });
 */

const axios = require('axios');

class ZaloMarketingAutomationSkill {
  static name = 'zalo-marketing-automation';
  static description = 'Tin nhắn Zalo tự động qua Zalo API';

  constructor() {
    this.config = {
      accessToken: process.env.ZALO_ACCESS_TOKEN || '',
      oaId: process.env.ZALO_OA_ID || '',
      secretKey: process.env.ZALO_SECRET_KEY || '',
      appId: process.env.ZALO_APP_ID || '',
      appSecret: process.env.ZALO_APP_SECRET || ''
    };
    this.api = 'https://openapi.zalo.me/v3';
    this.templates = this.getDefaultTemplates();
  }

  async execute(context) {
    const {
      action = 'send_message',
      userId = '',
      message = {},
      payload = {},
      recipients = []
    } = context;

    if (!this.config.accessToken) {
      return {
        success: false,
        error: 'Zalo not configured',
        config: this.getConfigInstructions()
      };
    }

    let result = {};
    try {
      switch (action) {
        case 'send_message':
          result = await this.sendMessage(userId, message);
          break;
        case 'send_broadcast':
          result = await this.sendBroadcast(recipients, message);
          break;
        case 'create_qr':
          result = await this.createQRCode(payload);
          break;
        case 'get_profile':
          result = await this.getUserProfile(userId);
          break;
        case 'send_template':
          result = await this.sendTemplateMessage(userId, payload);
          break;
        case 'reply_comment':
          result = await this.replyComment(payload);
          break;
        default:
          return { success: false, error: `Action ${action} not supported` };
      }
    } catch (error) {
      result = { success: false, error: error.message };
    }

    return {
      ...result,
      action,
      configInstructions: this.getConfigInstructions()
    };
  }

  // ========== SEND MESSAGE ==========
  async sendMessage(userId, message) {
    try {
      const response = await axios.post(
        `${this.api}/message`,
        {
          recipient: { user_id: userId },
          message: {
            text: message.text || 'Xin chào! 👋'
          }
        },
        {
          params: { access_token: this.config.accessToken }
        }
      );

      return {
        success: response.data?.error === 0,
        messageId: response.data?.message_id,
        recipient: userId,
        message: 'Message sent successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // ========== BROADCAST ==========
  async sendBroadcast(recipients, message) {
    const results = [];
    let successCount = 0;

    for (const userId of recipients) {
      const result = await this.sendMessage(userId, message);
      if (result.success) successCount++;
      results.push({ userId, ...result });
    }

    return {
      success: successCount > 0,
      total: recipients.length,
      successCount,
      failed: recipients.length - successCount,
      results
    };
  }

  // ========== TEMPLATE MESSAGE ==========
  async sendTemplateMessage(userId, payload) {
    try {
      const response = await axios.post(
        `${this.api}/template/message`,
        {
          recipient: { user_id: userId },
          template_id: payload.template_id,
          template_data: payload.parameters || {}
        },
        {
          params: { access_token: this.config.accessToken }
        }
      );

      return {
        success: response.data?.error === 0,
        messageId: response.data?.message_id,
        message: 'Template message sent'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // ========== GET USER PROFILE ==========
  async getUserProfile(userId) {
    try {
      const response = await axios.get(
        `${this.api}/profile`,
        {
          params: {
            access_token: this.config.accessToken,
            user_id: userId
          }
        }
      );

      return {
        success: response.data?.error === 0,
        user: response.data?.data
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ========== QR CODE ==========
  async createQRCode(payload) {
    try {
      const response = await axios.post(
        `${this.api}/oa/qr`,
        {
          name: payload.name || 'Default QR',
          image_width: payload.width || 500
        },
        {
          params: { access_token: this.config.accessToken }
        }
      );

      return {
        success: response.data?.error === 0,
        qrUrl: response.data?.data?.qr,
        code: response.data?.data?.code
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ========== REPLY COMMENT ==========
  async replyComment(payload) {
    try {
      const response = await axios.post(
        `${this.api}/oa/comment/reply`,
        {
          recipient: { user_id: payload.userId },
          message: { text: payload.message || 'Cảm ơn bạn!' },
          owner_id: payload.ownerId || this.config.oaId
        },
        {
          params: { access_token: this.config.accessToken }
        }
      );

      return {
        success: response.data?.error === 0,
        message: 'Comment replied'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getDefaultTemplates() {
    return [
      { id: 'welcome', name: 'Chào mừng', params: ['name'] },
      { id: 'order_confirm', name: 'Xác nhận đơn hàng', params: ['order_id', 'amount'] },
      { id: 'shipping', name: 'Thông báo vận chuyển', params: ['tracking', 'eta'] },
      { id: 'promotion', name: 'Khuyến mãi', params: ['discount', 'expire'] }
    ];
  }

  getConfigInstructions() {
    return {
      step1: 'Đăng ký Zalo Official Account (OA) tại zalo.me/oa',
      step2: 'Xác minh doanh nghiệp để được API',
      step3: 'Vào "Quản lý OA" → "Cấu hình" → "Cài đặt API"',
      step4: 'Lấy Access Token và Secret Key',
      step5: 'Set env: ZALO_ACCESS_TOKEN, ZALO_OA_ID',
      links: {
        docs: 'https://developers.zalo.me/',
        createOA: 'https://business.zalo.me/manage'
      }
    };
  }
}

module.exports = ZaloMarketingAutomationSkill;