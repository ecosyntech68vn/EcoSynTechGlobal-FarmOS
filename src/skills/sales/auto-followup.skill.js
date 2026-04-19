module.exports = {
  id: 'auto-followup',
  name: 'Auto Follow-up & Re-engagement',
  description: 'Tự động nhắc follow-up và re-engage lead cold',
  version: '2.3.2',

  FOLLOWUP_RULES: {
    new_lead: { firstResponse: 4, intervals: [2, 5, 10], template: 'default' },
   demo_requested: { firstResponse: 1, intervals: [1, 3, 7], template: 'demo' },
    proposal_sent: { firstResponse: 3, intervals: [2, 4, 7], template: 'proposal_follow' },
    negotiation: { firstResponse: 1, intervals: [1, 2, 3], template: 'negotiation' },
    inactive: { firstResponse: 0, intervals: [7, 14, 30], template: 're-engage' }
  },

  CHANNELS: ['email', 'sms', 'zalo', 'call', 'whatsapp'],

  TEMPLATES: {
    default: {
      subject: 'Cập nhật từ EcoSynTech - {date}',
      email: [
        {
          type: 'initial',
          subject: 'Cảm ơn bạn đã quan tâm EcoSynTech!',
          body: 'Xin chào {contact_name},\n\nCảm ơn bạn đã dành thời gian tìm hiểu về giải pháp IoT nông nghiệp thông minh của EcoSynTech.\n\nChúng tôi muốn được hỗ trợ bạn tốt hơn. Bạn có câu hỏi gì không?\n\n\nTrân trọng,\n{sales_name}\nEcoSynTech'
        },
        {
          type: 'follow_1',
          subject: 'Giải pháp IoT cho farm của bạn',
          body: 'Xin chào {contact_name},\n\nTôi muốn chia sẻ một số case study về farm tương tự của bạn:\n\n{dummy_case_study}\n\nBạn có muốn trao đổi thêm không?\n\n\nTrân trọng,\n{sales_name}'
        },
        {
          type: 'follow_2',
          subject: 'ROI của giải pháp IoT nông nghiệp',
          body: 'Xin chào {contact_name},\n\nTôi gửi bạn ROI calculator của EcoSynTech:\n\n- Tiết kiệm nước: 30-45%\n- Giảm nhân công: 20-35%\n- Thu hồi vốn: 9-15 tháng\n\nHẹn được giới thiệu trực tiếp?\n\n\n{sales_name}'
        }
      ],
      sms: [
        { body: 'Xin chao {contact_name}, cam on da quan tam EcoSynTech. Duoc khong? ({sales_name])' },
        { body: 'Xin chao {contact_name}, tien doi RAT 30-45% voi IoT. Xem them: {link}' },
        { body: 'Xin chao {contact_name}, gap may tinh ROI? Toi goi lai sau nhe. ({sales_name]}' }
      ]
    },
    demo: {
      subject: 'Hẹn demo EcoSynTech - {date}',
      email: [
        {
          type: 'initial',
          subject: 'Xác nhận lịch demo',
          body: 'Xin chào {contact_name},\n\nCảm ơn bạn đã đăng ký demo. Chúng tôi xác nhận:\n\n📅 Ngày: {demo_date}\n⏰ Giờ: {demo_time}\n💻 Link: {demo_link}\n\nNếu cần thay đổi, vui lòng phản hồi trước 2h.\n\n\n{sales_name}'
        },
        {
          type: 'follow_1',
          subject: 'Nhắc nhở: Demo ngày mai',
          body: 'Xin chào {contact_name},\n\nNhắc nhở nhẹ: Demo ngày mai!\n\nLink: {demo_link}\n\nGặp bạn mai nhé,\n\n{sales_name}'
        }
      ],
      sms: [
        { body: 'Xac nhan demo ngay mai {demo_date} luc {demo_time}. Link: {demo_link}' },
        { body: 'Nho gap ban mai {demo_date} nhe! Link: {demo_link}' }
      ]
    },
    re_engage: {
      subject: 'Quay lại với EcoSynTech?',
      email: [
        {
          type: 'reach_out',
          subject: 'Đã lâu không gặp!',
          body: 'Xin chào {contact_name},\n\nĐã lâu không trao đổi. Tôi muốn chia sẻ:\n\n🌱 Cập nhật sản phẩm mới\n📊 Case study mới\n💡 Giải pháp tối ưu hơn\n\nBạn có sẵn 15 phút không?\n\n\n{sales_name}'
        },
        {
          type: 'value_add',
          subject: 'Gửi bạn tài liệu mới',
          body: 'Xin chào {contact_name},\n\nGửi bạn một số tài liệu:\n\n{display_name}\n\nCó gì thắc mắc, reply nhé!\n\n{sales_name}'
        },
        {
          type: 'last_try',
          subject: 'Lần cuối!',
          body: 'Xin chào {contact_name},\n\nĐây là email cuối cùng từ tôi về chủ đề này.\n\nNếu bạn quan tâm, reply "QUAN TAM". Nếu không, tôi sẽ không làm phiền nữa.\n\nChúc bạn thành công!\n\n{sales_name}'
        }
      ],
      sms: [
        { body: 'Da lau, co gi thay doi? Toi goi lai sau dc k? ({sales_name])' },
        { body: 'Cam on da quan tam. Co gi can support? Y/call 0901...' },
        { body: 'Lan cuoi - neu can, reply "CAN" nhe!' }
      ]
    },
    proposal_follow: {
      email: [
        {
          type: 'sent',
          subject: 'Báo giá EcoSynTech',
          body: 'Xin chào {contact_name},\n\nĐã gửi bạn báo giá chi tiết. Có câu hỏi gì không?\n\n\nLink: {quote_link}\n\n{sales_name}'
        },
        {
          type: 'follow_up',
          subject: 'Báo giá + Case study',
          body: 'Xin chào {contact_name},\n\nGửi thêm case study:\n\n{display_name}\n\nSẵn sàng thảo luận chi tiết!\n\n{sales_name}'
        },
        {
          type: 'urgent',
          subject: 'Hết hạn báo giá',
          body: 'Xin chào {contact_name},\n\nBáo giá hết hạn ngày {expiry_date}. Liên hệ ngay!\n\n{sales_name}'
        }
      ]
    }
  },

  process: function(context) {
    const lead = context.lead || context;
    const now = new Date();

    const lastActivity = lead.lastActivityAt ? new Date(lead.lastActivityAt) : null;
    const daysSinceLastActivity = lastActivity 
      ? Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24)) 
      : 999;

    const shouldFollowUp = this.shouldFollowUp(lead, daysSinceLastActivity);
    const nextAction = this.getNextAction(lead, daysSinceLastActivity);
    const templates = this.getTemplate(lead.status);

    return {
      leadId: lead.id,
      shouldFollowUp,
      daysSinceLastActivity,
      nextAction,
      templates,
      channel: this.getPreferredChannel(lead),
      priority: this.getPriority(lead, daysSinceLastActivity)
    };
  },

  shouldFollowUp: function(lead, daysSinceLastActivity) {
    const rule = this.FOLLOWUP_RULES[lead.status];
    if (!rule) return daysSinceLastActivity >= 2;

    const intervals = [rule.firstResponse, ...rule.intervals];
    return intervals.some(interval => Math.abs(daysSinceLastActivity - interval) <= 1);
  },

  getNextAction: function(lead, daysSinceLastActivity) {
    if (lead.status === 'new' || lead.status === 'contacted') {
      if (daysSinceLastActivity <= 1) return { type: 'call', urgency: 'high', wait: 0 };
      if (daysSinceLastActivity <= 3) return { type: 'email', urgency: 'high', wait: 0 };
      return { type: 'email', urgency: 'medium', wait: 1 };
    }

    if (lead.status === 'qualified') {
      return { type: 'demo', urgency: 'high', wait: 1 };
    }

    if (lead.status === 'proposal') {
      return { type: 'call', urgency: 'high', wait: 1 };
    }

    if (lead.status === 'negotiation') {
      return { type: 'call', urgency: 'urgent', wait: 0 };
    }

    if (daysSinceLastActivity > 14) {
      return { type: 're-engage', urgency: 'low', wait: 0 };
    }

    return { type: 'none', urgency: 'none', wait: 0 };
  },

  getTemplate: function(status) {
    return this.TEMPLATES[this.FOLLOWUP_RULES[status]?.template || 'default'];
  },

  getPreferredChannel: function(lead) {
    if (lead.preferredChannel) return lead.preferredChannel;
    if (lead.phone && lead.phone.length > 0) return 'call';
    return 'email';
  },

  getPriority: function(lead, daysSinceLastActivity) {
    if (lead.score >= 80) return 1;
    if (lead.score >= 60) return 2;
    if (lead.status === 'negotiation') return 1;
    if (daysSinceLastActivity > 30) return 4;
    return 3;
  },

  scheduleFollowups: function(lead) {
    const rule = this.FOLLOWUP_RULES[lead.status];
    if (!rule) return [];

    const now = new Date();
    const schedule = [];

    const intervals = [rule.firstResponse, ...rule.intervals];
    intervals.forEach((interval, index) => {
      const scheduledDate = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
      schedule.push({
        channel: index === 0 ? 'email' : this.CHANNELS[index % this.CHANNELS.length],
        scheduledAt: scheduledDate.toISOString(),
        status: 'scheduled',
        leadId: lead.id,
        templateType: index === 0 ? 'initial' : `follow_${index}`
      });
    });

    return schedule;
  },

  execute: function(leads) {
    const actions = [];

    leads.forEach(lead => {
      const result = this.process(lead);
      if (result.shouldFollowUp) {
        actions.push({
          leadId: lead.id,
          action: result.nextAction,
          priority: result.priority,
          template: result.templates
        });
      }
    });

    return actions.sort((a, b) => a.priority - b.priority);
  }
};