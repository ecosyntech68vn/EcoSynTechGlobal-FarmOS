var os = require('os');

var totalMem = os.totalmem();
var freeMem = os.freemem();
var usedMem = totalMem - freeMem;
var memUsagePercent = (usedMem / totalMem) * 100;

function getSystemInfo() {
  var totalMem = os.totalmem();
  var freeMem = os.freemem();
  var usedMem = totalMem - freeMem;
  var memUsagePercent = (usedMem / totalMem) * 100;
  
  return {
    totalMemory: totalMem,
    freeMemory: freeMem,
    usedMemory: usedMem,
    usagePercent: memUsagePercent,
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    uptime: process.uptime(),
  };
}

function getMemoryStatus() {
  var mem = process.memoryUsage();
  return {
    heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
    heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
    external: (mem.external / 1024 / 1024).toFixed(2) + ' MB',
  };
}

function isLowMemory() {
  var percent = memUsagePercent;
  return percent > 80;
}

function isCriticalMemory() {
  return memUsagePercent > 90;
}

function getOptimizationLevel() {
  if (isCriticalMemory()) return 'critical';
  if (isLowMemory()) return 'low';
  return 'normal';
}

function getRecommendedSettings() {
  var level = getOptimizationLevel();
  
  var configs = {
    normal: {
      schedulerInterval: 600000,
      backupInterval: 10800000,
      wsHeartbeat: 60000,
      sensorInterval: 5000,
      maxHistory: 1000,
      enableMetrics: true,
    },
    low: {
      schedulerInterval: 1800000,
      backupInterval: 21600000,
      wsHeartbeat: 120000,
      sensorInterval: 10000,
      maxHistory: 500,
      enableMetrics: true,
    },
    critical: {
      schedulerInterval: 3600000,
      backupInterval: 43200000,
      wsHeartbeat: 300000,
      sensorInterval: 30000,
      maxHistory: 100,
      enableMetrics: false,
    },
  };
  
  return configs[level];
}

function optimizeForDevice() {
  var level = getOptimizationLevel();
  var settings = getRecommendedSettings();
  
  if (level !== 'normal') {
    global.__OPTIMIZATION__ = {
      level: level,
      settings: settings,
      timestamp: Date.now(),
    };
  }
  
  return {
    level: level,
    settings: settings,
    systemInfo: getSystemInfo(),
    memoryStatus: getMemoryStatus(),
  };
}

function getCacheSize() {
  return {
    requireCache: Object.keys(require.cache).length,
    moduleCache: process.moduleCacheVersions ? Object.keys(process.moduleCacheVersions).length : 0,
  };
}

function clearCache() {
  var before = Object.keys(require.cache).length;
  for (var key in require.cache) {
    if (key.indexOf('node_modules') !== -1) {
      delete require.cache[key];
    }
  }
  var after = Object.keys(require.cache).length;
  return { before: before, after: after, cleared: before - after };
}

setInterval(function() {
  global.__SYSTEM_INFO__ = getSystemInfo();
}, 30000);

module.exports = {
  getSystemInfo: getSystemInfo,
  getMemoryStatus: getMemoryStatus,
  isLowMemory: isLowMemory,
  isCriticalMemory: isCriticalMemory,
  getOptimizationLevel: getOptimizationLevel,
  getRecommendedSettings: getRecommendedSettings,
  optimizeForDevice: optimizeForDevice,
  getCacheSize: getCacheSize,
  clearCache: clearCache,
};