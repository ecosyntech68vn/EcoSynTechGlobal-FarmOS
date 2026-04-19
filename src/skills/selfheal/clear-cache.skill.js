module.exports = {
  id: 'clear-cache',
  name: 'Clear Cache',
  triggers: ['event:cache.stale', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: true,
  async run() {
    return {
      ok: true,
      action: 'clear-cache',
      note: 'Invalidate runtime caches, then rebuild derived state.',
      timestamp: new Date().toISOString(),
    };
  },
};