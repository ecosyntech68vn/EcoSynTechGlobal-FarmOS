module.exports = {
  id: 'approval-gate-advanced',
  name: 'Approval Gate Advanced',
  triggers: ['event:deploy.request', 'event:dangerous.action', 'event:watchdog.tick'],
  riskLevel: 'high',
  canAutoFix: false,
  async run(ctx) {
    const action = ctx.event.action || ctx.event.requestedAction || ctx.event.type;
    const risk = ctx.event.risk || 'high';
    const approver = ctx.event.approver || ctx.event.approvedBy || null;
    const approved = Boolean(approver) && ['low', 'medium'].includes(risk);

    return {
      ok: approved,
      approved,
      approver,
      action,
      risk,
      required: !approved,
      timestamp: new Date().toISOString(),
    };
  },
};