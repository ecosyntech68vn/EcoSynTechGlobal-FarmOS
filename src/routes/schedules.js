const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');
const { broadcast } = require('../websocket');

router.get('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const schedules = db.prepare('SELECT * FROM schedules ORDER BY time').all();
  
  const result = schedules.map(schedule => ({
    id: schedule.id,
    name: schedule.name,
    time: schedule.time,
    duration: schedule.duration,
    zones: JSON.parse(schedule.zones || '[]'),
    enabled: !!schedule.enabled,
    days: JSON.parse(schedule.days || '[]')
  }));
  
  res.json(result);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  
  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  res.json({
    id: schedule.id,
    name: schedule.name,
    time: schedule.time,
    duration: schedule.duration,
    zones: JSON.parse(schedule.zones || '[]'),
    enabled: !!schedule.enabled,
    days: JSON.parse(schedule.days || '[]')
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const { name, time, duration, zones, days } = req.body;
  
  if (!name || !time) {
    return res.status(400).json({ error: 'name and time are required' });
  }
  
  const id = `sched-${Date.now()}`;
  
  db.prepare(`
    INSERT INTO schedules (id, name, time, duration, zones, enabled, days)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    name,
    time,
    duration || 60,
    JSON.stringify(zones || ['all']),
    JSON.stringify(days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
  );
  
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);
  
  logger.info(`Schedule created: ${name} (${id})`);
  broadcast({ type: 'schedule', action: 'created', data: schedule });
  
  res.status(201).json({
    id: schedule.id,
    name: schedule.name,
    time: schedule.time,
    duration: schedule.duration,
    zones: JSON.parse(schedule.zones),
    enabled: !!schedule.enabled,
    days: JSON.parse(schedule.days)
  });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  
  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  const { name, time, duration, zones, enabled, days } = req.body;
  
  db.prepare(`
    UPDATE schedules 
    SET name = ?, time = ?, duration = ?, zones = ?, enabled = ?, days = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    name || schedule.name,
    time || schedule.time,
    duration !== undefined ? duration : schedule.duration,
    zones ? JSON.stringify(zones) : schedule.zones,
    enabled !== undefined ? (enabled ? 1 : 0) : schedule.enabled,
    days ? JSON.stringify(days) : schedule.days,
    req.params.id
  );
  
  const updatedSchedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  
  logger.info(`Schedule updated: ${req.params.id}`);
  broadcast({ type: 'schedule', action: 'updated', data: updatedSchedule });
  
  res.json({
    id: updatedSchedule.id,
    name: updatedSchedule.name,
    time: updatedSchedule.time,
    duration: updatedSchedule.duration,
    zones: JSON.parse(updatedSchedule.zones),
    enabled: !!updatedSchedule.enabled,
    days: JSON.parse(updatedSchedule.days)
  });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  
  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  
  logger.info(`Schedule deleted: ${req.params.id}`);
  broadcast({ type: 'schedule', action: 'deleted', data: { id: req.params.id } });
  
  res.status(204).send();
}));

router.post('/:id/toggle', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  
  if (!schedule) {
    return res.status(404).json({ error: 'Schedule not found' });
  }
  
  const newEnabled = schedule.enabled ? 0 : 1;
  
  db.prepare('UPDATE schedules SET enabled = ? WHERE id = ?').run(newEnabled, req.params.id);
  
  logger.info(`Schedule ${req.params.id} ${newEnabled ? 'enabled' : 'disabled'}`);
  broadcast({ type: 'schedule', action: 'toggled', data: { id: req.params.id, enabled: !!newEnabled } });
  
  res.json({ success: true, enabled: !!newEnabled });
}));

module.exports = router;
