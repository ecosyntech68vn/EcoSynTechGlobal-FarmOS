const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const timeout = require('express-timeout-handler');
const http = require('http');

const config = require('./config');
const logger = require('./config/logger');
const { initDatabase, closeDatabase } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { initWebSocket, broadcast } = require('./websocket');

const sensorsRoutes = require('./routes/sensors');
const devicesRoutes = require('./routes/devices');
const rulesRoutes = require('./routes/rules');
const schedulesRoutes = require('./routes/schedules');
const historyRoutes = require('./routes/history');
const alertsRoutes = require('./routes/alerts');
const webhooksRoutes = require('./routes/webhooks');
const statsRoutes = require('./routes/stats');
const authRoutes = require('./routes/auth');

function createApp() {
  const app = express();
  
  app.set('webhookSecret', config.webhook.secret);
  
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  
  app.use(cors({
    origin: config.cors.origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-EcoSynTech-Signature'],
    credentials: true
  }));
  
  app.use(compression());
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });
  app.use('/api/', limiter);
  
  app.use(timeout.handler({
    timeout: 30000,
    onTimeout: (req, res) => {
      res.status(503).json({ error: 'Request timeout' });
    }
  }));
  
  app.use((req, res, next) => {
    res.setHeader('X-Response-Time', Date.now());
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
    next();
  });
  
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: process.version
    });
  });
  
  app.get('/api/version', (req, res) => {
    res.json({
      api: '1.0.0',
      server: 'Express',
      websocket: 'enabled'
    });
  });
  
  app.use('/api/sensors', sensorsRoutes);
  app.use('/api/devices', devicesRoutes);
  app.use('/api/rules', rulesRoutes);
  app.use('/api/schedules', schedulesRoutes);
  app.use('/api/history', historyRoutes);
  app.use('/api/alerts', alertsRoutes);
  app.use('/api/webhooks', webhooksRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/auth', authRoutes);
  
  app.post('/api/export', (req, res) => {
    const db = require('./config/database').getDatabase();
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      sensors: {},
      devices: [],
      rules: [],
      schedules: [],
      history: [],
      alerts: []
    };
    
    const sensors = db.prepare('SELECT * FROM sensors').all();
    sensors.forEach(s => {
      exportData.sensors[s.type] = {
        value: s.value,
        unit: s.unit,
        min: s.min_value,
        max: s.max_value,
        timestamp: s.timestamp
      };
    });
    
    exportData.devices = db.prepare('SELECT * FROM devices').all().map(d => ({
      ...d,
      config: JSON.parse(d.config || '{}')
    }));
    
    exportData.rules = db.prepare('SELECT * FROM rules').all().map(r => ({
      ...r,
      condition: JSON.parse(r.condition),
      action: JSON.parse(r.action)
    }));
    
    exportData.schedules = db.prepare('SELECT * FROM schedules').all().map(s => ({
      ...s,
      zones: JSON.parse(s.zones),
      days: JSON.parse(s.days)
    }));
    
    exportData.history = db.prepare('SELECT * FROM history ORDER BY timestamp DESC LIMIT 100').all();
    exportData.alerts = db.prepare('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 50').all();
    
    res.json(exportData);
  });
  
  app.post('/api/import', (req, res) => {
    const db = require('./config/database').getDatabase();
    const { sensors, devices, rules, schedules } = req.body;
    
    if (sensors) {
      Object.entries(sensors).forEach(([type, data]) => {
        const existing = db.prepare('SELECT id FROM sensors WHERE type = ?').get(type);
        if (existing) {
          db.prepare(`
            UPDATE sensors SET value = ?, unit = ?, min_value = ?, max_value = ?
            WHERE type = ?
          `).run(data.value, data.unit, data.min, data.max, type);
        }
      });
    }
    
    if (rules && Array.isArray(rules)) {
      rules.forEach(rule => {
        const existing = db.prepare('SELECT id FROM rules WHERE id = ?').get(rule.id);
        if (existing) {
          db.prepare(`
            UPDATE rules SET name = ?, description = ?, enabled = ?, condition = ?, action = ?
            WHERE id = ?
          `).run(
            rule.name, rule.description || '', rule.enabled ? 1 : 0,
            JSON.stringify(rule.condition), JSON.stringify(rule.action),
            rule.id
          );
        } else {
          db.prepare(`
            INSERT INTO rules (id, name, description, enabled, condition, action)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            rule.id || `rule-${Date.now()}`,
            rule.name, rule.description || '', rule.enabled ? 1 : 0,
            JSON.stringify(rule.condition), JSON.stringify(rule.action)
          );
        }
      });
    }
    
    res.json({ success: true, message: 'Data imported successfully' });
  });
  
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}

function startServer() {
  try {
    initDatabase();
    
    const app = createApp();
    
    const server = http.createServer(app);
    
    initWebSocket(server);
    
    startSensorSimulation();
    
    server.listen(config.port, () => {
      logger.info(`
╔══════════════════════════════════════════════════════════════╗
║           EcoSynTech IoT Backend Server v1.0.0                ║
╠══════════════════════════════════════════════════════════════╣
║  Status:      Running                                        ║
║  Port:        ${String(config.port).padEnd(48)}║
║  Environment: ${config.nodeEnv.padEnd(48)}║
║  WebSocket:   Enabled (/ws)                                  ║
║  Database:    SQLite                                         ║
╠══════════════════════════════════════════════════════════════╣
║  API Endpoints:                                              ║
║    GET  /api/health            - Health check                ║
║    GET  /api/sensors           - Get all sensors             ║
║    GET  /api/devices           - Get all devices             ║
║    POST /api/devices/:id/cmd   - Send device command         ║
║    GET  /api/rules            - Get automation rules          ║
║    POST /api/rules            - Create rule                  ║
║    GET  /api/schedules        - Get schedules                ║
║    GET  /api/history           - Get activity history         ║
║    GET  /api/alerts            - Get alerts                  ║
║    GET  /api/stats             - Get system statistics        ║
║    POST /api/export            - Export all data             ║
║    POST /api/import            - Import data                  ║
║    POST /api/auth/register     - Register new user           ║
║    POST /api/auth/login        - Login                        ║
║                                                              ║
║  Webhooks:                                                    ║
║    POST /api/webhooks/sensor-alert                           ║
║    POST /api/webhooks/device-status                          ║
║    POST /api/webhooks/rule-triggered                        ║
║    POST /api/webhooks/schedule-run                          ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
    
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(() => {
        closeDatabase();
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(() => {
        closeDatabase();
        logger.info('Server closed');
        process.exit(0);
      });
    });
    
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

function startSensorSimulation() {
  const { getDatabase } = require('./config/database');
  const sensors = ['temperature', 'humidity', 'soil', 'light', 'water', 'co2', 'ec', 'ph'];
  
  setInterval(() => {
    try {
      const db = getDatabase();
      
      sensors.forEach(sensor => {
        const current = db.prepare('SELECT * FROM sensors WHERE type = ?').get(sensor);
        if (!current) return;
        
        const variance = sensor === 'ph' ? 0.1 : (sensor === 'ec' ? 0.05 : 1);
        const delta = (Math.random() - 0.5) * variance;
        let newValue = current.value + delta;
        
        if (sensor === 'temperature') {
          newValue = Math.max(current.min_value, Math.min(current.max_value, newValue));
        } else if (sensor === 'soil' || sensor === 'water') {
          newValue = Math.max(0, Math.min(100, newValue));
        }
        
        const roundedValue = parseFloat(newValue.toFixed(sensor === 'ph' || sensor === 'ec' ? 2 : 1));
        
        db.prepare(`
          UPDATE sensors SET value = ?, timestamp = CURRENT_TIMESTAMP WHERE type = ?
        `).run(roundedValue, sensor);
        
        broadcast({
          type: 'sensor-update',
          data: { type: sensor, value: roundedValue, unit: current.unit },
          timestamp: new Date().toISOString()
        });
      });
      
      checkRules();
    } catch (err) {
      logger.error('Sensor simulation error:', err);
    }
  }, 5000);
}

function checkRules() {
  const { getDatabase } = require('./config/database');
  
  try {
    const db = getDatabase();
    const rules = db.prepare('SELECT * FROM rules WHERE enabled = 1').all();
    const sensors = db.prepare('SELECT * FROM sensors').all();
    
    const sensorMap = {};
    sensors.forEach(s => { sensorMap[s.type] = s; });
    
    rules.forEach(rule => {
      const condition = JSON.parse(rule.condition);
      const sensor = sensorMap[condition.sensor];
      
      if (!sensor) return;
      
      let triggered = false;
      const value = sensor.value;
      const threshold = parseFloat(condition.value);
      
      switch (condition.operator) {
        case '<': triggered = value < threshold; break;
        case '>': triggered = value > threshold; break;
        case '<=': triggered = value <= threshold; break;
        case '>=': triggered = value >= threshold; break;
        case '==': triggered = value === threshold; break;
      }
      
      if (triggered) {
        const now = new Date();
        const lastTriggered = rule.last_triggered ? new Date(rule.last_triggered) : null;
        
        if (!lastTriggered || (now - lastTriggered) >= rule.cooldown_minutes * 60 * 1000) {
          db.prepare(`
            UPDATE rules SET trigger_count = trigger_count + 1, last_triggered = CURRENT_TIMESTAMP WHERE id = ?
          `).run(rule.id);
          
          const action = JSON.parse(rule.action);
          
          if (action.type === 'alert') {
            const alertId = `alert-${Date.now()}`;
            db.prepare(`
              INSERT INTO alerts (id, type, severity, sensor, value, message, timestamp)
              VALUES (?, 'rule', ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(alertId, value < threshold ? 'warning' : 'danger', condition.sensor, value, `Rule "${rule.name}" triggered`);
            
            const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId);
            broadcast({ type: 'alert', action: 'created', data: alert });
          }
          
          const historyEntry = {
            id: `history-${Date.now()}`,
            action: `${action.type} (${action.target})`,
            trigger: `${condition.sensor} ${condition.operator} ${threshold}`,
            status: 'success',
            timestamp: new Date().toISOString()
          };
          
          db.prepare(`
            INSERT INTO history (id, action, trigger, status, timestamp)
            VALUES (?, ?, ?, ?, ?)
          `).run(historyEntry.id, historyEntry.action, historyEntry.trigger, historyEntry.status, historyEntry.timestamp);
          
          broadcast({ type: 'rule-triggered', data: { rule: rule.id, action: action.type } });
          broadcast({ type: 'history', action: 'added', data: historyEntry });
          
          logger.info(`Rule triggered: ${rule.name}`);
        }
      }
    });
  } catch (err) {
    logger.error('Rule check error:', err);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { createApp, startServer };
