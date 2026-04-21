"use strict";

const os = require('os');

// Lightweight, on-prem LLM manager (free/open-source MVP).
// This is a minimal skeleton to support Phase 2 AB for smallholders.
class LLMManager {
  constructor() {
    // Determine available memory; require at least 4GB for MVP LLMs
    const total = os.totalmem();
    this.available = total >= 4 * 1024 * 1024 * 1024; // 4 GB
    this.mode = this.available ? 'local' : 'offline';
  }

  isAvailable() {
    return this.available;
  }

  // Synchronous-ish inference interface for MVP (returns a strategy object)
  infer(context = {}) {
    const strategy = {
      goal: 'minimize_water_stress',
      constraints: { max_cost_per_day: 5 }
    };
    if (!this.available) {
      // Fallback when RAM is constrained
      return {
        strategy,
        rationale: 'RAM constraint: using heuristic fallback',
        confidence: 0.4
      };
    }
    // Simple placeholder for when a local/remote LLM is available
    return {
      strategy,
      rationale: 'Local MVP LLM (placeholder) integration',
      confidence: 0.6
    };
  }
}

module.exports = { LLMManager };
