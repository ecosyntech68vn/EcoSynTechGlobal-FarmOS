module.exports = {
  id: 'audit-trail',
  name: 'Audit Trail',
  triggers: ['event:action.executed', 'event:deploy.request', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: true,
  async run(ctx) {
    const action = ctx.event.action || ctx.event.type || 'unknown';
    const actor = ctx.event.actor || ctx.event.user?.id || 'system';

    return {
      ok: true,
      record: {
        actor,
        action,
        at: new Date().toISOString(),
        source: ctx.event.source || 'ops'
      },
      timestamp: new Date().toISOString()
    };
  }
};