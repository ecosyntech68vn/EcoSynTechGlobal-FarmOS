const fs = require('fs');
const path = require('path');

const INTERVALS = {
  critical: 60000,
  high: 300000,
  medium: 600000,
  low: 1800000,
  hourly: 3600000,
};

const SKILL_PRIORITIES = {
  'version-drift-detect': 'high',
  'config-drift-detect': 'high',
  'ws-heartbeat': 'critical',
  'mqtt-watch': 'critical',
  'alert-deduper': 'medium',
  'incident-correlator': 'medium',
  'retry-job': 'high',
  'reconnect-bridge': 'critical',
  'clear-cache': 'low',
  'auto-acknowledge': 'low',
  'rules-engine': 'medium',
  'schedules-engine': 'medium',
  'build-test-gate': 'hourly',
  'approval-gate': 'critical',
  'approval-gate-advanced': 'critical',
  'rbac-guard': 'medium',
  'audit-trail': 'low',
  'secrets-check': 'hourly',
  'tenant-isolation': 'medium',
  'rate-limit-guard': 'low',
};

function SkillScheduler(ops, logger) {
  var scheduledJobs = new Map();
  var metrics = {
    ticks: 0,
    skillsRun: 0,
    skillsFailed: 0,
    lastTick: null,
    uptime: Date.now(),
  };
  var running = false;
  var intervalId = null;

  function getIntervalForSkill(skillId) {
    var priority = SKILL_PRIORITIES[skillId] || 'medium';
    return INTERVALS[priority] || INTERVALS.medium;
  }

  function getSkillsByPriority() {
    var skills = [];
    var priorities = ['critical', 'high', 'medium', 'low', 'hourly'];
    
    for (var i = 0; i < priorities.length; i++) {
      var priority = priorities[i];
      var prioritySkills = [];
      var regSkills = ops.registry.values();
      for (var j = 0; j < regSkills.length; j++) {
        var skill = regSkills[j];
        var p = SKILL_PRIORITIES[skill.id] || 'medium';
        if (p === priority) {
          prioritySkills.push({ skill: skill, priority: priority });
        }
      }
      skills = skills.concat(prioritySkills);
    }
    return skills;
  }

  function tick() {
    return new Promise(function(resolve) {
      var start = Date.now();
      metrics.ticks++;
      metrics.lastTick = new Date().toISOString();

      if (logger && logger.info) {
        logger.info('[Scheduler] Tick #' + metrics.ticks + ' started');
      }

      var skillsToRun = getSkillsByPriority();
      var skillsRun = 0;
      var failed = 0;

      var idx = 0;
      function runNext() {
        if (idx >= skillsToRun.length) {
          metrics.skillsRun += skillsRun;
          metrics.skillsFailed += failed;
          var elapsed = Date.now() - start;
          if (logger && logger.info) {
            logger.info('[Scheduler] Tick complete: ' + skillsRun + ' skills, ' + failed + ' failed, ' + elapsed + 'ms');
          }
          resolve({
            ticks: metrics.ticks,
            skillsRun: skillsRun,
            failed: failed,
            elapsed: elapsed,
          });
          return;
        }

        var item = skillsToRun[idx];
        idx++;
        var skill = item.skill;
        var priority = item.priority;

        var maxRetries = 3;
        var retryCount = 0;
        
        while (retryCount < maxRetries) {
          try {
            var result = skill.run({
              event: { type: 'scheduler.tick', priority: priority, retry: retryCount },
              logger: logger,
              stateStore: ops.stateStore,
              baseUrl: ops.context.baseUrl,
              packageVersion: ops.context.packageVersion,
              config: ops.context.config,
            });

            if (result && result.ok === false && retryCount < maxRetries - 1) {
              retryCount++;
              continue;
            }
            
            if (result && result.ok === false) {
              failed++;
            }
            skillsRun++;
            break;
          } catch (err) {
            retryCount++;
            if (retryCount >= maxRetries) {
              failed++;
              if (logger && logger.error) {
                logger.error('[Scheduler] Skill ' + skill.id + ' failed after ' + maxRetries + ' retries: ' + err.message);
              }
            }
          }
        }

        setImmediate(runNext);
      }

      runNext();
    });
  }

  function start(config) {
    if (running) return;
    running = true;

    var defaultInterval = (config && config.defaultInterval) ? config.defaultInterval : 600000;

    intervalId = setInterval(function() {
      tick();
    }, defaultInterval);

    if (logger && logger.info) {
      logger.info('[Scheduler] Started with interval ' + (defaultInterval / 1000 / 60) + ' minutes');
    }
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    running = false;
    if (logger && logger.info) {
      logger.info('[Scheduler] Stopped');
    }
  }

  function getMetrics() {
    return {
      ticks: metrics.ticks,
      skillsRun: metrics.skillsRun,
      skillsFailed: metrics.skillsFailed,
      lastTick: metrics.lastTick,
      uptimeSeconds: Math.floor((Date.now() - metrics.uptime) / 1000),
    };
  }

  function toJSON() {
    return {
      running: running,
      metrics: getMetrics(),
    };
  }

  return {
    tick: tick,
    start: start,
    stop: stop,
    getMetrics: getMetrics,
    getSkillsByPriority: getSkillsByPriority,
    toJSON: toJSON,
    get running() { return running; },
    get metrics() { return metrics; },
  };
}

