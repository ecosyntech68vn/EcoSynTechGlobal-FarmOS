module.exports = {
  id: 'emergency-lockdown',
  name: 'Emergency Lockdown Response',
  category: 'defense',
  triggers: ['event:emergency', 'manual:lockdown'],
  riskLevel: 'critical',
  canAutoFix: false,
  description: 'Automated emergency response for critical security events',
  lockdownLevels: {
    1: { name: 'monitor', actions: ['increase-logging'] },
    2: { name: 'partial', actions: ['block-suspicious', 'enable-2fa'] },
    3: { name: 'full', actions: ['block-all', 'disable-api', 'alert-admin'] }
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    const event = ctx.event || {};
    const level = event.level || 1;
    
    const lockdownStatus = {
      active: true,
      level: level,
      startTime: null,
      affectedUsers: 0,
      blockedIPs: []
    };
    
    const actions = {
      increase_logging: false,
      block_suspicious: false,
      enable_2fa: false,
      block_all: false,
      disable_api: false,
      alert_admin: false
    };
    
    try {
      logger.error('[EmergencyLockdown] ACTIVATED - Level ' + level);
      
      lockdownStatus.startTime = new Date().toISOString();
      
      if (level >= 1) {
        actions.increase_logging = true;
      }
      
      if (level >= 2) {
        actions.block_suspicious = true;
        
        const suspicious = await db.query(
          'SELECT ip FROM events WHERE type = "login.failed" AND timestamp > datetime("now", "-24 hours")'
        );
        
        lockdownStats.blockedIPs = [...new Set(suspicious.map(s => s.ip))];
      }
      
      if (level >= 3) {
        actions.block_all = true;
        actions.disable_api = true;
        
        lockdownStatus.affectedUsers = await db.query(
          'SELECT COUNT(*) as count FROM users WHERE active = 1'
        );
      }
      
      actions.alert_admin = level >= 2;
      
      if (actions.alert_admin) {
        await db.query(
          'INSERT INTO events (type, data, timestamp) VALUES (?, ?, datetime("now"))',
          ['admin.alert', JSON.stringify({ level, actions })]
        );
      }
      
      await db.query(
        'INSERT INTO security_logs (event, level, timestamp) VALUES (?, ?, datetime("now"))',
        ['lockdown', level]
      );
      
      return {
        ok: true,
        lockdown: lockdownStatus,
        actions: actions,
        message: 'Emergency lockdown activated - Level ' + level,
        recommendations: level === 3 
          ? 'FULL LOCKDOWN: All access restricted until manually cleared'
          : 'Monitor and prepare for escalation',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[EmergencyLockdown] Error:', err.message);
      return { ok: false, error: err.message };
    }
  }
};