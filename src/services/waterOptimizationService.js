const { getAll, getOne, runQuery } = require('../config/database');
const logger = require('../config/logger');

class WaterOptimizationService {
  constructor() {
    this.enabled = process.env.WATER_OPTIMIZATION_ENABLED === 'true';
    this.minMoisture = parseFloat(process.env.WATER_MIN_MOISTURE || '30');
    this.maxMoisture = parseFloat(process.env.WATER_MAX_MOISTURE || '70');
    this.checkIntervalMs = parseInt(process.env.WATER_CHECK_INTERVAL || '300000');
    this.timer = null;
  }

  start() {
    if (!this.enabled) {
      logger.info('[WaterOpt] Tắt ( WATER_OPTIMIZATION_ENABLED=false )');
      return;
    }
    logger.info('[WaterOpt] Khởi động tưới tiêu thông minh');
    this.scheduleCheck();
  }

  scheduleCheck() {
    this.timer = setTimeout(() => {
      this.checkAndOptimize();
      this.scheduleCheck();
    }, this.checkIntervalMs);
  }

  async getCropKc(cropType, growthStage) {
    const kcValues = {
      rice: { initial: 0.9, mid: 1.2, late: 0.9 },
      maize: { initial: 0.9, mid: 1.15, late: 0.7 },
      vegetable: { initial: 0.9, mid: 1.1, late: 0.8 },
      fruit: { initial: 0.9, mid: 1.05, late: 0.85 },
      default: { initial: 0.9, mid: 1.1, late: 0.8 }
    };
    const kc = kcValues[cropType] || kcValues.default;
    return kc[growthStage] || kc.mid;
  }

  calculateET0(temp, humidity, wind, solar) {
    if (!temp) return 4;
    const es = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
    const ea = es * (humidity / 100);
    const delta = (4098 * es) / Math.pow(temp + 237.3, 2);
    const u2 = wind || 2;
    const rs = solar || 15;
    const gamma = 0.665 * 0.001 * 101.3;
    return (0.408 * delta * es + gamma * u2 * (es - ea)) / (delta + gamma * u2 * 0.34);
  }

  async getIrrigationRecommendation(farmId = null) {
    try {
      const whereClause = farmId ? "WHERE zone LIKE ?" : "";
      const params = farmId ? [`%${farmId}%`] : [];
      const sensors = getAll(
        `SELECT type, value FROM sensors ${whereClause}`,
        params
      );
      
      const soilMoisture = sensors.find(s => s.type === 'soil')?.value || 0;
      const temperature = sensors.find(s => s.type === 'temperature')?.value || 25;
      const humidity = sensors.find(s => s.type === 'humidity')?.value || 60;
      
      const weatherData = await this.getWeatherForecast();
      const et0 = this.calculateET0(
        weatherData?.temp || temperature,
        weatherData?.humidity || humidity,
        weatherData?.wind,
        weatherData?.solar
      );
      
      const crops = getAll('SELECT * FROM crops WHERE status = "active"');
      let totalKc = 0;
      for (const crop of crops) {
        const stage = this.getGrowthStage(crop.planting_date);
        totalKc += await this.getCropKc(crop.variety || 'default', stage);
      }
      const avgKc = crops.length ? totalKc / crops.length : 1.0;
      const etc = et0 * avgKc;
      
      const recommendation = {
        soilMoisture,
        etc: etc.toFixed(2),
        weather: weatherData,
        action: 'no_action',
        duration: 0,
        reason: '',
        score: 100
      };
      
      if (soilMoisture < this.minMoisture) {
        const deficit = this.minMoisture - soilMoisture;
        recommendation.action = 'irrigate';
        recommendation.duration = Math.max(10, Math.round(deficit * 2));
        recommendation.reason = `Độ ẩm đất thấp (${soilMoisture.toFixed(0)}%)`;
        recommendation.score = Math.min(100, Math.round((1 - deficit / 100) * 100));
      } else if (soilMoisture > this.maxMoisture) {
        recommendation.action = 'stop_irrigation';
        recommendation.reason = `Độ ẩm đất cao (${soilMoisture.toFixed(0)}%)`;
        recommendation.score = Math.min(100, Math.round((this.maxMoisture / soilMoisture) * 100));
      } else if (weatherData?.rainfall > 5) {
        recommendation.action = 'skip';
        recommendation.reason = 'Dự báo có mưa';
        recommendation.score = 80;
      } else if (etc > 5 && soilMoisture < this.minMoisture + 10) {
        recommendation.action = 'irrigate';
        recommendation.duration = Math.max(10, Math.round(etc * 15));
        recommendation.reason = `ET0 cao (${etc.toFixed(1)}mm/ngày)`;
        recommendation.score = 70;
      }
      
      return recommendation;
    } catch (e) {
      logger.warn('[WaterOpt] Lỗi:', e.message);
      return { error: e.message };
    }
  }

  async getWeatherForecast() {
    try {
      const apiKey = process.env.OPENWEATHERMAP_API_KEY;
      if (!apiKey) return null;
      const lat = process.env.FARM_LAT || '10.8231';
      const lon = process.env.FARM_LON || '106.6297';
      
      const axios = require('axios');
      const res = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=8`
      );
      const list = res.data.list || [];
      const temps = list.map(l => l.main.temp);
      const humidities = list.map(l => l.main.humidity);
      const rain = list.reduce((sum, l) => sum + (l.rain?.['3h'] || 0), 0);
      
      return {
        temp: temps.reduce((a, b) => a + b, 0) / temps.length,
        humidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
        rainfall: rain,
        wind: list[0]?.wind?.speed || 0,
        solar: list[0]?.clouds?.all || 50
      };
    } catch (e) {
      return null;
    }
  }

  getGrowthStage(plantingDate) {
    if (!plantingDate) return 'mid';
    const days = Math.floor((Date.now() - new Date(plantingDate).getTime()) / 86400000);
    if (days < 30) return 'initial';
    if (days < 60) return 'mid';
    return 'late';
  }

  async checkAndOptimize() {
    const rec = await this.getIrrigationRecommendation();
    if (rec.action === 'irrigate' && rec.duration > 0) {
      this.triggerIrrigation(rec);
    }
  }

  triggerIrrigation(recommendation) {
    try {
      const pumpDevices = getAll("SELECT * FROM devices WHERE type = 'pump' AND status = 'online'");
      for (const pump of pumpDevices) {
        const config = JSON.parse(pump.config || '{}');
        if (config.autoMode) {
          runQuery(
            'INSERT INTO history (id, action, trigger, status, timestamp) VALUES (?, ?, ?, ?, datetime("now"))',
            [`irrigation-${Date.now()}`, 'auto_irrigate', recommendation.reason, 'pending']
          );
          logger.info(`[WaterOpt] Tưới tự động: ${recommendation.duration} phút - ${recommendation.reason}`);
        }
      }
    } catch (e) {
      logger.warn('[WaterOpt] Lỗi kích hoạt:', e.message);
    }
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
  }
}

module.exports = new WaterOptimizationService();