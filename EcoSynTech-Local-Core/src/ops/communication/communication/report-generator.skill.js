module.exports = {
  id: 'report-generator',
  name: 'Report Generator',
  triggers: ['event:report.request', 'cron:*/24h', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    const stateStore = ctx.stateStore;
    const baseUrl = ctx.baseUrl || 'http://localhost:3000';
    
    const period = ctx.event.period || 'daily';
    const alerts = stateStore.get('alerts') || [];
    const incidents = stateStore.get('incidents') || [];
    const sensors = stateStore.get('sensors') || {};
    const beats = stateStore.get('beats') || {};
    
    const filterTime = period === 'daily' ? 86400000 : (period === 'weekly' ? 604800000 : 2592000000);
    const recentAlerts = alerts.filter(function(a) { return Date.now() - a.ts < filterTime; });
    const recentIncidents = incidents.filter(function(i) { return Date.now() - new Date(i.createdAt).getTime() < filterTime; });
    
    const sensorKeys = Object.keys(sensors);
    let avgTemp = 0;
    if (sensors.temperature) avgTemp = sensors.temperature;
    
    const wsHealthy = !beats.websocket || (Date.now() - beats.websocket < 60000);
    const mqttHealthy = !beats.mqtt || (Date.now() - beats.mqtt < 90000);
    
    const summary = {
      period: period,
      generatedAt: new Date().toISOString(),
      summary: {
        totalAlerts: recentAlerts.length,
        totalIncidents: recentIncidents.length,
        onlineSensors: sensorKeys.length,
        avgTemperature: avgTemp,
        websocketStatus: wsHealthy ? 'online' : 'offline',
        mqttStatus: mqttHealthy ? 'online' : 'offline',
        uptime: process.uptime()
      },
      alerts: recentAlerts.slice(0, 10),
      incidents: recentIncidents.slice(0, 5)
    };
    
    return {
      ok: true,
      report: summary,
      timestamp: new Date().toISOString()
    };
  }
};