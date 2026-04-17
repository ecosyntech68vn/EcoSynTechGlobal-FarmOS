const { Policy } = require('./policy');

class Orchestrator {
  constructor({ registry, logger, stateStore }) {
    this.registry = registry;
    this.logger = logger;
    this.stateStore = stateStore;
    this.policy = new Policy();
  }

  async handle(event) {
    const candidates = this.policy.match(event, this.registry);
    const results = [];

    for (const skill of candidates) {
      const startedAt = Date.now();
      try {
        const output = await skill.run({
          event,
          logger: this.logger,
          stateStore: this.stateStore,
          baseUrl: event.baseUrl,
          packageVersion: event.packageVersion,
          config: event.config,
          cwd: event.cwd || process.cwd(),
        });
        results.push({
          skillId: skill.id,
          ok: true,
          ms: Date.now() - startedAt,
          output,
        });
      } catch (error) {
        results.push({
          skillId: skill.id,
          ok: false,
          ms: Date.now() - startedAt,
          error: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = { Orchestrator };