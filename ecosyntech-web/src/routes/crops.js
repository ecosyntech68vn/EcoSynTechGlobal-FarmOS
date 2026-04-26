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

router.get('/plantings', auth, async (req, res) => {
  try {
    const { farm_id, status } = req.query;
    let sql = `SELECT cp.*, c.name, c.name_vi, c.category, c.kc_mid 
               FROM crop_plantings cp 
               LEFT JOIN crops c ON cp.crop_id = c.id`;
    const params = [];
    const conditions = [];
    if (farm_id) { conditions.push('cp.farm_id = ?'); params.push(farm_id); }
    if (status) { conditions.push('cp.status = ?'); params.push(status); }
    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY cp.planting_date DESC';
    const plantings = getAll(sql, params);
    res.json({ ok: true, data: plantings });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/plantings/:id', auth, async (req, res) => {
  try {
    const planting = getOne(
      `SELECT cp.*, c.name, c.name_vi, c.category, c.kc_mid, c.optimal_temp_min, c.optimal_temp_max,
              c.min_soil_moisture, c.max_soil_moisture, c.growth_stages
       FROM crop_plantings cp 
       LEFT JOIN crops c ON cp.crop_id = c.id
       WHERE cp.id = ?`,
      [req.params.id]
    );
    if (!planting) return res.status(404).json({ ok: false, error: 'Planting not found' });
    res.json({ ok: true, data: planting });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/plantings/:id/recommendations', auth, async (req, res) => {
  try {
    const planting = getOne(
      `SELECT cp.*, c.name, c.name_vi, c.category, c.kc_mid, c.optimal_temp_min, c.optimal_temp_max,
              c.min_temp, c.max_temp, c.min_soil_moisture, c.max_soil_moisture, c.water_requirement,
              c.nitrogen_requirement, c.phosphorus_requirement, c.potassium_requirement
       FROM crop_plantings cp 
       LEFT JOIN crops c ON cp.crop_id = c.id
       WHERE cp.id = ?`,
      [req.params.id]
    );
    if (!planting) return res.status(404).json({ ok: false, error: 'Planting not found' });

    const sensors = getAll('SELECT type, value FROM sensors');
    const currentTemp = sensors.find(s => s.type === 'temperature')?.value || 28;
    const currentHumidity = sensors.find(s => s.type === 'humidity')?.value || 70;
    const currentSoilMoisture = sensors.find(s => s.type === 'soil')?.value || 40;

    const recommendations = [];
    const stageRecs = getStageRecommendations(planting.current_stage, planting.name_vi);
    recommendations.push(...stageRecs);

    if (currentTemp < planting.optimal_temp_min) {
      recommendations.push({ type: 'temperature', priority: 'high', message: `Nhiệt độ (${currentTemp}°C) thấp hơn tối ưu. Cần sưởi ấm hoặc che chắn.`, action: 'heat_protection' });
    } else if (currentTemp > planting.optimal_temp_max) {
      recommendations.push({ type: 'temperature', priority: 'high', message: `Nhiệt độ (${currentTemp}°C) cao hơn tối ưu. Cần tưới nước hoặc che lưới.`, action: 'cool_down' });
    }

    if (currentSoilMoisture < planting.min_soil_moisture) {
      const deficit = planting.min_soil_moisture - currentSoilMoisture;
      recommendations.push({ type: 'irrigation', priority: 'high', message: `Đất khô (${currentSoilMoisture}%). Cần tưới ngay ${deficit}% để đạt ${planting.min_soil_moisture}%.`, action: 'irrigate_now' });
    } else if (currentSoilMoisture > planting.max_soil_moisture) {
      recommendations.push({ type: 'drainage', priority: 'medium', message: `Đất quá ẩm (${currentSoilMoisture}%). Cần thoát nước tránh úng rễ.`, action: 'drain_water' });
    }

    if (planting.water_requirement === 'high') {
      recommendations.push({ type: 'fertilizer', priority: 'medium', message: `Cần bón NPK ${planting.nitrogen_requirement}:${planting.phosphorus_requirement}:${planting.potassium_requirement} cho ${planting.name_vi}.`, action: 'apply_fertilizer' });
    }

    const daysSincePlanting = Math.floor((Date.now() - new Date(planting.planting_date).getTime()) / (1000*60*60*24));
    if (daysSincePlanting > 30 && planting.current_stage === 'gieo_hat') {
      recommendations.push({ type: 'stage', priority: 'medium', message: `Đã ${daysSincePlanting} ngày. Cần chuyển giai đoạn cây con.`, action: 'advance_stage' });
    }

    res.json({ ok: true, data: { planting, recommendations, days_since_planting: daysSincePlanting, sensors: { temperature: currentTemp, humidity: currentHumidity, soil_moisture: currentSoilMoisture } } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

function getStageRecommendations(stage, cropName) {
  const stageData = {
    gieo_hat: [{ type: 'seed', priority: 'high', message: `Giai đoạn gieo hạt ${cropName}. Cần giữ ẩm 70-80% và che chắn tránh mưa to.`, action: 'keep_moist' }],
    cay_con: [{ type: 'nursery', priority: 'high', message: `Giai đoạn cây con ${cropName}. Cần bón thúc NPK cân bằng, giữ ẩm đất.`, action: 'fertilize_nursery' }],
    sinh_truong: [{ type: 'growth', priority: 'medium', message: `Giai đoạn sinh trưởng ${cropName}. Tưới nước đều đặn, bón phân NPK 3-4 lần/tuần.`, action: 'regular_water' }],
    ra_hoa: [{ type: 'flowering', priority: 'high', message: `Giai đoạn ra hoa ${cropName}. Hạn chế tưới nước, bón phân Kali tăng đậu quả.`, action: 'reduce_water' }],
    thu_hoach: [{ type: 'harvest', priority: 'medium', message: `Giai đoạn thu hoạch ${cropName}. Thu hoạch sớm buổi sáng, bảo quản mát.`, action: 'harvest_now' }]
  };
  return stageData[stage] || stageData.sinh_truong;
}

router.post('/plantings', auth, async (req, res) => {
  try {
    const { farm_id, crop_id, area, area_unit, planting_date, expected_harvest_date, yield_expected, notes } = req.body;
    if (!crop_id) return res.status(400).json({ ok: false, error: 'crop_id is required' });
    const crop = getOne('SELECT * FROM crops WHERE id = ?', [crop_id]);
    if (!crop) return res.status(404).json({ ok: false, error: 'Crop not found' });
    
    const { v4: uuidv4 } = require('uuid');
    const id = `plant-${uuidv4().slice(0, 8)}`;
    const plantingDate = planting_date || new Date().toISOString().split('T')[0];
    
    const { db } = require('../config/database');
    db.run(`INSERT INTO crop_plantings (id, farm_id, crop_id, area, area_unit, planting_date, expected_harvest_date, yield_expected, notes, current_stage)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'gieo_hat')`,
    [id, farm_id || null, crop_id, area || null, area_unit || 'hectare', plantingDate, expected_harvest_date || null, yield_expected || null, notes || null]
    );
    
    const planting = getOne('SELECT * FROM crop_plantings WHERE id = ?', [id]);
    res.status(201).json({ ok: true, data: planting });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.put('/plantings/:id', auth, async (req, res) => {
  try {
    const existing = getOne('SELECT * FROM crop_plantings WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ ok: false, error: 'Planting not found' });
    
    const { area, area_unit, planting_date, expected_harvest_date, actual_harvest_date, status, current_stage, yield_expected, yield_actual, notes } = req.body;
    const { db } = require('../config/database');
    
    db.run(`UPDATE crop_plantings 
           SET area = COALESCE(?, area), area_unit = COALESCE(?, area_unit), 
               planting_date = COALESCE(?, planting_date), expected_harvest_date = COALESCE(?, expected_harvest_date),
               actual_harvest_date = COALESCE(?, actual_harvest_date), status = COALESCE(?, status),
               current_stage = COALESCE(?, current_stage), yield_expected = COALESCE(?, yield_expected),
               yield_actual = COALESCE(?, yield_actual), notes = COALESCE(?, notes), updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
    [area, area_unit, planting_date, expected_harvest_date, actual_harvest_date, status, current_stage, yield_expected, yield_actual, notes, req.params.id]
    );
    
    const planting = getOne('SELECT * FROM crop_plantings WHERE id = ?', [req.params.id]);
    res.json({ ok: true, data: planting });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.delete('/plantings/:id', auth, async (req, res) => {
  try {
    const existing = getOne('SELECT * FROM crop_plantings WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ ok: false, error: 'Planting not found' });
    
    const { db } = require('../config/database');
    db.run('DELETE FROM crop_plantings WHERE id = ?', [req.params.id]);
    res.json({ ok: true, message: 'Planting deleted' });
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