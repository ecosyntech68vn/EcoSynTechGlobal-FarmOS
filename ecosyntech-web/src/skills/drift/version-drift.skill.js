module.exports = {
  id: 'version-drift-detect',
  name: 'Version Drift Detect',
  triggers: ['cron:*/10m', 'event:watchdog.tick', 'route:/api/health'],
  riskLevel: 'low',
  canAutoFix: false,
  async run(ctx) {
    const baseUrl = ctx.baseUrl || `http://127.0.0.1:${process.env.PORT || 3000}`;
    const packageVersion = ctx.packageVersion || null;

    const fetchJson = async (path) => {
      try {
        const res = await fetch(`${baseUrl}${path}`);
        return await res.json();
      } catch (_) {
        return null;
      }
    };

    const [health, apiHealth, apiVersion] = await Promise.all([
      fetchJson('/health'),
      fetchJson('/api/health'),
      fetchJson('/api/version')
    ]);

    const versions = {
      packageVersion,
      healthVersion: health?.version ?? null,
      apiHealthVersion: apiHealth?.version ?? null,
      apiVersion: apiVersion?.api ?? null
    };

    const unique = [...new Set(Object.values(versions).filter(Boolean))];

    return {
      ok: unique.length <= 1,
      drift: unique.length > 1,
      versions,
      recommendation: unique.length > 1
        ? 'Align README, package.json, /health and /api/health to one release version.'
        : 'Versions aligned.',
      timestamp: new Date().toISOString()
    };
  }
};