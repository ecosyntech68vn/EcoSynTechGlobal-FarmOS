'use strict';

const os = require('os');
const { AIManager } = require('./AIManager');
const { getOrchestrator } = require('./skillOrchestrator');
const logger = require('../config/logger');

class ContextualLearning {
  constructor(options = {}) {
    this.history = [];
    this.maxHistory = options.maxHistory || 1000;
    this.patterns = new Map();
    this.learnedThresholds = new Map();
  }

  record(agentName, input, output, outcome) {
    this.history.push({
      agent: agentName,
      input: this.sanitize(input),
      output,
      outcome,
      timestamp: Date.now()
    });

    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory / 2);
    }

    this.learn(input, output, outcome);
  }

  sanitize(obj) {
    const sanitized = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'number') sanitized[k] = v;
      else if (typeof v === 'string') sanitized[k] = v.substring(0, 50);
    }
    return sanitized;
  }

  learn(input, output, outcome) {
    if (outcome === 'success') {
      const key = this.extractPatternKey(input);
      const current = this.patterns.get(key) || { success: 0, total: 0 };
      current.success++;
      current.total++;
      this.patterns.set(key, current);
    }
  }

  extractPatternKey(input) {
    const keys = Object.keys(input).sort().slice(0, 3);
    return keys.map(k => `${k}:${input[k]}`).join('|');
  }

  getLearnedThreshold(agentName, metric) {
    const key = `${agentName}:${metric}`;
    return this.learnedThresholds.get(key);
  }

  adaptThreshold(agentName, metric, currentValue, suggestedThreshold) {
    const key = `${agentName}:${metric}`;
    const recent = this.history
      .filter(h => h.agent === agentName)
      .slice(-50)
      .map(h => h.input[metric])
      .filter(v => v !== undefined);

    if (recent.length >= 10) {
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const adaptedThreshold = Math.round((suggestedThreshold * 0.7) + (avg * 0.3));
      this.learnedThresholds.set(key, adaptedThreshold);
      return adaptedThreshold;
    }

    return suggestedThreshold;
  }

  getInsights() {
    const agentStats = {};
    for (const entry of this.history) {
      if (!agentStats[entry.agent]) {
        agentStats[entry.agent] = { total: 0, success: 0 };
      }
      agentStats[entry.agent].total++;
      if (entry.outcome === 'success') {
        agentStats[entry.agent].success++;
      }
    }

    return {
      totalRecords: this.history.length,
      agents: Object.entries(agentStats).map(([agent, stats]) => ({
        agent,
        total: stats.total,
        successRate: (stats.success / stats.total * 100).toFixed(1) + '%'
      }))
    };
  }
}

class PredictiveAlerting {
  constructor(options = {}) {
    this.alertHistory = new Map();
    this.baseline = new Map();
    this.anomalyThreshold = options.anomalyThreshold || 2.5;
    this.baselineWindow = options.baselineWindow || 3600000;
  }

  record(alertType, value, timestamp = Date.now()) {
    if (!this.alertHistory.has(alertType)) {
      this.alertHistory.set(alertType, []);
    }

    const history = this.alertHistory.get(alertType);
    history.push({ value, timestamp });

    const cutoff = timestamp - this.baselineWindow;
    const recent = history.filter(h => h.timestamp > cutoff);

    if (recent.length >= 10) {
      const mean = recent.reduce((a, b) => a + b.value, 0) / recent.length;
      const variance = recent.reduce((a, b) => a + Math.pow(b.value - mean, 2), 0) / recent.length;
      const stdDev = Math.sqrt(variance);

      this.baseline.set(alertType, { mean, stdDev, count: recent.length });
    }
  }

  predict(alertType, currentValue) {
    const baseline = this.baseline.get(alertType);
    if (!baseline || baseline.count < 10) {
      return { predicted: false, confidence: 0 };
    }

    const zScore = Math.abs((currentValue - baseline.mean) / baseline.stdDev);
    const isAnomaly = zScore > this.anomalyThreshold;

    return {
      predicted: isAnomaly,
      confidence: Math.min(100, (zScore / this.anomalyThreshold) * 100).toFixed(1),
      zScore: zScore.toFixed(2),
      baseline: {
        mean: baseline.mean.toFixed(2),
        stdDev: baseline.stdDev.toFixed(2)
      }
    };
  }

  shouldAlert(alertType, value) {
    const prediction = this.predict(alertType, value);
    return prediction.predicted;
  }
}

class SelfOptimizingPipeline {
  constructor(options = {}) {
    this.metrics = {
      latency: [],
      errors: [],
      throughput: []
    };
    this.optimizations = [];
    this.maxMetrics = 1000;
  }

  record(latency, success = true) {
    this.metrics.latency.push({ value: latency, timestamp: Date.now() });
    if (!success) {
      this.metrics.errors.push({ timestamp: Date.now() });
    }

    if (this.metrics.latency.length > this.maxMetrics) {
      this.metrics.latency = this.metrics.latency.slice(-this.maxMetrics / 2);
    }
    if (this.metrics.errors.length > this.maxMetrics) {
      this.metrics.errors = this.metrics.errors.slice(-this.maxMetrics / 2);
    }
  }

