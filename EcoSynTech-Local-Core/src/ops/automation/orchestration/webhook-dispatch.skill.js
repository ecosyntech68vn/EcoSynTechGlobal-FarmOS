module.exports = {
  id: 'webhook-dispatch',
  name: 'Webhook Dispatch',
  triggers: ['event:webhook.dispatch', 'event:watchdog.tick'],
  riskLevel: 'medium',
  canAutoFix: true,
  async run(ctx) {
    const target = ctx.event.target || ctx.event.webhook || null;

    return {
      ok: true,
      target,
      action: 'dispatch-webhook',
      timestamp: new Date().toISOString()
    };
  }
};