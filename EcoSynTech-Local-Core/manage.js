#!/usr/bin/env node
/**
 * EcoSynTech - Management Script
 * Modes: manual, auto, test, status
 */

const { createOps, skills } = require('./src/ops');
const { SkillScheduler } = require('./src/ops/scheduler');
const optimization = require('./src/optimization');
const i18n = require('./src/i18n');
const fs = require('fs');

var args = process.argv.slice(2);
var command = args[0] || 'help';

var logger = {
  info: function(m) { console.log('[INFO]', m); },
  error: function(m) { console.log('[ERROR]', m); }
};

var ops = createOps(logger, 'http://localhost:3000', '2.3.2', {});

console.log('==========================================');
console.log('ECO SYNTECH - MANAGEMENT');
console.log('==========================================');
console.log('');

switch (command) {
  case 'start':
    console.log('[MODE: AUTO] Starting system...');
    console.log('Use: npm start');
    break;

  case 'stop':
    console.log('[MODE: MANUAL] Stopping system...');
    if (ops.stopScheduler) {
      ops.stopScheduler();
      console.log('Scheduler stopped');
    }
    console.log('System stopped');
    break;

  case 'status':
    console.log('[MODE: MANUAL] System Status');
    console.log('');
    console.log('--- Version ---');
    var pkg = require('./package.json');
    console.log('Version:', pkg.version);
    console.log('');
    console.log('--- Skills ---');
    console.log('Total skills:', skills.length);
    console.log('');
    console.log('--- System ---');
    var sysInfo = optimization.getSystemInfo();
    var mem = optimization.getMemoryStatus();
    console.log('Total RAM:', (sysInfo.totalMemory/1024/1024/1024).toFixed(2) + ' GB');
    console.log('Usage:', sysInfo.usagePercent + '%');
    console.log('Process Memory:', mem.rss);
    console.log('');
    console.log('--- Scheduler ---');
    var sched = ops.getScheduler ? ops.getScheduler() : null;
    console.log('Scheduler running:', sched && sched.running ? 'YES' : 'NO');
    console.log('');
    console.log('--- Language ---');
    console.log('Current:', i18n.getLanguage());
    console.log('Supported:', Object.keys(i18n.getSupportedLanguages()).join(', '));
    break;

  case 'test':
    console.log('[MODE: TEST] Running skills test...');
    var passed = 0;
    var failed = 0;

    var testSkills = [
      'version-drift-detect',
      'alert-deduper',
      'auto-backup',
      'system-health-scorer',
      'approval-gate',
      'weather-decision',
      'energy-saver',
    ];

    for (var i = 0; i < testSkills.length; i++) {
      var skillId = testSkills[i];
      var skill = ops.registry.get(skillId);
      if (skill) {
        try {
          skill.run({
            event: { type: 'test' },
            logger: logger,
            stateStore: ops.stateStore,
            baseUrl: 'http://localhost:3000',
            packageVersion: '2.3.2',
            config: {}
          });
          console.log('[PASS]', skillId);
          passed++;
        } catch (e) {
          console.log('[FAIL]', skillId, '-', e.message);
          failed++;
        }
      }
    }

    console.log('');
    console.log('Results:', passed, 'passed,', failed, 'failed');
    break;

  case 'lang':
    var lang = args[1] || 'vi';
    i18n.setLanguage(lang);
    console.log('Language changed to:', lang, '-', i18n.t('app.name'));
    break;

  case 'optimize':
    console.log('[MODE: AUTO] Optimizing for device...');
    var result = optimization.optimizeForDevice();
    console.log('Optimization level:', result.level);
    console.log('Scheduler interval:', (result.settings.schedulerInterval/60000).toFixed(0), 'min');
    console.log('Backup interval:', (result.settings.backupInterval/3600000).toFixed(0), 'hours');
    break;

  case 'backup':
    console.log('[MODE: MANUAL] Creating manual backup...');
    var AutoBackup = require('./src/ops/advanced').AutoBackup;
    var backup = AutoBackup({ backupDir: './data/backups', maxBackups: 24 }, logger);
    var result = backup.createBackup('manual');
    console.log(result.ok ? 'Backup created: ' + result.file : 'Backup failed: ' + result.error);
    break;

  case 'restore':
    console.log('[MODE: MANUAL] Restoring latest backup...');
    var AutoBackup = require('./src/ops/advanced').AutoBackup;
    var backup = AutoBackup({ backupDir: './data/backups' }, logger);
    var result = backup.restoreFromLatest();
    console.log(result.ok ? 'Restore successful' : 'Restore failed: ' + result.error);
    break;

  case 'skills':
    console.log('[INFO] Available skills:', skills.length);
    for (var s = 0; s < skills.length; s++) {
      var skill = skills[s];
      console.log(' -', skill.id, '(' + skill.riskLevel + ')');
    }
    break;

  case 'help':
  default:
    console.log('Available commands:');
    console.log('  node manage.js status    - Show system status');
    console.log('  node manage.js test     - Run skills test');
    console.log('  node manage.js optimize - Optimize for device');
    console.log('  node manage.js lang [vi|en|zh] - Change language');
    console.log('  node manage.js backup - Create manual backup');
    console.log('  node manage.js restore - Restore from backup');
    console.log('  node manage.js skills  - List all skills');
    console.log('');
    console.log('For production:');
    console.log('  npm start        - Start server');
    console.log('  npm run dev      - Development mode');
    break;
}

console.log('');
console.log('==========================================');
console.log('Done');
console.log('==========================================');