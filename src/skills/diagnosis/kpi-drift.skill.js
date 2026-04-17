module.exports = {
  id: 'kpi-drift',
  name: 'KPI Drift',
  triggers: ['event:analytics.refresh', 'route:/api/analytics/kpis', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: false,
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

    const [kpis, dashboard] = await Promise.all([
      safeJson('/api/analytics/kpis'),
      safeJson('/api/analytics/dashboard'),
    ]);

    return {
      ok: Boolean(kpis || dashboard),
      kpis,
      dashboard,
      note: 'Use drift analysis to compare daily vs baseline trends.',
      timestamp: new Date().toISOString(),
    };
  },
};