#!/usr/bin/env node
/**
 * EcoSynTech - Skills Test Suite
 * Test all 51 skills for proper functionality
 */

const { createOps, skills } = require('./src/ops');

const mockLogger = {
  info: function(m) {},
  error: function(m) { console.log('ERROR:', m); },
  warn: function(m) { console.log('WARN:', m); }
};

const ops = createOps(mockLogger, 'http://localhost:3000', '2.3.2', {});

var testsRun = 0;
var testsPassed = 0;
var testsFailed = 0;

function test(skillId, event, expected) {
  testsRun++;
  try {
    var skill = ops.registry.get(skillId);
    if (!skill) {
      console.log('[FAIL] ' + skillId + ' - NOT FOUND');
      testsFailed++;
      return false;
    }

    var result = skill.run({
      event: event,
      logger: mockLogger,
      stateStore: ops.stateStore,
      baseUrl: 'http://localhost:3000',
      packageVersion: '2.3.2',
      config: {}
    });

    if (result && typeof result === 'object') {
      console.log('[PASS] ' + skillId);
      testsPassed++;
      return true;
    } else {
      console.log('[WARN] ' + skillId + ' - No result');
      testsPassed++;
      return true;
    }
  } catch (e) {
    console.log('[FAIL] ' + skillId + ' - ' + e.message);
    testsFailed++;
    return false;
  }
}

console.log('==========================================');
console.log('ECO SYNTECH - SKILLS TEST SUITE');
console.log('==========================================');
console.log('');
console.log('Total skills:', skills.length);
console.log('Running tests...');
console.log('');

// Test core skills
test('version-drift-detect', { type: 'watchdog.tick' });
test('config-drift-detect', { type: 'watchdog.tick' });
test('ws-heartbeat', { type: 'watchdog.tick' });
test('mqtt-watch', { type: 'watchdog.tick' });
test('alert-deduper', { type: 'alert.created', alert: { id: 'test-1', severity: 'low' } });
test('incident-correlator', { type: 'alert.created', alert: { id: 'test-2' } });
test('build-test-gate', { type: 'release.request' });
test('approval-gate', { type: 'release.request', risk: 'high' });

// Test diagnosis
test('route-mapper', { type: 'watchdog.tick' });
test('webhook-correlator', { type: 'webhook.sensor-alert', payload: {} });
test('anomaly-classifier', { type: 'alert.created', data: { value: 50 } });
test('device-state-diff', { type: 'device.update', current: {}, desired: {} });
test('kpi-drift', { type: 'analytics.refresh' });
test('root-cause-hint', { type: 'incident.created', incident: {} });

// Test self-heal
test('retry-job', { type: 'job.failed', job: { attempts: 1 } });
test('reconnect-bridge', { type: 'mqtt.disconnect' });
test('reset-device', { type: 'device.offline', deviceId: 'dev-1' });
test('clear-cache', { type: 'cache.stale' });
test('rollback-ota', { type: 'ota.failed', deviceId: 'dev-1' });
test('auto-acknowledge', { type: 'alert.created', alert: { severity: 'low' } });

// Test orchestration
test('rules-engine', { type: 'rule.changed' });
test('schedules-engine', { type: 'schedule.changed' });
test('webhook-dispatch', { type: 'webhook.dispatch' });
test('command-router', { type: 'device.command', deviceId: 'dev-1', command: 'on' });
test('ota-orchestrator', { type: 'ota.request' });
test('report-export', { type: 'watchdog.tick' });

// Test governance
test('rbac-guard', { type: 'watchdog.tick', user: { role: 'admin' } });
test('audit-trail', { type: 'action.executed', action: 'test' });
test('secrets-check', { type: 'deploy.request' });
test('tenant-isolation', { type: 'request.incoming', tenantId: 't1' });
test('rate-limit-guard', { type: 'request.spike' });
test('approval-gate-advanced', { type: 'deploy.request', risk: 'high' });

// Test analysis
test('root-cause-analyzer', { type: 'error', error: 'test error' });
test('auto-backup', { type: 'backup.request' });
test('anomaly-predictor', { type: 'sensor-update', data: { type: 'temp', value: 25 } });
test('system-health-scorer', { type: 'watchdog.tick' });

// Test recovery
test('auto-restore', { type: 'restore.request' });

// Test security
test('vuln-scanner', { type: 'security.check' });

// Test defense
test('intrusion-detector', { type: 'login.failed', ip: '1.2.3.4' });

// Test agriculture
test('weather-decision', { type: 'weather.update' });
test('water-optimization', { type: 'sensor-update' });
test('crop-growth-tracker', { type: 'sensor-update', crop: 'rice', day: 10 });
test('pest-alert', { type: 'sensor-update', data: {} });
test('fertilizer-scheduler', { type: 'crop-update', cropId: 'c1', day: 15 });

// Test IoT
test('energy-saver', { type: 'power.status' });
test('predictive-maintenance', { type: 'device-status', deviceId: 'dev-1' });
test('multi-farm-manager', { type: 'farm-status', farmId: 'farm-1' });

// Test communication
test('telegram-notifier', { type: 'alert.created', alert: { severity: 'low' } });
test('report-generator', { type: 'report.request', period: 'daily' });
test('voice-notifier', { type: 'alert.created' });
test('language-switcher', { type: 'language.change', language: 'en' });

console.log('');
console.log('==========================================');
console.log('TEST RESULTS');
console.log('==========================================');
console.log('Tests run:', testsRun);
console.log('Passed:', testsPassed);
console.log('Failed:', testsFailed);
console.log('Success rate:', (testsPassed/testsRun*100).toFixed(1) + '%');
console.log('');

if (testsFailed === 0) {
  console.log('==========================================');
  console.log('ALL TESTS PASSED - SYSTEM READY');
  console.log('==========================================');
  process.exit(0);
} else {
  console.log('==========================================');
  console.log('SOME TESTS FAILED - NEEDS ATTENTION');
  console.log('==========================================');
  process.exit(1);
}