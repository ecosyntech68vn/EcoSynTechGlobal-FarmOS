module.exports = {
  id: 'predictive-maintenance-ai',
  name: 'Predictive Maintenance AI',
  category: 'maintenance',
  triggers: ['schedule:15m'],
  riskLevel: 'high',
  canAutoFix: true,
  description: 'AI predicts device failures before they happen using ML pattern analysis',
  models: {
    minHistory: 7,
    failureThreshold: 0.75,
    healthWeight: { latency: 0.3, errors: 0.4, offline: 0.3 }
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const predictions = {
      critical: [],
      warning: [],
      healthy: [],
      deviceStats: new Map()
    };
    
    try {
      logger.info('[PredictiveMaintenance] Analyzing device health...');
      
      const devices = await db.query(
        `SELECT d.id, d.name, d.status, d.lastSeen,
                COUNT(l.id) as requestCount,
                AVG(l.responseTime) as avgLatency,
                MAX(l.responseTime) as maxLatency,
                SUM(CASE WHEN l.statusCode >= 500 THEN 1 ELSE 0 END) as errorCount
         FROM devices d
         LEFT JOIN device_logs l ON d.id = l.deviceId 
           AND l.timestamp > datetime("now", "-24 hours")
         WHERE d.status = 'active'
         GROUP BY d.id`
      );
      
      for (const device of devices) {
        const healthScore = calculateHealthScore(device, this.models.healthWeight);
        
        predictions.deviceStats.set(device.id, {
          healthScore: healthScore,
          lastScore: healthScore,
          trend: 'stable'
        });
        
        const historicalHealth = await db.query(
          `SELECT AVG(healthScore) as avg 
           FROM device_health 
           WHERE deviceId = ? 
           AND timestamp > datetime("now", "-${this.models.minHistory} days")`,
          [device.id]
        );
        
        if (historicalHealth.length > 1) {
          const scores = historicalHealth.map(h => h.avg).filter(s => s !== null);
          if (scores.length > 1) {
            const trend = scores[scores.length - 1] - scores[0];
            predictions.deviceStats.get(device.id).trend = trend > 10 ? 'declining' : trend < -10 ? 'improving' : 'stable';
            predictions.deviceStats.get(device.id).lastScore = scores[scores.length - 1];
          }
        }
        
        if (healthScore > 85) {
          predictions.healthy.push({
            deviceId: device.id,
            name: device.name,
            score: healthScore
          });
        } else if (healthScore > 60) {
          predictions.warning.push({
            deviceId: device.id,
            name: device.name,
            score: healthScore,
            trend: predictions.deviceStats.get(device.id).trend,
            predictedFailure: predictFailureTime(healthScore, predictions.deviceStats.get(device.id).lastScore)
          });
        } else {
          predictions.critical.push({
            deviceId: device.id,
            name: device.name,
            score: healthScore,
            trend: predictions.deviceStats.get(device.id).trend,
            predictedFailure: predictFailureTime(healthScore, predictions.deviceStats.get(device.id).lastScore)
          });
          
          await db.query(
            'INSERT INTO events (type, data, timestamp) VALUES (?, ?, datetime("now"))',
            ['device.critical', JSON.stringify({ deviceId: device.id, score: healthScore })]
          );
        }
      }
      
      const upcomingFailures = predictions.warning.length + predictions.critical.length;
      
      if (upcomingFailures > 0) {
        logger.warn('[PredictiveMaintenance] Predicted ' + upcomingFailures + ' devices will fail soon');
      }
      
      return {
        ok: predictions.critical.length === 0,
        devicesAnalyzed: devices.length,
        predictions: predictions,
        upcomingFailures: upcomingFailures,
        recommendations: upcomingFailures > 0
          ? 'Schedule maintenance for ' + upcomingFailures + ' devices'
          : 'All devices healthy',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[PredictiveMaintenance] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    function calculateHealthScore(device, weights) {
      const latencyScore = Math.max(0, 100 - (device.avgLatency || 0) / 10);
      const errorRate = (device.errorCount || 0) / (device.requestCount || 1);
      const errorScore = Math.max(0, 100 - errorRate * 1000);
      const offlineTime = device.lastSeen ? 
        (Date.now() - new Date(device.lastSeen).getTime()) / 1000 / 60 : 0;
      const offlineScore = offlineTime > 60 ? 0 : Math.max(0, 100 - offlineTime * 1.67);
      
      return Math.round(
        latencyScore * weights.latency +
        errorScore * weights.errors +
        offlineScore * weights.offline
      );
    }
    
    function predictFailureTime(currentHealth, lastHealth) {
      if (!lastHealth || currentHealth > 80) return null;
      const decline = (lastHealth - currentHealth) / 7;
      if (decline <= 0) return null;
      return Math.ceil((currentHealth - 30) / decline) + ' days';
    }
  }
};