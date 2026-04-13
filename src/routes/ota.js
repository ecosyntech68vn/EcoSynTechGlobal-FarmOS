const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getAll, getOne, runQuery } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth: authenticate } = require('../middleware/auth');
const logger = require('../config/logger');

const OTA_CONFIG = {
  checkInterval: 7 * 24 * 60 * 60 * 1000,
  downloadTimeout: 300000,
  maxRetry: 3
};

router.get('/firmwares', authenticate, asyncHandler(async (req, res) => {
  const firmwares = getAll('SELECT * FROM device_firmwares ORDER BY created_at DESC');
  
  res.json({ success: true, firmwares });
}));

router.post('/firmwares', authenticate, asyncHandler(async (req, res) => {
  const { version, description, device_type, file_url, file_content, checksum, size } = req.body;
  
  if (!version || !file_url) {
    return res.status(400).json({ error: 'Version and file URL are required' });
  }
  
  const id = uuidv4();
  
  let computedChecksum = checksum;
  if (file_content && !checksum) {
    const crypto = require('crypto');
    computedChecksum = crypto.createHash('sha256').update(Buffer.from(file_content, 'base64')).digest('hex');
  }
  
  runQuery(
    `INSERT INTO device_firmwares (id, version, description, device_type, file_url, checksum, size, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, version, description || '', device_type || 'esp32', file_url, computedChecksum || '', size || 0, new Date().toISOString()]
  );
  
  logger.info(`[OTA] Firmware uploaded: v${version}`);
  
  res.json({ 
    success: true, 
    id, 
    version,
    checksum: computedChecksum,
    message: 'Firmware uploaded successfully' 
  });
}));

router.get('/firmwares/latest', authenticate, asyncHandler(async (req, res) => {
  const { device_type } = req.query;
  
  const query = device_type 
    ? 'SELECT * FROM device_firmwares WHERE device_type = ? ORDER BY created_at DESC LIMIT 1'
    : 'SELECT * FROM device_firmwares ORDER BY created_at DESC LIMIT 1';
  
  const params = device_type ? [device_type] : [];
  
  const latest = getOne(query, params);
  
  res.json({ success: true, firmware: latest });
}));

router.get('/firmwares/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const firmware = getOne('SELECT * FROM device_firmwares WHERE id = ?', [id]);
  
  if (!firmware) {
    return res.status(404).json({ error: 'Firmware not found' });
  }
  
  res.json({ success: true, firmware });
}));

router.delete('/firmwares/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  runQuery('DELETE FROM device_firmwares WHERE id = ?', [id]);
  
  logger.info(`[OTA] Firmware deleted: ${id}`);
  
  res.json({ success: true, message: 'Firmware deleted successfully' });
}));

router.get('/devices/:deviceId/ota-check', asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { current_version, api_key } = req.query;
  
  let device = null;
  if (api_key) {
    const keyRecord = getOne('SELECT * FROM api_keys WHERE key = ? AND (device_id = ? OR device_id IS NULL)', [api_key, deviceId]);
    if (keyRecord) {
      device = getOne('SELECT * FROM devices WHERE id = ?', [deviceId]);
    }
  }
  
  if (!device) {
    device = getOne('SELECT * FROM devices WHERE id = ?', [deviceId]);
  }
  
  if (!device) {
    return res.json({ 
      update_available: false, 
      version: current_version || '1.0.0',
      message: 'Device not registered'
    });
  }
  
  const deviceType = device.type || 'esp32';
  const latestFirmware = getOne(
    'SELECT * FROM device_firmwares WHERE device_type = ? ORDER BY created_at DESC LIMIT 1',
    [deviceType]
  );
  
  if (!latestFirmware) {
    return res.json({
      update_available: false,
      version: current_version || '1.0.0',
      message: 'No firmware available'
    });
  }
  
  const needsUpdate = !current_version || current_version !== latestFirmware.version;
  
  const response = {
    update_available: needsUpdate,
    version: latestFirmware.version,
    current_version: current_version || 'unknown',
    bin_url: latestFirmware.file_url,
    sha256: latestFirmware.checksum,
    size: latestFirmware.size,
    notes: needsUpdate ? `Update from ${current_version || 'unknown'} to ${latestFirmware.version}` : 'No update needed',
    timestamp: new Date().toISOString()
  };
  
  runQuery(
    'INSERT INTO ota_history (id, device_id, current_version, target_version, status, checked_at) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), deviceId, current_version || 'unknown', latestFirmware.version, 'checked', new Date().toISOString()]
  );
  
  logger.info(`[OTA] Check for ${deviceId}: update=${needsUpdate}, version=${latestFirmware.version}`);
  
  res.json(response);
}));

router.post('/devices/:deviceId/ota-update', asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { success, new_version, error } = req.body;
  
  const status = success ? 'success' : 'failed';
  
  runQuery(
    `UPDATE ota_history SET status = ?, completed_at = ?, result = ? 
     WHERE device_id = ? AND status = 'checked' ORDER BY checked_at DESC LIMIT 1`,
    [status, new Date().toISOString(), error || (success ? 'Updated successfully' : error), deviceId]
  );
  
  if (success && new_version) {
    const deviceConfig = JSON.parse(getOne('SELECT config FROM devices WHERE id = ?', [deviceId])?.config || '{}');
    deviceConfig.firmware_version = new_version;
    
    runQuery(
      'UPDATE devices SET config = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(deviceConfig), new Date().toISOString(), deviceId]
    );
  }
  
  logger.info(`[OTA] Update result for ${deviceId}: ${status}`);
  
  res.json({ success: true, message: 'Update status recorded' });
}));

router.get('/devices/:deviceId/ota-status', authenticate, asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  
  const history = getAll(
    'SELECT * FROM ota_history WHERE device_id = ? ORDER BY checked_at DESC LIMIT 10',
    [deviceId]
  );
  
  const device = getOne('SELECT * FROM devices WHERE id = ?', [deviceId]);
  const currentVersion = device ? JSON.parse(device.config || '{}').firmware_version : 'unknown';
  
  res.json({
    success: true,
    current_version: currentVersion,
    history
  });
}));

router.get('/ota/manifest', asyncHandler(async (req, res) => {
  const { device_id, version } = req.query;
  
  const deviceType = getOne('SELECT type FROM devices WHERE id = ?', [device_id])?.type || 'esp32';
  
  const latestFirmware = getOne(
    'SELECT * FROM device_firmwares WHERE device_type = ? ORDER BY created_at DESC LIMIT 1',
    [deviceType]
  );
  
  if (!latestFirmware) {
    return res.json({
      update_available: false,
      version: version || '1.0.0'
    });
  }
  
  const needsUpdate = !version || version !== latestFirmware.version;
  
  const manifest = {
    update_available: needsUpdate,
    version: latestFirmware.version,
    current_version: version,
    bin_url: latestFirmware.file_url,
    sha256: latestFirmware.checksum,
    size: latestFirmware.size,
    notes: needsUpdate ? `Update to v${latestFirmware.version}` : 'Current'
  };
  
  if (device_id) {
    runQuery(
      'INSERT INTO ota_history (id, device_id, current_version, target_version, status, checked_at) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), device_id, version || 'unknown', latestFirmware.version, 'manifest_sent', new Date().toISOString()]
    );
  }
  
  res.json(manifest);
}));

router.get('/ota/settings', authenticate, asyncHandler(async (req, res) => {
  const settings = getOne("SELECT value FROM settings WHERE key = 'ota_config'");
  
  res.json({
    success: true,
    config: settings ? JSON.parse(settings.value) : OTA_CONFIG
  });
}));

router.put('/ota/settings', authenticate, asyncHandler(async (req, res) => {
  const { checkInterval, downloadTimeout, maxRetry } = req.body;
  
  const config = {
    checkInterval: checkInterval || OTA_CONFIG.checkInterval,
    downloadTimeout: downloadTimeout || OTA_CONFIG.downloadTimeout,
    maxRetry: maxRetry || OTA_CONFIG.maxRetry
  };
  
  runQuery(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
    ['ota_config', JSON.stringify(config), new Date().toISOString()]
  );
  
  res.json({ success: true, message: 'OTA settings updated' });
}));

router.get('/ota/stats', authenticate, asyncHandler(async (req, res) => {
  const totalDevices = getOne('SELECT COUNT(*) as count FROM devices');
  const updatedDevices = getOne(
    "SELECT COUNT(*) as count FROM devices WHERE json_extract(config, '$.firmware_version') IS NOT NULL"
  );
  const last24h = getOne(
    "SELECT COUNT(*) as count FROM ota_history WHERE checked_at >= datetime('now', '-24 hours')"
  );
  const successful = getOne(
    "SELECT COUNT(*) as count FROM ota_history WHERE status = 'success'"
  );
  
  res.json({
    success: true,
    stats: {
      total_devices: totalDevices?.count || 0,
      devices_updated: updatedDevices?.count || 0,
      checks_last_24h: last24h?.count || 0,
      successful_updates: successful?.count || 0
    }
  });
}));

module.exports = router;