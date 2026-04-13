const { getOne, getAll, runQuery } = require('../config/database');
const logger = require('../config/logger');

const ADVISORY_RULES = {
  temperature: [
    { threshold: 35, level: 'critical', message: 'Nhiệt độ quá cao! Cần bật quạt ngay', action: 'fan_on' },
    { threshold: 30, level: 'warning', message: 'Nhiệt độ cao, cần theo dõi', action: 'alert' },
    { threshold: 15, level: 'warning', message: 'Nhiệt độ thấp, cần kiểm tra', action: 'alert' },
    { threshold: 10, level: 'critical', message: 'Nhiệt độ quá thấp! Nguy hiểm cho cây trồng', action: 'heater_on' }
  ],
  humidity: [
    { threshold: 90, level: 'warning', message: 'Độ ẩm cao, nguy cơ nấm bệnh', action: 'ventilate' },
    { threshold: 70, level: 'warning', message: 'Độ ẩm cao, cần thông gió', action: 'ventilate' },
    { threshold: 40, level: 'warning', message: 'Độ ẩm thấp, cần tưới nước', action: 'irrigate' },
    { threshold: 25, level: 'critical', message: 'Độ ẩm quá thấp! Khẩn cấp tưới nước', action: 'irrigate_emergency' }
  ],
  soil_moisture: [
    { threshold: 30, level: 'warning', message: 'Độ ẩm đất thấp, cần tưới', action: 'irrigate' },
    { threshold: 20, level: 'critical', message: 'Đất quá khô! Tưới ngay', action: 'irrigate_emergency' },
    { threshold: 80, level: 'warning', message: 'Độ ẩm đất cao, giảm tưới', action: 'stop_irrigation' }
  ],
  co2: [
    { threshold: 1000, level: 'critical', message: 'CO2 quá cao! Thông gió ngay', action: 'ventilate_emergency' },
    { threshold: 800, level: 'warning', message: 'CO2 cao, cần thông gió', action: 'ventilate' }
  ],
  light: [
    { threshold: 60, level: 'warning', message: 'Cường độ sáng cao, che bóng', action: 'shade_on' },
    { threshold: 10, level: 'warning', message: 'Ánh sáng thấp, bật đèn grow', action: 'light_on' }
  ],
  ph: [
    { threshold: 8.0, level: 'critical', message: 'pH đất kiềm quá cao', action: 'adjust_ph_down' },
    { threshold: 5.5, level: 'critical', message: 'pH đất axit quá thấp', action: 'adjust_ph_up' }
  ],
  ec: [
    { threshold: 3.5, level: 'critical', message: 'EC quá cao! Rửa ngay', action: 'flush_water' },
    { threshold: 1.0, level: 'warning', message: 'EC thấp, cần bón phân', action: 'fertilize' }
  ]
};

class AdvisoryEngine {
  static analyzeLatestReadings(readings) {
    const alerts = [];
    const recommendations = [];

    readings.forEach(reading => {
      const rules = ADVISORY_RULES[reading.type];
      if (!rules) return;

      const value = parseFloat(reading.value);
      
      for (const rule of rules) {
        let triggered = false;
        
        if (rule.threshold > 0 && value >= rule.threshold) {
          triggered = true;
        } else if (rule.threshold < 0 && reading.type === 'temperature' && value <= Math.abs(rule.threshold)) {
          triggered = true;
        }

        if (triggered && rule.level === 'critical') {
          alerts.push({
            code: `${reading.type.toUpperCase()}_${rule.level.toUpperCase()}`,
            type: reading.type,
            value: value,
            level: rule.level,
            message: rule.message,
            action: rule.action,
            zone: reading.zone,
            timestamp: new Date().toISOString()
          });
          break;
        }
      }

      if (reading.type === 'temperature' && value > 28) {
        recommendations.push({ type: 'temperature', message: 'Nhiệt độ cao - khuyến nghị bật quạt', priority: 'medium' });
      }
      if (reading.type === 'humidity' && value < 50) {
        recommendations.push({ type: 'humidity', message: 'Độ ẩm thấp - khuyến nghị tưới nước', priority: 'medium' });
      }
      if (reading.type === 'soil_moisture' && value < 40) {
        recommendations.push({ type: 'soil', message: 'Đất khô - khuyến nghị tưới', priority: 'high' });
      }
    });

    return { alerts, recommendations };
  }

  static generateReport(readings, batchId = null) {
    const analysis = this.analyzeLatestReadings(readings);
    const avgValues = {};
    
    readings.forEach(r => {
      if (!avgValues[r.type]) avgValues[r.type] = [];
      avgValues[r.type].push(parseFloat(r.value));
    });

    const summary = Object.entries(avgValues).map(([type, values]) => ({
      type,
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2)
    }));

