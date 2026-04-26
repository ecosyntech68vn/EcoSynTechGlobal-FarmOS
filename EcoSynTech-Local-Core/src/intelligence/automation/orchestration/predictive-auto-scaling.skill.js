module.exports = {
  id: 'predictive-auto-scaling',
  name: 'Predictive Auto-Scaling Engine',
  category: 'automation',
  triggers: ['schedule:5m'],
  riskLevel: 'medium',
  canAutoFix: true,
  description: 'AI predicts load and scales resources before demand peaks',
  scalingPolicies: {
    scaleUpThreshold: 0.75,
    scaleDownThreshold: 0.3,
    minInstances: 1,
    maxInstances: 10,
    cooldownMinutes: 5,
    predictionWindow: 30
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const scalingActions = {
      scaleUp: false,
      scaleDown: false,
      predictions: [],
      currentLoad: 0,
      predictedLoad: 0
    };
    
    try {
      logger.info('[AutoScale] Analyzing load patterns...');
      
      const recentMetrics = await db.query(
        `SELECT 
           COUNT(*) as totalRequests,
           AVG(responseTime) as avgResponse,
           MAX(responseTime) as maxResponse,
           strftime('%H', timestamp) as hour
         FROM api_logs
         WHERE timestamp > datetime("now", "-30 minutes")
         GROUP BY hour
         ORDER BY hour DESC`
      );
      
      const totalRequests = recentMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
      const avgResponse = recentMetrics.reduce((sum, m) => sum + (m.avgResponse || 0), 0) / (recentMetrics.length || 1);
      
      scalingActions.currentLoad = calculateLoadScore(totalRequests, avgResponse);
      
      const historicalSameHour = await db.query(
        `SELECT AVG(requests) as avg
         FROM hourly_metrics
         WHERE hour = strftime('%H', 'now')
         AND timestamp > datetime("now", "-30 days")`
      );
      const historicalAvg = historicalSameHour[0]?.avg || totalRequests;
      const growthRate = totalRequests / (historicalAvg || 1);
      
      for (let i = 1; i <= this.scalingPolicies.predictionWindow; i += 10) {
        const predictedGrowth = Math.pow(growthRate, i / 10);
        scalingActions.predictions.push({
          minutesAhead: i,
          predictedLoad: (scalingActions.currentLoad * predictedGrowth).toFixed(1)
        });
      }
      
      const maxPredicted = Math.max(...scalingActions.predictions.map(p => parseFloat(p.predictedLoad)));
      scalingActions.predictedLoad = maxPredicted;
      
      const currentInstances = await db.query(
        'SELECT value FROM system_config WHERE key = "instanceCount"'
      );
      const instances = parseInt(currentInstances[0]?.value || 1);
      
      if (maxPredicted > this.scalingPolicies.scaleUpThreshold * 100) {
        const needed = Math.ceil(maxPredicted / 75);
        const newCount = Math.min(needed, this.scalingPolicies.maxInstances);
        
        if (newCount > instances) {
          scalingActions.scaleUp = true;
          
          await db.query(
            'UPDATE system_config SET value = ? WHERE key = "instanceCount"',
            [newCount]
          );
          
          logger.warn('[AutoScale] SCALING UP to ' + newCount + ' instances');
          
          await db.query(
            'INSERT INTO events (type, data, timestamp) VALUES (?, ?, datetime("now"))',
            ['scaling.up', JSON.stringify({ from: instances, to: newCount, reason: 'predictive' })]
          );
        }
      }
      else if (scalingActions.currentLoad < this.scalingPolicies.scaleDownThreshold * 100 && instances > this.scalingPolicies.minInstances) {
        const newCount = Math.max(this.scalingPolicies.minInstances, instances - 1);
        
        scalingActions.scaleDown = true;
        
        await db.query(
          'UPDATE system_config SET value = ? WHERE key = "instanceCount"',
          [newCount]
        );
        
        logger.info('[AutoScale] SCALING DOWN to ' + newCount + ' instances');
        
        await db.query(
          'INSERT INTO events (type, data, timestamp) VALUES (?, ?, datetime("now"))',
          ['scaling.down', JSON.stringify({ from: instances, to: newCount })]
        );
      }
      
      return {
        ok: true,
        scalingActions: scalingActions,
        currentInstances: instances,
        recommendations: scalingActions.scaleUp
          ? 'Scaled up to handle predicted load'
          : scalingActions.scaleDown
            ? 'Scaled down - low demand'
            : 'Current capacity optimal',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[AutoScale] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    function calculateLoadScore(requests, avgResponse) {
      const normalizedRequests = Math.min(100, requests / 100);
      const normalizedResponse = Math.min(100, (avgResponse || 0) / 100);
      return ((normalizedRequests * 0.7) + (normalizedResponse * 0.3)) * 100;
    }
  }
};