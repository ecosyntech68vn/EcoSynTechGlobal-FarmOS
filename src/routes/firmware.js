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

const NONCE_WINDOW_SEC = 1200;
const seenNonces = new Map();

function cleanupSeenNonces() {
  const now = Date.now();
  for (const [key, ts] of seenNonces.entries()) {
    if (now - ts > NONCE_WINDOW_SEC * 1000) seenNonces.delete(key);
  }
}

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

function hmacHex(message) {
  return crypto.createHmac('sha256', HMAC_SECRET).update(message).digest('hex');
}

function timingSafeEqualHex(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

function normalizeReading(r) {
  if (!r || typeof r !== 'object') return null;

  const sensorType = String(r.sensor_type || r.type || '').trim();
  const value = Number(r.value);

  if (!sensorType || Number.isNaN(value)) return null;

  return {
    sensor_type: sensorType,
    value,
    unit: String(r.unit || ''),
    sensor_id: String(r.sensor_id || r.id || ''),
    zone: String(r.zone || ''),
    event_ts: String(r.event_ts || r.timestamp || new Date().toISOString()),
    local_time: String(r.local_time || '')
  };
}

function normalizeReadings(payload) {
  const raw = Array.isArray(payload.readings)
    ? payload.readings
    : (Array.isArray(payload.sensor_data) ? payload.sensor_data : []);

  return raw.map(normalizeReading).filter(Boolean);
}

function verifyFirmwareEnvelope(payload, signature, deviceId, timestamp, nonce) {
  const ts = Number(timestamp || payload?._ts || 0);
  const did = String(deviceId || payload?._did || payload?.device_id || '');

  if (!payload || typeof payload !== 'object') return { valid: false, error: 'Invalid payload' };
  if (!signature) return { valid: false, error: 'Missing signature' };
  if (!did) return { valid: false, error: 'Missing device id' };
  if (!ts) return { valid: false, error: 'Missing timestamp' };
  if (!payload._nonce) return { valid: false, error: 'Missing nonce' };
  if (!payload._did) return { valid: false, error: 'Missing payload device id' };
  if (payload._did !== did) return { valid: false, error: 'Device id mismatch' };

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > NONCE_WINDOW_SEC) {
    return { valid: false, error: 'Timestamp expired' };
  }

  cleanupSeenNonces();
  const nonceKey = `${did}:${payload._nonce}`;
  if (seenNonces.has(nonceKey)) {
    return { valid: false, error: 'Replay detected' };
  }

  const expected = hmacHex(canonicalStringify(payload));
  if (!timingSafeEqualHex(signature, expected)) {
    return { valid: false, error: 'Invalid signature' };
  }

  seenNonces.set(nonceKey, Date.now());
  return { valid: true };
}

function signResponsePayload(payload) {
  return {
    payload,
    signature: hmacHex(canonicalStringify(payload))
  };
}

function getPendingCommandsPayload(deviceId) {
  const pendingCommands = getAll(
    'SELECT * FROM commands WHERE device_id = ? AND status = "pending" ORDER BY created_at ASC LIMIT 10',
    [deviceId]
  );

  const commands = pendingCommands.map(cmd => ({
    command: cmd.command,
    command_id: cmd.id,
    params: JSON.parse(cmd.params || '{}')
  }));

  pendingCommands.forEach(cmd => {
    runQuery('UPDATE commands SET status = "sent" WHERE id = ?', [cmd.id]);
  });

  return commands;
}

function upsertDeviceOnline(deviceId, fwVersion) {
  const device = getOne('SELECT * FROM devices WHERE id = ?', [deviceId]);

  if (!device) {
    runQuery(
      'INSERT INTO devices (id, name, type, zone, status, config, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [deviceId, `Device-${deviceId.substring(0, 8)}`, 'esp32', 'default', 'online', JSON.stringify({ firmware_version: fwVersion || '8.5.0' }), new Date().toISOString()]
    );
  } else {
    runQuery(
      'UPDATE devices SET status = ?, last_seen = ? WHERE id = ?',
      ['online', new Date().toISOString(), deviceId]
    );
  }
}

function canonicalStringifyOld(obj) {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj !== 'object') return String(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringifyOld).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => `"${k}":${canonicalStringifyOld(obj[k])}`);
  return '{' + pairs.join(',') + '}';
}

