module.exports = {
  id: 'approval-gate',
  name: 'Approval Gate',
  triggers: ['event:release.request', 'event:dangerous.action', 'event:watchdog.tick'],
  riskLevel: 'high',
  canAutoFix: false,
  async run(ctx) {
    const action = ctx.event.action || ctx.event.requestedAction || ctx.event.type;
    const risk = ctx.event.risk || 'unknown';
    const approvedBy = ctx.event.approvedBy || null;

    const autoApproved = Boolean(approvedBy) && ['low', 'medium'].includes(risk);

    return {
      ok: autoApproved,
      approved: autoApproved,
      approvedBy,
      action,
      risk,
      required: !autoApproved,
      message: autoApproved
        ? 'Approved for safe execution.'
        : 'Manual approval required before execution.',
      timestamp: new Date().toISOString(),
    };
  },
};