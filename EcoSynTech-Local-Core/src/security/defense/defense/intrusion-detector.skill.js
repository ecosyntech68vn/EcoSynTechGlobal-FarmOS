module.exports = {
  id: 'intrusion-detector',
  name: 'Intrusion Detector',
  triggers: ['event:login.failed', 'event:rate.exceeded', 'event:watchdog.tick'],
  riskLevel: 'high',
  canAutoFix: true,
  run: function(ctx) {
    const logger = ctx.logger || {};
    const event = ctx.event || {};
    const ip = event.ip || event.clientIp || 'unknown';
    
    const blocked = [];
    const suspicious = [];
    let recommendation = 'No threats detected';
    
    if (event.type === 'login.failed' || event.success === false) {
      recommendation = 'Failed login from ' + ip + ' - monitor';
    } else if (event.type === 'rate.exceeded') {
      recommendation = 'Rate limit exceeded - consider blocking ' + ip;
    }
    
    return {
      ok: recommendation.indexOf('No threats') !== -1,
      lastIP: ip,
      blockedIPs: blocked,
      suspiciousIPs: suspicious,
      recommendations: recommendation,
      timestamp: new Date().toISOString()
    };
  }
};