const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getAll, getOne } = require('../config/database');
const si = require('systeminformation');
const os = require('os');

router.get('/overview', auth, async (req, res) => {
  try {
    const devices = getOne('SELECT COUNT(*) as total, SUM(CASE WHEN status = "online" THEN 1 ELSE 0 END) as online FROM devices');
    const farms = getOne('SELECT COUNT(*) as total FROM farms WHERE active = 1');
    const crops = getOne('SELECT COUNT(*) as total, SUM(area) as total_area FROM crops WHERE status = "active"');
    const sensors = getAll('SELECT type, value, unit FROM sensors');
    const alerts = getOne('SELECT COUNT(*) as total, SUM(CASE WHEN acknowledged = 0 THEN 1 ELSE 0 END) as pending FROM alerts');
    const rules = getOne('SELECT COUNT(*) as total, SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as active FROM rules');
    
    const sensorData = {};
    sensors.forEach(s => { sensorData[s.type] = { value: s.value, unit: s.unit }; });
    
    const [cpu, mem, disk] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize()
    ]);
    const mainDisk = disk.find(d => d.mount === '/' || d.mount === 'C:') || disk[0];
    
    res.json({
      ok: true,
      data: {
        system: {
          uptime: os.uptime(),
          cpu: cpu.currentLoad.toFixed(1),
          memory: ((mem.used / mem.total) * 100).toFixed(1),
          disk: mainDisk?.use ?? 0
        },
        farms: farms?.total || 0,
        devices: {
          total: devices?.total || 0,
          online: devices?.online || 0
        },
        crops: {
          total: crops?.total || 0,
          area: crops?.total_area || 0
        },
        sensors: sensorData,
        alerts: {
          total: alerts?.total || 0,
          pending: alerts?.pending || 0
        },
        automation: {
          rules: rules?.total || 0,
          active: rules?.active || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/alerts', auth, async (req, res) => {
  try {
    const alerts = getAll('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 20');
    res.json({ ok: true, data: alerts });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/activity', auth, async (req, res) => {
  try {
    const history = getAll('SELECT * FROM history ORDER BY timestamp DESC LIMIT 30');
    res.json({ ok: true, data: history });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/weather', auth, async (req, res) => {
  try {
    const lat = req.query.lat || process.env.FARM_LAT || '10.7769';
    const lon = req.query.lon || process.env.FARM_LON || '106.7009';
    
    const axios = require('axios');
    const response = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m&forecast_days=5&timezone=auto`
    );
    const data = response.data;
    const hourly = data.hourly;
    const now = new Date();
    const currentIdx = hourly.time.findIndex(t => new Date(t) >= now);
    
    const current = {
      temp: hourly.temperature_2m[currentIdx]?.toFixed(1) || 0,
      humidity: hourly.relative_humidity_2m[currentIdx] || 0,
      precipitation: hourly.precipitation[currentIdx] || 0,
      precipProbability: hourly.precipitation_probability[currentIdx] || 0,
      wind: hourly.wind_speed_10m[currentIdx] || 0,
      weatherCode: hourly.weather_code[currentIdx] || 0
    };
    
    const forecast = [];
    for (let i = 0; i < Math.min(24, hourly.time.length); i += 3) {
      forecast.push({
        time: hourly.time[i],
        temp: hourly.temperature_2m[i]?.toFixed(1),
        humidity: hourly.relative_humidity_2m[i],
        precipProbability: hourly.precipitation_probability[i],
        precipitation: hourly.precipitation[i],
        wind: hourly.wind_speed_10m[i],
        weatherCode: hourly.weather_code[i]
      });
    }
    
    res.json({
      ok: true,
      data: {
        current,
        forecast,
        location: { lat, lon },
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;