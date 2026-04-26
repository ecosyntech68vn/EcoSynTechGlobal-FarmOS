/**
 * Customer Care Hub
 * Quản lý khách hàng đa nền tảng (Telegram, Zalo, Facebook Messenger)
 * 
 * CÁCH SỬ DỤNG:
 * const hub = new CustomerCareHubSkill();
 * await hub.execute({
 *   action: 'unify_conversations',  // 'unify_conversations' | 'get_all_chats' | 'broadcast'
 *   platforms: ['telegram', 'zalo', 'messenger']
 * });
 */

class CustomerCareHubSkill {
  static name = 'customer-care-hub';
  static description = 'Quản lý khách hàng đa nền tảng';

  constructor() {
    this.conversations = new Map();
    this.platforms = ['telegram', 'zalo', 'messenger', 'email'];
  }

  async execute(context) {
    const {
      action = 'unify_conversations',
      platforms = ['telegram'],
      filters = {}
    } = context;

    switch (action) {
    case 'unify_conversations':
      return await this.unifyConversations(platforms);
    case 'get_all_chats':
      return this.getAllChats(filters);
    case 'broadcast':
      return await this.broadcastMessage(context);
    case 'get_conversation':
      return this.getConversation(context.conversationId);
    case 'assign_agent':
      return this.assignAgent(context);
    default:
      return { success: false, error: 'Unknown action' };
    }
  }

  async unifyConversations(platforms) {
    const unified = [];
    
    for (const platform of platforms) {
      const platformChats = await this.getPlatformChats(platform);
      unified.push(...platformChats);
    }

    // Sort by recent activity
    unified.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    // Save to local
    unified.forEach(chat => {
      const id = `${chat.platform}_${chat.userId}`;
      this.conversations.set(id, chat);
    });

    return {
      success: true,
      total: unified.length,
      platforms: platforms,
      conversations: unified.slice(0, 50),
      summary: this.generateSummary(unified)
    };
  }

  async getPlatformChats(platform) {
    // Mock data - trong thực tế sẽ gọi API
    const mockData = {
      telegram: [
        { platform: 'telegram', userId: '123456', userName: 'Nguyễn Văn A', lastMessage: 'Tôi muốn mua sản phẩm', lastMessageAt: new Date().toISOString(), status: 'open', platformId: 'tg_123456' },
        { platform: 'telegram', userId: '234567', userName: 'Trần Thị B', lastMessage: 'Cảm ơn!', lastMessageAt: new Date(Date.now() - 3600000).toISOString(), status: 'closed', platformId: 'tg_234567' }
      ],
      zalo: [
        { platform: 'zalo', userId: '987654', userName: 'Lê Văn C', lastMessage: 'Báo giá giúp', lastMessageAt: new Date().toISOString(), status: 'open', platformId: 'zl_987654' }
      ],
      messenger: [
        { platform: 'messenger', userId: '555666', userName: 'Phạm Văn D', lastMessage: 'Sản phẩm còn hàng?', lastMessageAt: new Date().toISOString(), status: 'pending', platformId: 'fb_555666' }
      ]
    };

    return mockData[platform] || [];
  }

  getAllChats(filters) {
    const all = Array.from(this.conversations.values());
    
    let filtered = all;
    if (filters.platform) {
      filtered = filtered.filter(c => c.platform === filters.platform);
    }
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    return {
      success: true,
      total: filtered.length,
      byPlatform: this.groupByPlatform(filtered),
      byStatus: this.groupByStatus(filtered),
      conversations: filtered.slice(0, 20)
    };
  }

  async broadcastMessage(context) {
    const { message, recipients = [], platforms = [] } = context;
    
    const results = [];
    for (const conv of this.conversations.values()) {
      if (platforms.includes(conv.platform) || platforms.length === 0) {
        results.push({
          userId: conv.userId,
          platform: conv.platform,
          status: 'sent'
        });
      }
    }

    return {
      success: true,
      total: results.length,
      results
    };
  }

  getConversation(conversationId) {
    const conv = this.conversations.get(conversationId);
    if (!conv) {
      return { success: false, error: 'Conversation not found' };
    }

    return {
      success: true,
      conversation: conv,
      history: conv.history || []
    };
  }

  assignAgent(context) {
    const { conversationId, agentId } = context;
    const conv = this.conversations.get(conversationId);
    
    if (!conv) {
      return { success: false, error: 'Conversation not found' };
    }

    conv.agentId = agentId;
    conv.status = 'assigned';
    conv.updatedAt = new Date().toISOString();
    this.conversations.set(conversationId, conv);

    return {
      success: true,
      conversation: conv,
      message: `Assigned to agent ${agentId}`
    };
  }

  generateSummary(conversations) {
    return {
      total: conversations.length,
      open: conversations.filter(c => c.status === 'open').length,
      pending: conversations.filter(c => c.status === 'pending').length,
      closed: conversations.filter(c => c.status === 'closed').length,
      avgResponseTime: '15 phút'
    };
  }

  groupByPlatform(conversations) {
    const grouped = {};
    conversations.forEach(c => {
      grouped[c.platform] = (grouped[c.platform] || 0) + 1;
    });
    return grouped;
  }

  groupByStatus(conversations) {
    const grouped = {};
    conversations.forEach(c => {
      grouped[c.status] = (grouped[c.status] || 0) + 1;
    });
    return grouped;
  }
}

module.exports = CustomerCareHubSkill;