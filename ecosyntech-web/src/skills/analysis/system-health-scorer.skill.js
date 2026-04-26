module.exports = {
  id: 'system-health-scorer',
  name: 'System Health Scorer',
  triggers: ['event:watchdog.tick', 'cron:*/30m'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    const stateStore = ctx.stateStore;
    const uptime = process.uptime();
    const mem = process.memoryUsage();
    
    const beats = stateStore.get('beats') || {};
    const alerts = stateStore.get('alerts') || [];
    const incidents = stateStore.get('incidents') || [];
    
    const wsBeat = beats.websocket;
    const mqttBeat = beats.mqtt;
    const wsStale = wsBeat ? Date.now() - wsBeat > 60000 : true;
    const mqttStale = mqttBeat ? Date.now() - mqttBeat > 90000 : true;
    
    const recentAlerts = alerts.filter(function(a) { return Date.now() - a.ts < 3600000; }).length;
    const recentIncidents = incidents.filter(function(i) { return Date.now() - new Date(i.createdAt).getTime() < 3600000; }).length;
    
    const memUsage = mem.heapUsed / mem.heapTotal;
    let score = 100;
    
    if (wsStale) score -= 10;
    if (mqttStale) score -= 10;
    if (recentAlerts > 10) score -= 10;
    if (recentIncidents > 5) score -= 15;
    if (memUsage > 0.8) score -= 20;
    if (uptime < 3600) score -= 10;
    
    score = Math.max(0, score);
    
    const status = score >= 80 ? 'healthy' : (score >= 50 ? 'warning' : 'critical');
    
    return {
      ok: score >= 50,
      status: status,
      score: score,
      uptime: Math.floor(uptime),
      memoryUsage: (memUsage * 100).toFixed(1) + '%',
      websocketHealthy: !wsStale,
      mqttHealthy: !mqttStale,
      alertsLastHour: recentAlerts,
      incidentsLastHour: recentIncidents,
      timestamp: new Date().toISOString()
    };
  }
};