module.exports = {
  id: 'cleanup-agent',
  name: 'Cleanup Agent',
  triggers: ['cron:*/24h', 'event:cleanup.request', 'event:disk.low'],
  riskLevel: 'low',
  canAutoFix: true,
  run: function(ctx) {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    const cleanTargets = [
      { path: path.join(process.cwd(), 'data', 'temp'), maxAge: 24 * 3600000 },
      { path: path.join(process.cwd(), 'logs'), maxAge: 7 * 24 * 3600000 },
      { path: path.join(process.cwd(), 'data', 'cache'), maxAge: 2 * 3600000 }
    ];

    let cleaned = 0;
    let freed = 0;
    const errors = [];

    for (let i = 0; i < cleanTargets.length; i++) {
      const target = cleanTargets[i];
      try {
        if (!fs.existsSync(target.path)) continue;
        
        const files = fs.readdirSync(target.path);
        const now = Date.now();
        
        for (let j = 0; j < files.length; j++) {
          const file = files[j];
          const filePath = path.join(target.path, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isFile() && now - stat.mtimeMs > target.maxAge) {
            const size = stat.size;
            fs.unlinkSync(filePath);
            cleaned++;
            freed += size;
          }
        }
      } catch (err) {
        errors.push(target.path + ': ' + err.message);
      }
    }

    const stateStore = ctx.stateStore;
    if (stateStore) {
      let alerts = stateStore.get('alerts') || [];
      const cutoff = Date.now() - (7 * 24 * 3600000);
      const before = alerts.length;
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
      timestamp: new Date().toISOString()
    };
  }
};