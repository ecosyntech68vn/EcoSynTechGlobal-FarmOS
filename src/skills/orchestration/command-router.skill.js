module.exports = {
  id: 'command-router',
  name: 'Command Router',
  triggers: ['event:device.command', 'route:/api/devices', 'route:/api/device-mgmt', 'event:watchdog.tick'],
  riskLevel: 'high',
  canAutoFix: false,
  async run(ctx) {
    const deviceId = ctx.event.deviceId || ctx.event.data?.deviceId || null;
    const command = ctx.event.command || ctx.event.data?.command || null;

    return {
      ok: Boolean(deviceId && command),
      deviceId,
      command,
      action: 'route-command',
      requiresApproval: true,
      timestamp: new Date().toISOString(),
    };
  },
};