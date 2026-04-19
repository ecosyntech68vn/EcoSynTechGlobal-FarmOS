module.exports = {
  id: 'ws-heartbeat',
  name: 'WebSocket Heartbeat Watch',
  triggers: ['event:websocket.tick', 'event:watchdog.tick', 'route:/ws'],
  riskLevel: 'low',
  canAutoFix: false,
  async run(ctx) {
    const beats = ctx.stateStore?.get('beats', {}) || {};
    const lastBeat = beats.websocket || null;
    const staleForMs = lastBeat ? Date.now() - lastBeat : null;
    const ok = typeof staleForMs === 'number' ? staleForMs < 60_000 : false;

    return {
      ok,
      lastBeat,
      staleForMs,
      recommendation: ok ? 'WS healthy' : 'WebSocket heartbeat missing/stale. Check reconnect logic and /ws consumers.',
      timestamp: new Date().toISOString(),
    };
  },
};