"use strict";

const logger = require('../config/logger');

class SkillRegistry {
  constructor() {
    this.skills = new Map();
    this.agentSkillMap = new Map();
    this.skillHistory = [];
    this.initDefaultMappings();
  }

  initDefaultMappings() {
    this.agentSkillMap.set('system_health', [
      { skill: 'system-health-scorer', weight: 1.0, priority: 'high' },
      { skill: 'auto-backup', weight: 0.8, priority: 'medium' },
      { skill: 'cleanup-agent', weight: 0.6, priority: 'low' }
    ]);

    this.agentSkillMap.set('security_monitor', [
      { skill: 'intrusion-detector', weight: 1.0, priority: 'critical' },
      { skill: 'vuln-scanner', weight: 0.9, priority: 'high' },
      { skill: 'audit-trail', weight: 0.7, priority: 'medium' }
    ]);

    this.agentSkillMap.set('performance_tuner', [
      { skill: 'db-optimizer', weight: 1.0, priority: 'high' },
      { skill: 'cleanup-agent', weight: 0.8, priority: 'medium' },
      { skill: 'log-rotator', weight: 0.6, priority: 'low' }
    ]);

    this.agentSkillMap.set('alert_aggregator', [
      { skill: 'alert-deduper', weight: 1.0, priority: 'high' },
      { skill: 'incident-correlator', weight: 0.9, priority: 'high' }
    ]);

    this.agentSkillMap.set('irrigation', [
      { skill: 'water-optimization', weight: 1.0, priority: 'high' },
      { skill: 'weather-decision', weight: 0.8, priority: 'medium' }
    ]);

    this.agentSkillMap.set('climate', [
      { skill: 'weather-decision', weight: 1.0, priority: 'high' },
      { skill: 'crop-growth-tracker', weight: 0.7, priority: 'medium' }
    ]);

    this.agentSkillMap.set('pest_control', [
      { skill: 'pest-alert', weight: 1.0, priority: 'critical' },
      { skill: 'fertilizer-scheduler', weight: 0.6, priority: 'low' }
    ]);

    this.agentSkillMap.set('energy_saver', [
      { skill: 'energy-saver', weight: 1.0, priority: 'high' }
    ]);
  }

  registerSkill(name, handler, metadata = {}) {
    this.skills.set(name, {
      name,
      handler,
      metadata,
      enabled: true,
      lastUsed: null,
      successCount: 0,
      failCount: 0
    });
    logger.info(`[SkillRegistry] Registered skill: ${name}`);
  }

  getSkillsForAgent(agentName) {
    return this.agentSkillMap.get(agentName) || [];
  }

  async executeSkill(skillName, context) {
    const skill = this.skills.get(skillName);
    if (!skill || !skill.enabled) {
      return { success: false, error: 'Skill not found or disabled' };
    }

    try {
      const startTime = Date.now();
      const result = await skill.handler(context);
      const duration = Date.now() - startTime;

      skill.lastUsed = new Date().toISOString();
      skill.successCount++;

      this.logExecution(skillName, context, result, duration, true);

      return {
        success: true,
        skill: skillName,
        result,
        duration,
        metadata: skill.metadata
      };
    } catch (error) {
      skill.failCount++;
      this.logExecution(skillName, context, error.message, 0, false);

      return {
        success: false,
        skill: skillName,
        error: error.message,
        metadata: skill.metadata
      };
    }
  }

  logExecution(skillName, context, result, duration, success) {
    this.skillHistory.push({
      skill: skillName,
      context: this.sanitizeContext(context),
      result: typeof result === 'object' ? 'object' : result,
      duration,
      success,
      timestamp: new Date().toISOString()
    });

    if (this.skillHistory.length > 1000) {
      this.skillHistory = this.skillHistory.slice(-500);
    }
  }

  sanitizeContext(context) {
    const sanitized = { ...context };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) sanitized[field] = '***';
    });
    return sanitized;
  }

  getSkillStats() {
    const stats = {};
    for (const [name, skill] of this.skills) {
      stats[name] = {
        enabled: skill.enabled,
        lastUsed: skill.lastUsed,
        successCount: skill.successCount,
        failCount: skill.failCount,
        successRate: skill.successCount / (skill.successCount + skill.failCount || 1) * 100
      };
    }
    return stats;
  }

  getSkillHistory(limit = 50) {
    return this.skillHistory.slice(-limit);
  }

  enableSkill(skillName) {
    const skill = this.skills.get(skillName);
    if (skill) {
      skill.enabled = true;
      return true;
    }
    return false;
  }

  disableSkill(skillName) {
    const skill = this.skills.get(skillName);
    if (skill) {
      skill.enabled = false;
      return true;
    }
    return false;
  }

  mapAgentToSkills(agentName, skillMappings) {
    this.agentSkillMap.set(agentName, skillMappings);
  }
}

