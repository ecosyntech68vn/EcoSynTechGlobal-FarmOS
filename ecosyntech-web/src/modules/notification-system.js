module.exports = {
  version: '2.3.2',
  
  channels: ['push', 'email', 'sms', 'telegram'],
  notifications: [],
  
  // Send Notification
  send: async function(options) {
    const notification = {
      id: 'NOTIF-' + Date.now(),
      timestamp: new Date().toISOString(),
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      channels: options.channels || ['push'],
      recipients: options.recipients || [],
      status: 'pending',
      ...options
    };
    
    const results = {};
    
    for (const channel of notification.channels) {
      results[channel] = await this.sendToChannel(channel, notification);
    }
    
    notification.results = results;
    notification.status = results.error ? 'failed' : 'sent';
    this.notifications.push(notification);
    
    return notification;
  },
  
  sendToChannel: async function(channel, notification) {
    switch (channel) {
    case 'push':
      return this.sendPush(notification);
    case 'email':
      return this.sendEmail(notification);
    case 'sms':
      return this.sendSMS(notification);
    case 'telegram':
      return this.sendTelegram(notification);
    default:
      return { success: false, error: 'Unknown channel' };
    }
  },
  
  sendPush: async function(notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png'
      });
      return { success: true, method: 'browser' };
    }
    return { success: false, error: 'Push not available' };
  },
  
  sendEmail: async function(notification) {
    return {
      success: true,
      method: 'email',
      to: notification.recipients,
      subject: notification.title,
      message: notification.message
    };
  },
  
  sendSMS: async function(notification) {
    return {
      success: true,
      method: 'sms',
      to: notification.recipients,
      message: notification.message
    };
  },
  
  sendTelegram: async function(notification) {
    return {
      success: true,
      method: 'telegram',
      chatIds: notification.recipients,
      message: notification.message
    };
  },
  
  // Request Push Permission
  requestPushPermission: async function() {
    if (!('Notification' in window)) {
      return { available: false, error: 'Not supported' };
    }
    
    if (Notification.permission === 'granted') {
      return { available: true, granted: true };
    }
    
    if (Notification.permission === 'denied') {
      return { available: true, denied: true };
    }
    
    const permission = await Notification.requestPermission();
    return { available: true, granted: permission === 'granted' };
  },
  
  // Get Notification History
  getHistory: function(filters = {}) {
    let history = [...this.notifications];
    
    if (filters.type) {
      history = history.filter(n => n.type === filters.type);
    }
    if (filters.status) {
      history = history.filter(n => n.status === filters.status);
    }
    if (filters.from) {
      history = history.filter(n => n.timestamp >= filters.from);
    }
    
    return history.slice(-100);
  },
  
  // Pre-built Notifications
  notifyNewOrder: async function(order) {
    return this.send({
      type: 'order',
      title: '🛒 Đơn hàng mới',
      message: `Đơn hàng ${order.id} - ${order.value} VNĐ`,
      channels: ['push', 'telegram', 'email'],
      recipients: order.recipients || []
    });
  },
  
  notifyPaymentReceived: async function(payment) {
    return this.send({
      type: 'payment',
      title: '💰 Đã nhận thanh toán',
      message: `Thanh toán ${payment.amount} VNĐ cho đơn ${payment.orderId}`,
      channels: ['push', 'telegram'],
      recipients: payment.recipients || []
    });
  },
  
  notifyLowStock: async function(sensor) {
    return this.send({
      type: 'alert',
      title: '⚠️ Cảnh báo',
      message: `Cảm biến ${sensor.name} sắp hết pin!`,
      channels: ['push', 'telegram'],
      recipients: sensor.recipients || []
    });
  },
  
  notifyDailyReport: async function(report) {
    return this.send({
      type: 'report',
      title: '📊 Báo cáo ngày',
      message: `Doanh thu: ${report.revenue} VNĐ | ${report.orders} đơn`,
      channels: ['telegram'],
      recipients: report.recipients || []
    });
  },
  
  // Schedule Notification
  schedule: function(options) {
    const scheduled = {
      id: 'SCH-' + Date.now(),
      ...options,
      status: 'scheduled'
    };
    
    if (scheduled.at && scheduled.at <= Date.now()) {
      return this.send(scheduled);
    }
    
    return scheduled;
  }
};