    return {
      batch_id: batchId,
      timestamp: new Date().toISOString(),
      summary,
      alerts: analysis.alerts,
      recommendations: analysis.recommendations
    };
  }
}

class SmartControlEngine {
  static lastExecution = new Map();
  static sensorCache = new Map();
  static cacheTimeout = 5000;

  static clearCache() {
    this.sensorCache.clear();
  }

  static getSensorValue(sensorType) {
    const now = Date.now();
    if (this.sensorCache.has(sensorType)) {
      const cached = this.sensorCache.get(sensorType);
      if (now - cached.timestamp < this.cacheTimeout) {
        return cached.value;
      }
    }
    const sensor = getOne('SELECT value, timestamp FROM sensors WHERE type = ?', [sensorType]);
    if (sensor) {
      this.sensorCache.set(sensorType, { value: parseFloat(sensor.value), timestamp: now });
      return parseFloat(sensor.value);
    }
    return null;
  }

  static checkTimeWindow(timeWindow) {
    if (!timeWindow) return true;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    if (timeWindow.startHour !== undefined && timeWindow.endHour !== undefined) {
      if (currentHour < timeWindow.startHour || currentHour >= timeWindow.endHour) {
        return false;
      }
    }
    
    if (timeWindow.daysOfWeek && timeWindow.daysOfWeek.length > 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      if (!timeWindow.daysOfWeek.includes(dayNames[currentDay])) {
        return false;
      }
    }
    
    return true;
  }

  static checkCondition(condition, sensorMap) {
    if (condition.type === 'and') {
      return condition.conditions?.every(c => this.checkCondition(c, sensorMap)) ?? false;
    }
    
    if (condition.type === 'or') {
      return condition.conditions?.some(c => this.checkCondition(c, sensorMap)) ?? false;
    }

    const sensor = sensorMap[condition.sensor];
    if (!sensor) return false;

    const value = parseFloat(sensor.value);
    const threshold = parseFloat(condition.value);
    const hysteresis = condition.hysteresis || 0;

    switch (condition.operator) {
    case '>': 
      return hysteresis > 0 ? value > threshold + hysteresis : value > threshold;
    case '<': 
      return hysteresis > 0 ? value < threshold - hysteresis : value < threshold;
    case '>=': return value >= threshold;
    case '<=': return value <= threshold;
    case '==': return Math.abs(value - threshold) < 0.01;
    case '!=': return Math.abs(value - threshold) >= 0.01;
    case 'between':
      return value >= (condition.min || threshold - 1) && value <= (condition.max || threshold + 1);
    default:
      return false;
    }
  }

