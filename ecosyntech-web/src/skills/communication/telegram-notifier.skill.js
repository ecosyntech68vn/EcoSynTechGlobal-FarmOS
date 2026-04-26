module.exports = {
  id: 'telegram-notifier',
  name: 'Telegram Notifier',
  triggers: ['event:alert.created', 'event:incident.created', 'event:security.threat', 'event:deploy.request'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    const TelegramNotifier = require('../../ops/advanced').TelegramNotifier;
    const config = {
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID
    };
    
    const notifier = TelegramNotifier(config);
    if (!notifier.enabled) {
      return { ok: true, skipped: true, reason: 'Telegram not configured' };
    }
    
    const event = ctx.event;
    const severity = event.severity || 'medium';
    
    if (event.type === 'alert.created') {
      notifier.sendAlert(event.alert || event, severity);
    } else if (event.type === 'incident.created') {
      notifier.sendIncident(event.incident || event, 'auto-created');
    } else if (event.type === 'deploy.request') {
      notifier.send('📤 <b>DEPLOY REQUEST</b>\nAction: ' + event.action + '\nRequestedBy: ' + (event.requestedBy || 'unknown'));
    }
    
    return {
      ok: true,
      notified: true,
      channel: 'telegram',
      timestamp: new Date().toISOString()
    };
  }
};