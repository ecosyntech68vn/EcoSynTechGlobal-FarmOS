module.exports = {
  id: 'reset-device',
  name: 'Reset Device',
  triggers: ['event:device.offline', 'event:device.unresponsive'],
  riskLevel: 'high',
  canAutoFix: false,
  async run(ctx) {
    const deviceId = ctx.event.deviceId || ctx.event.data?.deviceId || null;

    return {
      ok: Boolean(deviceId),
      deviceId,
      action: 'reset-device',
      requiresApproval: true,
      timestamp: new Date().toISOString(),
    };
  },
};