  static async evaluateRules(readings, deviceId = null) {
    const rules = getAll('SELECT * FROM rules WHERE enabled = 1');
    const actions = [];
    const now = Date.now();

    const sensorMap = {};
    readings.forEach(r => { sensorMap[r.type] = r; });

    for (const rule of rules) {
      try {
        const ruleId = rule.id;
        const cooldownMs = (rule.cooldown_minutes || 30) * 60 * 1000;
        
        if (this.lastExecution.has(ruleId)) {
          const lastExec = this.lastExecution.get(ruleId);
          if (now - lastExec < cooldownMs) {
            continue;
          }
        }

        const timeWindow = rule.time_window ? JSON.parse(rule.time_window) : null;
        if (timeWindow && !this.checkTimeWindow(timeWindow)) {
          continue;
        }

        let condition;
        try {
          condition = JSON.parse(rule.condition);
        } catch (e) {
          logger.warn(`[SmartControl] Invalid condition JSON for rule ${ruleId}`);
          continue;
        }

        const triggered = this.checkCondition(condition, sensorMap);

        if (triggered) {
          this.lastExecution.set(ruleId, now);
          
          let action;
          try {
            action = JSON.parse(rule.action || rule.action_config || '{}');
          } catch (e) {
            action = { type: 'alert', target: 'all' };
          }

          const actionItem = {
            rule_id: ruleId,
            rule_name: rule.name,
            trigger: typeof rule.condition === 'string' ? rule.condition : JSON.stringify(condition),
            action: action.type || 'alert',
            target: action.target || 'all',
            device_id: deviceId,
            priority: action.priority || 'normal',
            duration_sec: action.durationSec || 0,
            timestamp: new Date().toISOString()
          };

          if (action.priority === 'high' || action.require_confirm) {
            actionItem.require_confirm = true;
            actionItem.status = 'pending_confirm';
          }

          actions.push(actionItem);

          runQuery(
            `INSERT INTO rule_history (id, rule_id, sensor_value, triggered, action_taken, executed_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [require('uuid').v4(), ruleId, JSON.stringify(sensorMap), 1, JSON.stringify(action), new Date().toISOString()]
          );

          runQuery(
            'UPDATE rules SET trigger_count = trigger_count + 1, last_triggered = ? WHERE id = ?',
            [new Date().toISOString(), ruleId]
          );

          logger.info(`[SmartControl] Rule triggered: ${rule.name} (${ruleId})`);
        }
      } catch (err) {
        logger.error(`[SmartControl] Rule evaluation error: ${rule.id}`, err);
      }
    }

    return actions;
  }

  static async executeAction(action) {
    if (action.require_confirm) {
      logger.info(`[SmartControl] Action requires confirmation: ${action.rule_name}`);
      return { status: 'pending_confirm', action };
    }

    switch (action.action) {
    case 'relay_on':
    case 'relay1_on':
    case 'relay2_on':
      return { status: 'executed', type: 'relay', command: 'on', target: action.target };
      
    case 'relay_off':
    case 'relay1_off':
    case 'relay2_off':
      return { status: 'executed', type: 'relay', command: 'off', target: action.target };
      
    case 'alert':
      runQuery(
        'INSERT INTO alerts (id, type, severity, sensor, value, message, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [require('uuid').v4(), 'rule', 'warning', 'system', 0, `Rule triggered: ${action.rule_name}`, new Date().toISOString()]
      );
      return { status: 'executed', type: 'alert' };
      
    case 'webhook':
      return { status: 'executed', type: 'webhook', target: action.target };
      
    case 'notification':
      return { status: 'executed', type: 'notification' };
      
    case 'irrigate':
    case 'irrigate_emergency':
      return { status: 'executed', type: 'irrigation', command: action.action };
      
    case 'fan_on':
    case 'fan_off':
    case 'ventilate':
      return { status: 'executed', type: 'fan', command: action.action };
      
    default:
      logger.warn(`[SmartControl] Unknown action type: ${action.action}`);
      return { status: 'unknown_action' };
    }
  }

  static getActiveRules() {
    return getAll('SELECT * FROM rules WHERE enabled = 1');
  }

  static getRulesByDevice(deviceId) {
    return getAll(
      'SELECT * FROM rules WHERE enabled = 1 AND (target_device = ? OR target_device IS NULL OR target_device = "")',
      [deviceId]
    );
  }

  static getRuleStats() {
    const total = getOne('SELECT COUNT(*) as count FROM rules');
    const enabled = getOne('SELECT COUNT(*) as count FROM rules WHERE enabled = 1');
    const triggeredToday = getOne(
      'SELECT COUNT(*) as count FROM rule_history WHERE DATE(executed_at) = DATE(\'now\') AND triggered = 1'
    );
    const avgTrigger = getOne(
      'SELECT AVG(trigger_count) as avg FROM rules WHERE trigger_count > 0'
    );

    return {
      total: total?.count || 0,
      enabled: enabled?.count || 0,
      triggered_today: triggeredToday?.count || 0,
      avg_trigger_count: avgTrigger?.avg ? parseFloat(avgTrigger.avg).toFixed(1) : 0
    };
  }

  static createRule(name, condition, action, options = {}) {
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    
    const ruleData = {
      condition: typeof condition === 'string' ? condition : JSON.stringify(condition),
      action: typeof action === 'string' ? action : JSON.stringify(action),
      enabled: options.enabled !== false ? 1 : 0,
      cooldown_minutes: options.cooldownMinutes || 30,
      hysteresis: options.hysteresis || 0,
      time_window: options.timeWindow ? JSON.stringify(options.timeWindow) : null,
      priority: options.priority || 'normal',
      target_device: options.targetDevice || null
    };

    runQuery(
      `INSERT INTO rules (id, name, description, enabled, condition, action, cooldown_minutes, hysteresis, time_window, priority, target_device, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, options.description || '', ruleData.enabled, ruleData.condition, ruleData.action, 
        ruleData.cooldown_minutes, ruleData.hysteresis, ruleData.time_window, ruleData.priority, 
        ruleData.target_device, new Date().toISOString()]
    );

    logger.info(`[SmartControl] Rule created: ${name} (${id})`);
    return { id, name, enabled: options.enabled !== false };
  }

  static updateRule(id, updates) {
    const fields = [];
    const params = [];
    
    if (updates.name) { fields.push('name = ?'); params.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); params.push(updates.description); }
    if (updates.enabled !== undefined) { fields.push('enabled = ?'); params.push(updates.enabled ? 1 : 0); }
    if (updates.condition) { fields.push('condition = ?'); params.push(JSON.stringify(updates.condition)); }
    if (updates.action) { fields.push('action = ?'); params.push(JSON.stringify(updates.action)); }
    if (updates.cooldown_minutes) { fields.push('cooldown_minutes = ?'); params.push(updates.cooldown_minutes); }
    if (updates.hysteresis !== undefined) { fields.push('hysteresis = ?'); params.push(updates.hysteresis); }
    if (updates.time_window) { fields.push('time_window = ?'); params.push(JSON.stringify(updates.time_window)); }
    if (updates.priority) { fields.push('priority = ?'); params.push(updates.priority); }
    
    if (fields.length > 0) {
      params.push(new Date().toISOString(), id);
      runQuery(`UPDATE rules SET ${fields.join(', ')}, updated_at = ? WHERE id = ?`, params);
    }
    
    return { success: true };
  }

  static deleteRule(id) {
    runQuery('DELETE FROM rules WHERE id = ?', [id]);
    this.lastExecution.delete(id);
    return { success: true };
  }

  static getRuleHistory(ruleId = null, limit = 50) {
    if (ruleId) {
      return getAll('SELECT * FROM rule_history WHERE rule_id = ? ORDER BY executed_at DESC LIMIT ?', [ruleId, limit]);
    }
    return getAll('SELECT * FROM rule_history ORDER BY executed_at DESC LIMIT ?', [limit]);
  }

  static testRule(condition, readings) {
    const sensorMap = {};
    readings.forEach(r => { sensorMap[r.type] = r; });
    
    const result = this.checkCondition(condition, sensorMap);
    return { triggered: result, sensor_values: sensorMap };
  }
}

async function sendTelegramNotification(botToken, chatId, message, parseMode = 'HTML') {
  if (!botToken || !chatId) return null;

  const https = require('https');
  const encodedMsg = encodeURIComponent(message);
  const path = `/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodedMsg}&parse_mode=${parseMode}`;

  return new Promise((resolve) => {
    const req = https.get({ hostname: 'api.telegram.org', path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          logger.info(`[Telegram] Notification sent to ${chatId}`);
          resolve(true);
        } else {
          logger.error(`[Telegram] Send error: ${res.statusCode} - ${data}`);
          resolve(false);
        }
      });
    });
    req.on('error', err => {
      logger.error('[Telegram] Send error:', err.message);
      resolve(false);
    });
    req.end();
  });
}