function SkillMetrics(options) {
  var storePath = (options && options.storePath) ? options.storePath : path.join(process.cwd(), 'data', 'ops-metrics.json');
  var data = {
    skills: {},
    history: [],
    summary: {
      totalRuns: 0,
      totalFailures: 0,
      avgDuration: 0,
      lastUpdated: null,
    },
  };

  function load() {
    try {
      if (fs.existsSync(storePath)) {
        var raw = fs.readFileSync(storePath, 'utf8');
        var parsed = JSON.parse(raw);
        for (var key in parsed) {
          data[key] = parsed[key];
        }
      }
    } catch (_) {}
  }

  function save() {
    try {
      fs.mkdirSync(path.dirname(storePath), { recursive: true });
      fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    } catch (_) {}
  }

  function record(skillId, result) {
    var duration = (result && result.ms) ? result.ms : 0;
    var ok = (result && result.ok === false) ? false : true;

    if (!data.skills[skillId]) {
      data.skills[skillId] = {
        runs: 0,
        failures: 0,
        totalDuration: 0,
        avgDuration: 0,
        lastRun: null,
      };
    }

    var skill = data.skills[skillId];
    skill.runs++;
    skill.totalDuration += duration;
    skill.avgDuration = Math.round(skill.totalDuration / skill.runs);
    skill.lastRun = new Date().toISOString();
    if (!ok) skill.failures++;

    data.summary.totalRuns++;
    if (!ok) data.summary.totalFailures++;
    data.summary.lastUpdated = new Date().toISOString();

    data.history.push({
      skillId: skillId,
      ok: ok,
      duration: duration,
      timestamp: new Date().toISOString(),
    });

    if (data.history.length > 1000) {
      data.history = data.history.slice(-1000);
    }
    save();
  }

  function getSkillMetrics(skillId) {
    return data.skills[skillId] || null;
  }

  function getAllMetrics() {
    return data;
  }

  load();

  return {
    record: record,
    getSkillMetrics: getSkillMetrics,
    getAllMetrics: getAllMetrics,
  };
}

function SkillHotReloader(ops, logger, watchDir) {
  var dir = watchDir || path.join(process.cwd(), 'src', 'skills');
  var watching = false;

  function watch() {
    if (watching) return;
    watching = true;

    try {
      fs.watch(dir, { recursive: true }, function(eventType, filename) {
        if (filename && filename.endsWith('.skill.js')) {
          reloadSkill(filename);
        }
      });
      if (logger && logger.info) {
        logger.info('[HotReload] Watching: ' + dir);
      }
    } catch (err) {
      if (logger && logger.error) {
        logger.error('[HotReload] Failed: ' + err.message);
      }
    }

    if (logger && logger.info) {
      logger.info('[HotReload] Started');
    }
  }

  function reloadSkill(filename) {
    var skillPath = path.join(dir, filename);
    var skillId = path.basename(filename, '.skill.js');

    if (logger && logger.info) {
      logger.info('[HotReload] Reloading: ' + skillId);
    }

    try {
      var resolved = require.resolve(skillPath);
      if (require.cache[resolved]) {
        delete require.cache[resolved];
      }
      var newSkill = require(skillPath);

      if (newSkill && newSkill.id && ops.registry.has(newSkill.id)) {
        ops.registry.set(newSkill.id, newSkill);
        if (logger && logger.info) {
          logger.info('[HotReload] Reloaded: ' + newSkill.id);
        }
        return { ok: true, skillId: newSkill.id };
      }
      return { ok: false, error: 'Invalid skill' };
    } catch (err) {
      if (logger && logger.error) {
        logger.error('[HotReload] Error: ' + err.message);
      }
      return { ok: false, error: err.message };
    }
  }

  function stop() {
    watching = false;
  }

  return {
    watch: watch,
    reloadSkill: reloadSkill,
    stop: stop,
    get watching() { return watching; },
  };
}

module.exports = { 
  SkillScheduler: SkillScheduler, 
  SkillMetrics: SkillMetrics, 
  SkillHotReloader: SkillHotReloader,
  INTERVALS: INTERVALS,
  SKILL_PRIORITIES: SKILL_PRIORITIES
};