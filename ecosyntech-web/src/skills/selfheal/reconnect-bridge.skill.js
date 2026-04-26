module.exports = {
  id: 'reconnect-bridge',
  name: 'Reconnect Bridge',
  triggers: ['event:mqtt.disconnect', 'event:websocket.disconnect', 'event:watchdog.tick'],
  riskLevel: 'medium',
  canAutoFix: true,
  async run(ctx) {
    const channel = ctx.event.channel || (ctx.event.type?.includes('mqtt') ? 'mqtt' : 'websocket');

    return {
      ok: true,
      channel,
      action: 'reconnect',
      recommendation: `Restart ${channel} bridge and rebind subscriptions.`,
      timestamp: new Date().toISOString()
    };
  }
};