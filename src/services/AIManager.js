"use strict";

const os = require('os');

class Agent {
  constructor(field) {
    this.field = field;
    this.memory = {};
    this.thresholds = this.getThresholds(field);
  }

  getThresholds(field) {
    const defaults = { critical: 20, warning: 40, optimal: 60 };
    const custom = {
      soil_health: { critical: 15, warning: 30, optimal: 50 },
      energy_saver: { critical: 80, warning: 60, optimal: 40 },
      pest_control: { critical: 70, warning: 50, optimal: 25 }
    };
    return custom[field] || defaults;
  }

  remember(key, value) {
    this.memory[key] = value;
  }

  recall(key, defaultValue) {
    if (this.memory.hasOwnProperty(key)) return this.memory[key];
    return defaultValue;
  }

  think(context = {}) {
    const field = this.field;
    const ctx = context[field] || context;
    const result = { field, action: 'no_action', details: {}, confidence: 0.8 };

    if (field === 'irrigation') {
      const soil = typeof ctx.soilMoisture === 'number' ? ctx.soilMoisture : null;
      if (soil !== null) {
        if (soil < this.thresholds.critical) {
          result.action = 'irrigate';
          result.details = { level: 'high', soilMoisture: soil, reason: 'critical_low_moisture' };
        } else if (soil < this.thresholds.warning) {
          result.action = 'irrigate';
          result.details = { level: 'medium', soilMoisture: soil, reason: 'warning_low_moisture' };
        } else if (soil >= this.thresholds.optimal && ctx.forecast === 'rain') {
          result.action = 'delay_irrigation';
          result.details = { reason: 'rain_forecasted', forecast: 'rain' };
        } else {
          result.action = 'no_action';
        }
      }
    }
    else if (field === 'climate' || field === 'weather') {
      const forecast = ctx.forecast || context.forecast;
      const temp = typeof ctx.temperature === 'number' ? ctx.temperature : context.temperature;
      if (forecast === 'dry' || (typeof temp === 'number' && temp > 34)) {
        result.action = 'adjust_irrigation_schedule';
        result.details = { reason: 'dry_heat', forecast, temperature: temp };
      } else if (forecast === 'rain' || temp < 20) {
        result.action = 'reduce_irrigation';
        result.details = { reason: 'cool_rainy', forecast, temperature: temp };
      } else {
        result.action = 'no_action';
      }
    }
    else if (field === 'soil_health') {
      const ph = typeof ctx.ph === 'number' ? ctx.ph : null;
      const nitrogen = typeof ctx.nitrogen === 'number' ? ctx.nitrogen : null;
      const phosphorus = typeof ctx.phosphorus === 'number' ? ctx.phosphorus : null;
      const potassium = typeof ctx.potassium === 'number' ? ctx.potassium : null;
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
      if (nitrogen !== null && result.action === 'no_action') {
        if (nitrogen < 20) {
          result.action = 'apply_nitrogen';
          result.details = { nitrogen, reason: 'nitrogen_deficient' };
        }
      }
    }
    else if (field === 'energy_saver') {
      const powerUsage = typeof ctx.powerUsage === 'number' ? ctx.powerUsage : null;
      const solarOutput = typeof ctx.solarOutput === 'number' ? ctx.solarOutput : null;
      const hour = typeof ctx.hour === 'number' ? ctx.hour : new Date().getHours();
      if (powerUsage !== null) {
        if (powerUsage > this.thresholds.critical) {
          result.action = 'reduce_load';
          result.details = { powerUsage, reason: 'high_power_consumption', severity: 'critical' };
        } else if (powerUsage > this.thresholds.warning) {
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
        if (pestRisk > this.thresholds.critical) {
          result.action = 'activate_spraying';
          result.details = { pestRisk, reason: 'high_pest_risk', severity: 'critical' };
        } else if (pestRisk > this.thresholds.warning) {
          result.action = 'increase_monitoring';
          result.details = { pestRisk, reason: 'elevated_pest_risk' };
        } else {
          result.action = 'no_action';
        }
      } else if (humidity !== null && temperature !== null) {
        if (humidity > 80 && temperature >= 20 && temperature <= 30) {
          result.action = 'preventive_spray';
          result.details = { humidity, temperature, reason: 'fungal_conditions' };
        }
      }
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
    ['irrigation', 'climate', 'soil_health', 'energy_saver', 'pest_control'].forEach(name => {
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
    const actions = Object.values(all).filter(r => r.action !== 'no_action');
    return {
      mode: this.mode,
      totalAgents: this.agents.size,
      actionableCount: actions.length,
      actions: actions.map(a => ({ field: a.field, action: a.action, details: a.details }))
    };
  }
}

module.exports = { AIManager };
