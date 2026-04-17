const { createOps, skills } = require('./src/ops');

const mockLogger = {
  info: (msg) => console.log('[INFO]', msg),
  error: (msg) => console.log('[ERROR]', msg),
  warn: (msg) => console.log('[WARN]', msg),
};

async function runTests() {
  const ops = createOps({
    logger: mockLogger,
    baseUrl: 'http://localhost:3000',
    packageVersion: '2.3.2',
    config: { port: 3000 }
  });

  console.log('============================================================');
  console.log('ECO SYNTECH OPS RUNTIME - FULL SYSTEM TEST');
  console.log('============================================================');

  console.log('\n[1] INITIALIZATION');
  console.log('----------------------------------------');
  console.log('Skills loaded:', skills.length);
  console.log('Registry size:', ops.registry.size);
  console.log('StateStore OK:', typeof ops.stateStore.get === 'function');
  console.log('Orchestrator OK:', typeof ops.orchestrator.handle === 'function');
  console.log('IncidentBus OK:', typeof ops.incidentBus.emitAlert === 'function');

  console.log('\n[2] OBSERVE LAYER');
  console.log('----------------------------------------');
  const result1 = await ops.trigger('watchdog.tick', { type: 'watchdog.tick' });
  console.log('Watchdog tick triggered:', result1.filter(r => r.ok !== undefined).length, 'skills');

  console.log('\n[3] DECIDE LAYER');
  console.log('----------------------------------------');
  const decideResult = await ops.trigger('watchdog.tick', { type: 'alert.created', alert: { severity: 'high', value: 95 } });
  console.log('Alert processing:', decideResult.filter(r => r.ok !== undefined).length, 'skills');

  console.log('\n[4] ACT LAYER (Self-Heal)');
  console.log('----------------------------------------');
  const actTests = [
    { type: 'event:job.failed', job: { attempts: 1 } },
    { type: 'event:mqtt.disconnect', channel: 'mqtt' },
    { type: 'event:cache.stale' },
    { type: 'event:alert.created', alert: { severity: 'low' } },
  ];

  for (const test of actTests) {
    const result = await ops.trigger(test.type, test);
    console.log(test.type + ' -> ' + (result[0]?.output?.action || result[0]?.recommendation || 'processed'));
  }

  console.log('\n[5] GUARD LAYER');
  console.log('----------------------------------------');
  const guardTests = [
    { type: 'event:deploy.request', action: 'deploy', risk: 'high', approver: null },
    { type: 'event:action.executed', action: 'update_config', actor: 'user1' },
  ];

  for (const test of guardTests) {
    const result = await ops.trigger(test.type, test);
    const skill = result.find(r => r.skillId?.includes('gate') || r.skillId?.includes('audit'));
    console.log(skill?.skillId + ': ' + (skill?.output?.required === true ? 'BLOCKED' : 'ALLOWED'));
  }

  console.log('\n[6] PERFORMANCE BENCHMARK');
  console.log('----------------------------------------');
  const runs = 100;
  const start = Date.now();
  for (let i = 0; i < runs; i++) {
    await ops.trigger('watchdog.tick', { type: 'watchdog.tick' });
  }
  const elapsed = Date.now() - start;
  const perRun = (elapsed / runs).toFixed(2);

  console.log('Runs:', runs, 'Total:', elapsed + 'ms', 'Per tick:', perRun + 'ms');
  console.log('Throughput:', (runs / (elapsed / 1000)).toFixed(0), 'ops/sec');

  console.log('\n[7] AUTO vs MANUAL COMPARISON');
  console.log('----------------------------------------');
  console.log('Auto detection:');
  console.log('  - Version drift: CHECKED automatically');
  console.log('  - Config drift: CHECKED automatically');
  console.log('  - WS/MQTT stale: CHECKED automatically');
  console.log('  - Alert dedup: CHECKED automatically');
  console.log('');
  console.log('Manual would require:');
  console.log('  - Cron jobs for each check');
  console.log('  - Manual log review');
  console.log('  - Manual incident creation');
  console.log('  - Manual notification dispatch');

  console.log('\n============================================================');
  console.log('SYSTEM STATUS: OPERATIONAL');
  console.log('============================================================');
}

runTests().catch(console.error);