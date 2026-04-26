const logger = require('../config/logger');

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_DELAY = 1000;
const DEFAULT_BACKOFF_FACTOR = 2;

class RetryOptions {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || DEFAULT_MAX_RETRIES;
    this.initialDelay = options.initialDelay || DEFAULT_INITIAL_DELAY;
    this.backoffFactor = options.backoffFactor || DEFAULT_BACKOFF_FACTOR;
    this.retryableErrors = options.retryableErrors || ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH'];
    this.onRetry = options.onRetry || null;
  }

  getDelay(attempt) {
    return this.initialDelay * Math.pow(this.backoffFactor, attempt);
  }

  shouldRetry(error, attempt) {
    if (attempt >= this.maxRetries) return false;
    const code = error.code || error.name;
    return this.retryableErrors.some(e => code && code.includes(e));
  }
}

async function retry(fn, options = {}) {
  const opts = new RetryOptions(options);
  let lastError = null;
  const errors = [];

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      errors.push({ attempt, error: error.message, time: new Date().toISOString() });
      
      if (!opts.shouldRetry(error, attempt)) {
        break;
      }
      
      const delay = opts.getDelay(attempt);
      
      if (opts.onRetry) {
        opts.onRetry({ attempt, delay, error: error.message });
      } else {
        logger.warn(`[Retry] Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  logger.error(`[Retry] All attempts failed after ${errors.length} tries`);
  throw lastError;
}

function withFallback(primaryFn, fallbackFn, options = {}) {
  return async (...args) => {
    try {
      return await primaryFn(...args);
    } catch (error) {
      logger.warn(`[Fallback] Primary failed: ${error.message}. Using fallback...`);
      try {
        return await fallbackFn(...args);
      } catch (fallbackError) {
        logger.error(`[Fallback] Also failed: ${fallbackError.message}`);
        throw error;
      }
    }
  };
}

function withCircuitBreaker(fn, options = {}) {
  const failureThreshold = options.failureThreshold || 5;
  const resetTimeout = options.resetTimeout || 30000;
  
  let failures = 0;
  let isOpen = false;
  let lastFailure = null;
  const resetTimer = null;

  return async (...args) => {
    if (isOpen) {
      const now = Date.now();
      if (now - lastFailure > resetTimeout) {
        logger.info('[CircuitBreaker] Resetting after timeout');
        isOpen = false;
        failures = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn(...args);
      failures = 0;
      return result;
    } catch (error) {
      failures++;
      lastFailure = Date.now();
      
      if (failures >= failureThreshold) {
        isOpen = true;
        logger.error(`[CircuitBreaker] Opened after ${failures} failures`);
      }
      
      throw error;
    }
  };
}

function createGracefulHandler(handler, fallbackHandler = null) {
  return async (req, res, next) => {
    try {
      await handler(req, res);
    } catch (error) {
      logger.error('[Graceful] Handler error:', error.message);
      
      if (fallbackHandler) {
        try {
          await fallbackHandler(req, res);
        } catch (fallbackError) {
          res.status(500).json({ error: 'Service temporarily unavailable' });
        }
      } else {
        next(error);
      }
    }
  };
}

module.exports = {
  retry,
  RetryOptions,
  withFallback,
  withCircuitBreaker,
  createGracefulHandler
};