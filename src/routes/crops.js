const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getAll, getOne } = require('../config/database');

router.get('/crops', auth, async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM crops';
    const params = [];
    if (category) { sql += ' WHERE category = ?'; params.push(category); }
    sql += ' ORDER BY category, name';
    const crops = getAll(sql, params);
    res.json({ ok: true, data: crops });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/crops/:id', auth, async (req, res) => {
  try {
    const crop = getOne('SELECT * FROM crops WHERE id = ?', [req.params.id]);
    if (!crop) return res.status(404).json({ ok: false, error: 'Crop not found' });
    res.json({ ok: true, data: crop });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/crops/category/list', auth, async (req, res) => {
  try {
    const categories = getAll('SELECT DISTINCT category FROM crops ORDER BY category');
    res.json({ ok: true, data: categories.map(c => c.category) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/aquaculture', auth, async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM aquaculture';
    const params = [];
    if (category) { sql += ' WHERE category = ?'; params.push(category); }
    sql += ' ORDER BY category, name';
    const aqua = getAll(sql, params);
    res.json({ ok: true, data: aqua });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/aquaculture/:id', auth, async (req, res) => {
  try {
    const aqua = getOne('SELECT * FROM aquaculture WHERE id = ?', [req.params.id]);
    if (!aqua) return res.status(404).json({ ok: false, error: 'Species not found' });
    res.json({ ok: true, data: aqua });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/aquaculture/category/list', auth, async (req, res) => {
  try {
    const categories = getAll('SELECT DISTINCT category FROM aquaculture ORDER BY category');
    res.json({ ok: true, data: categories.map(c => c.category) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/analyze/crop/:cropId', auth, async (req, res) => {
  try {
    const crop = getOne('SELECT * FROM crops WHERE id = ?', [req.params.cropId]);
    if (!crop) return res.status(404).json({ ok: false, error: 'Crop not found' });

    const sensors = getAll('SELECT type, value FROM sensors');
    const currentTemp = sensors.find(s => s.type === 'temperature')?.value || 28;
    const currentHumidity = sensors.find(s => s.type === 'humidity')?.value || 70;
    const currentSoilMoisture = sensors.find(s => s.type === 'soil')?.value || 40;

    const analysis = {
      crop: { id: crop.id, name: crop.name, name_vi: crop.name_vi },
      conditions: {
        temperature: currentTemp,
        humidity: currentHumidity,
        soil_moisture: currentSoilMoisture
      },
      assessment: {
        temperature: {
          status: currentTemp >= crop.optimal_temp_min && currentTemp <= crop.optimal_temp_max ? 'optimal' : 
                  currentTemp < crop.min_temp ? 'too_cold' : 'too_hot',
          value: currentTemp,
          optimal_range: `${crop.optimal_temp_min}-${crop.optimal_temp_max}`,
          min: crop.min_temp,
          max: crop.max_temp
        },
        humidity: {
          status: currentHumidity >= crop.min_humidity && currentHumidity <= crop.max_humidity ? 'optimal' : 'suboptimal',
          value: currentHumidity,
          optimal_range: `${crop.min_humidity}-${crop.max_humidity}%`
        },
        soil_moisture: {
          status: currentSoilMoisture >= crop.min_soil_moisture && currentSoilMoisture <= crop.max_soil_moisture ? 'optimal' : 
                  currentSoilMoisture < crop.min_soil_moisture ? 'too_dry' : 'too_wet',
          value: currentSoilMoisture,
          optimal_range: `${crop.min_soil_moisture}-${crop.max_soil_moisture}%`
        }
      },
      recommendations: [],
      water_need: crop.water_requirement,
      estimated_etc: 0
    };

    if (analysis.assessment.temperature.status !== 'optimal') {
      analysis.recommendations.push({
        type: 'temperature',
        priority: 'high',
        message: currentTemp < crop.min_temp ? 
          `Nhiệt độ quá thấp (${currentTemp}°C), cần sưởi ấm` :
          `Nhiệt độ quá cao (${currentTemp}°C), cần làm mát`
      });
    }

    if (analysis.assessment.soil_moisture.status === 'too_dry') {
      analysis.recommendations.push({
        type: 'irrigation',
        priority: 'high',
        message: `Đất quá khô (${currentSoilMoisture}%), cần tưới ngay`
      });
    }

    const weatherData = await getWeatherForecast();
    if (weatherData) {
      const etc = calculateET0(weatherData.temp, weatherData.humidity, weatherData.wind, crop.kc_mid);
      analysis.estimated_etc = etc.toFixed(2);
      analysis.weather = weatherData;
    }

    res.json({ ok: true, data: analysis });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

async function getWeatherForecast() {
  try {
    const axios = require('axios');
    const lat = process.env.FARM_LAT || '10.7769';
    const lon = process.env.FARM_LON || '106.7009';
    const res = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&forecast_days=1&timezone=auto`
    );
    return {
      temp: res.data.hourly.temperature_2m[0] || 28,
      humidity: res.data.hourly.relative_humidity_2m[0] || 70,
      wind: res.data.hourly.wind_speed_10m[0] || 2
    };
  } catch (e) { return null; }
}

function calculateET0(temp, humidity, wind, kc) {
  const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
  const ea = es * (humidity / 100);
  const delta = (4098 * es) / Math.pow(temp + 237.3, 2);
  const u2 = wind || 2;
  const gamma = 0.665 * 0.001 * 101.3;
  const etc = (0.408 * delta * es + gamma * u2 * (es - ea)) / (delta + gamma * u2 * 0.34);
  return etc * kc;
}

module.exports = router;