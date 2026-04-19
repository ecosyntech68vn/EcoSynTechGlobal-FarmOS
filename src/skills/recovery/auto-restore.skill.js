module.exports = {
  id: 'auto-restore',
  name: 'Auto Restore',
  triggers: ['event:restore.request', 'event:data.corrupt'],
  riskLevel: 'high',
  canAutoFix: true,
  run: function(ctx) {
    var AutoBackup = require('../../ops/advanced').AutoBackup;
    var config = { backupDir: './data/backups' };
    var backup = AutoBackup(config, ctx.logger);
    
    var restore = backup.restoreFromLatest();
    
    return {
      ok: restore.ok,
      action: 'restore-latest-backup',
      restored: restore.ok,
      data: restore.data,
      timestamp: new Date().toISOString(),
    };
  },
};