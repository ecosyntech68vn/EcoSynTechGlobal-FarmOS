module.exports = {
  id: 'anomaly-predictor',
  name: 'Anomaly Predictor',
  triggers: ['event:sensor-update', 'event:watchdog.tick', 'cron:*/15m'],
  riskLevel: 'medium',
  canAutoFix: false,
  run: function(ctx) {
    const stateStore = ctx.stateStore;
    let history = stateStore.get('sensorHistory') || [];
    
    const data = ctx.event.data || ctx.event;
    const sensorType = data.type || data.sensor;
    const value = Number(data.value);
    
    if (!isNaN(value)) {
      history.push({
        type: sensorType,
        value: value,
        timestamp: Date.now()
      });
      
      if (history.length > 100) history = history.slice(-100);
      stateStore.set('sensorHistory', history);
    }
    
    if (history.length < 10) {
      return { ok: true, skipped: true, reason: 'Insufficient data' };
    }
    
    const recent = history.slice(-10);
    let avg = 0;
    let variance = 0;
    
    for (let i = 0; i < recent.length; i++) avg += recent[i].value;
    avg /= recent.length;
    
    for (let j = 0; j < recent.length; j++) variance += Math.pow(recent[j].value - avg, 2);
    variance = Math.sqrt(variance / recent.length);
    
    const deviation = Math.abs(value - avg);
    const anomaly = deviation > variance * 2;
    
    return {
      ok: !anomaly,
      isAnomaly: anomaly,
      currentValue: value,
      average: avg,
      deviation: deviation,
      threshold: variance * 2,
      recommendation: anomaly ? 'Check sensor ' + sensorType + ' for abnormal readings' : 'Normal',
      timestamp: new Date().toISOString()
    };
  }
};