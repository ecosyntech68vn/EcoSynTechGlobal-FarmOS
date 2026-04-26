const express = require('express');
const router = express.Router();
const { getAll, getOne } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const pkg = require('../../package.json');

const COMPANY_INFO = {
  name: 'CÔNG TY TNHH CÔNG NGHỆ ECOSYNTECH GLOBAL',
  founder: 'Tạ Quang Thuận',
  position: 'CEO and FOUNDER',
  phone: '0989516698',
  email: 'kd.ecosyntech@gmail.com',
  website: 'https://ecosyntech.com'
};

const healthReportEnabled = !!(process.env.WEBLOCAL_WEBAPP_URL && process.env.WEBLOCAL_API_KEY);

router.get('/', asyncHandler(async (req, res) => {
  const { farm_id, date_from, date_to } = req.query;
  
  const deviceFilter = farm_id ? `WHERE farm_id = "${farm_id}"` : '';
  const deviceQuery = deviceFilter 
    ? `SELECT COUNT(*) as count, SUM(CASE WHEN status = "online" THEN 1 ELSE 0 END) as online FROM devices ${deviceFilter}`
    : 'SELECT COUNT(*) as count, SUM(CASE WHEN status = "online" THEN 1 ELSE 0 END) as online FROM devices';
  
  const devices = getOne(deviceQuery);
  const rules = getOne('SELECT COUNT(*) as count, SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as active FROM rules');
  const schedules = getOne('SELECT COUNT(*) as count, SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as active FROM schedules');
  const alerts = getOne('SELECT COUNT(*) as total, SUM(CASE WHEN acknowledged = 0 THEN 1 ELSE 0 END) as unacknowledged FROM alerts');
  const history = getOne('SELECT COUNT(*) as total FROM history');
  
  const sensors = getAll('SELECT type, value FROM sensors');
  const sensorStats = {};
  sensors.forEach(s => {
    sensorStats[s.type] = s.value;
  });
  
  res.json({
    system: {
      name: 'EcoSynTech Farm OS',
      version: pkg.version,
      company: COMPANY_INFO
    },
    devices: {
      total: devices?.count || 0,
      online: devices?.online || 0,
      offline: (devices?.count || 0) - (devices?.online || 0)
    },
    rules: {
      total: rules?.count || 0,
      active: rules?.active || 0
    },
    schedules: {
      total: schedules?.count || 0,
      active: schedules?.active || 0
    },
    alerts: {
      total: alerts?.total || 0,
      unacknowledged: alerts?.unacknowledged || 0
    },
    history: {
      total: history?.total || 0
    },
    sensors: sensorStats,
    healthReport: {
      enabled: healthReportEnabled,
      customerId: process.env.CUSTOMER_ID || null,
      intervalMin: parseInt(process.env.HEALTH_REPORT_INTERVAL_MIN || '30', 10)
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
