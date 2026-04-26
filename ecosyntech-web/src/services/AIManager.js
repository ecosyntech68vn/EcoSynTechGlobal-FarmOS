"use strict";

const os = require('os');

const AGRICULTURE_THRESHOLDS = {
  irrigation: { critical: 20, warning: 40, optimal: 60 },
  climate: { critical: 34, warning: 30 },
  soil_health: { critical: 15, warning: 30, optimal: 50 },
  energy_saver: { critical: 80, warning: 60, optimal: 40 },
  pest_control: { critical: 70, warning: 50, optimal: 25 }
};

const SYSTEM_THRESHOLDS = {
  system_health: { cpu: 90, ram: 90, disk: 95 },
  security_monitor: { failedLogins: 5 },
  performance_tuner: { responseTime: 2000, errorRate: 5 },
  alert_aggregator: { alertCount: 20 }
};

class Agent {
  constructor(field) {
    this.field = field;
    this.memory = {};
    this.thresholds = AGRICULTURE_THRESHOLDS[field] || SYSTEM_THRESHOLDS[field] || { critical: 80, warning: 60 };
  }

  think(context = {}) {
    const field = this.field;
    const ctx = context[field] || context;
    const result = { field, action: 'no_action', details: {}, confidence: 0.8 };
    const th = this.thresholds;

    if (field === 'irrigation') {
      const soil = typeof ctx.soilMoisture === 'number' ? ctx.soilMoisture : null;
      if (soil !== null) {
        if (soil < th.critical) {
          result.action = 'irrigate';
          result.details = { level: 'high', soilMoisture: soil, reason: 'critical_low_moisture' };
        } else if (soil < th.warning) {
          result.action = 'irrigate';
          result.details = { level: 'medium', soilMoisture: soil, reason: 'warning_low_moisture' };
        } else if (soil >= th.optimal && ctx.forecast === 'rain') {
          result.action = 'delay_irrigation';
          result.details = { reason: 'rain_forecasted', forecast: 'rain' };
        }
      }
    }
    else if (field === 'climate' || field === 'weather') {
      const forecast = ctx.forecast || context.forecast;
      const temp = typeof ctx.temperature === 'number' ? ctx.temperature : context.temperature;
      if (forecast === 'dry' || (typeof temp === 'number' && temp > th.critical)) {
        result.action = 'adjust_irrigation_schedule';
        result.details = { reason: 'dry_heat', forecast, temperature: temp };
      } else if (forecast === 'rain' || temp < 20) {
        result.action = 'reduce_irrigation';
        result.details = { reason: 'cool_rainy', forecast, temperature: temp };
      }
    }
    else if (field === 'soil_health') {
      const ph = typeof ctx.ph === 'number' ? ctx.ph : null;
      const nitrogen = typeof ctx.nitrogen === 'number' ? ctx.nitrogen : null;
      if (ph !== null) {
        if (ph < 5.5) {
          result.action = 'apply_lime';
          result.details = { ph, reason: 'acidic_soil', severity: 'high' };
        } else if (ph > 7.5) {
          result.action = 'apply_sulfur';
          result.details = { ph, reason: 'alkaline_soil', severity: 'medium' };
        } else if (ph >= 6.0 && ph <= 7.0) {
          result.action = 'optimal';
          result.details = { ph, reason: 'optimal_ph_range' };
        }
      }
      if (nitrogen !== null && result.action === 'no_action' && nitrogen < 20) {
        result.action = 'apply_nitrogen';
        result.details = { nitrogen, reason: 'nitrogen_deficient' };
      }
    }
    else if (field === 'energy_saver') {
      const powerUsage = typeof ctx.powerUsage === 'number' ? ctx.powerUsage : null;
      const solarOutput = typeof ctx.solarOutput === 'number' ? ctx.solarOutput : null;
      const hour = typeof ctx.hour === 'number' ? ctx.hour : new Date().getHours();
      if (powerUsage !== null) {
        if (powerUsage > th.critical) {
          result.action = 'reduce_load';
          result.details = { powerUsage, reason: 'high_power_consumption', severity: 'critical' };
        } else if (powerUsage > th.warning) {
          result.action = 'optimize_schedule';
          result.details = { powerUsage, reason: 'moderate_power_usage' };
        }
      }
      if (solarOutput !== null && solarOutput > 70 && hour >= 10 && hour <= 14) {
        result.details.solar_optimization = true;
      }
    }
    else if (field === 'pest_control') {
      const humidity = typeof ctx.humidity === 'number' ? ctx.humidity : null;
      const temperature = typeof ctx.temperature === 'number' ? ctx.temperature : null;
      const pestRisk = typeof ctx.pestRisk === 'number' ? ctx.pestRisk : null;
      if (pestRisk !== null) {
        if (pestRisk > th.critical) {
          result.action = 'activate_spraying';
          result.details = { pestRisk, reason: 'high_pest_risk', severity: 'critical' };
        } else if (pestRisk > th.warning) {
          result.action = 'increase_monitoring';
          result.details = { pestRisk, reason: 'elevated_pest_risk' };
        }
      } else if (humidity !== null && temperature !== null) {
        if (humidity > 80 && temperature >= 20 && temperature <= 30) {
          result.action = 'preventive_spray';
          result.details = { humidity, temperature, reason: 'fungal_conditions' };
        }
      }
    }
    else if (field === 'system_health') {
      const cpu = typeof ctx.cpu === 'number' ? ctx.cpu : 0;
      const ram = typeof ctx.ram === 'number' ? ctx.ram : 0;
      const disk = typeof ctx.disk === 'number' ? ctx.disk : 0;
      const uptime = typeof ctx.uptime === 'number' ? ctx.uptime : 0;
      const reasons = [];

      if (cpu > th.cpu) {
        result.action = 'critical';
        reasons.push('cpu_overload');
        result.details.cpu = cpu;
      } else if (cpu > 80) {
        result.action = 'warning';
        reasons.push('cpu_high');
        result.details.cpu = cpu;
      }

      if (ram > th.ram) {
        if (result.action === 'no_action') result.action = 'critical';
        result.details.ram = ram;
        reasons.push('memory_critical');
      } else if (ram > 80 && result.action === 'no_action') {
        result.action = 'warning';
        result.details.ram = ram;
        reasons.push('memory_high');
      }

      if (disk > th.disk) {
        if (result.action === 'no_action') result.action = 'critical';
        result.details.disk = disk;
        reasons.push('disk_full');
      } else if (disk > 85 && result.action === 'no_action') {
        result.action = 'warning';
        result.details.disk = disk;
        reasons.push('disk_high');
      }

      if (reasons.length > 0) {
        result.details.reason = reasons.join('; ');
        result.details.severity = result.action;
      }

      if (uptime > 0 && uptime < 3600) {
        result.details.recentReboot = true;
      }
      if (result.action === 'no_action') result.action = 'ok';
      result.confidence = 0.9;
    }
    else if (field === 'security_monitor') {
      const failedLogins = typeof ctx.failedLogins === 'number' ? ctx.failedLogins : 0;
      const suspiciousIPs = typeof ctx.suspiciousIPs === 'number' ? ctx.suspiciousIPs : 0;
      const unusualAccess = ctx.unusualAccess === true;
      const anomalies = typeof ctx.anomalies === 'number' ? ctx.anomalies : 0;

      if (failedLogins >= th.failedLogins) {
        result.action = 'block_ip';
        result.details = { failedLogins, reason: 'brute_force_detected', severity: 'critical' };
      } else if (failedLogins >= 3) {
        result.action = 'alert';
        result.details = { failedLogins, reason: 'multiple_failed_logins', severity: 'warning' };
      }

      if (suspiciousIPs > 0) {
        result.details.suspiciousIPs = suspiciousIPs;
        if (result.action === 'no_action') result.action = 'investigate';
      }
      if (unusualAccess) {
        result.action = 'investigate';
        result.details.unusualAccess = true;
        result.details.reason = 'unusual_access_pattern';
      }
      if (anomalies > 3) {
        result.details.anomalyScore = anomalies;
        if (result.action === 'no_action') result.action = 'anomaly_detected';
      }
      if (result.action === 'no_action') { result.action = 'ok'; result.confidence = 0.9; }
    }
    else if (field === 'performance_tuner') {
      const responseTime = typeof ctx.responseTime === 'number' ? ctx.responseTime : 0;
      const errorRate = typeof ctx.errorRate === 'number' ? ctx.errorRate : 0;
      const connections = typeof ctx.connections === 'number' ? ctx.connections : 0;
      const cacheHitRate = typeof ctx.cacheHitRate === 'number' ? ctx.cacheHitRate : 0;

      const reasons = [];
      if (responseTime > th.responseTime) {
        result.action = 'optimize';
        reasons.push('slow_response');
        result.details.responseTime = responseTime;
      }
      if (errorRate > th.errorRate) {
        if (result.action === 'no_action') result.action = 'investigate';
        result.details.errorRate = errorRate;
        reasons.push('high_error_rate');
      }
      if (connections > 100) {
        result.details.highConnections = true;
        if (result.action === 'no_action') result.action = 'scale_resources';
        reasons.push('high_connections');
      }
      if (cacheHitRate < 50) {
        result.details.cacheOptimization = true;
        reasons.push('low_cache_hit_rate');
      }
      if (reasons.length > 0) {
        result.details.reason = reasons.join('; ');
      }
      if (result.action === 'no_action') { result.action = 'ok'; result.confidence = 0.9; }
    }
    else if (field === 'alert_aggregator') {
      const alertCount = typeof ctx.alertCount === 'number' ? ctx.alertCount : 0;
      const alertType = ctx.alertType || 'mixed';

      if (alertCount > th.alertCount) {
        result.action = 'group_alerts';
        result.details = { alertCount, reason: 'alert_fatigue_prevention', groupBy: 'severity' };
      } else if (alertCount > 10) {
        result.action = 'summarize';
        result.details = { alertCount, reason: 'reduce_noise' };
      }
      if (alertType === 'sensor' && alertCount > 5) {
        result.details.recommendation = 'consider_sensor_maintenance';
      }
      if (result.action === 'no_action') { result.action = 'ok'; result.confidence = 0.9; }
    }

    this.memory.lastDecision = result;
    return result;
  }
}

