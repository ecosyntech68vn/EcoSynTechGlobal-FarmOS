module.exports = {
  id: 'intrusion-detector',
  name: 'Intrusion Detector',
  triggers: ['event:login.failed', 'event:rate.exceeded', 'event:watchdog.tick'],
  riskLevel: 'high',
  canAutoFix: true,
  run: function(ctx) {
    var logger = ctx.logger || {};
    var event = ctx.event || {};
    var ip = event.ip || event.clientIp || 'unknown';
    
    var blocked = [];
    var suspicious = [];
    var recommendation = 'No threats detected';
    
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
      timestamp: new Date().toISOString(),
    };
  },
};