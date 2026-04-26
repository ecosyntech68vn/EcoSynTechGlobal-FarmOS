const axios = require('axios');
const logger = require('../config/logger');
const { getBreaker } = require('./circuitBreaker');
const fs = require('fs');
const path = require('path');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const MESSAGE_QUEUE_PATH = path.join(__dirname, '..', 'data', 'telegram_queue.json');

const ALERT_TEMPLATE = {
  critical: '🔴 CRITICAL',
  high: '🟠 HIGH',
  medium: '🟡 MEDIUM',
  low: '🔵 LOW',
  info: 'ℹ️ INFO'
};

const telegramBreaker = getBreaker('telegram', { 
  failureThreshold: 5, 
  timeout: 60000 
});

function ensureQueueFile() {
  try {
    const dir = path.dirname(MESSAGE_QUEUE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(MESSAGE_QUEUE_PATH)) {
      fs.writeFileSync(MESSAGE_QUEUE_PATH, '[]');
    }
  } catch (e) {
    logger.warn('[Telegram] Queue init error:', e.message);
  }
}

function loadQueue() {
  try {
    ensureQueueFile();
    return JSON.parse(fs.readFileSync(MESSAGE_QUEUE_PATH, 'utf8') || '[]');
  } catch (e) { return []; }
}

function saveQueue(queue) {
  try {
    fs.writeFileSync(MESSAGE_QUEUE_PATH, JSON.stringify(queue, null, 2));
  } catch (e) {
    logger.warn('[Telegram] Queue save error:', e.message);
  }
}

function enqueueMessage(message) {
  const queue = loadQueue();
  queue.push({
    id: 'TG-' + Date.now(),
    message,
    enqueuedAt: new Date().toISOString()
  });
  saveQueue(queue);
  logger.info('[Telegram] Message queued for later delivery');
}

async function processQueue() {
  const queue = loadQueue();
  if (!queue.length) return;
  
  const remaining = [];
  for (const item of queue) {
    const result = await sendTelegramMessageDirect(item.message);
    if (result.success) {
      logger.debug('[Telegram] Queued message sent');
    } else {
      remaining.push(item);
    }
  }
  saveQueue(remaining);
  
  if (remaining.length < queue.length) {
    logger.info(`[Telegram] Sent ${queue.length - remaining.length} queued messages`);
  }
}

async function sendTelegramMessageDirect(message, parseMode = 'Markdown') {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { success: false, error: 'Telegram not configured' };
  }

  try {
    const response = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: parseMode,
        disable_web_page_preview: true
      },
      { timeout: 10000 }
    );

    return { success: true, messageId: response.data.result.message_id };
  } catch (error) {
    logger.error('[Telegram] Send error:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendTelegramMessage(message, parseMode = 'Markdown') {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    logger.warn('[Telegram] Bot not configured - queuing message');
    enqueueMessage(message);
    return { success: false, error: 'Telegram not configured', queued: true };
  }

  try {
    return await telegramBreaker.execute(async () => {
      return await sendTelegramMessageDirect(message, parseMode);
    });
  } catch (error) {
    logger.warn(`[Telegram] Circuit open - queuing message: ${error.message}`);
    enqueueMessage(message);
    return { success: false, error: error.message, queued: true };
  }
}

async function sendAlert(type, title, message, details = {}) {
  const emoji = ALERT_TEMPLATE[type] || ALERT_TEMPLATE.info;
  
  const formattedMessage = [
    `${emoji} *EcoSynTech Alert*`,
    '',
    `*${title}*`,
    message,
    ''
  ].join('\n');

  if (Object.keys(details).length > 0) {
    const detailsText = Object.entries(details)
      .map(([k, v]) => `• ${k}: \`${v}\``)
      .join('\n');
    formattedMessage += '\n' + detailsText;
  }

  return sendTelegramMessage(formattedMessage);
}

async function sendDeviceStatus(device) {
  const status = device.status === 'online' ? '🟢 Online' : '🔴 Offline';
  
  return sendTelegramMessage(
    `📡 *Device Status* ${status}`,
    'HTML',
    `<b>${device.name}</b>\n` +
    `ID: ${device.id}\n` +
    `Last seen: ${device.last_seen || 'Unknown'}`
  );
}

async function sendSensorAlert(sensor, value, threshold) {
  return sendAlert(
    'medium',
    'Sensor Alert',
    `*${sensor.type}* exceeded threshold`,
    {
      Device: sensor.device_id,
      Value: `${value}${sensor.unit || ''}`,
      Threshold: threshold,
      Time: new Date().toISOString()
    }
  );
}

async function sendSystemIssue(issue) {
  return sendAlert(
    issue.severity || 'high',
    issue.title,
    issue.description,
    {
      'Farm ID': issue.farmId || 'N/A',
      'Device': issue.deviceId || 'N/A',
      'Time': issue.timestamp || new Date().toISOString()
    }
  );
}

async function sendDailyReport(report) {
  const lines = [
    '📊 *Daily Report*',
    '',
    `*Farms:* ${report.farms || 0}`,
    `*Devices:* ${report.devices || 0}`,
    `*Alerts:* ${report.alerts || 0}`,
    `*Water Usage:* ${report.waterUsage || 0}L`,
    ''
  ].join('\n');
  
  return sendTelegramMessage(lines);
}

async function sendIrrigationSummary(farmId, summary) {
  const lines = [
    '💧 *Irrigation Summary*',
    '',
    `*Farm:* ${farmId}`,
    `*Total Duration:* ${summary.totalMinutes || 0} min`,
    `*Water Used:* ${summary.waterUsed || 0}L`,
    `*Sessions:* ${summary.sessions || 0}`,
    ''
  ].join('\n');
  
  return sendTelegramMessage(lines);
}

function getCircuitBreakerStatus() {
  return telegramBreaker.getState();
}

function getQueueStatus() {
  return {
    queued: loadQueue().length,
    path: MESSAGE_QUEUE_PATH
  };
}

module.exports = {
  sendTelegramMessage,
  sendAlert,
  sendDeviceStatus,
  sendSensorAlert,
  sendSystemIssue,
  sendDailyReport,
  sendIrrigationSummary,
  processQueue,
  getCircuitBreakerStatus,
  getQueueStatus
};