module.exports = {
  id: 'smart-alert-triage',
  name: 'Smart Alert Triage AI',
  category: 'communication',
  triggers: ['schedule:1m'],
  riskLevel: 'high',
  canAutoFix: true,
  description: 'AI prioritizes and routes alerts based on severity, context, and urgency',
  triageFramework: {
    criticalEscalation: 5,
    highPriority: 30,
    autoDismiss: 5,
    minUrgencyScore: 60
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const triageResults = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      dismissed: [],
      routed: new Map()
    };
    
    try {
      logger.info('[AlertTriage] Triaging alerts...');
      
      const pendingAlerts = await db.query(
        `SELECT id, type, severity, source, data, timestamp
         FROM alerts
         WHERE status = 'pending'
         ORDER BY timestamp DESC
         LIMIT 100`
      );
      
      for (const alert of pendingAlerts) {
        const data = typeof alert.data === 'string' ? JSON.parse(alert.data) : {};
        const urgencyScore = calculateUrgencyScore(alert, data);
        const impactScore = calculateImpactScore(alert, data);
        const combinedScore = (urgencyScore * 0.6 + impactScore * 0.4);
        
        let priority, category;
        
        if (combinedScore >= this.triageFramework.criticalEscalation) {
          priority = 'critical';
          category = triageResults.critical;
        } else if (combinedScore >= this.triageFramework.highPriority) {
          priority = 'high';
          category = triageResults.high;
        } else if (combinedScore >= 15) {
          priority = 'medium';
          category = triageResults.medium;
        } else if (combinedScore <= this.triageFramework.autoDismiss) {
          priority = 'dismiss';
          category = triageResults.dismissed;
          
          await db.query(
            'UPDATE alerts SET status = ?, triageScore = ? WHERE id = ?',
            ['dismissed', combinedScore, alert.id]
          );
        } else {
          priority = 'low';
          category = triageResults.low;
        }
        
        category.push({
          id: alert.id,
          type: alert.type,
          source: alert.source,
          urgencyScore: urgencyScore,
          impactScore: impactScore,
          combinedScore: combinedScore,
          priority: priority
        });
        
        const routeTo = determineRoute(alert.type, priority);
        if (!triageResults.routed.has(routeTo)) {
          triageResults.routed.set(routeTo, []);
        }
        triageResults.routed.get(routeTo).push(alert.id);
        
        if (priority === 'critical') {
          await db.query(
            'INSERT INTO events (type, data, timestamp) VALUES (?, ?, datetime("now"))',
            ['alert.critical', JSON.stringify({ alertId: alert.id, score: combinedScore })]
          );
        }
      }
      
      return {
        ok: true,
        triageResults: triageResults,
        totalProcessed: pendingAlerts.length,
        criticalCount: triageResults.critical.length,
        dismissedCount: triageResults.dismissed.length,
        routes: Object.fromEntries(triageResults.routed),
        recommendations: triageResults.critical.length > 0
          ? triageResults.critical.length + ' critical alerts need immediate attention'
          : 'Alerts triaged successfully',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[AlertTriage] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    function calculateUrgencyScore(alert, data) {
      let score = 0;
      
      if (alert.type.includes('critical') || alert.severity === 'critical') score += 50;
      else if (alert.type.includes('error') || alert.severity === 'high') score += 30;
      else if (alert.type.includes('warning')) score += 15;
      else score += 5;
      
      if (data.repeated) score = Math.min(50, score + 10);
      if (data.userImpact) score = Math.min(50, score + data.userImpact * 2);
      
      return Math.min(100, score);
    }
    
    function calculateImpactScore(alert, data) {
      let score = 0;
      
      const typeScores = {
        'security': 40,
        'device': 25,
        'network': 20,
        'automation': 15,
        'data': 35
      };
      
      for (const [type, points] of Object.entries(typeScores)) {
        if (alert.type.includes(type)) {
          score += points;
          break;
        }
      }
      
      if (data.affectedUsers) score += data.affectedUsers * 3;
      if (data.affectedDevices) score += data.affectedDevices * 2;
      
      return Math.min(100, score);
    }
    
    function determineRoute(type, priority) {
      if (type.includes('security') || type.includes('auth')) return 'security-team';
      if (type.includes('device') || type.includes('iot')) return 'ops-team';
      if (type.includes('data') || type.includes('database')) return 'dba-team';
      if (priority === 'critical') return 'on-call';
      return 'general';
    }
  }
};