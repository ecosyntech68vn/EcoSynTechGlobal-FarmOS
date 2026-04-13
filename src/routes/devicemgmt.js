const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/ota/firmwares', authenticate, asyncHandler(async (req, res) => {
  const firmwares = getAll('SELECT * FROM device_firmwares ORDER BY created_at DESC');
  res.json({ success: true, firmwares });
}));

router.post('/ota/firmwares', authenticate, asyncHandler(async (req, res) => {
  const { version, description, device_type, file_url, checksum } = req.body;
  const id = uuidv4();
  
  runQuery(
    'INSERT INTO device_firmwares (id, version, description, device_type, file_url, checksum) VALUES (?, ?, ?, ?, ?, ?)',
    [id, version, description, device_type, file_url, checksum]
  );
  
  res.json({ success: true, id, message: 'Firmware uploaded successfully' });
}));

router.get('/ota/devices/:deviceId', authenticate, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const device = getOne('SELECT * FROM devices WHERE id = ?', [deviceId]);
  
  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }
  
  const latestFirmware = getOne(
    'SELECT * FROM device_firmwares WHERE device_type = ? ORDER BY created_at DESC LIMIT 1',
    [device.type]
  );
  
  res.json({ success: true, device, latestFirmware });
}));

router.post('/ota/deploy', authenticate, asyncHandler(async (req, res) => {
  const { deviceIds, firmwareId } = req.body;
  const firmware = getOne('SELECT * FROM device_firmwares WHERE id = ?', [firmwareId]);
  
  if (!firmware) {
    return res.status(404).json({ success: false, error: 'Firmware not found' });
  }
  
  deviceIds.forEach(deviceId => {
    runQuery(
      'INSERT INTO ota_updates (id, device_id, firmware_id, status, created_at) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), deviceId, firmwareId, 'pending', new Date().toISOString()]
    );
  });
  
  res.json({ success: true, message: `OTA update queued for ${deviceIds.length} devices` });
}));

router.get('/qr/provision', authenticate, asyncHandler(async (req, res) => {
  const QRCode = require('qrcode');
  
  const { deviceName, deviceType, zone } = req.query;
  const deviceId = uuidv4();
  
  const provisioningData = JSON.stringify({
    action: 'provision',
    deviceId,
    deviceName,
    deviceType,
    zone,
    serverUrl: process.env.SERVER_URL || 'http://localhost:3000'
  });
  
  const qrCodeImage = await QRCode.toDataURL(provisioningData);
  
  res.json({ success: true, qrCode: qrCodeImage, deviceId });
}));

router.post('/qr/activate', asyncHandler(async (req, res) => {
  const { deviceId, deviceName, deviceType, zone } = req.body;
  
  const existing = getOne('SELECT id FROM devices WHERE id = ?', [deviceId]);
  if (existing) {
    return res.json({ success: true, message: 'Device already registered' });
  }
  
  runQuery(
    'INSERT INTO devices (id, name, type, zone, status, config, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [deviceId, deviceName, deviceType, zone, 'online', '{}', new Date().toISOString()]
  );
  
  const apiKey = uuidv4();
  runQuery(
    'INSERT INTO api_keys (id, key, device_id, name, permissions, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), apiKey, deviceId, `${deviceName}-key`, JSON.stringify(['read', 'write']), new Date().toISOString()]
  );
  
  res.json({ success: true, apiKey, message: 'Device activated successfully' });
}));

router.get('/:id/config', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const device = getOne('SELECT * FROM devices WHERE id = ?', [id]);
  
  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }
  
  const configHistory = getAll(
    'SELECT * FROM device_config_history WHERE device_id = ? ORDER BY created_at DESC LIMIT 10',
    [id]
  );
  
  res.json({ success: true, config: JSON.parse(device.config || '{}'), history: configHistory });
}));

router.put('/:id/config', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const newConfig = req.body;
  
  const device = getOne('SELECT * FROM devices WHERE id = ?', [id]);
  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }
  
  const oldConfig = JSON.parse(device.config || '{}');
  
  runQuery(
    'INSERT INTO device_config_history (id, device_id, old_config, new_config, changed_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), id, JSON.stringify(oldConfig), JSON.stringify(newConfig), req.user?.id || 'system', new Date().toISOString()]
  );
  
  runQuery('UPDATE devices SET config = ?, updated_at = ? WHERE id = ?', 
    [JSON.stringify(newConfig), new Date().toISOString(), id]
  );
  
  res.json({ success: true, message: 'Configuration updated successfully' });
}));

router.post('/:id/remote-command', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { command, params } = req.body;
  
  const device = getOne('SELECT * FROM devices WHERE id = ?', [id]);
  if (!device) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }
  
  const commandId = uuidv4();
  runQuery(
    'INSERT INTO commands (id, device_id, command, params, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [commandId, id, command, JSON.stringify(params || {}), 'pending', new Date().toISOString()]
  );
  
  res.json({ success: true, commandId, message: 'Command sent to device' });
}));

router.get('/:id/logs', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 50 } = req.query;
  
  const commands = getAll(
    'SELECT * FROM commands WHERE device_id = ? ORDER BY created_at DESC LIMIT ?',
    [id, limit]
  );
  
  const configHistory = getAll(
    'SELECT * FROM device_config_history WHERE device_id = ? ORDER BY created_at DESC LIMIT ?',
    [id, limit]
  );
  
  res.json({ success: true, commands, configHistory });
}));

module.exports = router;