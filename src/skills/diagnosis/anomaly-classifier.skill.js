module.exports = {
  id: 'anomaly-classifier',
  name: 'Anomaly Classifier',
  triggers: ['event:alert.created', 'event:sensor-update', 'event:watchdog.tick'],
  riskLevel: 'medium',
  canAutoFix: false,
  async run(ctx) {
    const data = ctx.event.data || ctx.event.alert || ctx.event.payload || {};
    const value = Number(data.value ?? data.reading ?? NaN);

    let severity = 'low';
    if (Number.isNaN(value)) {
      severity = 'unknown';
    } else if (value > 90 || value < 10) {
      severity = 'high';
    } else if (value > 75 || value < 25) {
      severity = 'medium';
    }

    return {
      ok: severity !== 'unknown',
      severity,
      entity: data.deviceId || data.sensor || data.type || 'system',
      observedValue: Number.isNaN(value) ? null : value,
      timestamp: new Date().toISOString(),
    };
  },
};