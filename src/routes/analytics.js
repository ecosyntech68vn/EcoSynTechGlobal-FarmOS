const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

router.get('/sensor-history', authenticate, asyncHandler(async (req, res) => {
  const { sensorType, startDate, endDate, interval = 'hour' } = req.query;
  
  let dateFormat = '%Y-%m-%d %H:00';
  if (interval === 'day') dateFormat = '%Y-%m-%d';
  if (interval === 'minute') dateFormat = '%Y-%m-%d %H:%i';

  const sql = `
    SELECT 
      strftime('${dateFormat}', timestamp) as period,
      AVG(value) as avg,
      MIN(value) as min,
      MAX(value) as max,
      COUNT(*) as count
    FROM sensor_readings
    WHERE sensor_type = ?
    ${startDate ? 'AND timestamp >= ?' : ''}
    ${endDate ? 'AND timestamp <= ?' : ''}
    GROUP BY period
    ORDER BY period DESC
    LIMIT 100
  `;

  const params = [sensorType];
  if (startDate) params.push(startDate);
  if (endDate) params.push(endDate);

  const data = getAll(sql, params);
  
  res.json({ success: true, data });
}));

router.get('/dashboard', authenticate, asyncHandler(async (req, res) => {
  const devices = getOne('SELECT COUNT(*) as total, SUM(CASE WHEN status = "online" THEN 1 ELSE 0 END) as online FROM devices');
  const sensors = getAll('SELECT type, value, unit FROM sensors');
  const alerts = getAll('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 10');
  const recentHistory = getAll("SELECT * FROM history ORDER BY timestamp DESC LIMIT 20");
  
  const rules = getAll('SELECT * FROM rules WHERE enabled = 1');
  const schedules = getAll('SELECT * FROM schedules WHERE enabled = 1');
  
  const dailyAlerts = getOne(`
    SELECT COUNT(*) as count FROM alerts 
    WHERE timestamp >= datetime('now', '-24 hours')
  `);

  res.json({
    success: true,
    dashboard: {
      devices: {
        total: devices?.total || 0,
        online: devices?.online || 0,
        offline: (devices?.total || 0) - (devices?.online || 0),
        onlinePercent: devices?.total ? Math.round((devices.online / devices.total) * 100) : 0
      },
      sensors: sensors.reduce((acc, s) => {
        acc[s.type] = { value: s.value, unit: s.unit };
        return acc;
      }, {}),
      alerts: {
        today: dailyAlerts?.count || 0,
        recent: alerts
      },
      rules: {
        active: rules.length,
        list: rules.slice(0, 5)
      },
      schedules: {
        active: schedules.length,
        list: schedules.slice(0, 5)
      },
      history: recentHistory
    }
  });
}));

router.get('/kpis', authenticate, asyncHandler(async (req, res) => {
  const { period = '7d' } = req.query;
  
  let days = 7;
  if (period === '30d') days = 30;
  if (period === '24h') days = 1;

  const startDate = `datetime('now', '-${days} days')`;

  const sensorData = getAll(`
    SELECT sensor_type, AVG(value) as avg_value, MIN(value) as min_value, MAX(value) as max_value
    FROM sensor_readings
    WHERE timestamp >= ${startDate}
    GROUP BY sensor_type
  `);

  const alertData = getOne(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical,
      SUM(CASE WHEN severity = 'warning' THEN 1 ELSE 0 END) as warning,
      SUM(CASE WHEN acknowledged = 0 THEN 1 ELSE 0 END) as unacknowledged
    FROM alerts WHERE timestamp >= ${startDate}
  `);

  const deviceUptime = getOne(`
    SELECT 
      AVG(CASE WHEN status = 'online' THEN 100 ELSE 0 END) as uptime_percent
    FROM devices
  `);

  const ruleExecutions = getOne(`
    SELECT COUNT(*) as total, SUM(triggered) as triggered
    FROM rule_history WHERE executed_at >= ${startDate}
  `);

  res.json({
    success: true,
    kpis: {
      period,
      sensors: sensorData,
      alerts: alertData,
      deviceUptime: deviceUptime?.uptime_percent || 0,
      ruleExecutions: {
        total: ruleExecutions?.total || 0,
        triggered: ruleExecutions?.triggered || 0
      }
    }
  });
}));

router.get('/export/pdf', authenticate, asyncHandler(async (req, res) => {
  const PDFDocument = require('pdfkit');
  
  const sensors = getAll('SELECT * FROM sensors');
  const devices = getAll('SELECT * FROM devices');
  const alerts = getAll("SELECT * FROM alerts WHERE timestamp >= datetime('now', '-7 days')");

  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=ecosyntech-report.pdf');
  
  doc.pipe(res);
  
  doc.fontSize(20).text('EcoSynTech IoT Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated: ${new Date().toISOString()}`);
  doc.moveDown();
  
  doc.fontSize(16).text('Sensors');
  sensors.forEach(s => {
    doc.fontSize(10).text(`- ${s.type}: ${s.value} ${s.unit}`);
  });
  
  doc.moveDown();
  doc.fontSize(16).text('Devices');
  devices.forEach(d => {
    doc.fontSize(10).text(`- ${d.name} (${d.type}): ${d.status}`);
  });
  
  doc.moveDown();
  doc.fontSize(16).text(`Alerts (Last 7 days: ${alerts.length})`);
  
  doc.end();
}));

router.get('/export/excel', authenticate, asyncHandler(async (req, res) => {
  const Excel = require('exceljs');
  
  const workbook = new Excel.Workbook();
  workbook.creator = 'EcoSynTech';
  workbook.created = new Date();
  
  const sensorsSheet = workbook.addWorksheet('Sensors');
  sensorsSheet.columns = [
    { header: 'Type', key: 'type' },
    { header: 'Value', key: 'value' },
    { header: 'Unit', key: 'unit' }
  ];
  getAll('SELECT * FROM sensors').forEach(s => sensorsSheet.addRow(s));
  
  const devicesSheet = workbook.addWorksheet('Devices');
  devicesSheet.columns = [
    { header: 'Name', key: 'name' },
    { header: 'Type', key: 'type' },
    { header: 'Status', key: 'status' },
    { header: 'Zone', key: 'zone' }
  ];
  getAll('SELECT * FROM devices').forEach(d => devicesSheet.addRow(d));
  
  const alertsSheet = workbook.addWorksheet('Alerts');
  alertsSheet.columns = [
    { header: 'Type', key: 'type' },
    { header: 'Severity', key: 'severity' },
    { header: 'Message', key: 'message' },
    { header: 'Timestamp', key: 'timestamp' }
  ];
  getAll("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 100").forEach(a => alertsSheet.addRow(a));
  
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=ecosyntech-report.xlsx');
  
  await workbook.xlsx.write(res);
  res.end();
}));

module.exports = router;