class SkillOrchestrator {
  constructor() {
    this.registry = new SkillRegistry();
    this.executionQueue = [];
    this.isProcessing = false;
    this.loadSkills();
  }

  loadSkills() {
    const skillLoaders = [
      { name: 'system-health-scorer', file: '../skills/analysis/system-health-scorer.skill', optional: true },
      { name: 'auto-backup', file: '../skills/analysis/auto-backup.skill', optional: true },
      { name: 'cleanup-agent', file: '../skills/maintenance/cleanup-agent.skill', optional: true },
      { name: 'intrusion-detector', file: '../skills/defense/intrusion-detector.skill', optional: true },
      { name: 'vuln-scanner', file: '../skills/security/vuln-scanner.skill', optional: true },
      { name: 'audit-trail', file: '../skills/governance/audit-trail.skill', optional: true },
      { name: 'db-optimizer', file: '../skills/maintenance/db-optimizer.skill', optional: true },
      { name: 'log-rotator', file: '../skills/maintenance/log-rotator.skill', optional: true },
      { name: 'alert-deduper', file: '../skills/data/alert-deduper.skill', optional: true },
      { name: 'incident-correlator', file: '../skills/data/incident-correlator.skill', optional: true },
      { name: 'water-optimization', file: '../skills/agriculture/water-optimization.skill', optional: true },
      { name: 'weather-decision', file: '../skills/agriculture/weather-decision.skill', optional: true },
      { name: 'crop-growth-tracker', file: '../skills/agriculture/crop-growth-tracker.skill', optional: true },
      { name: 'pest-alert', file: '../skills/agriculture/pest-alert.skill', optional: true },
      { name: 'fertilizer-scheduler', file: '../skills/agriculture/fertilizer-scheduler.skill', optional: true },
      { name: 'energy-saver', file: '../skills/iot/energy-saver.skill', optional: true }
    ];

    skillLoaders.forEach(({ name, file, optional }) => {
      try {
        const skillModule = require(file);
        const handler = skillModule.execute || skillModule.handler || skillModule;
        this.registry.registerSkill(name, handler, { category: name.split('-')[0] });
      } catch (e) {
        if (!optional) {
          logger.warn(`[SkillOrchestrator] Failed to load skill ${name}: ${e.message}`);
        }
      }
    });
  }

  async orchestrate(agentName, context, options = {}) {
    const { parallel = false, timeout = 5000 } = options;

    const skillMappings = this.registry.getSkillsForAgent(agentName);
    if (skillMappings.length === 0) {
      return { agent: agentName, actions: [], message: 'No skills mapped' };
    }

    const results = [];

    if (parallel) {
      const promises = skillMappings.map(async ({ skill, weight }) => {
        try {
          const result = await this.executeWithTimeout(skill, context, timeout);
          return { skill, weight, ...result };
        } catch (e) {
          return { skill, weight, success: false, error: e.message };
        }
      });
      results.push(...await Promise.all(promises));
    } else {
      for (const { skill, weight, priority } of skillMappings) {
        if (priority === 'critical' || priority === 'high') {
          try {
            const result = await this.executeWithTimeout(skill, context, timeout);
            results.push({ skill, weight, ...result });
            if (result.success && priority === 'critical') break;
          } catch (e) {
            results.push({ skill, weight, success: false, error: e.message });
          }
        }
      }
    }

    const successful = results.filter(r => r.success);
    return {
      agent: agentName,
      context,
      executed: results.length,
      successful: successful.length,
      results: results.filter(r => r.success),
      recommendations: this.generateRecommendations(results)
    };
  }

  async executeWithTimeout(skillName, context, timeout) {
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('Skill execution timeout')), timeout);
    });

    const executionPromise = this.registry.executeSkill(skillName, context);

    try {
      return await Promise.race([executionPromise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    const successRate = results.filter(r => r.success).length / results.length;
    if (successRate < 0.5) {
      recommendations.push({
        type: 'optimization',
        message: 'Low skill success rate - consider checking skill configurations'
      });
    }

    const criticalFails = results.filter(r => !r.success && r.error);
    if (criticalFails.length > 0) {
      recommendations.push({
        type: 'alert',
        message: `${criticalFails.length} skills failed - review error logs`
      });
    }

    return recommendations;
  }

  getStats() {
    return {
      registered: this.registry.skills.size,
      mappings: this.registry.agentSkillMap.size,
      history: this.registry.skillHistory.length,
      stats: this.registry.getSkillStats()
    };
  }
}

let orchestrator = null;

function getOrchestrator() {
  if (!orchestrator) {
    orchestrator = new SkillOrchestrator();
  }
  return orchestrator;
}

module.exports = {
  SkillOrchestrator,
  SkillRegistry,
  getOrchestrator
};