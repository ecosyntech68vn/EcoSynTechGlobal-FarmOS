const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { broadcast } = require('../websocket');

router.get('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const includeAcknowledged = req.query.includeAcknowledged === 'true';
  
  let query = 'SELECT * FROM alerts ORDER BY timestamp DESC';
  if (!includeAcknowledged) {
    query += ' WHERE acknowledged = 0';
  }
  query += ' LIMIT 100';
  
  const alerts = db.prepare(query).all();
  
  const result = alerts.map(alert => ({
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    sensor: alert.sensor,
    value: alert.value,
    message: alert.message,
    acknowledged: !!alert.acknowledged,
    acknowledgedAt: alert.acknowledged_at,
    timestamp: alert.timestamp
  }));
  
  res.json(result);
}));

router.post('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const { type, severity, sensor, value, message } = req.body;
  
  if (!type) {
    return res.status(400).json({ error: 'type is required' });
  }
  
  const id = `alert-${Date.now()}`;
  
  db.prepare(`
    INSERT INTO alerts (id, type, severity, sensor, value, message, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(id, type, severity || 'info', sensor || null, value || null, message || '');
  
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
  
  logger.warn(`Alert created: ${type} - ${message || 'No message'}`);
  broadcast({ type: 'alert', action: 'created', data: alert });
  
  res.status(201).json({
    id: alert.id,
    type: alert.type,
    severity: alert.severity,
    sensor: alert.sensor,
    value: alert.value,
    message: alert.message,
    acknowledged: false,
    timestamp: alert.timestamp
  });
}));

router.post('/:id/acknowledge', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  db.prepare(`
    UPDATE alerts 
    SET acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(req.params.id);
  
  const updatedAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  
  logger.info(`Alert ${req.params.id} acknowledged`);
  broadcast({ type: 'alert', action: 'acknowledged', data: updatedAlert });
  
  res.json({
    id: updatedAlert.id,
    acknowledged: !!updatedAlert.acknowledged,
    acknowledgedAt: updatedAlert.acknowledged_at
  });
}));

router.post('/acknowledge-all', asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  const result = db.prepare(`
    UPDATE alerts 
    SET acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP 
    WHERE acknowledged = 0
  `).run();
  
  logger.info(`${result.changes} alerts acknowledged`);
  broadcast({ type: 'alert', action: 'all-acknowledged' });
  
  res.json({ success: true, count: result.changes });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  
  db.prepare('DELETE FROM alerts WHERE id = ?').run(req.params.id);
  
  res.status(204).send();
}));

router.delete('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  const acknowledgedOnly = req.query.acknowledgedOnly === 'true';
  
  if (acknowledgedOnly) {
    db.prepare('DELETE FROM alerts WHERE acknowledged = 1').run();
  } else {
    db.prepare('DELETE FROM alerts').run();
  }
  
  logger.info('Alerts cleared');
  
  res.status(204).send();
}));

module.exports = router;
