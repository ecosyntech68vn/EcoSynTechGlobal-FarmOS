const express = require('express');
const router = express.Router();
const { getDatabase } = require('../config/database');
const { validateMiddleware } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../config/logger');

router.get('/', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const sensors = db.prepare('SELECT * FROM sensors ORDER BY type').all();
  
  const result = {};
  sensors.forEach(sensor => {
    result[sensor.type] = {
      value: sensor.value,
      unit: sensor.unit,
      min: sensor.min_value,
      max: sensor.max_value,
      timestamp: sensor.timestamp
    };
  });
  
  res.json(result);
}));

router.get('/:type', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const sensor = db.prepare('SELECT * FROM sensors WHERE type = ?').get(req.params.type);
  
  if (!sensor) {
    return res.status(404).json({ error: 'Sensor not found' });
  }
  
  res.json({
    value: sensor.value,
    unit: sensor.unit,
    min: sensor.min_value,
    max: sensor.max_value,
    timestamp: sensor.timestamp
  });
}));

router.post('/update', asyncHandler(async (req, res) => {
  const db = getDatabase();
  const { type, value } = req.body;
  
  if (!type || value === undefined) {
    return res.status(400).json({ error: 'type and value are required' });
  }
  
  const sensor = db.prepare('SELECT * FROM sensors WHERE type = ?').get(type);
  if (!sensor) {
    return res.status(404).json({ error: 'Sensor not found' });
  }
  
  db.prepare(`
    UPDATE sensors 
    SET value = ?, timestamp = CURRENT_TIMESTAMP 
    WHERE type = ?
  `).run(value, type);
  
  const updatedSensor = db.prepare('SELECT * FROM sensors WHERE type = ?').get(type);
  
  logger.info(`Sensor ${type} updated to ${value}`);
  
  res.json({
    success: true,
    sensor: {
      type: updatedSensor.type,
      value: updatedSensor.value,
      unit: updatedSensor.unit,
      timestamp: updatedSensor.timestamp
    }
  });
}));

module.exports = router;
