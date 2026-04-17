module.exports = {
  id: 'rate-limit-guard',
  name: 'Rate Limit Guard',
  triggers: ['event:watchdog.tick', 'event:request.spike'],
  riskLevel: 'medium',
  canAutoFix: true,
  async run(ctx) {
    const rate = ctx.event.rate || null;
    const ok = !rate || rate.requestsPerMinute < 80;

    return {
      ok,
      rate,
      recommendation: ok ? 'Rate is within normal range.' : 'Consider temporary throttling or queueing.',
      timestamp: new Date().toISOString(),
    };
  },
};