async function processSensorData(data, deviceId) {
  const readings = data.sensor_data || [];
  const batchId = data.batch_id;
  const timestamp = data.timestamp || new Date().toISOString();
  
  readings.forEach(sensor => {
    runQuery(
      'INSERT INTO sensor_readings (id, sensor_type, value, timestamp) VALUES (?, ?, ?, ?)',
      [require('uuid').v4(), sensor.type, sensor.value, timestamp]
    );
    
    const existing = getOne('SELECT id FROM sensors WHERE type = ?', [sensor.type]);
    if (existing) {
      runQuery('UPDATE sensors SET value = ?, timestamp = ? WHERE type = ?', [sensor.value, timestamp, sensor.type]);
    } else {
      runQuery('INSERT INTO sensors (id, type, value, unit, timestamp) VALUES (?, ?, ?, ?, ?)',
        [require('uuid').v4(), sensor.type, sensor.value, 'unit', timestamp]);
    }
    
    SmartControlEngine.sensorCache.set(sensor.type, { value: parseFloat(sensor.value), timestamp: Date.now() });
  });

  const advisoryResult = AdvisoryEngine.analyzeLatestReadings(readings);
  
  advisoryResult.alerts.forEach(alert => {
    runQuery(
      'INSERT INTO alerts (id, type, severity, sensor, value, message, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [require('uuid').v4(), alert.type, alert.level, alert.type, alert.value, alert.message, new Date().toISOString()]
    );
  });

  const smartActions = await SmartControlEngine.evaluateRules(readings, deviceId);
  
  for (const action of smartActions) {
    const execResult = await SmartControlEngine.executeAction(action);
    action.execution_status = execResult.status;
    
    runQuery(
      'INSERT INTO history (id, action, trigger, status, timestamp) VALUES (?, ?, ?, ?, ?)',
      [require('uuid').v4(), `${action.action} (${action.target})`, action.trigger, execResult.status, new Date().toISOString()]
    );
  }

  return {
    success: true,
    processed: readings.length,
    alerts: advisoryResult.alerts.length,
    actions: smartActions.length,
    action_details: smartActions
  };
}

module.exports = {
  AdvisoryEngine,
  SmartControlEngine,
  processSensorData,
  sendTelegramNotification,
  ADVISORY_RULES
};