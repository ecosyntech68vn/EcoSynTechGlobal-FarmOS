module.exports = {
  id: 'secrets-check',
  name: 'Secrets Check',
  triggers: ['event:deploy.request', 'event:watchdog.tick'],
  riskLevel: 'medium',
  canAutoFix: false,
  async run() {
    const risky = ['CHANGE_ME', 'your-secret', 'secret', 'password'];
    const values = Object.entries(process.env).filter(([k]) => /secret|token|key|password/i.test(k));
    const findings = values.filter(([, v]) => risky.includes(String(v)));

    return {
      ok: findings.length === 0,
      findings: findings.map(([k]) => ({ key: k, issue: 'placeholder or weak secret detected' })),
      timestamp: new Date().toISOString()
    };
  }
};