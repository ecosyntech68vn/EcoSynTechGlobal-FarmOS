#!/usr/bin/env node
/**
 * EcoSynTech - Quick Management
 * No dependencies on full ops system
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function getVersion() {
  try {
    return require('./package.json').version;
  } catch (e) {
    return 'unknown';
  }
}

function getStatus() {
  return {
    version: getVersion(),
    uptime: process.uptime(),
    platform: os.platform(),
    arch: os.arch(),
    cpuCount: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
    freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100 + ' GB',
  };
}

function getConfig() {
  return {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    opsSchedulerDisabled: process.env.OPS_SCHEDULER_DISABLED === 'true',
    opsHotReloadEnabled: process.env.OPS_HOT_RELOAD_ENABLED === 'true',
  };
}

var args = process.argv.slice(2);
var cmd = args[0] || 'help';

switch (cmd) {
  case 'status':
    console.log('=== SYSTEM STATUS ===');
    var s = getStatus();
    console.log('Version:', s.version);
    console.log('Uptime:', Math.floor(s.uptime), 'seconds');
    console.log('Platform:', s.platform, s.arch);
    console.log('RAM:', s.totalMemory, 'total,', s.freeMemory, 'free');
    console.log('');
    var c = getConfig();
    console.log('=== CONFIG ===');
    console.log('Port:', c.port);
    console.log('Mode:', c.nodeEnv);
    console.log('Scheduler:', c.opsSchedulerDisabled ? 'disabled' : 'enabled');
    console.log('HotReload:', c.opsHotReloadEnabled ? 'enabled' : 'disabled');
    break;

  case 'check':
    console.log('=== SYNTAX CHECK ===');
    try {
      require('./server.js');
      console.log('server.js: OK');
    } catch (e) {
      console.log('server.js: ERROR -', e.message);
    }
    try {
      require('./src/ops');
      console.log('ops/index.js: OK');
    } catch (e) {
      console.log('ops/index.js: ERROR -', e.message);
    }
    break;

  case 'env':
    console.log('=== REQUIRED ENV VARS ===');
    console.log('PORT=3000');
    console.log('NODE_ENV=production');
    console.log('JWT_SECRET=your-secret-key');
    if (process.env.TELEGRAM_BOT_TOKEN) {
      console.log('TELEGRAM_BOT_TOKEN=***configured***');
    } else {
      console.log('TELEGRAM_BOT_TOKEN=NOT SET (optional)');
    }
    if (process.env.TELEGRAM_CHAT_ID) {
      console.log('TELEGRAM_CHAT_ID=***configured***');
    } else {
      console.log('TELEGRAM_CHAT_ID=NOT SET (optional)');
    }
    break;

  case 'help':
  default:
    console.log('=== ECO SYNTECH MANAGEMENT ===');
    console.log('');
    console.log('Usage: node quick.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  node quick.js status  - Show system status');
    console.log('  node quick.js check  - Check syntax');
    console.log('  node quick.js env     - Show required env vars');
    console.log('');
    console.log('For production:');
    console.log('  npm start                     - Start server');
    console.log('  PORT=3000 node server.js     - Custom port');
    console.log('  NODE_ENV=production node ...  - Production mode');
    break;
}