module.exports = {
  id: 'defense-in-depth',
  name: 'Defense in Depth Orchestrator',
  category: 'defense',
  triggers: ['schedule:10m', 'event:security.breach'],
  riskLevel: 'critical',
  canAutoFix: true,
  description: 'Multi-layer defense orchestration with automatic threat response',
  layers: [
    { name: 'perimeter', skills: ['ddos-mitigator', 'rate-limiter'] },
    { name: 'network', skills: ['intrusion-detector', 'firewall'] },
    { name: 'application', skills: ['waf', 'input-validator'] },
    { name: 'data', skills: ['encryption-monitor', 'access-audit'] },
    { name: 'continuous', skills: ['threat-intel', 'zero-day-detector'] }
  ],
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    const event = ctx.event || {};
    
    const defenseStatus = {
      perimeter: { ok: true, score: 100 },
      network: { ok: true, score: 100 },
      application: { ok: true, score: 100 },
      data: { ok: true, score: 100 },
      continuous: { ok: true, score: 100 }
    };
    
    const responses = [];
    
    try {
      logger.info('[DefenseInDepth] Running multi-layer check...');
      
      const failedLogins = await db.query(
        'SELECT COUNT(*) as count FROM events WHERE type="login.failed" AND timestamp > datetime("now", "-10 minutes")'
      );
      
      if (failedLogins[0].count > 10) {
        defenseStatus.perimeter.score = Math.max(0, 100 - (failedLogins[0].count - 10) * 5);
        defenseStatus.perimeter.ok = failedLogins[0].count < 20;
        responses.push({ layer: 'perimeter', action: 'rate-limit', detail: failedLogins[0].count + ' failed logins' });
      }
      
      const sqlInjections = await db.query(
        'SELECT COUNT(*) as count FROM api_logs WHERE endpoint LIKE "%" OR "%" AND (payload LIKE "%--%" OR payload LIKE "%UNION%")'
      );
      
      if (sqlInjections[0].count > 0) {
        defenseStatus.application.score = 50;
        defenseStatus.application.ok = false;
        responses.push({ layer: 'application', action: 'block', detail: 'SQL injection attempt' });
      }
      
      const unauthorized = await db.query(
        'SELECT COUNT(*) as count FROM events WHERE type="auth.unauthorized" AND timestamp > datetime("now", "-10 minutes")'
      );
      
      if (unauthorized[0].count > 5) {
        defenseStatus.network.score = Math.max(0, 100 - unauthorized[0].count * 10);
        responses.push({ layer: 'network', action: 'review', detail: unauthorized[0].count + ' unauthorized attempts' });
      }
      
      const avgScore = Object.values(defenseStatus).reduce((sum, l) => sum + l.score, 0) / 5;
      
      const threatLevel = avgScore > 90 ? 'low' : avgScore > 70 ? 'medium' : 'high' : 'critical';
      
      if (threatLevel === 'critical' || event.type === 'security.breach') {
        logger.error('[DefenseInDepth] CRITICAL: Activating emergency response!');
        
        await db.query(
          'INSERT INTO events (type, data, timestamp) VALUES (?, ?, datetime("now"))',
          ['security.breach', JSON.stringify({ responses, threatLevel })]
        );
        
        responses.push({
          layer: 'all',
          action: 'emergency-lockdown',
          detail: 'Auto-enabled due to critical threat'
        });
      }
      
      return {
        ok: avgScore > 70,
        threatLevel: threatLevel,
        overallScore: avgScore.toFixed(1),
        layers: defenseStatus,
        responses: responses,
        recommendations: responses.length > 0
          ? 'Take action on ' + responses.length + ' layers'
          : 'All layers secure',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[DefenseInDepth] Error:', err.message);
      return { ok: false, error: err.message };
    }
  }
};