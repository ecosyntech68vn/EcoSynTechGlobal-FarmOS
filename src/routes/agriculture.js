const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth: authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/eto', authenticate, asyncHandler(async (req, res) => {
  const { lat, lon, date } = req.query;
  
  const tempMax = getOne('SELECT value FROM sensors WHERE type = ?', ['temperature_max']);
  const tempMin = getOne('SELECT value FROM sensors WHERE type = ?', ['temperature_min']);
  const humidity = getOne('SELECT value FROM sensors WHERE type = ?', ['humidity']);
  const windSpeed = getOne('SELECT value FROM sensors WHERE type = ?', ['wind_speed']);
  const solarRadiation = getOne('SELECT value FROM sensors WHERE type = ?', ['solar_radiation']);
  
  const tMax = tempMax?.value || 28;
  const tMin = tempMin?.value || 18;
  const rh = humidity?.value || 70;
  const u2 = windSpeed?.value || 2;
  const rs = solarRadiation?.value || 15;
  
  const eto = calculateETo(tMax, tMin, rh, u2, rs);
  
  res.json({
    success: true,
    eto: {
      value: eto.toFixed(2),
      unit: 'mm/day',
      date: date || new Date().toISOString().split('T')[0],
      inputs: { tMax, tMin, humidity: rh, windSpeed: u2, solarRadiation: rs }
    }
  });
}));

function calculateETo(tMax, tMin, rh, u2, rs) {
  const tMean = (tMax + tMin) / 2;
  const delta = 4098 * (0.6108 * Math.exp((17.27 * tMean) / (tMean + 237.3))) / Math.pow(tMean + 237.3, 2);
  const es = 0.6108 * Math.exp((17.27 * tMax) / (tMax + 237.3)) + 0.6108 * Math.exp((17.27 * tMin) / (tMin + 237.3));
  const es_rh = es * (1 - rh / 100);
  const ea = es - es_rh;
  const gamma = 0.067;
  const u2_adj = u2 * (4.87 / Math.log(67.8 * 10 - 5.42));
  const rn = rs * 0.0864;
  
  const eto = (0.408 * delta * rn + gamma * (900 / (tMean + 273)) * u2_adj * ea) / 
              (delta + gamma * (1 + 0.34 * u2_adj));
  
  return Math.max(0, eto);
}

router.get('/irrigation-schedule', authenticate, asyncHandler(async (req, res) => {
  const { cropId } = req.query;
  
  const etoValue = calculateETo(
    getOne('SELECT value FROM sensors WHERE type = ?', ['temperature_max'])?.value || 28,
    getOne('SELECT value FROM sensors WHERE type = ?', ['temperature_min'])?.value || 18,
    getOne('SELECT value FROM sensors WHERE type = ?', ['humidity'])?.value || 70,
    getOne('SELECT value FROM sensors WHERE type = ?', ['wind_speed'])?.value || 2,
    getOne('SELECT value FROM sensors WHERE type = ?', ['solar_radiation'])?.value || 15
  );
  
  const crop = cropId ? getOne('SELECT * FROM crops WHERE id = ?', [cropId]) : getOne('SELECT * FROM crops LIMIT 1');
  const kc = crop?.kc || 0.85;
  
  const etc = etoValue * kc;
  const soilMoisture = getOne('SELECT value FROM sensors WHERE type = ?', ['soil'])?.value || 50;
  const availableWater = (soilMoisture / 100) * 100;
  
  let recommendation = 'no-action';
  let waterAmount = 0;
  
  if (availableWater < 30) {
    recommendation = 'irrigate-immediately';
    waterAmount = (50 - availableWater) * 10;
  } else if (availableWater < 50) {
    recommendation = 'irrigate-soon';
    waterAmount = (60 - availableWater) * 8;
  } else if (availableWater > 80 && etc < 3) {
    recommendation = 'skip-irrigation';
    waterAmount = 0;
  }
  
  res.json({
    success: true,
    irrigation: {
      eto: etoValue.toFixed(2),
      etc: etc.toFixed(2),
      kc: kc,
      soilMoisture,
      recommendation,
      suggestedWaterLiters: waterAmount.toFixed(0),
      timestamp: new Date().toISOString()
    }
  });
}));

