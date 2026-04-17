module.exports = {
  id: 'auto-acknowledge',
  name: 'Auto Acknowledge',
  triggers: ['event:alert.created', 'event:alert.duplicate', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: true,
  async run(ctx) {
    const alert = ctx.event.alert || ctx.event.data || {};
    const severity = alert.severity || ctx.event.severity || 'low';
    const shouldAck = severity === 'low' || ctx.event.duplicate === true;

    return {
      ok: true,
      alertId: alert.id || null,
      action: shouldAck ? 'acknowledge' : 'leave-open',
      timestamp: new Date().toISOString(),
    };
  },
};