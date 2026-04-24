const logger = require('../config/logger');
const telegramService = require('./telegramService');

const ALERT_LEVELS = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

function formatAlertMessage(level, title, details) {
  const icons = {
    critical: '🔴',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  const icon = icons[level] || 'ℹ️';

  let message = `*${icon} EcoSynTech Alert: ${title}*\n`;
  message += `Level: \`${level.toUpperCase()}\`\n`;
  message += `Time: \`${new Date().toISOString()}\`\n\n`;

  if (details) {
    message += `Details:\n\`\`\`\n${typeof details === 'string' ? details : JSON.stringify(details, null, 2)}\n\`\`\``;
  }

  return message;
}

async function alert(level, title, details) {
  if (level === ALERT_LEVELS.INFO) {
    logger.info(title, details);
    return;
  }

  const message = formatAlertMessage(level, title, details);
  logger.warn(`${title}: ${JSON.stringify(details)}`);

  if (level === ALERT_LEVELS.CRITICAL || level === ALERT_LEVELS.ERROR) {
    return await telegramService.sendTelegramMessage(message);
  }
  
  return { success: false, error: 'Below threshold' };
}

async function notifyError(error, context = {}) {
  const isCritical = error.message?.includes('database') ||
    error.message?.includes('connection') ||
    error.message?.includes('MQTT');

  const level = isCritical ? ALERT_LEVELS.CRITICAL : ALERT_LEVELS.ERROR;
  const details = {
    message: error.message,
    stack: error.stack,
    ...context
  };

  return alert(level, error.name || 'Error', details);
}

async function notifySecurity(event) {
  return alert(
    ALERT_LEVELS.CRITICAL,
    'Security Event',
    event
  );
}

async function notifyDeviceOffline(deviceId, lastSeen) {
  return alert(
    ALERT_LEVELS.WARNING,
    'Device Offline',
    { deviceId, lastSeen }
  );
}

async function notifySensorThreshold(sensorType, value, threshold, deviceId) {
  return alert(
    ALERT_LEVELS.WARNING,
    'Sensor Threshold Exceeded',
    { sensorType, value, threshold, deviceId }
  );
}

async function notifyIrrigationComplete(farmId, duration, waterUsed) {
  return alert(
    ALERT_LEVELS.INFO,
    'Irrigation Complete',
    { farmId, duration, waterUsed }
  );
}

async function notifySystemStartup() {
  return alert(
    ALERT_LEVELS.INFO,
    'System Started',
    { timestamp: new Date().toISOString(), version: require('../../package.json').version }
  );
}

module.exports = {
  alert,
  notifyError,
  notifySecurity,
  notifyDeviceOffline,
  notifySensorThreshold,
  notifyIrrigationComplete,
  notifySystemStartup,
  ALERT_LEVELS
};