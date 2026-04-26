const GeneticOptimizer = require('./GeneticOptimizer');
const logger = require('../config/logger');

async function collectHistoricalData() {
  try {
    const { getAll } = require('../config/database');
    
    const query = `
      SELECT 
        (50 - s.value) as soilMoistureError,
        COALESCE(w.precipitation_probability, 0) as rainProb,
        CAST(strftime('%H', h.timestamp) AS INTEGER) as hour,
        h.duration as actualDurationUsed,
        CASE 
          WHEN s.value < 25 THEN 1 
          ELSE 0 
        END as stressFlag
      FROM history h
      LEFT JOIN sensors s ON s.type = 'soil'
      LEFT JOIN weather_cache w ON 1=1
      WHERE h.action = 'auto_irrigate'
        AND h.timestamp > datetime('now', '-7 days')
      ORDER BY h.timestamp DESC
      LIMIT 100
    `;
    
    return getAll(query);
  } catch (err) {
    logger.warn('[AutoTuning] Lỗi truy vấn dữ liệu:', err.message);
    return [];
  }
}

function generateMockData() {
  const data = [];
  const soilErrors = [-30, -20, -10, 0, 10, 20, 30, 40];
  const rainProbs = [0, 10, 20, 30, 50, 70, 90];
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  
  for (let i = 0; i < 50; i++) {
    const error = soilErrors[Math.floor(Math.random() * soilErrors.length)];
    const rainProb = rainProbs[Math.floor(Math.random() * rainProbs.length)];
    const hour = hours[Math.floor(Math.random() * hours.length)];
    
    const actualDuration = Math.max(0, error > 0 ? Math.round(error * 1.5) : 0);
    const stressFlag = error > 20 && actualDuration < 15 ? 1 : 0;
    
    data.push({
      soilMoistureError: error,
      rainProb,
      hour,
      actualDurationUsed: actualDuration,
      stressFlag
    });
  }
  
  return data;
}

async function runDailyOptimization() {
  logger.info('[AutoTuning] Bắt đầu thu thập dữ liệu và tối ưu GA...');
  
  let dataLogs = await collectHistoricalData();
  
  if (!dataLogs || dataLogs.length < 10) {
    logger.info('[AutoTuning] Dữ liệu thực không đủ, sử dụng dữ liệu mô phỏng');
    dataLogs = generateMockData();
  }
  
  logger.info(`[AutoTuning] Sử dụng ${dataLogs.length} bản ghi để huấn luyện`);
  
  const result = await GeneticOptimizer.runOptimization(dataLogs);
  
  if (result) {
    logger.info(`[AutoTuning] Hoàn tất - Fitness: ${result.bestFitness.toFixed(4)}`);
  }
  
  return result;
}

let cronJob = null;

function startAutoTuning(schedule = '0 3 * * *') {
  if (cronJob) {
    logger.warn('[AutoTuning] Đã có lịch chạy, dừng trước');
    cronJob.stop();
  }
  
  logger.info(`[AutoTuning] Đăng ký lịch chạy: ${schedule}`);
  
  try {
    const cron = require('node-cron');
    cronJob = cron.schedule(schedule, runDailyOptimization);
    logger.info('[AutoTuning] Đã kích hoạt tự động tối ưu');
  } catch (err) {
    logger.warn('[AutoTuning] node-cron không khả dụng, chạy thủ công:', err.message);
  }
  
  return {
    run: runDailyOptimization,
    stop: () => {
      if (cronJob) {
        cronJob.stop();
        cronJob = null;
      }
    },
    getOptimizerStatus: () => GeneticOptimizer.getStatus()
  };
}

function startImmediate() {
  return runDailyOptimization();
}

module.exports = {
  startAutoTuning,
  startImmediate,
  collectHistoricalData,
  generateMockData
};