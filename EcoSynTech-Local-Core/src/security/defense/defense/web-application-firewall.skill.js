module.exports = {
  id: 'web-application-firewall',
  name: 'WAF - Web Application Firewall',
  category: 'defense',
  triggers: ['event:request', 'schedule:5m'],
  riskLevel: 'high',
  canAutoFix: true,
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const event = ctx.event || {};
    const db = ctx.db;
    
    const wafRules = {
      sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b|--|;|'|")/i,
      xss: /<script|javascript:|onerror=|onload=/i,
      pathTraversal: /(\.\.(\/|\\)|etc\/passwd|boot\.ini)/i,
      commandInjection: /(;\|\||`|\$\()/i,
      ldapInjection: /(\*|\(|\)|\x00)/i
    };
    
    const blocks = {
      sqlInjection: 0,
      xss: 0,
      pathTraversal: 0,
      commandInjection: 0,
      ldapInjection: 0
    };
    
    const checkPayload = (payload) => {
      if (!payload) return null;
      
      if (wafRules.sqlInjection.test(payload)) return 'sqlInjection';
      if (wafRules.xss.test(payload)) return 'xss';
      if (wafRules.pathTraversal.test(payload)) return 'pathTraversal';
      if (wafRules.commandInjection.test(payload)) return 'commandInjection';
      if (wafRules.ldapInjection.test(payload)) return 'ldapInjection';
      
      return null;
    };
    
    try {
      const request = event.request || {};
      const query = request.query || {};
      const body = request.body || {};
      const params = { ...query, ...body };
      
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === 'string') {
          const attack = checkPayload(value);
          if (attack) {
            blocks[attack]++;
            
            await db.query(
              'INSERT INTO waf_blocks (ip, attack_type, payload, timestamp) VALUES (?, ?, ?, datetime("now"))',
              [request.ip, attack, value.substring(0, 100)]
            );
            
            logger.warn('[WAF] Blocked ' + attack + ' from ' + request.ip);
          }
        }
      }
      
      const totalBlocks = Object.values(blocks).reduce((sum, c) => sum + c, 0);
      
      return {
        ok: totalBlocks === 0,
        blocked: totalBlocks > 0,
        attackTypes: blocks,
        recommendations: totalBlocks > 0
          ? 'Blocked ' + totalBlocks + ' attack attempts'
          : 'Request clean',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[WAF] Error:', err.message);
      return { ok: false, error: err.message };
    }
  }
};