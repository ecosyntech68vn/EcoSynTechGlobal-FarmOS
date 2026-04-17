class Watchdog {
  constructor({ orchestrator, logger, baseUrl, packageVersion, config }) {
    this.orchestrator = orchestrator;
    this.logger = logger;
    this.baseUrl = baseUrl;
    this.packageVersion = packageVersion;
    this.config = config;
    this.lastBeat = Date.now();
  }

  beat() {
    this.lastBeat = Date.now();
  }

  async tick() {
    const stale = Date.now() - this.lastBeat > 60_000;
    if (stale) {
      return this.orchestrator.handle({
        type: 'watchdog.tick',
        severity: 'high',
        baseUrl: this.baseUrl,
        packageVersion: this.packageVersion,
        config: this.config,
      });
    }
    return [];
  }
}

module.exports = { Watchdog };