router.post('/auto-irrigation', authenticate, asyncHandler(async (req, res) => {
  const { enabled, threshold, duration } = req.body;
  
  runQuery(
    'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)',
    ['auto_irrigation', JSON.stringify({ enabled, threshold, duration }), new Date().toISOString()]
  );
  
  res.json({ success: true, message: `Auto irrigation ${enabled ? 'enabled' : 'disabled'}` });
}));

router.get('/crops', authenticate, asyncHandler(async (req, res) => {
  const crops = getAll('SELECT * FROM crops ORDER BY created_at DESC');
  res.json({ success: true, crops });
}));

router.post('/crops', authenticate, asyncHandler(async (req, res) => {
  const { name, variety, planting_date, expected_harvest, kc_stage, area, unit } = req.body;
  const id = uuidv4();
  
  runQuery(
    'INSERT INTO crops (id, name, variety, planting_date, expected_harvest, kc_stage, area, unit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, variety, planting_date, expected_harvest, JSON.stringify(kc_stage || {}), area, unit, new Date().toISOString()]
  );
  
  res.json({ success: true, id, message: 'Crop registered successfully' });
}));

router.get('/crops/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const crop = getOne('SELECT * FROM crops WHERE id = ?', [id]);
  
  if (!crop) {
    return res.status(404).json({ success: false, error: 'Crop not found' });
  }
  
  const stages = getAll('SELECT * FROM crop_stages WHERE crop_id = ? ORDER BY stage_order', [id]);
  const yields = getAll('SELECT * FROM crop_yields WHERE crop_id = ? ORDER BY harvest_date DESC', [id]);
  
  res.json({ success: true, crop, stages, yields });
}));

router.put('/crops/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), new Date().toISOString(), id];
  
  runQuery(`UPDATE crops SET ${fields}, updated_at = ? WHERE id = ?`, values);
  
  res.json({ success: true, message: 'Crop updated successfully' });
}));

router.post('/crops/:id/harvest', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity, quality, notes } = req.body;
  
  runQuery(
    'INSERT INTO crop_yields (id, crop_id, harvest_date, quantity, quality, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uuidv4(), id, new Date().toISOString(), quantity, quality, notes, new Date().toISOString()]
  );
  
  const crop = getOne('SELECT * FROM crops WHERE id = ?', [id]);
  if (crop) {
    runQuery(
      'UPDATE crops SET harvest_date = ?, harvest_quantity = ?, status = ?, updated_at = ? WHERE id = ?',
      [new Date().toISOString(), quantity, 'harvested', new Date().toISOString(), id]
    );
  }
  
  res.json({ success: true, message: 'Harvest recorded successfully' });
}));

router.get('/reports/daily', authenticate, asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0];
  
  const sensors = getAll('SELECT * FROM sensors');
  const alerts = getAll(
    'SELECT * FROM alerts WHERE DATE(timestamp) = ?',
    [date]
  );
  const irrigation = getAll(
    'SELECT * FROM history WHERE DATE(timestamp) = ? AND action LIKE ?',
    [date, '%irrigation%']
  );
  
  res.json({
    success: true,
    report: {
      date,
      sensors: sensors.reduce((acc, s) => { acc[s.type] = s.value; return acc; }, {}),
      alerts: alerts.length,
      irrigationEvents: irrigation.length,
      summary: {
        avgTemp: sensors.find(s => s.type === 'temperature')?.value,
        avgHumidity: sensors.find(s => s.type === 'humidity')?.value,
        avgSoil: sensors.find(s => s.type === 'soil')?.value
      }
    }
  });
}));

router.get('/reports/yield', authenticate, asyncHandler(async (req, res) => {
  const yields = getAll(`
    SELECT c.name, c.variety, c.area, c.unit, y.harvest_date, y.quantity, y.quality
    FROM crops c
    LEFT JOIN crop_yields y ON c.id = y.crop_id
    WHERE y.quantity IS NOT NULL
    ORDER BY y.harvest_date DESC
  `);
  
  const totalYield = yields.reduce((sum, y) => sum + (y.quantity || 0), 0);
  const totalArea = yields.reduce((sum, y) => sum + (y.area || 0), 0);
  
  res.json({
    success: true,
    report: {
      totalHarvests: yields.length,
      totalYield,
      averageYield: totalArea ? (totalYield / totalArea).toFixed(2) : 0,
      yields
    }
  });
}));

module.exports = router;