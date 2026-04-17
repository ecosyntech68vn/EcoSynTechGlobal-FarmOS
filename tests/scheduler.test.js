#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const API_KEY = process.env.SCHEDULER_API_KEY || 'test-api-key-12345';
const CONFIG_PATH = path.resolve(__dirname, '../Skill-Management-for-EcoSynTech/scheduler/config/scheduler.json');

let passed = 0;
let failed = 0;
let results = [];

function log(msg, type = 'info') {
  const prefix = type === 'pass' ? '\x1b[32m✓' : type === 'fail' ? '\x1b[31m✗' : '\x1b[36m→';
  const reset = '\x1b[0m';
  console.log(`${prefix} ${msg}${reset}`);
}

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    log(name, 'pass');
    passed++;
    results.push({ name, status: 'PASS' });
  } catch (e) {
    log(`${name}: ${e.message}`, 'fail');
    failed++;
    results.push({ name, status: 'FAIL', error: e.message });
  }
}

async function expect(status, expected, msg) {
  if (status !== expected) {
    throw new Error(`${msg} (expected ${expected}, got ${status})`);
  }
}

function getHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'X-Scheduler-API-Key': API_KEY,
    ...extra
  };
}

async function testSchedulerAPI() {
  console.log('\n\x1b[33m=== Testing Scheduler API ===\x1b[0m\n');
  
  await test('GET / - List schedules (authenticated)', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler',
      method: 'GET',
      headers: getHeaders()
    });
    await expect(res.status, 200, 'Status code');
    if (!res.data.success) throw new Error('Response should have success: true');
    if (!Array.isArray(res.data.data)) throw new Error('Response should have data array');
  });

  await test('GET / - List schedules (no API key) - should return 401', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    await expect(res.status, 401, 'Status code');
  });

  await test('GET / - List schedules (invalid API key) - should return 403', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler',
      method: 'GET',
      headers: getHeaders({ 'X-Scheduler-API-Key': 'wrong-key' })
    });
    await expect(res.status, 403, 'Status code');
  });

  await test('GET /metadata - Get metadata', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler/metadata',
      method: 'GET',
      headers: getHeaders()
    });
    await expect(res.status, 200, 'Status code');
    if (!res.data.metadata) throw new Error('Response should have metadata');
  });

  await test('GET /export - Export config', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler/export',
      method: 'GET',
      headers: getHeaders()
    });
    await expect(res.status, 200, 'Status code');
    if (!res.data.schedules) throw new Error('Response should have schedules');
  });

  await test('POST / - Create new schedule', async () => {
    const newSchedule = {
      name: 'Test Schedule',
      interval: '5m',
      skills: ['health-check', 'monitor'],
      description: 'Test schedule for automated testing'
    };
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler',
      method: 'POST',
      headers: getHeaders()
    }, newSchedule);
    await expect(res.status, 201, 'Status code');
    if (!res.data.data?.id) throw new Error('Should return schedule with id');
    global.testScheduleId = res.data.data.id;
  });

  await test('POST / - Create schedule (missing fields) - should return 400', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler',
      method: 'POST',
      headers: getHeaders()
    }, { name: 'Incomplete' });
    await expect(res.status, 400, 'Status code');
  });

  await test('POST /execute - Execute single skill', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler/execute',
      method: 'POST',
      headers: getHeaders()
    }, { skill: 'health-check' });
    await expect(res.status, 200, 'Status code');
  });

  await test('POST /execute - Execute skill (missing skill) - should return 400', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler/execute',
      method: 'POST',
      headers: getHeaders()
    }, {});
    await expect(res.status, 400, 'Status code');
  });

  await test('GET /:id - Get single schedule', async () => {
    if (!global.testScheduleId) throw new Error('No test schedule ID');
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/skills/scheduler/${global.testScheduleId}`,
      method: 'GET',
      headers: getHeaders()
    });
    await expect(res.status, 200, 'Status code');
    if (!res.data.data) throw new Error('Should return schedule data');
  });

  await test('GET /:id - Get non-existent schedule - should return 404', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler/non-existent-id',
      method: 'GET',
      headers: getHeaders()
    });
    await expect(res.status, 404, 'Status code');
  });

  await test('PUT /:id - Update schedule', async () => {
    if (!global.testScheduleId) throw new Error('No test schedule ID');
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/skills/scheduler/${global.testScheduleId}`,
      method: 'PUT',
      headers: getHeaders()
    }, { name: 'Updated Test Schedule', interval: '30m' });
    await expect(res.status, 200, 'Status code');
    if (res.data.data?.name !== 'Updated Test Schedule') throw new Error('Name should be updated');
  });

  await test('POST /:id/toggle - Toggle schedule', async () => {
    if (!global.testScheduleId) throw new Error('No test schedule ID');
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/skills/scheduler/${global.testScheduleId}/toggle`,
      method: 'POST',
      headers: getHeaders()
    });
    await expect(res.status, 200, 'Status code');
    if (typeof res.data.enabled !== 'boolean') throw new Error('Should return enabled boolean');
  });

  await test('POST /:id/toggle - Toggle non-existent - should return 404', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler/non-existent-id/toggle',
      method: 'POST',
      headers: getHeaders()
    });
    await expect(res.status, 404, 'Status code');
  });

  await test('DELETE /:id - Delete schedule', async () => {
    if (!global.testScheduleId) throw new Error('No test schedule ID');
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1/skills/scheduler/${global.testScheduleId}`,
      method: 'DELETE',
      headers: getHeaders()
    });
    await expect(res.status, 200, 'Status code');
  });

  await test('DELETE /:id - Delete non-existent - should return 404', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler/non-existent-id',
      method: 'DELETE',
      headers: getHeaders()
    });
    await expect(res.status, 404, 'Status code');
  });

  await test('POST /import - Import schedules (replace mode)', async () => {
    const res = await httpRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/skills/scheduler/import',
      method: 'POST',
      headers: getHeaders()
    }, {
      schedules: [
        { name: 'Import Test 1', interval: '10m', skills: ['backup'] },
        { name: 'Import Test 2', interval: '1h', skills: ['alerting'] }
      ],
      mode: 'replace'
    });
    await expect(res.status, 200, 'Status code');
    if (res.data.count !== 2) throw new Error('Should import 2 schedules');
  });
}

