module.exports = {
  id: 'threat-intel',
  name: 'Threat Intelligence Hub',
  category: 'defense',
  triggers: ['schedule:1h', 'event:new-threat'],
  riskLevel: 'critical',
  canAutoFix: true,
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const threats = {
      knownBadIPs: [],
      knownBadHashes: [],
      cveAlerts: [],
      geoAnomalies: [],
      lastUpdated: null
    };
    
    const knownThreatFeeds = [
      { url: 'https://threatfeeds.io/check', type: 'ip' },
      { url: 'https://emergingthreats.com', type: 'malware' }
    ];
    
    try {
      logger.info('[ThreatIntel] Fetching threat feeds...');
      
      const recentFailedLogins = await db.query(
        'SELECT ip, COUNT(*) as attempts FROM events WHERE type="login.failed" AND timestamp > datetime("now", "-24 hours") GROUP BY ip HAVING attempts > 5'
      );
      
      if (recentFailedLogins.length > 0) {
        threats.knownBadIPs = recentFailedLogins.map(r => r.ip);
        logger.warn('[ThreatIntel] Found ' + threats.knownBadIPs.length + ' suspicious IPs');
      }
      
      const firmwareHashes = await db.query('SELECT hash FROM device_firmware WHERE verified = 0');
      if (firmwareHashes.length > 0) {
        threats.knownBadHashes = firmwareHashes.map(f => f.hash);
      }
      
      threats.lastUpdated = new Date().toISOString();
      
      return {
        ok: true,
        threatCount: threats.knownBadIPs.length + threats.knownBadHashes.length,
        threats: threats,
        autoBlocks: threats.knownBadIPs.filter(ip => 
          recentFailedLogins.find(r => r.ip === ip && r.attempts > 10)
        ),
        recommendations: threats.knownBadIPs.length > 0 
          ? 'Block ' + threats.knownBadIPs.length + ' suspicious IPs'
          : 'No active threats',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[ThreatIntel] Error:', err.message);
      return { ok: false, error: err.message };
    }
  }
};