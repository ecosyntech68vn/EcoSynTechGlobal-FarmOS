const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { getAll, getOne, runQuery } = require('../config/database');
const logger = require('../config/logger');
const { hmacAuth } = require('../middleware/auth');
const { AdvisoryEngine, SmartControlEngine, sendTelegramNotification } = require('../modules/iot-engine');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const HMAC_SECRET = process.env.HMAC_SECRET || 'CEOTAQUANGTHUAN_TADUYANH_CTYTNHHDUYANH_ECOSYNTECH_2026';
const TIMEOUT_WINDOW = 300000;

function canonicalStringify(obj) {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return String(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => `"${k}":${canonicalStringify(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

function verifySignature(payload, signature, timestamp) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > TIMEOUT_WINDOW / 1000) {
    return { valid: false, error: 'Timestamp expired' };
  }
  
  const canonical = canonicalStringify(payload);
  const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(canonical).digest('hex');
  
  return { valid: signature === expectedSig, error: signature !== expectedSig ? 'Invalid signature' : null };
}

router.post('/webhook', async (req, res) => {
  try {
    const { payload, signature, _ts, _did } = req.body;
    
    if (!payload || !signature || !_ts) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const verification = verifySignature(payload, signature, _ts);
    if (!verification.valid) {
      logger.warn(`[Firmware] Auth failed: ${verification.error} for device ${_did}`);
      return res.status(401).json({ error: verification.error });
    }

    const device = getOne('SELECT * FROM devices WHERE id = ?', [_did]);
    if (!device) {
      runQuery(
        'INSERT INTO devices (id, name, type, zone, status, config, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [_did, `Device-${_did.substring(0, 8)}`, 'esp32', 'default', 'online', '{}', new Date().toISOString()]
      );
    } else {
      runQuery('UPDATE devices SET status = ?, last_seen = ? WHERE id = ?', ['online', new Date().toISOString(), _did]);
    }

    const response = { success: true };

    if (payload.sensor_data && Array.isArray(payload.sensor_data)) {
      const processResult = await processFirmwareData(payload, _did);
      response.processed = processResult;
    }

    if (payload.get_commands) {
      const pendingCommands = getAll(
        'SELECT * FROM commands WHERE device_id = ? AND status = "pending" ORDER BY created_at ASC LIMIT 10',
        [_did]
      );
      
      if (pendingCommands.length > 0) {
        response.commands = pendingCommands.map(cmd => ({
          command: cmd.command,
          command_id: cmd.id,
          params: JSON.parse(cmd.params || '{}')
        }));
        
        pendingCommands.forEach(cmd => {
          runQuery('UPDATE commands SET status = "sent" WHERE id = ?', [cmd.id]);
        });
      }
    }

    if (payload.get_config) {
      const device = getOne('SELECT * FROM devices WHERE id = ?', [_did]);
      response.config = {
        post_interval_sec: 1800,
        sensor_interval_sec: 30,
        deep_sleep_enabled: true,
        version: '8.5.0',
        server_url: process.env.API_BASE_URL || 'http://localhost:3000'
      };
      response.config_version = 5;
    }

    res.json(response);
  } catch (err) {
    logger.error('[FirmwareWebhook] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function processFirmwareData(payload, deviceId) {
  const readings = payload.sensor_data || [];
  const batchId = payload.batch_id;
  const timestamp = payload._ts ? new Date(payload._ts * 1000).toISOString() : new Date().toISOString();

  readings.forEach(sensor => {
    runQuery(
      'INSERT INTO sensor_readings (id, sensor_type, value, timestamp) VALUES (?, ?, ?, ?)',
      [uuidv4(), sensor.type, sensor.value, timestamp]
    );
    
    const existing = getOne('SELECT id FROM sensors WHERE type = ?', [sensor.type]);
    if (existing) {
      runQuery('UPDATE sensors SET value = ?, timestamp = ? WHERE type = ?', [sensor.value, timestamp, sensor.type]);
    } else {
      runQuery('INSERT INTO sensors (id, type, value, unit, timestamp) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), sensor.type, sensor.value, 'unit', timestamp]);
    }
  });

  const advisory = AdvisoryEngine.analyzeLatestReadings(readings);
  
  advisory.alerts.forEach(alert => {
    runQuery(
      'INSERT INTO alerts (id, type, severity, sensor, value, message, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), alert.type, alert.level, alert.type, alert.value, alert.message, new Date().toISOString()]
    );
  });

  if (advisory.alerts.length > 0 && TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    const criticalAlerts = advisory.alerts.filter(a => a.level === 'critical');
    if (criticalAlerts.length > 0) {
      const alertText = criticalAlerts.map(a => `• ${a.type}: ${a.value} - ${a.message}`).join('\n');
      const msg = `<b>⚠️ Cảnh báo IoT</b>\n\n${alertText}\n\n<i>Thiết bị: ${deviceId}</i>`;
      sendTelegramNotification(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, msg);
    }
  }

  return { sensors: readings.length, alerts: advisory.alerts.length };
}

router.get('/devices/:deviceId/firmware', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = getOne('SELECT * FROM devices WHERE id = ?', [deviceId]);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const firmwares = getAll('SELECT * FROM device_firmwares ORDER BY created_at DESC');
    const latest = firmwares[0];

    res.json({
      success: true,
      device: { id: device.id, name: device.name, type: device.type },
      current_version: device.config ? JSON.parse(device.config).firmware_version : '8.5.0',
      latest_firmware: latest ? {
        version: latest.version,
        description: latest.description,
        url: latest.file_url,
        checksum: latest.checksum
      } : null
    });
  } catch (err) {
    logger.error('[Firmware] Get error:', err);
    res.status(500).json({ error: 'Failed to get firmware info' });
  }
});

router.post('/devices/:deviceId/command', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command, params, schedule } = req.body;

    const device = getOne('SELECT * FROM devices WHERE id = ?', [deviceId]);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const commandId = uuidv4();
    const status = schedule ? 'scheduled' : 'pending';

    runQuery(
      'INSERT INTO commands (id, device_id, command, params, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [commandId, deviceId, command, JSON.stringify(params || {}), status, new Date().toISOString()]
    );

    if (schedule) {
      runQuery(
        'INSERT INTO schedules (id, name, time, duration, zones, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [uuidv4(), `cmd_${commandId}`, schedule.time, schedule.duration || 60, JSON.stringify([deviceId]), 1, new Date().toISOString()]
      );
    }

    res.json({ success: true, command_id: commandId, status });
  } catch (err) {
    logger.error('[Firmware] Command error:', err);
    res.status(500).json({ error: 'Failed to queue command' });
  }
});

router.get('/devices/:deviceId/history', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { limit = 50 } = req.query;

    const commands = getAll(
      'SELECT * FROM commands WHERE device_id = ? ORDER BY created_at DESC LIMIT ?',
      [deviceId, limit]
    );

    const readings = getAll(
      'SELECT * FROM sensor_readings WHERE timestamp >= datetime("now", "-24 hours") ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );

    res.json({
      success: true,
      device_id: deviceId,
      commands,
      recent_readings: readings
    });
  } catch (err) {
    logger.error('[Firmware] History error:', err);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

router.post('/batch/:batchId/attach', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { deviceId } = req.body;

    const batch = getOne('SELECT * FROM traceability_batches WHERE batch_code = ?', [batchId]);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    runQuery('UPDATE devices SET zone = ? WHERE id = ?', [batchId, deviceId]);

    res.json({ success: true, message: `Device ${deviceId} attached to batch ${batchId}` });
  } catch (err) {
    logger.error('[Firmware] Batch attach error:', err);
    res.status(500).json({ error: 'Failed to attach device' });
  }
});

module.exports = router;