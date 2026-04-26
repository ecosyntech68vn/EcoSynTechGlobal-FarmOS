module.exports = {
  id: 'weather-decision',
  name: 'Weather Decision',
  triggers: ['event:weather.update', 'cron:*/30m', 'event:watchdog.tick'],
  riskLevel: 'medium',
  canAutoFix: true,
  run: function(ctx) {
    const stateStore = ctx.stateStore;
    const weather = stateStore.get('weather') || {};
    
    const raining = weather.rainfall > 5;
    const humidity = weather.humidity || 0;
    const temp = weather.temperature || 25;
    const forecast = weather.forecast || 'clear';
    
    let decision = 'normal';
    let reason = '';
    
    if (raining || forecast === 'rain') {
      decision = 'skip-irrigation';
      reason = 'Rain expected in next 2 hours';
    } else if (humidity > 85 && temp < 20) {
      decision = 'reduce-irrigation';
      reason = 'High humidity + low temp - reduce water';
    } else if (temp > 35) {
      decision = 'increase-irrigation';
      reason = 'High temperature - increase water';
    } else if (forecast === 'cloudy') {
      decision = 'delay-irrigation';
      reason = 'Cloudy weather - delay watering';
    } else {
      decision = 'normal';
      reason = 'Normal watering schedule';
    }
    
    const actions = {
      'skip-irrigation': { irrigation: false, pump: false },
      'reduce-irrigation': { irrigation: true, pump: true, duration: 0.5 },
      'increase-irrigation': { irrigation: true, pump: true, duration: 1.5 },
      'delay-irrigation': { irrigation: false, pump: false, delay: 3600000 },
      'normal': { irrigation: true, pump: true, duration: 1 }
    };
    
    return {
      ok: true,
      decision: decision,
      reason: reason,
      actions: actions[decision],
      weatherSummary: { raining: raining, humidity: humidity, temp: temp, forecast: forecast },
      timestamp: new Date().toISOString()
    };
  }
};