  analyze() {
    const recent = this.metrics.latency.slice(-100);
    if (recent.length < 10) {
      return { status: 'insufficient_data' };
    }

    const avgLatency = recent.reduce((a, b) => a + b.value, 0) / recent.length;
    const p95Latency = recent.sort((a, b) => a.value - b.value)[Math.floor(recent.length * 0.95)].value;
    const errorRate = this.metrics.errors.length / this.metrics.latency.length;

    let status = 'healthy';
    const recommendations = [];

    if (avgLatency > 1000) {
      status = 'degraded';
      recommendations.push('High latency - consider increasing cache TTL');
    }
    if (p95Latency > 2000) {
      status = 'critical';
      recommendations.push('P95 latency critical - investigate blocking operations');
    }
    if (errorRate > 0.05) {
      status = 'degraded';
      recommendations.push('Error rate elevated - review error logs');
    }

    return {
      status,
      avgLatency: Math.round(avgLatency),
      p95Latency: Math.round(p95Latency),
      errorRate: (errorRate * 100).toFixed(2) + '%',
      throughput: recent.length,
      recommendations
    };
  }

  applyOptimization(type, params) {
    this.optimizations.push({
      type,
      params,
      timestamp: new Date().toISOString()
    });
    logger.info(`[Pipeline] Applied optimization: ${type}`, params);
  }
}

class SmartAutomationEngine {
  constructor(options = {}) {
    this.aiManager = new AIManager();
    this.orchestrator = getOrchestrator();
    this.learning = new ContextualLearning(options.learning);
    this.predictor = new PredictiveAlerting(options.predictive);
    this.pipeline = new SelfOptimizingPipeline(options.pipeline);
    this.enabled = options.enabled !== false;
    this.autoExecute = options.autoExecute !== false;
    this.executionCount = 0;
  }

  async process(context = {}) {
    if (!this.enabled) {
      return { enabled: false };
    }

    const startTime = Date.now();
    const systemContext = this.enrichContext(context);

    const aiInsights = this.aiManager.getInsights(systemContext);
    const results = [];

    for (const action of aiInsights.actions) {
      const agentResult = await this.orchestrator.orchestrate(action.field, {
        ...systemContext,
        action: action.action,
        details: action.details
      }, { parallel: false, timeout: 3000 });

      results.push({
        agent: action.field,
        decision: action.action,
        details: action.details,
        execution: agentResult
      });

      this.learning.record(action.field, action.details, action.action, 'success');
    }

    const prediction = this.predictor.predict('system_health', systemContext.cpu || 0);
    
    const pipelineAnalysis = this.pipeline.analyze();

    this.executionCount++;
    const duration = Date.now() - startTime;
    this.pipeline.record(duration, results.length > 0);

    return {
      timestamp: new Date().toISOString(),
      duration,
      insights: aiInsights,
      executions: results,
      prediction,
      pipeline: pipelineAnalysis,
      learning: this.learning.getInsights(),
      stats: {
        totalExecutions: this.executionCount,
        agentsActive: aiInsights.actionableCount
      }
    };
  }

  enrichContext(context) {
    const mem = process.memoryUsage();
    const cpuLoad = os.loadavg()[0] * 10;

    return {
      ...context,
      cpu: cpuLoad,
      ram: (mem.heapUsed / mem.heapTotal) * 100,
      uptime: process.uptime(),
      timestamp: Date.now()
    };
  }

  async processAgent(agentName, context = {}) {
    const enrichedContext = this.enrichContext(context);
    const decision = this.aiManager.thinkForField(agentName, enrichedContext);

    if (decision.action !== 'no_action' && decision.action !== 'ok') {
      const orchestration = await this.orchestrator.orchestrate(agentName, {
        ...enrichedContext,
        decision
      });

      this.learning.record(agentName, context, decision, orchestration.successful > 0 ? 'success' : 'failed');

      return {
        decision,
        orchestration
      };
    }

    return { decision, orchestration: null };
  }

  getStats() {
    return {
      enabled: this.enabled,
      executionCount: this.executionCount,
      aiAgents: this.aiManager.agents.size,
      learning: this.learning.getInsights(),
      pipeline: this.pipeline.analyze(),
      orchestrator: this.orchestrator.getStats()
    };
  }

  enable() {
    this.enabled = true;
    logger.info('[SmartAutomationEngine] Enabled');
  }

  disable() {
    this.enabled = false;
    logger.info('[SmartAutomationEngine] Disabled');
  }
}

let engine = null;

function getSmartEngine() {
  if (!engine) {
    engine = new SmartAutomationEngine({
      enabled: true,
      autoExecute: true,
      learning: { maxHistory: 500 },
      predictive: { anomalyThreshold: 2.0 },
      pipeline: {}
    });
  }
  return engine;
}

module.exports = {
  SmartAutomationEngine,
  ContextualLearning,
  PredictiveAlerting,
  SelfOptimizingPipeline,
  getSmartEngine
};