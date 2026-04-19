module.exports = {
  id: 'multi-farm-manager',
  name: 'Multi-Farm Manager',
  triggers: ['event:farm-status', 'cron:*/1h', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    var stateStore = ctx.stateStore;
    var farms = stateStore.get('farms') || {};
    
    var farmId = ctx.event.farmId || ctx.event.farm || 'farm-1';
    var sensorData = ctx.event.sensors || {};
    
    if (!farms[farmId]) {
      farms[farmId] = {
        name: farmId,
        sensors: {},
        alerts: [],
        lastUpdate: null,
      };
    }
    
    var farm = farms[farmId];
    farm.sensors = sensorData;
    farm.lastUpdate = Date.now();
    
    var statuses = {};
    for (var id in farms) {
      var f = farms[id];
      var hasAlerts = f.alerts && f.alerts.length > 0;
      statuses[id] = {
        online: f.lastUpdate ? (Date.now() - f.lastUpdate < 300000) : false,
        sensorCount: Object.keys(f.sensors || {}).length,
        hasAlerts: hasAlerts,
      };
    }
    
    stateStore.set('farms', farms);
    
    var totalFarms = Object.keys(farms).length;
    var onlineFarms = Object.keys(statuses).filter(function(id) { return statuses[id].online; }).length;
    
    return {
      ok: onlineFarms === totalFarms,
      totalFarms: totalFarms,
      onlineFarms: onlineFarms,
      farmStatuses: statuses,
      timestamp: new Date().toISOString(),
    };
  },
};