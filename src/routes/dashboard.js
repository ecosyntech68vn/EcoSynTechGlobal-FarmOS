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
    const weatherApiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!weatherApiKey) {
      return res.json({ ok: true, data: { error: 'OpenWeatherMap API not configured' } });
    }
    const lat = req.query.lat || process.env.FARM_LAT || '10.8231';
    const lon = req.query.lon || process.env.FARM_LON || '106.6297';
    
    const axios = require('axios');
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`
    );
    const data = response.data;
    res.json({
      ok: true,
      data: {
        temp: data.main.temp,
        humidity: data.main.humidity,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        wind: data.wind.speed,
        location: data.name
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;