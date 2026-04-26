module.exports = {
  id: 'tenant-isolation',
  name: 'Tenant Isolation',
  triggers: ['event:request.incoming', 'event:watchdog.tick'],
  riskLevel: 'high',
  canAutoFix: false,
  async run(ctx) {
    const tenantId = ctx.event.tenantId || ctx.event.user?.tenantId || null;
    const path = ctx.event.route || ctx.event.path || null;

    return {
      ok: Boolean(tenantId),
      tenantId,
      path,
      note: 'Verify tenant scoping in every query and device lookup.',
      timestamp: new Date().toISOString()
    };
  }
};