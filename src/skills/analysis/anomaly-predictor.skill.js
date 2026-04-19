module.exports = {
  id: 'anomaly-predictor',
  name: 'Anomaly Predictor',
  triggers: ['event:sensor-update', 'event:watchdog.tick', 'cron:*/15m'],
  riskLevel: 'medium',
  canAutoFix: false,
  run: function(ctx) {
    var stateStore = ctx.stateStore;
    var history = stateStore.get('sensorHistory') || [];
    
    var data = ctx.event.data || ctx.event;
    var sensorType = data.type || data.sensor;
    var value = Number(data.value);
    
    if (!isNaN(value)) {
      history.push({
        type: sensorType,
        value: value,
        timestamp: Date.now(),
      });
      
      if (history.length > 100) history = history.slice(-100);
      stateStore.set('sensorHistory', history);
    }
    
    if (history.length < 10) {
      return { ok: true, skipped: true, reason: 'Insufficient data' };
    }
    
    var recent = history.slice(-10);
    var avg = 0;
    var variance = 0;
    
    for (var i = 0; i < recent.length; i++) avg += recent[i].value;
    avg /= recent.length;
    
    for (var j = 0; j < recent.length; j++) variance += Math.pow(recent[j].value - avg, 2);
    variance = Math.sqrt(variance / recent.length);
    
    var deviation = Math.abs(value - avg);
    var anomaly = deviation > variance * 2;
    
    return {
      ok: !anomaly,
      isAnomaly: anomaly,
      currentValue: value,
      average: avg,
      deviation: deviation,
      threshold: variance * 2,
      recommendation: anomaly ? 'Check sensor ' + sensorType + ' for abnormal readings' : 'Normal',
      timestamp: new Date().toISOString(),
    };
  },
};