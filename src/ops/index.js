const { buildRegistry, skills } = require('./skill-registry');
const { Orchestrator } = require('./orchestrator');
const { StateStore } = require('./state-store');
const { IncidentBus } = require('./incident-bus');
const { Watchdog } = require('../watchdog');
const { SkillScheduler, SkillMetrics, SkillHotReloader } = require('./scheduler');

function createOps(logger, baseUrl, packageVersion, config) {
  const stateStore = new StateStore();
  const registry = buildRegistry();
  const orchestrator = new Orchestrator({ registry, logger, stateStore });
  const incidentBus = new IncidentBus();
  const context = { baseUrl, packageVersion, config };

  let scheduler = null;
  let hotReloader = null;
  let metrics = null;

  function startScheduler(schedulerConfig) {
    if (!scheduler) {
      scheduler = SkillScheduler({ registry, orchestrator, stateStore, context }, logger);
    }
    scheduler.start(schedulerConfig);
    return scheduler;
  }

  function stopScheduler() {
    if (scheduler) {
      scheduler.stop();
    }
  }

  function enableHotReload() {
    if (!hotReloader) {
      hotReloader = SkillHotReloader({ registry, orchestrator }, logger);
    }
    hotReloader.watch();
    return hotReloader;
  }

  function disableHotReload() {
    if (hotReloader) {
      hotReloader.stop();
    }
  }

  function getMetrics() {
    return (metrics && metrics.getAllMetrics) ? metrics.getAllMetrics() : {};
  }

  return {
    stateStore,
    registry,
    orchestrator,
    incidentBus,
    context,
    
    createWatchdog: function(options) {
      return new Watchdog({
        orchestrator: orchestrator,
        logger: logger,
        baseUrl: options && options.baseUrl ? options.baseUrl : baseUrl,
        packageVersion: options && options.packageVersion ? options.packageVersion : packageVersion,
        config: options && options.config ? options.config : config,
      });
    },

    getScheduler: function() { return scheduler; },
    getMetrics: getMetrics,
    
    getHealth: function() {
      return {
        skills: registry.size,
        schedulerRunning: scheduler && scheduler.running ? scheduler.running : false,
        lastTick: scheduler && scheduler.metrics && scheduler.metrics.lastTick ? scheduler.metrics.lastTick : null,
      };
    },

    heartbeat: function() {
      var current = stateStore.get('beats') || {};
    current.orchestrator = Date.now();
    stateStore.set('beats', current);
    },

    recordWebSocketBeat: function() {
      var current = stateStore.get('beats') || {};
    current.websocket = Date.now();
    stateStore.set('beats', current);
    },

    recordMqttBeat: function() {
      var current = stateStore.get('beats') || {};
    current.mqtt = Date.now();
    stateStore.set('beats', current);
    },

    handleAlert: async function(alert) {
      stateStore.push('alerts', {
        id: (alert && alert.id) ? alert.id : 'alert-' + Date.now(),
        signature: JSON.stringify(alert),
        ts: Date.now(),
      }, 500);
      return orchestrator.handle({
        type: 'alert.created',
        alert: alert,
        baseUrl: baseUrl,
        packageVersion: packageVersion,
        config: config,
      });
    },

    trigger: async function(eventType, data) {
      return orchestrator.handle({
        type: eventType,
        event: eventType,
        data: data,
        baseUrl: baseUrl,
        packageVersion: packageVersion,
        config: config,
      });
    },

    startScheduler: startScheduler,
    stopScheduler: stopScheduler,

    enableHotReload: enableHotReload,
    disableHotReload: disableHotReload,

    getMetrics: getMetrics,
  };
}

module.exports = { createOps, skills };