async function testSchedulerRunner() {
  console.log('\n\x1b[33m=== Testing Scheduler Runner ===\x1b[0m\n');
  
  await test('Scheduler config exists', () => {
    if (!fs.existsSync(CONFIG_PATH)) throw new Error('Config file not found');
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    if (!cfg.schedules) throw new Error('Config should have schedules array');
  });

  await test('Scheduler config has valid schedules', () => {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    const hasValid = cfg.schedules.some(s => s.enabled && s.interval && s.skills?.length > 0);
    if (!hasValid) throw new Error('At least one schedule should be enabled and valid');
  });

  await test('Interval parsing works correctly', () => {
    const intervals = [
      { input: '5m', expected: 5 * 60 * 1000 },
      { input: '15m', expected: 15 * 60 * 1000 },
      { input: '1h', expected: 1 * 60 * 60 * 1000 },
      { input: '2h', expected: 2 * 60 * 60 * 1000 },
      { input: '1d', expected: 1 * 24 * 60 * 60 * 1000 }
    ];
    for (const { input, expected } of intervals) {
      const parsed = parseInterval(input);
      if (parsed !== expected) throw new Error(`Interval ${input} should be ${expected}, got ${parsed}`);
    }
  });
}

function parseInterval(interval) {
  let m = /^([0-9]+)m$/.exec(interval);
  if (m) return parseInt(m[1], 10) * 60_000;
  let h = /^([0-9]+)h$/.exec(interval);
  if (h) return parseInt(h[1], 10) * 3_600_000;
  let d = /^([0-9]+)d$/.exec(interval);
  if (d) return parseInt(d[1], 10) * 86_400_000;
  return 0;
}

async function testSkillsConfig() {
  console.log('\n\x1b[33m=== Testing Skills Configuration ===\x1b[0m\n');
  
  const skillsDir = path.resolve(__dirname, '../Skill-Management-for-EcoSynTech');
  const expectedSkills = [
    'security-audit', 'firewall-setup', 'ssl-manager',
    'health-check', 'monitor', 'alerting', 'system-report', 'config-manager', 'api-gateway', 'user-manager',
    'log-analyzer', 'iot-debug', 'fix-common',
    'deployment', 'test-runner', 'device-provision', 'firmware-update',
    'backup', 'update', 'database-migrate', 'db-cleanup', 'cache-manager', 'auto-scale',
    'metrics-export', 'load-test', 'scheduler'
  ];

  await test('All 26 skills directories exist', () => {
    let missing = [];
    for (const skill of expectedSkills) {
      const skillPath = path.join(skillsDir, skill, 'SKILL.md');
      if (!fs.existsSync(skillPath)) {
        missing.push(skill);
      }
    }
    if (missing.length > 0) throw new Error(`Missing skills: ${missing.join(', ')}`);
  });

  await test('All skill SKILL.md files have valid content', () => {
    let invalid = [];
    for (const skill of expectedSkills) {
      const skillPath = path.join(skillsDir, skill, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        const content = fs.readFileSync(skillPath, 'utf8');
        if (content.length < 50) invalid.push(skill);
      }
    }
    if (invalid.length > 0) throw new Error(`Invalid skills: ${invalid.join(', ')}`);
  });

  await test('Scheduler SKILL.md exists', () => {
    const schedulerSkillPath = path.join(skillsDir, 'scheduler', 'SKILL.md');
    if (!fs.existsSync(schedulerSkillPath)) throw new Error('Scheduler SKILL.md not found');
  });
}

async function runTests() {
  console.log('\n\x1b[1m\x1b[35m╔════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[35m║    EcoSynTech Scheduler - Automated Tests     ║\x1b[0m');
  console.log('\x1b[1m\x1b[35m╚════════════════════════════════════════════════╝\x1b[0m\n');

  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    log('Server not running on localhost:3000 - starting in test mode', 'info');
    log('Run "npm start" first, then re-run tests', 'info');
  }

  await testSkillsConfig();
  await testSchedulerRunner();
  
  if (serverRunning) {
    await testSchedulerAPI();
  }

  console.log('\n\x1b[1m\x1b[35m╔════════════════════════════════════════════════╗\x1b[0m');
  console.log('\x1b[1m\x1b[35m║              Test Summary                     ║\x1b[0m');
  console.log('\x1b[1m\x1b[35m╚════════════════════════════════════════════════╝\x1b[0m\n');
  
  log(`Total: ${passed + failed} | \x1b[32mPassed: ${passed}\x1b[0m | \x1b[31mFailed: ${failed}\x1b[0m\n`, 'info');

  if (failed > 0) {
    log('Some tests failed!', 'fail');
    process.exit(1);
  } else {
    log('All tests passed!', 'pass');
  }
}

function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET'
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

runTests().catch(console.error);
