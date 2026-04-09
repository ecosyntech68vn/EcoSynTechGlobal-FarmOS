const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

router.get('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const limit = parseInt(req.query.limit) || 50;
  
  const history = db.prepare(`
    SELECT * FROM history 
    ORDER BY timestamp DESC 
    LIMIT ?
  `).all(limit);
  
  const result = history.map(entry => ({
    id: entry.id,
    action: entry.action,
    trigger: entry.trigger,
    status: entry.status,
    timestamp: entry.timestamp
  }));
  
  res.json(result);
}));

router.post('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const { action, trigger, status } = req.body;
  
  if (!action) {
    return res.status(400).json({ error: 'action is required' });
  }
  
  const id = `history-${Date.now()}`;
  
  db.prepare(`
    INSERT INTO history (id, action, trigger, status, timestamp)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(id, action, trigger || 'Manual', status || 'success');
  
  const entry = db.prepare('SELECT * FROM history WHERE id = ?').get(id);
  
  res.status(201).json({
    id: entry.id,
    action: entry.action,
    trigger: entry.trigger,
    status: entry.status,
    timestamp: entry.timestamp
  });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const entry = db.prepare('SELECT * FROM history WHERE id = ?').get(req.params.id);
  
  if (!entry) {
    return res.status(404).json({ error: 'History entry not found' });
  }
  
  db.prepare('DELETE FROM history WHERE id = ?').run(req.params.id);
  
  res.status(204).send();
}));

router.delete('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  db.prepare('DELETE FROM history').run();
  
  logger.info('All history entries cleared');
  
  res.status(204).send();
}));

module.exports = router;
