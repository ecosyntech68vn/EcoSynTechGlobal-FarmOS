module.exports = {
  id: 'ddos-mitigator',
  name: 'DDoS Attack Mitigator',
  category: 'defense',
  triggers: ['event:ddos.detected', 'schedule:5m'],
  riskLevel: 'critical',
  canAutoFix: true,
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const rateLimits = {
      windowMs: 60000,
      maxRequests: 100,
      blockDuration: 300
    };
    
    const attackIndicators = {
      trafficSpike: false,
      suspiciousPattern: false,
      geoAnomaly: false
    };
    
    try {
      const recentRequests = await db.query(
        `SELECT ip, COUNT(*) as count, AVG(responseTime) as avgTime 
         FROM api_logs 
         WHERE timestamp > datetime("now", "-5 minutes")
         GROUP BY ip`
      );
      
      const suspiciousIPs = recentRequests
        .filter(r => r.count > rateLimits.maxRequests || r.avgTime > 5000)
        .map(r => r.ip);
      
      if (suspiciousIPs.length > 0) {
        attackIndicators.trafficSpike = true;
        logger.warn('[DDoS] Detected ' + suspiciousIPs.length + ' attack sources');
        
        for (const ip of suspiciousIPs) {
          await db.query(
            'INSERT OR REPLACE INTO ip_blacklist (ip, reason, blockedUntil) VALUES (?, ?, datetime("now", "+' + rateLimits.blockDuration + ' seconds"))',
            [ip, 'DDoS protection']
          );
        }
      }
      
      const total5m = recentRequests.reduce((sum, r) => sum + r.count, 0);
      if (total5m > rateLimits.maxRequests * 10) {
        attackIndicators.suspiciousPattern = true;
      }
      
      const activeBlocks = await db.query(
        'SELECT COUNT(*) as count FROM ip_blacklist WHERE blockedUntil > datetime("now")'
      );
      
      return {
        ok: !attackIndicators.trafficSpike,
        attackDetected: attackIndicators.trafficSpike,
        blockedIPs: suspiciousIPs.length,
        activeBlocks: activeBlocks[0]?.count || 0,
        indicators: attackIndicators,
        recommendations: suspiciousIPs.length > 0
          ? 'Activated rate limiting for ' + suspiciousIPs.length + ' IPs'
          : 'Traffic normal',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[DDoS] Error:', err.message);
      return { ok: false, error: err.message };
    }
  }
};