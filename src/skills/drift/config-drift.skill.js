module.exports = {
  id: 'config-drift-detect',
  name: 'Config Drift Detect',
  triggers: ['cron:*/15m', 'event:watchdog.tick', 'route:/readiness'],
  riskLevel: 'low',
  canAutoFix: false,
  async run(ctx) {
    const baseUrl = ctx.baseUrl || `http://127.0.0.1:${process.env.PORT || 3000}`;

    const fetchJson = async (path) => {
      try {
        const res = await fetch(`${baseUrl}${path}`);
        return await res.json();
      } catch (_) {
        return null;
      }
    };

    const [health, readiness, stats] = await Promise.all([
      fetchJson('/api/health'),
      fetchJson('/readiness'),
      fetchJson('/api/stats'),
    ]);

    const findings = [];

    if (health?.environment && process.env.NODE_ENV && health.environment !== process.env.NODE_ENV) {
      findings.push({ key: 'NODE_ENV', expected: process.env.NODE_ENV, actual: health.environment });
    }

    if (readiness && readiness.status && readiness.status !== 'ready') {
      findings.push({ key: 'READINESS', expected: 'ready', actual: readiness.status });
    }

    if (!stats) {
      findings.push({ key: 'STATS', expected: 'available', actual: 'missing' });
    }

    return {
      ok: findings.length === 0,
      findings,
      timestamp: new Date().toISOString(),
    };
  },
};