class AIManager {
  constructor() {
    this.agents = new Map();
    this.totalMem = os.totalmem();
    this.availableMemGB = this.totalMem / (1024 * 1024 * 1024);
    this.mode = this.availableMemGB >= 4 ? 'hybrid' : 'heuristic_only';
    ['irrigation', 'climate', 'soil_health', 'energy_saver', 'pest_control',
     'system_health', 'security_monitor', 'performance_tuner', 'alert_aggregator'].forEach(name => {
      this.registerAgent(name);
    });
  }

  getMode() {
    return this.mode;
  }

  registerAgent(name) {
    const agent = new Agent(name);
    this.agents.set(name, agent);
    return agent;
  }

  getAgent(name) {
    return this.agents.get(name);
  }

  getOrCreateAgent(name) {
    if (this.agents.has(name)) return this.agents.get(name);
    return this.registerAgent(name);
  }

  thinkForField(field, context = {}) {
    const agent = this.getOrCreateAgent(field);
    return agent.think(context);
  }

  thinkForAll(context = {}) {
    const results = {};
    for (const [name, agent] of this.agents) {
      results[name] = agent.think(context);
    }
    return results;
  }

  getInsights(context = {}) {
    const all = this.thinkForAll(context);
    const actions = Object.values(all).filter(r => r.action !== 'no_action' && r.action !== 'ok');
    return {
      mode: this.mode,
      totalAgents: this.agents.size,
      actionableCount: actions.length,
      actions: actions.map(a => ({ field: a.field, action: a.action, details: a.details }))
    };
  }
}

module.exports = { AIManager };