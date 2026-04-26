module.exports = {
  id: 'vuln-scanner',
  name: 'Vulnerability Scanner',
  triggers: ['cron:*/24h', 'event:security.check', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    const VulnerabilityScanner = require('../../ops/advanced').VulnerabilityScanner;
    const scanner = VulnerabilityScanner(ctx.logger);
    
    const srcDir = ctx.cwd || process.cwd();
    const results = scanner.scanDirectory(srcDir + '/src');
    
    let highFindings = 0;
    let mediumFindings = 0;
    for (let i = 0; i < results.length; i++) {
      for (let j = 0; j < results[i].findings.length; j++) {
        if (results[i].findings[j].severity === 'high') highFindings++;
        else if (results[i].findings[j].severity === 'medium') mediumFindings++;
      }
    }
    
    return {
      ok: highFindings === 0,
      filesScanned: results.length,
      highFindings: highFindings,
      mediumFindings: mediumFindings,
      details: results.slice(0, 5),
      timestamp: new Date().toISOString()
    };
  }
};