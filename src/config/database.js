const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('./index');
const logger = require('./logger');

let db = null;

function initDatabase() {
  const dbDir = path.dirname(config.database.path);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.database.path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedInitialData();
  
  logger.info('Database initialized successfully');
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      zone TEXT,
      status TEXT DEFAULT 'offline',
      config TEXT DEFAULT '{}',
      last_seen TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      type TEXT UNIQUE NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      min_value REAL,
      max_value REAL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      condition TEXT NOT NULL,
      action TEXT NOT NULL,
      cooldown_minutes INTEGER DEFAULT 30,
      trigger_count INTEGER DEFAULT 0,
      last_triggered TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      time TEXT NOT NULL,
      duration INTEGER DEFAULT 60,
      zones TEXT DEFAULT '[]',
      enabled INTEGER DEFAULT 1,
      days TEXT DEFAULT '[]',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      trigger TEXT,
      status TEXT DEFAULT 'success',
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      severity TEXT DEFAULT 'info',
      sensor TEXT,
      value REAL,
      message TEXT,
      acknowledged INTEGER DEFAULT 0,
      acknowledged_at TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sensors_type ON sensors(type);
    CREATE INDEX IF NOT EXISTS idx_history_timestamp ON history(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
  `);
}

function seedInitialData() {
  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get();
  
  if (deviceCount.count === 0) {
    const insertDevice = db.prepare(`
      INSERT INTO devices (id, name, type, zone, status, config, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const devices = [
      ['device-001', 'SoilSense-001', 'sensor', 'zone1', 'online', JSON.stringify({ thresholdLow: 30, thresholdCritical: 20 }), new Date().toISOString()],
      ['device-002', 'AirPulse-002', 'sensor', 'zone2', 'online', JSON.stringify({ thresholdLow: 60, thresholdCritical: 90 }), new Date().toISOString()],
      ['device-003', 'Pump-Control-01', 'pump', 'all', 'online', JSON.stringify({ autoMode: true }), new Date().toISOString()],
      ['device-004', 'Valve-Zone-03', 'valve', 'zone3', 'online', JSON.stringify({ flowRate: 50 }), new Date().toISOString()],
      ['device-005', 'AirSense-002', 'sensor', 'zone2', 'offline', '{}', new Date(Date.now() - 3600000).toISOString()],
      ['device-006', 'GrowLight-01', 'light', 'zone1', 'online', JSON.stringify({ brightness: 80 }), new Date().toISOString()]
    ];

    const insertMany = db.transaction((devices) => {
      for (const device of devices) {
        insertDevice.run(...device);
      }
    });
    insertMany(devices);
  }

  const sensorCount = db.prepare('SELECT COUNT(*) as count FROM sensors').get();
  
  if (sensorCount.count === 0) {
    const insertSensor = db.prepare(`
      INSERT INTO sensors (id, type, value, unit, min_value, max_value)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const sensors = [
      ['sensor-temp', 'temperature', 28.5, '°C', 18, 32],
      ['sensor-humid', 'humidity', 72, '%', 60, 85],
      ['sensor-soil', 'soil', 45, '%', 30, 70],
      ['sensor-light', 'light', 42.5, 'klux', 20, 60],
      ['sensor-ph', 'ph', 6.8, 'pH', 6.0, 7.5],
      ['sensor-co2', 'co2', 418, 'ppm', 350, 800],
      ['sensor-ec', 'ec', 2.1, 'mS/cm', 1.5, 3.0],
      ['sensor-water', 'water', 78, '%', 20, 100]
    ];

    const insertMany = db.transaction((sensors) => {
      for (const sensor of sensors) {
        insertSensor.run(...sensor);
      }
    });
    insertMany(sensors);
  }

  const ruleCount = db.prepare('SELECT COUNT(*) as count FROM rules').get();
  
  if (ruleCount.count === 0) {
    const insertRule = db.prepare(`
      INSERT INTO rules (id, name, description, enabled, condition, action)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const rules = [
      ['rule-1', 'Tưới khi đất khô', 'Tự động tưới khi độ ẩm đất xuống dưới 35%', 1, JSON.stringify({ sensor: 'soil', operator: '<', value: 35 }), JSON.stringify({ type: 'valve_open', target: 'zone1' }))],
      ['rule-2', 'Bật quạt khi nóng', 'Kích hoạt quạt thông gió khi nhiệt độ trên 30°C', 1, JSON.stringify({ sensor: 'temperature', operator: '>', value: 30 }), JSON.stringify({ type: 'fan_on', target: 'all' }))],
      ['rule-3', 'Cảnh báo nước thấp', 'Thông báo khi mực nước bồn dưới 25%', 1, JSON.stringify({ sensor: 'water', operator: '<', value: 25 }), JSON.stringify({ type: 'alert', target: 'all' }))]
    ];

    const insertMany = db.transaction((rules) => {
      for (const rule of rules) {
        insertRule.run(...rule);
      }
    });
    insertMany(rules);
  }

  const scheduleCount = db.prepare('SELECT COUNT(*) as count FROM schedules').get();
  
  if (scheduleCount.count === 0) {
    const insertSchedule = db.prepare(`
      INSERT INTO schedules (id, name, time, duration, zones, enabled, days)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const schedules = [
      ['sched-1', 'Lịch tưới sáng', '06:00', 60, JSON.stringify(['zone1', 'zone2', 'zone3']), 1, JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']))],
      ['sched-2', 'Lịch tưới chiều', '17:00', 60, JSON.stringify(['zone4', 'zone5']), 1, JSON.stringify(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']))],
      ['sched-3', 'Bón phân định kỳ', '08:00', 45, JSON.stringify(['all']), 0, JSON.stringify(['Tue', 'Fri']))
    ];

    const insertMany = db.transaction((schedules) => {
      for (const schedule of schedules) {
        insertSchedule.run(...schedule);
      }
    });
    insertMany(schedules);
  }
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    logger.info('Database connection closed');
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase
};
