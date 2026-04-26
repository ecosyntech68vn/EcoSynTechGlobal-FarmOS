module.exports = {
  id: 'multi-farm-manager',
  name: 'Multi-Farm Manager',
  triggers: ['event:farm-status', 'cron:*/1h', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    const stateStore = ctx.stateStore;
    const farms = stateStore.get('farms') || {};
    
    const farmId = ctx.event.farmId || ctx.event.farm || 'farm-1';
    const sensorData = ctx.event.sensors || {};
    
    if (!farms[farmId]) {
      farms[farmId] = {
        name: farmId,
        sensors: {},
        alerts: [],
        lastUpdate: null
      };
    }
    
    const farm = farms[farmId];
    farm.sensors = sensorData;
    farm.lastUpdate = Date.now();
    
    const statuses = {};
    for (const id in farms) {
      const f = farms[id];
      const hasAlerts = f.alerts && f.alerts.length > 0;
      statuses[id] = {
        online: f.lastUpdate ? (Date.now() - f.lastUpdate < 300000) : false,
        sensorCount: Object.keys(f.sensors || {}).length,
        hasAlerts: hasAlerts
      };
    }
    
    stateStore.set('farms', farms);
    
    const totalFarms = Object.keys(farms).length;
    const onlineFarms = Object.keys(statuses).filter(function(id) { return statuses[id].online; }).length;
    
    return {
      ok: onlineFarms === totalFarms,
      totalFarms: totalFarms,
      onlineFarms: onlineFarms,
      farmStatuses: statuses,
      timestamp: new Date().toISOString()
    };
  }
};