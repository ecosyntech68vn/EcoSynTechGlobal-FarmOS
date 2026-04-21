"use strict";

// Lightweight, on-prem LLM manager (free/open-source MVP).
// This is a minimal skeleton to support Phase 2 AB for smallholders.
class LLMManager {
  constructor() {
    this.available = true;
    this.mode = 'local';
  }

  // Synchronous-ish inference interface for MVP (returns a strategy object)
  infer(context = {}) {
    // Minimal heuristic-based adaptive strategy as a placeholder for real LLM
    const strategy = {
      goal: 'minimize_water_stress',
      constraints: { max_cost_per_day: 5 }
    };
    return {
      strategy,
      rationale: 'On-prem heuristic; Phase 2 MVP',
      confidence: 0.6
    };
  }
}

module.exports = { LLMManager };
