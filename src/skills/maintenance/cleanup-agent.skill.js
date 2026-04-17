module.exports = {
  id: 'cleanup-agent',
  name: 'Cleanup Agent',
  triggers: ['cron:*/24h', 'event:cleanup.request', 'event:disk.low'],
  riskLevel: 'low',
  canAutoFix: true,
  run: function(ctx) {
    var fs = require('fs');
    var path = require('path');
    var os = require('os');

    var cleanTargets = [
      { path: path.join(process.cwd(), 'data', 'temp'), maxAge: 24 * 3600000 },
      { path: path.join(process.cwd(), 'logs'), maxAge: 7 * 24 * 3600000 },
      { path: path.join(process.cwd(), 'data', 'cache'), maxAge: 2 * 3600000 },
    ];

    var cleaned = 0;
    var freed = 0;
    var errors = [];

    for (var i = 0; i < cleanTargets.length; i++) {
      var target = cleanTargets[i];
      try {
        if (!fs.existsSync(target.path)) continue;
        
        var files = fs.readdirSync(target.path);
        var now = Date.now();
        
        for (var j = 0; j < files.length; j++) {
          var file = files[j];
          var filePath = path.join(target.path, file);
          var stat = fs.statSync(filePath);
          
          if (stat.isFile() && now - stat.mtimeMs > target.maxAge) {
            var size = stat.size;
            fs.unlinkSync(filePath);
            cleaned++;
            freed += size;
          }
        }
      } catch (err) {
        errors.push(target.path + ': ' + err.message);
      }
    }

    var stateStore = ctx.stateStore;
    if (stateStore) {
      var alerts = stateStore.get('alerts') || [];
      var cutoff = Date.now() - (7 * 24 * 3600000);
      var before = alerts.length;
      alerts = alerts.filter(function(a) { return a.ts > cutoff; });
      stateStore.set('alerts', alerts);
      cleaned += (before - alerts.length);
    }

    return {
      ok: errors.length === 0,
      filesCleaned: cleaned,
      spaceFreed: freed,
      freedFormatted: (freed / 1024 / 1024).toFixed(2) + ' MB',
      errors: errors,
      timestamp: new Date().toISOString(),
    };
  },
};