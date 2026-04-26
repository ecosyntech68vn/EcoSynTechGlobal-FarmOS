const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { runQuery, getOne, getAll } = require('../config/database');
const logger = require('../config/logger');

const HMAC_SECRET = process.env.HMAC_SECRET || 'CEOTAQUANGTHUAN_TADUYANH_CTYTNHHDUYANH_ECOSYNTECH_2026';

function computeHmacSha256(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
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

function verifySignature(payload, signature, secret) {
  const canonical = canonicalStringify(payload);
  const expected = computeHmacSha256(canonical, secret);
  return signature === expected;
}

// POST /api/webhook/esp32 - Nhận data từ ESP32 V8.5.0
router.post('/esp32', async (req, res) => {
  try {
    const { payload, signature } = req.body;
    
    if (!payload || !signature) {
      return res.status(400).json({ error: 'Missing payload or signature' });
    }

    // Verify HMAC signature
    if (!verifySignature(payload, signature, HMAC_SECRET)) {
      logger.warn('[Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { device_id, fw_version, readings, timestamp, _nonce, _ts } = payload;

    if (!device_id) {
      return res.status(400).json({ error: 'Missing device_id' });
    }

    logger.info(`[Webhook] Data from ${device_id} (FW: ${fw_version})`);

    // Update or create device
    const existingDevice = getOne('SELECT * FROM devices WHERE id = ?', [device_id]);
    if (!existingDevice) {
      runQuery(
        'INSERT INTO devices (id, name, type, zone, status, config, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [device_id, `EcoSynTech-${device_id}`, 'ESP32', 'default', 'online', '{}', new Date().toISOString()]
      );
    } else {
      runQuery(
        'UPDATE devices SET status = ?, last_seen = ? WHERE id = ?',
        ['online', new Date().toISOString(), device_id]
      );
    }

    // Process sensor readings
    if (readings && Array.isArray(readings)) {
      for (const reading of readings) {
        const { sensor, value, unit } = reading;
        
        if (sensor && value !== undefined) {
          // Update or insert sensor reading
          const existingSensor = getOne('SELECT * FROM sensors WHERE type = ? AND sensor_id = ?', [sensor, device_id]);
          if (existingSensor) {
            runQuery(
              'UPDATE sensors SET value = ?, unit = ?, timestamp = ? WHERE type = ? AND sensor_id = ?',
              [value, unit || '', new Date().toISOString(), sensor, device_id]
            );
          } else {
            runQuery(
              'INSERT INTO sensors (id, type, value, unit, sensor_id) VALUES (?, ?, ?, ?, ?)',
              [`${device_id}-${sensor}`, sensor, value, unit || '', device_id]
            );
          }
          
          logger.info(`[Webhook] ${sensor}=${value}${unit || ''} from ${device_id}`);
        }
      }
    }

    res.json({
      status: 'ok',
      received: { device_id, readings_count: readings?.length || 0 },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    logger.error('[Webhook] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/webhook/batch - Nhận batch info từ ESP32
router.post('/batch', async (req, res) => {
  try {
    const { payload, signature } = req.body;
    
    if (!payload || !signature) {
      return res.status(400).json({ error: 'Missing payload or signature' });
    }

    if (!verifySignature(payload, signature, HMAC_SECRET)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { device_id, batches, config, rules } = payload;

    logger.info(`[Webhook] Batch config from ${device_id}`);

    // Return server-side configuration
    const response = {
      payload: {
        batches: getBatchesForDevice(device_id),
        config: {
          rules: getRulesForDevice(device_id),
          settings: {
            post_interval_sec: 3600,
            sensor_interval_sec: 60,
            deep_sleep_enabled: false
          }
        },
        _nonce: crypto.randomBytes(16).toString('hex'),
        _ts: Math.floor(Date.now() / 1000),
        _did: device_id
      }
    };

    // Compute signature for response
    const canonical = canonicalStringify(response.payload);
    response.signature = computeHmacSha256(canonical, HMAC_SECRET);

    res.json(response);

  } catch (err) {
    logger.error('[Webhook] Batch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/webhook/command - Gửi command tới ESP32
router.post('/command', async (req, res) => {
  try {
    const { device_id, command, params, command_id } = req.body;
    
    if (!device_id || !command) {
      return res.status(400).json({ error: 'Missing device_id or command' });
    }

    const commandId = command_id || `cmd-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // Store command for ESP32 to fetch
    runQuery(
      'INSERT INTO commands (id, device_id, command, params, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [commandId, device_id, command, JSON.stringify(params || {}), 'pending', new Date().toISOString()]
    );

    logger.info(`[Webhook] Command ${command} queued for ${device_id}`);

    res.json({
      status: 'ok',
      command_id: commandId,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    logger.error('[Webhook] Command error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/webhook/command/:deviceId - ESP32 fetch pending commands
router.get('/command/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { api_key } = req.query;

    if (!api_key || api_key !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const pendingCommands = getAll(
      'SELECT * FROM commands WHERE device_id = ? AND status = \'pending\' ORDER BY created_at ASC LIMIT 10',
      [deviceId]
    );

    // Mark as delivered
    for (const cmd of pendingCommands) {
      runQuery('UPDATE commands SET status = \'delivered\' WHERE id = ?', [cmd.id]);
    }

    const response = {
      payload: {
        commands: pendingCommands.map(c => ({
          command: c.command,
          command_id: c.id,
          params: JSON.parse(c.params || '{}')
        })),
        _nonce: crypto.randomBytes(16).toString('hex'),
        _ts: Math.floor(Date.now() / 1000),
        _did: deviceId
      }
    };

    const canonical = canonicalStringify(response.payload);
    response.signature = computeHmacSha256(canonical, HMAC_SECRET);

    res.json(response);

  } catch (err) {
    logger.error('[Webhook] Fetch commands error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/webhook/command-result - ESP32 report command result
router.post('/command-result', async (req, res) => {
  try {
    const { payload, signature } = req.body;
    
    if (!verifySignature(payload, signature, HMAC_SECRET)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { device_id, command_id, status, note } = payload;

    if (command_id) {
      runQuery(
        'UPDATE commands SET status = ?, note = ?, completed_at = ? WHERE id = ?',
        [status || 'completed', note || '', new Date().toISOString(), command_id]
      );
    }

    res.json({ status: 'ok' });

  } catch (err) {
    logger.error('[Webhook] Command result error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getBatchesForDevice(deviceId) {
  return getAll(
    'SELECT * FROM batches WHERE device_id = ? AND (status = \'active\' OR force_send = 1)',
    [deviceId]
  );
}

function getRulesForDevice(deviceId) {
  return getAll(
    'SELECT * FROM rules WHERE device_id = ? AND enabled = 1',
    [deviceId]
  );
}

module.exports = router;
