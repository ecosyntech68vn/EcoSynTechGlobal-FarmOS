const backupService = require('./backupRestoreService');
const logger = require('../config/logger');
const fs = require('fs');
const path = require('path');

const BACKUP_ENABLED = process.env.AUTO_BACKUP_ENABLED === 'true';
const BACKUP_CRON = process.env.AUTO_BACKUP_CRON || '0 2 * * *';
const BACKUP_RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);
const BACKUP_MAX_COUNT = parseInt(process.env.BACKUP_MAX_COUNT || '7', 10);
const MIN_DISK_SPACE_MB = 100;

let intervalHandle = null;

function checkDiskSpace(dir) {
  try {
    const stat = fs.statfsSync(dir);
    const freeMB = (stat.bsize * stat.blocks) / 1024 / 1024;
    return freeMB >= MIN_DISK_SPACE_MB;
  } catch (e) {
    logger.warn('[AutoBackup] Cannot check disk space:', e.message);
    return true;
  }
}

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
  
  const backDir = process.env.BACKUP_DIR || './backups';
  if (!checkDiskSpace(backDir)) {
    logger.error('[AutoBackup] Low disk space, skipping backup');
    return { success: false, error: 'Low disk space' };
  }
  
  try {
    const result = await backupService.createBackup({ compression: true });
    if (result.success) {
      logger.info('[AutoBackup] Backup created:', result.backupPath);
      
      const verifyResult = await backupService.verifyBackup(result.backupPath);
      if (!verifyResult.valid) {
        logger.error('[AutoBackup] Backup verification FAILED:', verifyResult.error);
        return { success: false, error: 'Backup verification failed', verifyResult };
      }
      logger.info('[AutoBackup] Backup verified successfully');
      
      await cleanupOldBackups();
      
      return { success: true, backupPath: result.backupPath, verified: true };
    } else {
      logger.error('[AutoBackup] Failed:', result.error);
    }
    return result;
  } catch (err) {
    logger.error('[AutoBackup] Error:', err.message);
    return { success: false, error: err.message };
  }
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