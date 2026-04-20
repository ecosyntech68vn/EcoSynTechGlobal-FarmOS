const backupService = require('./backupRestoreService');
const logger = require('../config/logger');

const BACKUP_ENABLED = process.env.AUTO_BACKUP_ENABLED === 'true';
const BACKUP_CRON = process.env.AUTO_BACKUP_CRON || '0 2 * * *';
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);
const BACKUP_MAX_COUNT = parseInt(process.env.BACKUP_MAX_COUNT || '7', 10);

let intervalHandle = null;

function parseCron(cron) {
  const parts = cron.split(' ');
  if (parts.length !== 5) return null;
  const [, minute, hour] = parts;
  return { minute: parseInt(minute), hour: parseInt(hour) };
}

function shouldRunNow(cron) {
  const parsed = parseCron(cron);
  if (!parsed) return false;
  
  const now = new Date();
  return now.getMinutes() === parsed.minute && now.getHours() === parsed.hour;
}

async function runScheduledBackup() {
  logger.info('[AutoBackup] Running scheduled backup...');
  
  const result = await backupService.createBackup({ compression: true });
  if (result.success) {
    logger.info('[AutoBackup] Backup created:', result.backupPath);
    
    await cleanupOldBackups();
    return result;
  }
  
  logger.error('[AutoBackup] Failed:', result.error);
  return result;
}

async function cleanupOldBackups() {
  const backupService = require('./backupRestoreService');
  const backups = await backupService.listBackups();
  
  if (backups.length <= BACKUP_MAX_COUNT) {
    return { cleaned: 0 };
  }
  
  const toDelete = backups.slice(BACKUP_MAX_COUNT);
  let cleaned = 0;
  
  for (const backup of toDelete) {
    try {
      require('fs').unlinkSync(backup.path);
      cleaned++;
    } catch (e) {
      logger.warn('[AutoBackup] Could not delete:', backup.path);
    }
  }
  
  logger.info(`[AutoBackup] Cleaned ${cleaned} old backups`);
  return { cleaned };
}

function startScheduler() {
  if (!BACKUP_ENABLED) {
    logger.info('[AutoBackup] Disabled (AUTO_BACKUP_ENABLED not set)');
    return;
  }
  
  logger.info(`[AutoBackup] Starting scheduler with cron: ${BACKUP_CRON}`);
  
  intervalHandle = setInterval(() => {
    if (shouldRunNow(BACKUP_CRON)) {
      runScheduledBackup().catch(err => {
        logger.error('[AutoBackup] Scheduler error:', err);
      });
    }
  }, 60000);
  
  logger.info('[AutoBackup] Scheduler started');
}

function stopScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info('[AutoBackup] Scheduler stopped');
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  runScheduledBackup,
  cleanupOldBackups,
  shouldRunNow,
  BACKUP_CRON,
  BACKUP_RETENTION_DAYS,
  BACKUP_MAX_COUNT
};