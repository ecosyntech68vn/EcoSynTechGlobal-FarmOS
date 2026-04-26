module.exports = {
  id: 'report-export',
  name: 'Report Export',
  triggers: ['route:/api/export', 'route:/api/analytics/export/pdf', 'route:/api/analytics/export/excel', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: true,
  async run(ctx) {
    const baseUrl = ctx.baseUrl || `http://127.0.0.1:${process.env.PORT || 3000}`;

    const safeJson = async (path) => {
      try {
        const res = await fetch(`${baseUrl}${path}`);
        return await res.json();
      } catch (_) {
        return null;
      }
    };

    const dashboard = await safeJson('/api/analytics/dashboard');
    const kpis = await safeJson('/api/analytics/kpis');
    const exportData = await safeJson('/api/export');

    return {
      ok: Boolean(dashboard || kpis || exportData),
      dashboard,
      kpis,
      exportData,
      timestamp: new Date().toISOString()
    };
  }
};