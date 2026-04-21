"use strict";

// Simple AI Manager for multi-field agents. Each field (e.g., irrigation, climate) has an Agent with its own memory.
const { LLMManager } = require('./LLMManager');
class Agent {
  constructor(field) {
    this.field = field;
    this.memory = {};
  }

  remember(key, value) {
    this.memory[key] = value;
  }

  recall(key, defaultValue) {
    if (this.memory.hasOwnProperty(key)) return this.memory[key];
    return defaultValue;
  }

  think(context = {}) {
    // Very lightweight heuristic-based decision.
    // Context example: { soilMoisture: 25, forecast: 'dry', field: 'irrigation' }
    const field = this.field;
    const ctx = context[field] || context;
    const result = { field, action: 'no_action', details: {} };

    if (field === 'irrigation' || (ctx && ctx.soilMoisture !== undefined)) {
      const soil = typeof ctx.soilMoisture === 'number' ? ctx.soilMoisture : null;
      if (soil !== null) {
        if (soil < 25) {
          result.action = 'irrigate';
          result.details = { level: 'high', soilMoisture: soil };
        } else if (soil < 40) {
          result.action = 'irrigate';
          result.details = { level: 'medium', soilMoisture: soil };
        } else {
          result.action = 'no_action';
        }
      }
    }

    // persist last decision in memory
    this.memory.lastDecision = result;
    return result;
  }
}

class AIManager {
  constructor() {
    this.agents = new Map();
    // Optional LLM-based backend
    const useLLM = (process.env.LLM_BACKEND || 'local') === 'local';
    this.llm = null;
    if (useLLM) {
      try {
        this.llm = new LLMManager();
      } catch (e) {
        this.llm = null;
      }
    }
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
    // Try LLM-based adaptive thinking first if available
    if (this.llm && typeof this.llm.infer === 'function') {
      try {
        const llmResult = this.llm.infer({ field, ...context });
        if (llmResult && llmResult.strategy) {
          return { adaptive: llmResult.strategy, rationale: llmResult.rationale, confidence: llmResult.confidence };
        }
      } catch (e) {
        // ignore and fallback to heuristic
      }
    }
    const agent = this.getOrCreateAgent(field);
    return agent.think(context);
  }
}

module.exports = { AIManager };
