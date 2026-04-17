module.exports = {
  id: 'energy-saver',
  name: 'Energy Saver',
  triggers: ['event:power.status', 'cron:*/30m', 'event:watchdog.tick'],
  riskLevel: 'medium',
  canAutoFix: true,
  run: function(ctx) {
    var stateStore = ctx.stateStore;
    var config = ctx.config || {};
    
    var powerLevel = stateStore.get('powerLevel') || 100;
    var batteryMode = stateStore.get('batteryMode') || 'normal';
    var currentInterval = config.opsSchedulerInterval || 600000;
    
    var ecoConfig = {
      critical: { interval: 3600000, backup: 43200000, sample: 0.3 },
      low: { interval: 1800000, backup: 21600000, sample: 0.5 },
      normal: { interval: 600000, backup: 10800000, sample: 1 },
    };
    
    var mode = 'normal';
    var action = 'none';
    var newInterval = currentInterval;
    var newBackupInterval = 10800000;
    var sampleRate = 1;
    
    if (powerLevel < 20) {
      mode = 'critical';
      action = 'CRITICAL - Enable eco mode';
      newInterval = 3600000;
      newBackupInterval = 43200000;
      sampleRate = 0.3;
    } else if (powerLevel < 50) {
      mode = 'low';
      action = 'LOW - Enable power saving';
      newInterval = 1800000;
      newBackupInterval = 21600000;
      sampleRate = 0.5;
    } else if (batteryMode === 'charging') {
      mode = 'charging';
      action = 'Charging - Normal mode';
      newInterval = 600000;
      newBackupInterval = 10800000;
      sampleRate = 1;
    } else {
      mode = 'normal';
      action = 'Normal mode';
    }
    
    return {
      ok: mode !== 'critical',
      mode: mode,
      action: action,
      schedulerInterval: newInterval,
      schedulerIntervalLabel: (newInterval / 60000).toFixed(0) + ' minutes',
      backupInterval: (newBackupInterval / 3600000).toFixed(0) + ' hours',
      sampleRate: sampleRate,
      previousInterval: currentInterval,
      powerLevel: powerLevel,
      timestamp: new Date().toISOString(),
    };
  },
};