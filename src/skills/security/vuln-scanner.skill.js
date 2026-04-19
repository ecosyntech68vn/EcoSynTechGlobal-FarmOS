module.exports = {
  id: 'vuln-scanner',
  name: 'Vulnerability Scanner',
  triggers: ['cron:*/24h', 'event:security.check', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: false,
  run: function(ctx) {
    var VulnerabilityScanner = require('../../ops/advanced').VulnerabilityScanner;
    var scanner = VulnerabilityScanner(ctx.logger);
    
    var srcDir = ctx.cwd || process.cwd();
    var results = scanner.scanDirectory(srcDir + '/src');
    
    var highFindings = 0;
    var mediumFindings = 0;
    for (var i = 0; i < results.length; i++) {
      for (var j = 0; j < results[i].findings.length; j++) {
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
      timestamp: new Date().toISOString(),
    };
  },
};