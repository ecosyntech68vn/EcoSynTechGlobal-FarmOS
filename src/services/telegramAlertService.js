const axios = require('axios');
const logger = require('../config/logger');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const ALERT_LEVELS = {
  CRITICAL: 'critical',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

async function sendTelegramMessage(message, parseMode = 'Markdown') {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    logger.debug('[Telegram] Bot token or chat ID not configured');
    return false;
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: parseMode
      },
      { timeout: 10000 }
    );
    return response.data.ok;
  } catch (error) {
    logger.error('[Telegram] Failed to send message:', error.message);
    return false;
  }
}

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
    return await sendTelegramMessage(message);
  }
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

  return await alert(level, 'System Error', details);
}

async function notifyDatabaseLock() {
  return await alert(
    ALERT_LEVELS.CRITICAL,
    'Database Locked',
    'Database is locked or inaccessible'
  );
}

async function notifyMqttDisconnect() {
  return await alert(
    ALERT_LEVELS.CRITICAL,
    'MQTT Disconnected',
    'Lost connection to MQTT broker'
  );
}

async function notifyStartup() {
  return await alert(
    ALERT_LEVELS.INFO,
    'Server Started',
    `EcoSynTech v${require('../../package.json').version} started successfully`
  );
}

module.exports = {
  ALERT_LEVELS,
  alert,
  notifyError,
  notifyDatabaseLock,
  notifyMqttDisconnect,
  notifyStartup,
  sendTelegramMessage
};