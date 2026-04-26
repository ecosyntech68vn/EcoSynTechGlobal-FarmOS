module.exports = {
  id: 'auto-restore',
  name: 'Auto Restore',
  triggers: ['event:restore.request', 'event:data.corrupt'],
  riskLevel: 'high',
  canAutoFix: true,
  run: function(ctx) {
    const AutoBackup = require('../../ops/advanced').AutoBackup;
    const config = { backupDir: './data/backups' };
    const backup = AutoBackup(config, ctx.logger);
    
    const restore = backup.restoreFromLatest();
    
    return {
      ok: restore.ok,
      action: 'restore-latest-backup',
      restored: restore.ok,
      data: restore.data,
      timestamp: new Date().toISOString()
    };
  }
};