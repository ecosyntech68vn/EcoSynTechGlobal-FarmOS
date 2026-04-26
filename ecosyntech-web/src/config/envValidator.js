const logger = require('./logger');

const REQUIRED_ENV_VARS = [
  'NODE_ENV'
];

const RECOMMENDED_ENV_VARS = [
  'JWT_SECRET',
  'DB_PATH'
];

const PRODUCTION_REQUIRED = [
  'JWT_SECRET'
];

const warnings = [];
const errors = [];

function validateEnv() {
  errors.length = 0;
  warnings.length = 0;
  
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required env: ${varName}`);
    }
  });
  
  if (isProduction) {
    PRODUCTION_REQUIRED.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Production requires ${varName}`);
      }
    });
  }
  
  RECOMMENDED_ENV_VARS.forEach(varName => {
    if (!process.env[varName]) {
      warnings.push(`Recommended but not set: ${varName}`);
    }
  });
  
  if (!process.env.JWT_SECRET && !isProduction) {
    warnings.push('JWT_SECRET not set - using temporary secret for dev');
  }
  
  if (!process.env.LOG_LEVEL) {
    warnings.push('LOG_LEVEL not set - using default');
  }
  
  const dbPath = process.env.DB_PATH || './data/ecosyntech.db';
  const fs = require('fs');
  const dbDir = require('path').dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    warnings.push(`Database directory does not exist: ${dbDir}`);
  }
  
  if (errors.length > 0) {
    errors.forEach(e => logger.error('[Config] ' + e));
  }
  
  if (warnings.length > 0) {
    warnings.forEach(w => logger.warn('[Config] ' + w));
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    environment: nodeEnv,
    isProduction
  };
}

function getConfigSummary() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    dbPath: process.env.DB_PATH || './data/ecosyntech.db',
    logLevel: process.env.LOG_LEVEL || 'info',
    jwtSecretSet: !!process.env.JWT_SECRET,
    corsEnabled: !!process.env.CORS_ORIGIN,
    wsEnabled: process.env.WEBSOCKET_ENABLED !== 'false',
    backupEnabled: process.env.AUTO_BACKUP_ENABLED === 'true',
    telegramEnabled: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
  };
}

function checkRequiredStartup() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production' && !process.env.JWT_SECRET) {
    logger.error('FATAL: JWT_SECRET required in production');
    process.exit(1);
  }
  
  validateEnv();
  
  logger.info('[Config] Environment validated');
}

module.exports = {
  validateEnv,
  getConfigSummary,
  checkRequiredStartup,
  REQUIRED_ENV_VARS,
  RECOMMENDED_ENV_VARS,
  PRODUCTION_REQUIRED
};