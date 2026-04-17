module.exports = {
  id: 'db-optimizer',
  name: 'Database Optimizer',
  triggers: ['cron:*/24h', 'event:db.optimize', 'event:watchdog.tick'],
  riskLevel: 'low',
  canAutoFix: true,
  run: function(ctx) {
    var fs = require('fs');
    var path = require('path');

    var dbPath = path.join(process.cwd(), 'data', 'ecosyntech.db');
    var indexPath = path.join(process.cwd(), 'data', 'index.json');

    if (!fs.existsSync(dbPath)) {
      return { ok: true, skipped: true, reason: 'No database found' };
    }

    var stats = {
      dbSize: 0,
      indexSize: 0,
      optimizationRate: 0,
    };

    try {
      var dbStat = fs.statSync(dbPath);
      stats.dbSize = dbStat.size;

      if (fs.existsSync(indexPath)) {
        var indexStat = fs.statSync(indexPath);
        stats.indexSize = indexStat.size;
      }

      // Estimate optimization (simplified)
      var optimalSize = stats.dbSize * 0.7;
      if (stats.dbSize > 10 * 1024 * 1024) {
        stats.optimizationRate = 15;
      } else if (stats.dbSize > 5 * 1024 * 1024) {
        stats.optimizationRate = 10;
      } else {
        stats.optimizationRate = 5;
      }

      var recommendation = stats.dbSize > 10 * 1024 * 1024 
        ? 'Consider backup and recreate database'
        : 'Database healthy';

      return {
        ok: true,
        dbSize: (stats.dbSize / 1024 / 1024).toFixed(2) + ' MB',
        indexSize: (stats.indexSize / 1024).toFixed(2) + ' KB',
        optimizationRate: stats.optimizationRate + '%',
        recommendation: recommendation,
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
};