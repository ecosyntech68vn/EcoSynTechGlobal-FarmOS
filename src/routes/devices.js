const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');
const { validateMiddleware } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { broadcast } = require('../websocket');

router.get('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const devices = db.prepare('SELECT * FROM devices ORDER BY name').all();
  
  const result = devices.map(device => ({
    id: device.id,
    name: device.name,
    type: device.type,
    zone: device.zone,
    status: device.status,
    config: JSON.parse(device.config || '{}'),
    lastSeen: device.last_seen
  }));
  
  res.json(result);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  res.json({
    id: device.id,
    name: device.name,
    type: device.type,
    zone: device.zone,
    status: device.status,
    config: JSON.parse(device.config || '{}'),
    lastSeen: device.last_seen
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const { id, name, type, zone, config } = req.body;
  
  if (!id || !name || !type) {
    return res.status(400).json({ error: 'id, name, and type are required' });
  }
  
  const existing = db.prepare('SELECT id FROM devices WHERE id = ?').get(id);
  if (existing) {
    return res.status(409).json({ error: 'Device ID already exists' });
  }
  
  db.prepare(`
    INSERT INTO devices (id, name, type, zone, status, config, last_seen)
    VALUES (?, ?, ?, ?, 'offline', ?, CURRENT_TIMESTAMP)
  `).run(id, name, type, zone || 'all', JSON.stringify(config || {}));
  
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  
  logger.info(`Device created: ${name} (${id})`);
  broadcast({ type: 'device', action: 'created', data: device });
  
  res.status(201).json(device);
}));

router.put('/:id/config', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  const newConfig = { ...JSON.parse(device.config || '{}'), ...req.body };
  
  db.prepare(`
    UPDATE devices 
    SET config = ?, last_seen = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(JSON.stringify(newConfig), req.params.id);
  
  const updatedDevice = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  
  logger.info(`Device ${req.params.id} config updated`);
  broadcast({ type: 'device', action: 'updated', data: updatedDevice });
  
  res.json({ success: true, device: updatedDevice });
}));

router.post('/:id/command', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  const { command, params } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'command is required' });
  }
  
  const historyEntry = {
    id: `history-${Date.now()}`,
    action: `${command} ${device.name}`,
    trigger: 'API command',
    status: 'success',
    timestamp: new Date().toISOString()
  };
  
  db.prepare(`
    INSERT INTO history (id, action, trigger, status, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(historyEntry.id, historyEntry.action, historyEntry.trigger, historyEntry.status, historyEntry.timestamp);
  
  db.prepare(`
    UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  
  logger.info(`Command ${command} sent to device ${device.name}`);
  broadcast({ type: 'command', action: 'sent', data: { device: device.id, command, params } });
  broadcast({ type: 'history', action: 'added', data: historyEntry });
  
  res.json({ success: true, command, device: device.id });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const device = db.prepare('SELECT * FROM devices WHERE id = ?').get(req.params.id);
  
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  db.prepare('DELETE FROM devices WHERE id = ?').run(req.params.id);
  
  logger.info(`Device deleted: ${req.params.id}`);
  broadcast({ type: 'device', action: 'deleted', data: { id: req.params.id } });
  
  res.status(204).send();
}));

module.exports = router;
