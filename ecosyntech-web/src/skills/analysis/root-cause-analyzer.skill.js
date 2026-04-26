module.exports = {
  id: 'root-cause-analyzer',
  name: 'Root Cause Analyzer',
  triggers: ['event:error', 'event:watchdog.tick', 'event:incident.created'],
  riskLevel: 'medium',
  canAutoFix: false,
  run: function(ctx) {
    const event = ctx.event || {};
    const err = event.error || event.message || event.err || event.type || 'unknown';

    const hints = [];
    let severity = 'low';

    const errorStr = String(err).toLowerCase();

    if (errorStr.indexOf('database') !== -1 || errorStr.indexOf('sql') !== -1) {
      hints.push('Check DB connection and queries');
      severity = 'high';
    } else if (errorStr.indexOf('mqtt') !== -1) {
      hints.push('Check MQTT broker connection');
    } else if (errorStr.indexOf('websocket') !== -1 || errorStr.indexOf('ws') !== -1) {
      hints.push('Check WebSocket connection');
    } else if (errorStr.indexOf('memory') !== -1) {
      hints.push('Check memory usage');
      severity = 'critical';
    } else if (errorStr.indexOf('timeout') !== -1) {
      hints.push('Check network latency');
    } else if (errorStr.indexOf('permission') !== -1 || errorStr.indexOf('access') !== -1) {
      hints.push('Check permissions');
      severity = 'high';
    } else if (errorStr.indexOf('jwt') !== -1 || errorStr.indexOf('token') !== -1) {
      hints.push('Check authentication token');
    } else {
      hints.push('Manual investigation required');
    }

    return {
      ok: hints.length > 0,
      error: err,
      hints: hints,
      severity: severity,
      recommendation: hints[0],
      timestamp: new Date().toISOString()
    };
  }
};