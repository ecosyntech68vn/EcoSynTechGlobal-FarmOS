const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getAll, getOne, runQuery } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth: authenticate } = require('../middleware/auth');
const logger = require('../config/logger');
const crypto = require('crypto');

const OTA_CONFIG = {
  checkInterval: 7 * 24 * 60 * 60 * 1000,
  downloadTimeout: 300000,
  maxRetry: 3,
  googleDriveEnabled: false
};

router.get('/config', asyncHandler(async (req, res) => {
  const settings = getOne("SELECT value FROM settings WHERE key = 'ota_config'");
  const driveSettings = getOne("SELECT value FROM settings WHERE key = 'ota_drive_config'");
  
  res.json({
    success: true,
    config: settings ? JSON.parse(settings.value) : OTA_CONFIG,
    driveConfig: driveSettings ? JSON.parse(driveSettings.value) : { folderId: '', enabled: false }
  });
}));

router.put('/config', authenticate, asyncHandler(async (req, res) => {
  const { checkInterval, downloadTimeout, maxRetry, driveEnabled, folderId, driveCredentials } = req.body;
  
  const config = {
    checkInterval: checkInterval || OTA_CONFIG.checkInterval,
    downloadTimeout: downloadTimeout || OTA_CONFIG.downloadTimeout,
    maxRetry: maxRetry || OTA_CONFIG.maxRetry,
    googleDriveEnabled: driveEnabled || false
  };
  
  runQuery(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
    ['ota_config', JSON.stringify(config), new Date().toISOString()]
  );
  
  if (folderId !== undefined || driveCredentials) {
    const driveConfig = {
      folderId: folderId || '',
      enabled: driveEnabled || false,
      credentials: driveCredentials ? 'REDACTED' : undefined
    };
    runQuery(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
      ['ota_drive_config', JSON.stringify(driveConfig), new Date().toISOString()]
    );
  }
  
  res.json({ success: true, message: 'OTA config updated' });
}));

router.post('/drive/scan', authenticate, asyncHandler(async (req, res) => {
  const { folderId } = req.body;
  
  if (!folderId) {
    return res.status(400).json({ error: 'Google Drive folder ID is required' });
  }
  
  logger.info(`[OTA] Scanning Google Drive folder: ${folderId}`);
  
  res.json({
    success: true,
    message: 'Google Drive scanning requires service account credentials. Use /drive/sync webhook for auto-sync.',
    note: 'To enable Google Drive integration, add GOOGLE_DRIVE_SERVICE_ACCOUNT JSON to settings'
  });
}));

router.post('/drive/sync', asyncHandler(async (req, res) => {
  const { version, file_url, sha256, size, notes } = req.body;
  
  if (!version || !file_url) {
    return res.status(400).json({ error: 'Version and file URL are required' });
  }
  
  const existing = getOne('SELECT id FROM device_firmwares WHERE version = ?', [version]);
  
  if (existing) {
    runQuery(
      'UPDATE device_firmwares SET file_url = ?, checksum = ?, size = ?, updated_at = ? WHERE id = ?',
      [file_url, sha256 || '', size || 0, new Date().toISOString(), existing.id]
    );
    logger.info(`[OTA] Firmware updated from Drive: v${version}`);
    return res.json({ success: true, message: 'Firmware updated', id: existing.id });
  }
  
  const id = uuidv4();
  runQuery(
    `INSERT INTO device_firmwares (id, version, description, device_type, file_url, checksum, size, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, version, notes || 'Synced from Google Drive', 'esp32', file_url, sha256 || '', size || 0, new Date().toISOString()]
  );
  
  logger.info(`[OTA] New firmware synced from Drive: v${version}`);
  
  res.json({ 
    success: true, 
    id, 
    version,
    message: 'Firmware synced from Google Drive successfully' 
  });
}));

router.post('/webhook/gas', asyncHandler(async (req, res) => {
  const { action, firmware, device_id } = req.body;
  
  logger.info(`[OTA] GAS webhook received: ${action}`);
  
  if (action === 'firmware_scanned' || action === 'firmware_updated') {
    const { version, bin_url, sha256, size } = firmware;
    
    if (!version || !bin_url) {
      return res.status(400).json({ error: 'Missing firmware data' });
    }
    
    const existing = getOne('SELECT id FROM device_firmwares WHERE version = ?', [version]);
    
    if (existing) {
      runQuery(
        'UPDATE device_firmwares SET file_url = ?, checksum = ?, size = ?, updated_at = ? WHERE id = ?',
        [bin_url, sha256 || '', size || 0, new Date().toISOString(), existing.id]
      );
      logger.info(`[OTA] Firmware updated from GAS: v${version}`);
    } else {
      const id = uuidv4();
      runQuery(
        `INSERT INTO device_firmwares (id, version, description, device_type, file_url, checksum, size, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, version, 'Uploaded via GAS Google Apps Script', 'esp32', bin_url, sha256 || '', size || 0, new Date().toISOString()]
      );
      logger.info(`[OTA] New firmware from GAS: v${version}`);
    }
    
    runQuery(
      'INSERT INTO ota_history (id, device_id, current_version, target_version, status, result, checked_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), device_id || 'system', 'unknown', version, 'synced_from_gas', 'Firmware synced from Google Drive', new Date().toISOString()]
    );
  }
  
  res.json({ success: true, message: 'Webhook processed' });
}));