function verifySignature(payload, signature, timestamp) {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > TIMEOUT_WINDOW / 1000) {
    return { valid: false, error: 'Timestamp expired' };
  }
  
  const canonical = canonicalStringifyOld(payload);
  const expectedSig = crypto.createHmac('sha256', HMAC_SECRET).update(canonical).digest('hex');
  
  return { valid: signature === expectedSig, error: signature !== expectedSig ? 'Invalid signature' : null };
}

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body || {};

    // Firmware hiện tại gửi body dạng { payload, signature }
    // nhưng vẫn cho phép fallback nếu ai đó post raw payload.
    const payload = (body.payload && typeof body.payload === 'object') ? body.payload : body;
    const signature = String(body.signature || req.get('x-ecoSynTech-signature') || req.get('x-signature') || '');
    const deviceId = String(
      body._did ||
      payload._did ||
      req.get('x-device-id') ||
      payload.device_id ||
      ''
    );
    const fwVersion = String(req.get('x-fw-version') || payload.fw_version || '8.5.0');
    const timestamp = body._ts || payload._ts || req.get('x-timestamp') || 0;
    const nonce = payload._nonce || body._nonce || '';

    if (!signature || !deviceId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const verification = verifyFirmwareEnvelope(payload, signature, deviceId, timestamp, nonce);
    if (!verification.valid) {
      logger.warn(`[Firmware] Auth failed: ${verification.error} for device ${deviceId}`);
      return res.status(401).json({ error: verification.error });
    }

    upsertDeviceOnline(deviceId, fwVersion);

    const responsePayload = {
      ok: true,
      device_id: deviceId,
      fw_version: fwVersion,
      server_ts: new Date().toISOString()
    };

    // 1) Sensor data
    const readings = normalizeReadings(payload);
    if (readings.length > 0) {
      const processResult = await processFirmwareData(readings, deviceId, payload);
      responsePayload.processed = processResult;
    }

    // 2) Commands
    if (payload.get_commands) {
      responsePayload.commands = getPendingCommandsPayload(deviceId);
    }

    // 3) Config
    if (payload.get_config) {
      responsePayload.config = {
        post_interval_sec: 600,
        sensor_interval_sec: 600,
        deep_sleep_enabled: true,
        version: fwVersion,
        server_url: process.env.API_BASE_URL || 'http://localhost:3000'
      };
      responsePayload.config_version = 6;
    }

    return res.json(signResponsePayload(responsePayload));
  } catch (err) {
    logger.error('[FirmwareWebhook] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

async function processFirmwareData(readings, deviceId, payload) {
  const timestamp = payload?._ts
    ? new Date(Number(payload._ts) * 1000).toISOString()
    : new Date().toISOString();

  readings.forEach(sensor => {
    runQuery(
      'INSERT INTO sensor_readings (id, sensor_type, value, timestamp) VALUES (?, ?, ?, ?)',
      [uuidv4(), sensor.sensor_type, sensor.value, timestamp]
    );

    const existing = getOne('SELECT id FROM sensors WHERE type = ?', [sensor.sensor_type]);
    if (existing) {
      runQuery(
        'UPDATE sensors SET value = ?, timestamp = ? WHERE type = ?',
        [sensor.value, timestamp, sensor.sensor_type]
      );
    } else {
      runQuery(
        'INSERT INTO sensors (id, type, value, unit, timestamp) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), sensor.sensor_type, sensor.value, sensor.unit || 'unit', timestamp]
      );
    }
  });

  // Nếu engine của bạn đang dùng { type, value }, convert alias trước khi analyze
  const advisoryInput = readings.map(r => ({
    type: r.sensor_type,
    value: r.value,
    unit: r.unit,
    timestamp
  }));

  const advisory = AdvisoryEngine.analyzeLatestReadings(advisoryInput);

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

  return {
    sensors: readings.length,
    alerts: advisory.alerts.length
  };
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

// ACK endpoint for command lifecycle (queued → sent → done)
router.post('/devices/:deviceId/ack', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { command_id, status = 'done', note = '' } = req.body || {};

    if (!command_id) {
      return res.status(400).json({ error: 'Missing command_id' });
    }

    const cmd = getOne('SELECT * FROM commands WHERE id = ? AND device_id = ?', [command_id, deviceId]);
    if (!cmd) {
      return res.status(404).json({ error: 'Command not found' });
    }

    runQuery(
      'UPDATE commands SET status = ?, executed_at = ?, note = ? WHERE id = ?',
      [status, new Date().toISOString(), note, command_id]
    );

    return res.json(signResponsePayload({
      ok: true,
      command_id,
      device_id: deviceId,
      status
    }));
  } catch (err) {
    logger.error('[FirmwareAck] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;