module.exports = {
  id: 'pest-alert',
  name: 'Pest Alert',
  triggers: ['event:sensor-update', 'cron:*/1h', 'event:watchdog.tick'],
  riskLevel: 'high',
  canAutoFix: false,
  run: function(ctx) {
    const stateStore = ctx.stateStore;
    let alerts = stateStore.get('pestAlerts') || [];
    
    const sensorData = ctx.event.data || ctx.event;
    const imageData = sensorData.image || sensorData.capture;
    
    const threshold = 0.7;
    let detected = false;
    let pestType = null;
    let confidence = 0;
    
    if (ctx.config && ctx.config.pestDetection) {
      const result = ctx.config.pestDetection(imageData);
      detected = result.detected;
      pestType = result.type;
      confidence = result.confidence;
    } else {
      const soil = sensorData.soil || 50;
      const leaf = sensorData.leaf || 50;
      const color = sensorData.color || 50;
      
      if (soil > 90 || leaf < 20 || color < 30) {
        detected = true;
        confidence = 0.6;
        if (soil > 90) pestType = 'root-rot';
        else if (leaf < 20) pestType = 'leaf-blight';
        else pestType = 'unknown';
      }
    }
    
    if (detected) {
      const alert = {
        id: 'pest-' + Date.now(),
        type: pestType,
        confidence: confidence,
        timestamp: Date.now(),
        deviceId: sensorData.deviceId
      };
      alerts.unshift(alert);
      if (alerts.length > 100) alerts = alerts.slice(0, 100);
      stateStore.set('pestAlerts', alerts);
    }
    
    const recentCount = alerts.filter(function(a) { return Date.now() - a.timestamp < 86400000; }).length;
    
    return {
      ok: !detected,
      detected: detected,
      pestType: pestType,
      confidence: confidence,
      recentAlerts: recentCount,
      recommendation: detected ? 'URGENT - Inspect crops immediately for ' + pestType : 'No pest detection',
      timestamp: new Date().toISOString()
    };
  }
};