router.get('/firmwares', authenticate, asyncHandler(async (req, res) => {
  const firmwares = getAll('SELECT * FROM device_firmwares ORDER BY created_at DESC');
  
  res.json({ success: true, count: firmwares.length, firmwares });
}));

router.post('/firmwares', authenticate, asyncHandler(async (req, res) => {
  const { version, description, device_type, file_url, file_content, checksum, size } = req.body;
  
  if (!version || !file_url) {
    return res.status(400).json({ error: 'Version and file URL are required' });
  }
  
  const id = uuidv4();
  
  let computedChecksum = checksum;
  if (file_content && !checksum) {
    computedChecksum = crypto.createHash('sha256').update(Buffer.from(file_content, 'base64')).digest('hex');
  }
  
  runQuery(
    `INSERT INTO device_firmwares (id, version, description, device_type, file_url, checksum, size, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, version, description || '', device_type || 'esp32', file_url, computedChecksum || '', size || 0, new Date().toISOString()]
  );
  
  logger.info(`[OTA] Firmware uploaded: v${version} (${file_url})`);
  
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
  
  logger.info(`[OTA] Check for ${deviceId}: update=${needsUpdate}, version=${latestFirmware.version}, url=${latestFirmware.file_url.substring(0, 50)}...`);
  
  res.json(response);
}));

router.post('/devices/:deviceId/ota-update', asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  const { success, new_version, error, downloaded_size } = req.body;
  
  const status = success ? 'success' : 'failed';
  
  runQuery(
    `UPDATE ota_history SET status = ?, completed_at = ?, result = ? 
     WHERE device_id = ? AND status = 'checked' ORDER BY checked_at DESC LIMIT 1`,
    [status, new Date().toISOString(), error || (success ? `Updated to v${new_version}` : error), deviceId]
  );
  
  if (success && new_version) {
    const device = getOne('SELECT * FROM devices WHERE id = ?', [deviceId]);
    const deviceConfig = device ? JSON.parse(device.config || '{}') : {};
    deviceConfig.firmware_version = new_version;
    deviceConfig.last_ota_update = new Date().toISOString();
    
    runQuery(
      'UPDATE devices SET config = ?, updated_at = ? WHERE id = ?',
      [JSON.stringify(deviceConfig), new Date().toISOString(), deviceId]
    );
  }
  
  logger.info(`[OTA] Update result for ${deviceId}: ${status} ${new_version || ''}`);
  
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
    device_id: deviceId,
    current_version: currentVersion,
    history
  });
}));

router.get('/ota/manifest', asyncHandler(async (req, res) => {
  const { device_id, version } = req.query;
  
  const deviceType = device_id 
    ? getOne('SELECT type FROM devices WHERE id = ?', [device_id])?.type || 'esp32'
    : 'esp32';
  
  const latestFirmware = getOne(
    'SELECT * FROM device_firmwares WHERE device_type = ? ORDER BY created_at DESC LIMIT 1',
    [deviceType]
  );
  
  if (!latestFirmware) {
    return res.json({
      update_available: false,
      version: version || '1.0.0',
      message: 'No firmware available'
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
    notes: needsUpdate ? `Update to v${latestFirmware.version}` : 'Current',
    source: latestFirmware.description?.includes('GAS') ? 'google_drive' : 'manual'
  };
  
  if (device_id) {
    runQuery(
      'INSERT INTO ota_history (id, device_id, current_version, target_version, status, checked_at) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), device_id, version || 'unknown', latestFirmware.version, 'manifest_sent', new Date().toISOString()]
    );
  }
  
  res.json(manifest);
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
  const fromDrive = getOne(
    "SELECT COUNT(*) as count FROM device_firmwares WHERE description LIKE '%Drive%' OR description LIKE '%GAS%'"
  );
  
  res.json({
    success: true,
    stats: {
      total_devices: totalDevices?.count || 0,
      devices_updated: updatedDevices?.count || 0,
      checks_last_24h: last24h?.count || 0,
      successful_updates: successful?.count || 0,
      firmwares_from_google_drive: fromDrive?.count || 0
    }
  });
}));

module.exports = router;