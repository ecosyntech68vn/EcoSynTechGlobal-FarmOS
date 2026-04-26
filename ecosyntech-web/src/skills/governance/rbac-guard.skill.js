module.exports = {
  id: 'rbac-guard',
  name: 'RBAC Guard',
  triggers: ['route:/api/rbac', 'route:/api/security', 'event:watchdog.tick'],
  riskLevel: 'high',
  canAutoFix: false,
  async run(ctx) {
    const user = ctx.event.user || null;
    const role = user?.role || 'unknown';

    return {
      ok: role !== 'unknown',
      role,
      allowed: ['admin', 'operator', 'maintainer'].includes(role),
      timestamp: new Date().toISOString()
    };
  }
};