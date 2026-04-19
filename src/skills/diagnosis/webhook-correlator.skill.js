module.exports = {
  id: 'webhook-correlator',
  name: 'Webhook Correlator',
  triggers: ['event:webhook.sensor-alert', 'event:webhook.device-status', 'event:webhook.rule-triggered', 'event:webhook.schedule-run'],
  riskLevel: 'medium',
  canAutoFix: false,
  async run(ctx) {
    const payload = ctx.event.payload || ctx.event.data || ctx.event.body || {};
    const source = ctx.event.source || 'webhook';

    const fingerprint = JSON.stringify({
      source,
      type: payload.type || payload.eventType || 'unknown',
      deviceId: payload.deviceId || payload.id || null,
      ruleId: payload.ruleId || null,
      scheduleId: payload.scheduleId || null,
    });

    return {
      ok: true,
      fingerprint,
      source,
      payloadSummary: { keys: Object.keys(payload || {}) },
      timestamp: new Date().toISOString(),
    };
  },
};