module.exports = {
  id: 'log-rotator',
  name: 'Log Rotator',
  triggers: ['cron:*/24h', 'event:log.rotate'],
  riskLevel: 'low',
  canAutoFix: true,
  run: function(ctx) {
    var fs = require('fs');
    var path = require('path');

    var logDir = path.join(process.cwd(), 'logs');
    var maxFiles = 10;
    var maxSize = 10 * 1024 * 1024;

    try {
      if (!fs.existsSync(logDir)) {
        return { ok: true, skipped: true, reason: 'No log directory' };
      }

      var files = fs.readdirSync(logDir)
        .filter(function(f) { return f.endsWith('.log'); })
        .map(function(f) {
          return {
            name: f,
            path: path.join(logDir, f),
            stat: fs.statSync(path.join(logDir, f))
          };
        });

      var totalSize = 0;
      for (var i = 0; i < files.length; i++) {
        totalSize += files[i].stat.size;
      }

      var rotated = 0;
      if (files.length > maxFiles || totalSize > maxSize) {
        files.sort(function(a, b) { return a.stat.mtime - b.stat.mtime; });
        
        while (files.length > maxFiles || totalSize > maxSize) {
          var oldest = files.shift();
          try {
            fs.unlinkSync(oldest.path);
            totalSize -= oldest.stat.size;
            rotated++;
          } catch (e) {}
        }
      }

      return {
        ok: true,
        filesTotal: files.length,
        totalSize: totalSize,
        rotated: rotated,
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
};