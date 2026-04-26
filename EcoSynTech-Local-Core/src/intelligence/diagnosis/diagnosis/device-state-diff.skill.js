module.exports = {
  id: 'device-state-diff',
  name: 'Device State Diff',
  triggers: ['event:device.update', 'event:device.status', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: false,
  async run(ctx) {
    const current = ctx.event.current || ctx.event.device || ctx.event.data || {};
    const desired = ctx.event.desired || ctx.event.expected || {};

    const diffs = [];
    for (const key of new Set([...Object.keys(current), ...Object.keys(desired)])) {
      if (JSON.stringify(current[key]) !== JSON.stringify(desired[key])) {
        diffs.push({ key, current: current[key], desired: desired[key] });
      }
    }

    return {
      ok: diffs.length === 0,
      diffs,
      timestamp: new Date().toISOString()
    };
  }
};