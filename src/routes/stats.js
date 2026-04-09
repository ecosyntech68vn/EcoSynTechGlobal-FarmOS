const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

router.get('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  const devices = db.prepare('SELECT COUNT(*) as count, SUM(CASE WHEN status = "online" THEN 1 ELSE 0 END) as online FROM devices').get();
  const rules = db.prepare('SELECT COUNT(*) as count, SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as active FROM rules').get();
  const schedules = db.prepare('SELECT COUNT(*) as count, SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as active FROM schedules').get();
  const alerts = db.prepare('SELECT COUNT(*) as total, SUM(CASE WHEN acknowledged = 0 THEN 1 ELSE 0 END) as unacknowledged FROM alerts').get();
  const history = db.prepare('SELECT COUNT(*) as total FROM history').get();
  
  const sensors = db.prepare('SELECT type, value FROM sensors').all();
  const sensorStats = {};
  sensors.forEach(s => {
    sensorStats[s.type] = s.value;
  });
  
  res.json({
    devices: {
      total: devices.count,
      online: devices.online || 0,
      offline: (devices.count || 0) - (devices.online || 0)
    },
    rules: {
      total: rules.count,
      active: rules.active || 0
    },
    schedules: {
      total: schedules.count,
      active: schedules.active || 0
    },
    alerts: {
      total: alerts.total || 0,
      unacknowledged: alerts.unacknowledged || 0
    },
    history: {
      total: history.total || 0
    },
    sensors: sensorStats,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
