const logger = require('../config/logger');

const METRICS = {
  restarts: 0,
  errors: [],
  lastError: null,
  uptime: Date.now(),
  checks: {}
};

const SELF_HEAL_ENABLED = process.env.SELF_HEAL_ENABLED !== 'false';

function healthCheck(name, fn) {
  METRICS.checks[name] = {
    lastCheck: null,
    status: 'unknown',
    consecutiveFailures: 0
  };
  
  return async () => {
    const start = Date.now();
    try {
      const result = await fn();
      METRICS.checks[name] = {
        lastCheck: new Date().toISOString(),
        status: 'healthy',
        duration: Date.now() - start,
        consecutiveFailures: 0
      };
      return { healthy: true, result };
    } catch (error) {
      METRICS.checks[name].consecutiveFailures++;
      METRICS.checks[name].lastCheck = new Date().toISOString();
      METRICS.checks[name].status = 'unhealthy';
      
      if (METRICS.checks[name].consecutiveFailures >= 3) {
        logger.error(`[SelfHeal] ${name} failed ${METRICS.checks[name].consecutiveFailures} times`);
        await triggerRecovery(name);
      }
      
      return { healthy: false, error: error.message };
    }
  };
}

async function triggerRecovery(name) {
  const recoveryActions = {
    database: async () => {
      logger.info('[SelfHeal] Attempting database recovery...');
      const db = require('../config/database');
      try {
        db.saveDatabase();
        logger.info('[SelfHeal] Database saved');
      } catch (e) {
        logger.error('[SelfHeal] DB save failed:', e.message);
      }
    },
    cache: async () => {
      logger.info('[SelfHeal] Clearing cache...');
      const cache = require('../services/cacheService');
      cache.stopCache();
      logger.info('[SelfHeal] Cache stopped');
    },
    scheduler: async () => {
      logger.info('[SelfHeal] Restarting scheduler...');
      const ops = require('../../server').getOps?.();
      if (ops?.getScheduler) {
        const scheduler = ops.getScheduler();
        scheduler?.stop?.();
        scheduler?.start?.();
        METRICS.restarts++;
      }
    }
  };
  
  const action = recoveryActions[name];
  if (action) {
    try {
      await action();
      logger.info(`[SelfHeal] ${name} recovered`);
    } catch (e) {
      logger.error(`[SelfHeal] Recovery failed for ${name}:`, e.message);
    }
  }
}

function recordError(error) {
  METRICS.lastError = {
    message: error.message,
    time: Date.now(),
    stack: error.stack
  };
  METRICS.errors.push({
    message: error.message,
    time: new Date().toISOString()
  });
  
  if (METRICS.errors.length > 100) {
    METRICS.errors = METRICS.errors.slice(-50);
  }
}

function getHealth() {
  return {
    uptime: Date.now() - METRICS.uptime,
    restarts: METRICS.restarts,
    checks: METRICS.checks,
    lastError: METRICS.lastError,
    totalErrors: METRICS.errors.length
  };
}

function startSelfHealing() {
  if (!SELF_HEAL_ENABLED) {
    logger.info('[SelfHeal] Disabled');
    return;
  }
  
  logger.info('[SelfHeal] Starting self-healing system');
  
  setInterval(() => {
    logger.debug('[SelfHeal] System check:', getHealth());
  }, 60000);
}

module.exports = {
  healthCheck,
  triggerRecovery,
  recordError,
  getHealth,
  startSelfHealing,
  get METRICS() { return METRICS; }
};