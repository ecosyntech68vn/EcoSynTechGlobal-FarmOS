module.exports = {
  id: 'water-optimization',
  name: 'Water Optimization',
  triggers: ['event:sensor-update', 'cron:*/15m', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: true,
  run: function(ctx) {
    var stateStore = ctx.stateStore;
    var sensors = stateStore.get('sensors') || {};
    
    var soilMoisture = sensors.soil || 50;
    var humidity = sensors.humidity || 60;
    var temp = sensors.temperature || 25;
    var plantType = stateStore.get('plantType') || 'general';
    
    var optimalRanges = {
      'general': { min: 40, max: 70 },
      'rice': { min: 70, max: 90 },
      'vegetable': { min: 50, max: 70 },
      'fruit': { min: 40, max: 60 },
      'coffee': { min: 60, max: 80 },
    };
    
    var range = optimalRanges[plantType] || optimalRanges.general;
    var deficit = range.min - soilMoisture;
    var excess = soilMoisture - range.max;
    
    var waterAmount = 0;
    var duration = 0;
    var recommendation = '';
    
    if (excess > 10) {
      waterAmount = 0;
      duration = 0;
      recommendation = 'Soil too wet - skip irrigation';
    } else if (deficit > 20) {
      waterAmount = deficit * 0.8;
      duration = Math.ceil(deficit / 10);
      recommendation = 'Critical - water immediately';
    } else if (deficit > 10) {
      waterAmount = deficit * 0.6;
      duration = Math.ceil(deficit / 15);
      recommendation = 'Normal irrigation';
    } else if (deficit > 5) {
      waterAmount = deficit * 0.4;
      duration = 1;
      recommendation = 'Light watering only';
    } else {
      waterAmount = 0;
      duration = 0;
      recommendation = 'Soil moisture optimal';
    }
    
    var efficiency = (soilMoisture >= range.min && soilMoisture <= range.max) ? 100 : (soilMoisture < range.min ? (100 - deficit) : (100 - excess * 2));
    efficiency = Math.max(0, Math.min(100, efficiency));
    
    return {
      ok: efficiency > 50,
      recommendation: recommendation,
      soilMoisture: soilMoisture,
      optimalRange: range,
      waterAmount: Math.round(waterAmount),
      duration: duration,
      efficiency: efficiency,
      timestamp: new Date().toISOString(),
    };
  },
};