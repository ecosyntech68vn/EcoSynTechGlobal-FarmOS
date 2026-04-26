const { execFile } = require('child_process');

function runCmd(cmd, args, cwd = process.cwd()) {
  return new Promise(resolve => {
    execFile(cmd, args, { cwd, timeout: 120000 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error?.code ?? 0,
        stdout: stdout?.toString() || '',
        stderr: stderr?.toString() || ''
      });
    });
  });
}

module.exports = {
  id: 'build-test-gate',
  name: 'Build Test Gate',
  triggers: ['event:release.request', 'event:deploy.request', 'event:watchdog.tick'],
  riskLevel: 'high',
  canAutoFix: false,
  async run(ctx) {
    const cwd = ctx.cwd || process.cwd();
    const steps = [
      ['npm', ['run', 'build']],
      ['npm', ['test']],
      ['npm', ['run', 'lint']]
    ];

    const results = [];
    for (const [cmd, args] of steps) {
      const result = await runCmd(cmd, args, cwd);
      results.push({ cmd, args, ...result });
      if (!result.ok) break;
    }

    return {
      ok: results.every(r => r.ok),
      results,
      timestamp: new Date().toISOString()
    };
  }
};