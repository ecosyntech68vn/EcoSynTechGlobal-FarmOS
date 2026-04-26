module.exports = {
  id: 'mqtt-watch',
  name: 'MQTT Watch',
  triggers: ['event:mqtt.tick', 'cron:*/1m', 'event:watchdog.tick'],
  riskLevel: 'medium',
  canAutoFix: true,
  async run(ctx) {
    const beats = ctx.stateStore?.get('beats', {}) || {};
    const lastBeat = beats.mqtt || null;
    const staleForMs = lastBeat ? Date.now() - lastBeat : null;
    const ok = typeof staleForMs === 'number' ? staleForMs < 90_000 : false;

    return {
      ok,
      lastBeat,
      staleForMs,
      autoFix: ok ? null : {
        action: 'reconnect-mqtt',
        note: 'Reconnect MQTT bridge and re-subscribe topics.'
      },
      timestamp: new Date().toISOString()
    };
  }
};