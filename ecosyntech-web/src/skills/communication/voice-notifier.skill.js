module.exports = {
  id: 'voice-notifier',
  name: 'Voice Notifier',
  triggers: ['event:alert.created', 'event:incident.created', 'event:emergency'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    const event = ctx.event;
    const severity = event.severity || 'medium';
    const message = event.message || event.alert || event.type || 'Alert';
    
    let messageStr = String(message);
    if (messageStr.length > 200) {
      messageStr = messageStr.substring(0, 197) + '...';
    }
    
    let priority = 'default';
    if (severity === 'critical') priority = 'urgent';
    else if (severity === 'high') priority = 'urgent';
    
    return {
      ok: true,
      notified: true,
      message: messageStr,
      voicePriority: priority,
      language: 'vi-VN',
      timestamp: new Date().toISOString()
    };
  }
};