module.exports = {
  id: 'root-cause-hint',
  name: 'Root Cause Hint',
  triggers: ['event:incident.created', 'event:alert.created', 'event:watchdog.tick'],
  riskLevel: 'medium',
  canAutoFix: false,
  async run(ctx) {
    const incident = ctx.event.incident || ctx.event.alert || ctx.event.data || {};

    const hints = [];
    if (incident.type === 'websocket' || incident.channel === 'ws') {
      hints.push('Check /ws reconnect, auth token expiry, and client subscriptions.');
    }
    if (incident.type === 'mqtt' || incident.channel === 'mqtt') {
      hints.push('Check MQTT broker reachability, bridge config, and topic re-subscribe.');
    }
    if (incident.severity === 'high') {
      hints.push('Inspect rules, schedules, and recent deploy/OTA changes.');
    }

    return {
      ok: true,
      hints,
      summary: hints.length ? hints[0] : 'No immediate root-cause hint available.',
      timestamp: new Date().toISOString(),
    };
  },
};