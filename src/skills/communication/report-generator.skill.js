module.exports = {
  id: 'report-generator',
  name: 'Report Generator',
  triggers: ['event:report.request', 'cron:*/24h', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    var stateStore = ctx.stateStore;
    var baseUrl = ctx.baseUrl || 'http://localhost:3000';
    
    var period = ctx.event.period || 'daily';
    var alerts = stateStore.get('alerts') || [];
    var incidents = stateStore.get('incidents') || [];
    var sensors = stateStore.get('sensors') || {};
    var beats = stateStore.get('beats') || {};
    
    var filterTime = period === 'daily' ? 86400000 : (period === 'weekly' ? 604800000 : 2592000000);
    var recentAlerts = alerts.filter(function(a) { return Date.now() - a.ts < filterTime; });
    var recentIncidents = incidents.filter(function(i) { return Date.now() - new Date(i.createdAt).getTime() < filterTime; });
    
    var sensorKeys = Object.keys(sensors);
    var avgTemp = 0;
    if (sensors.temperature) avgTemp = sensors.temperature;
    
    var wsHealthy = !beats.websocket || (Date.now() - beats.websocket < 60000);
    var mqttHealthy = !beats.mqtt || (Date.now() - beats.mqtt < 90000);
    
    var summary = {
      period: period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalAlerts: recentAlerts.length,
        totalIncidents: recentIncidents.length,
        onlineSensors: sensorKeys.length,
        avgTemperature: avgTemp,
        websocketStatus: wsHealthy ? 'online' : 'offline',
        mqttStatus: mqttHealthy ? 'online' : 'offline',
        uptime: process.uptime(),
      },
      alerts: recentAlerts.slice(0, 10),
      incidents: recentIncidents.slice(0, 5),
    };
    
    return {
      ok: true,
      report: summary,
      timestamp: new Date().toISOString(),
    };
  },
};