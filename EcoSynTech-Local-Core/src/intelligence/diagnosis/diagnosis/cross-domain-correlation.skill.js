module.exports = {
  id: 'cross-domain-correlation',
  name: 'Cross-Domain Correlation Engine',
  category: 'diagnosis',
  triggers: ['schedule:5m', 'event:alert'],
  riskLevel: 'high',
  canAutoFix: true,
  description: 'Correlates events across domains to find root causes and hidden patterns',
  correlation: {
    timeWindow: 300,
    minCorrelation: 0.6,
    domains: ['iot', 'network', 'security', 'weather', 'automation']
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    const event = ctx.event || {};
    
    const correlations = {
      rootCauses: [],
      rippleEffects: [],
      hiddenPatterns: [],
      domainLinks: new Map()
    };
    
    try {
      logger.info('[CrossDomain] Analyzing cross-domain correlations...');
      
      const recentEvents = await db.query(
        `SELECT type, data, timestamp, 
                strftime('%s', timestamp) as ts
         FROM events
         WHERE timestamp > datetime("now", "-${this.correlation.timeWindow} seconds")
         ORDER BY timestamp DESC LIMIT 100`
      );
      
      const domainMap = {
        'device.offline': 'iot',
        'device.error': 'iot',
        'login.failed': 'security',
        'rate.exceeded': 'security',
        'automation.trigger': 'automation',
        'network.error': 'network',
        'weather.change': 'weather',
        'alert.critical': 'monitoring'
      };
      
      const eventsByDomain = new Map();
      for (const e of recentEvents) {
        const domain = domainMap[e.type.split('.')[0]] || 'system';
        if (!eventsByDomain.has(domain)) {
          eventsByDomain.set(domain, []);
        }
        eventsByDomain.get(domain).push(e);
      }
      
      if (eventsByDomain.has('iot') && eventsByDomain.has('security')) {
        const iotEvents = eventsByDomain.get('iot');
        const securityEvents = eventsByDomain.get('security');
        
        if (iotEvents.length > 0 && securityEvents.length > 0) {
          correlations.hiddenPatterns.push({
            pattern: 'Device issues often follow security attacks',
            confidence: 0.72,
            domains: ['iot', 'security'],
            suggests: 'Check for unauthorized access attempts'
          });
        }
      }
      
      if (eventsByDomain.has('iot') && eventsByDomain.has('weather')) {
        const iotOffline = iotEvents.filter(e => e.type === 'device.offline').length;
        if (iotOffline > 5) {
          correlations.rootCauses.push({
            cause: 'Weather-related device failures',
            confidence: 0.83,
            relatedDomains: ['iot', 'weather'],
            evidence: iotOffline + ' devices offline'
          });
        }
      }
      
      if (recentEvents.length > 20) {
        const timeGroups = {};
        for (const e of recentEvents) {
          const minute = Math.floor(e.ts / 60) * 60;
          if (!timeGroups[minute]) timeGroups[minute] = [];
          timeGroups[minute].push(e.type);
        }
        
        for (const [time, types] of Object.entries(timeGroups)) {
          const uniqueDomains = [...new Set(types.map(t => domainMap[t.split('.')[0]]))];
          if (uniqueDomains.length >= 3) {
            correlations.rippleEffects.push({
              timestamp: time,
              affectedDomains: uniqueDomains.length,
              events: types.length,
              pattern: 'Cascading failure across ' + uniqueDomains.join(', ')
            });
          }
        }
      }
      
      const avgEventsPerMinute = recentEvents.length / (this.correlation.timeWindow / 60);
      if (avgEventsPerMinute > 50) {
        correlations.rippleEffects.push({
          pattern: 'Event storm detected',
          severity: 'high',
          rate: avgEventsPerMinute.toFixed(1) + ' events/minute',
          recommendation: 'Consider scaling or throttling'
        });
      }
      
      return {
        ok: correlations.rootCauses.length === 0,
        correlations: correlations,
        totalPatterns: correlations.hiddenPatterns.length + correlations.rootCauses.length,
        recommendations: correlations.rootCauses.length > 0
          ? 'Found root cause: ' + correlations.rootCauses[0].cause
          : 'No significant correlations',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[CrossDomain] Error:', err.message);
      return { ok: false, error: err.message };
    }
  }
};