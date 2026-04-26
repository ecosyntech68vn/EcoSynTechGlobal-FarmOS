const logger = require('../config/logger');

const DEFAULT_FLAGS = {
  ENABLE_WATER_OPTIMIZATION: false,
  ENABLE_HEALTH_REPORT: false,
  ENABLE_AI_FEATURES: false,
  ENABLE_ADVANCED_RULES: true,
  ENABLE_BATCH_OPERATIONS: false,
  ENABLE_WEBRTC: false,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_TELEMETRY: true,
  ENABLE_DEBUG_MODE: false,
  ENABLE_EXPERIMENTAL_FEATURES: false
};

const featureFlags = new Map(Object.entries(DEFAULT_FLAGS));

function getFlag(name) {
  if (process.env.hasOwnProperty('FF_' + name)) {
    return process.env['FF_' + name] === 'true';
  }
  return featureFlags.get(name) ?? false;
}

function setFlag(name, value) {
  featureFlags.set(name, !!value);
  logger.info(`[FeatureFlags] ${name} = ${value}`);
}

function isEnabled(name) {
  return getFlag(name);
}

function getAllFlags() {
  const flags = {};
  for (const [name, defaultValue] of featureFlags) {
    flags[name] = {
      default: defaultValue,
      current: getFlag(name),
      envVar: 'FF_' + name
    };
  }
  return flags;
}

function middleware(req, res, next) {
  res.setHeader('X-Feature-Flags', JSON.stringify([...featureFlags.keys()]));
  next();
}

function checkFeature(name) {
  if (!isEnabled(name)) {
    return { enabled: false, message: `Feature ${name} is disabled` };
  }
  return { enabled: true };
}

const FEATURE_GROUPS = {
  core: ['ENABLE_ADVANCED_RULES', 'ENABLE_OFFLINE_MODE'],
  ai: ['ENABLE_AI_FEATURES', 'ENABLE_EXPERIMENTAL_FEATURES'],
  integration: ['ENABLE_HEALTH_REPORT', 'ENABLE_WATER_OPTIMIZATION', 'ENABLE_TELEMETRY']
};

function enableGroup(groupName) {
  const features = FEATURE_GROUPS[groupName];
  if (!features) return;
  features.forEach(f => setFlag(f, true));
}

function disableGroup(groupName) {
  const features = FEATURE_GROUPS[groupName];
  if (!features) return;
  features.forEach(f => setFlag(f, false));
}

module.exports = {
  getFlag,
  setFlag,
  isEnabled,
  getAllFlags,
  middleware,
  checkFeature,
  FEATURE_GROUPS,
  enableGroup,
  disableGroup
};