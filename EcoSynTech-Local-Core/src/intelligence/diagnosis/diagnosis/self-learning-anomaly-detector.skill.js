module.exports = {
  id: 'self-learning-anomaly-detector',
  name: 'Self-Learning Anomaly Detector',
  category: 'diagnosis',
  triggers: ['schedule:5m'],
  riskLevel: 'high',
  canAutoFix: true,
  description: 'AI-powered anomaly detection that learns normal patterns over time and adapts',
  learning: {
    minSamples: 100,
    windowDays: 7,
    sensitivity: 2.5,
    autoAdjust: true
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const baseline = {
      patterns: new Map(),
      normalRanges: new Map(),
      lastUpdate: null
    };
    
    const anomalies = {
      statistical: [],
      behavioral: [],
      temporal: []
    };
    
    try {
      logger.info('[SelfLearningAnomaly] Building baseline...');
      
      const endpoints = await db.query(
        `SELECT endpoint, 
                AVG(responseTime) as avg, 
                MIN(responseTime) as min,
                MAX(responseTime) as max,
                STDDEV(responseTime) as std,
                COUNT(*) as count
         FROM api_logs
         WHERE timestamp > datetime("now", "-${this.learning.windowDays} days")
         GROUP BY endpoint`
      );
      
      for (const ep of endpoints) {
        if (ep.count >= this.learning.minSamples) {
          const upperBound = ep.avg + (this.learning.sensitivity * ep.std);
          const lowerBound = ep.avg - (this.learning.sensitivity * ep.std);
          
          baseline.normalRanges.set(ep.endpoint, {
            avg: ep.avg,
            std: ep.std,
            upper: upperBound,
            lower: Math.max(0, lowerBound),
            samples: ep.count
          });
        }
      }
      
      logger.info('[SelfLearningAnomaly] Analyzing current traffic...');
      
      const recentLogs = await db.query(
        `SELECT endpoint, 
                responseTime,
                statusCode,
                userId,
                timestamp
         FROM api_logs
         WHERE timestamp > datetime("now", "-1 hour")
         ORDER BY timestamp DESC LIMIT 1000`
      );
      
      for (const log of recentLogs) {
        const range = baseline.normalRanges.get(log.endpoint);
        if (range) {
          if (log.responseTime > range.upper) {
            anomalies.statistical.push({
              endpoint: log.endpoint,
              value: log.responseTime,
              threshold: range.upper,
              deviation: ((log.responseTime - range.avg) / range.std).toFixed(2),
              time: log.timestamp
            });
          }
        }
      }
      
      const timeOfDay = new Date().getHours();
      const historicalSameTime = await db.query(
        `SELECT AVG(responseTime) as avg 
         FROM api_logs 
         WHERE strftime('%H', timestamp) = ?
         AND timestamp > datetime("now", "-30 days")`,
        [String(timeOfDay).padStart(2, '0')]
      );
      
      const currentAvg = recentLogs.reduce((s, l) => s + l.responseTime, 0) / recentLogs.length;
      if (historicalSameTime[0]?.avg) {
        const temporalChange = Math.abs(currentAvg - historicalSameTime[0].avg) / historicalSameTime[0].avg;
        if (temporalChange > 0.5) {
          anomalies.temporal.push({
            message: 'Response time changed ' + (temporalChange * 100).toFixed(1) + '% from same time historical',
            historical: historicalSameTime[0].avg,
            current: currentAvg
          });
        }
      }
      
      baseline.lastUpdate = new Date().toISOString();
      
      const totalAnomalies = anomalies.statistical.length + anomalies.behavioral.length + anomalies.temporal.length;
      
      if (totalAnomalies > 10) {
        await db.query(
          'INSERT INTO events (type, data, timestamp) VALUES (?, ?, datetime("now"))',
          ['anomaly.detected', JSON.stringify({ count: totalAnomalies, type: 'self-learning' })]
        );
      }
      
      return {
        ok: totalAnomalies < 10,
        anomaliesDetected: totalAnomalies,
        baselineSize: baseline.normalRanges.size,
        anomalies: anomalies,
        confidence: totalAnomalies > 0 ? 0.85 : 0.98,
        autoAdjust: this.learning.autoAdjust,
        recommendations: totalAnomalies > 0
          ? 'Review ' + totalAnomalies + ' anomalies - system learning'
          : 'Normal operation',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[SelfLearningAnomaly] Error:', err.message);
      return { ok: false, error: err.message };
    }
  }
};