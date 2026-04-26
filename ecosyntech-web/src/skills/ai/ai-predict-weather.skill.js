module.exports = {
  id: 'ai-predict-weather',
  name: 'AI Weather Prediction',
  triggers: ['event:weather.update', 'cron:*/6h', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    // Simple prediction using historical data
    const stateStore = ctx.stateStore;
    let weatherHistory = stateStore.get('weatherHistory') || [];
    
    const current = ctx.event.data || {};
    if (current.temperature) {
      weatherHistory.push({
        temp: current.temperature,
        humidity: current.humidity,
        timestamp: Date.now()
      });
      if (weatherHistory.length > 168) weatherHistory = weatherHistory.slice(-168);
      stateStore.set('weatherHistory', weatherHistory);
    }
    
    if (weatherHistory.length < 12) {
      return {
        ok: true,
        skipped: true,
        reason: 'Insufficient data (need 12+ hours)',
        prediction: null
      };
    }
    
    // Simple trend analysis
    const recent = weatherHistory.slice(-12);
    let avgTemp = 0;
    let avgHumidity = 0;
    
    for (let i = 0; i < recent.length; i++) {
      avgTemp += recent[i].temp;
      avgHumidity += recent[i].humidity || 0;
    }
    avgTemp /= recent.length;
    avgHumidity /= recent.length;
    
    // Trend detection
    let trend = 'stable';
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    if (last.temp > first.temp + 2) trend = 'warming';
    else if (last.temp < first.temp - 2) trend = 'cooling';
    
    if (last.temp > first.temp + 5) trend = 'rapid_warming';
    else if (last.temp < first.temp - 5) trend = 'rapid_cooling';
    
    // Predictions for next 24h
    const predictions = [];
    for (let h = 1; h <= 24; h += 6) {
      const offset = trend === 'warming' ? h * 0.3 : (trend === 'cooling' ? -h * 0.3 : 0);
      predictions.push({
        hoursAhead: h,
        temperature: (avgTemp + offset).toFixed(1),
        confidence: h <= 6 ? 85 : (h <= 12 ? 70 : 55)
      });
    }
    
    let recommendation = '';
    if (trend === 'rapid_warming') recommendation = 'Expect heat stress - prepare irrigation';
    else if (trend === 'rapid_cooling') recommendation = 'Expect cold - protect sensitive crops';
    else if (avgTemp > 35) recommendation = 'High temperature - increase watering';
    else if (avgTemp < 15) recommendation = 'Low temperature - reduce irrigation';
    else recommendation = 'Normal conditions';
    
    return {
      ok: true,
      current: { temperature: avgTemp.toFixed(1), humidity: avgHumidity.toFixed(1) },
      trend: trend,
      predictions: predictions,
      recommendation: recommendation,
      timestamp: new Date().toISOString()
    };
  }
};