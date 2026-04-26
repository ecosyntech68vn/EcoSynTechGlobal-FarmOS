#!/usr/bin/env node
'use strict';

const http = require('http');

const API = process.env.API_URL || 'http://localhost:3000/api/bootstrap';

function usage() {
  console.log(`
🌱 EcoSynTech AI Bootstrap CLI

Usage: node bin/bootstrap-ai.js <command> [options]

Commands:
  status                  Show current bootstrap status
  health                  Show health check
  history [N]             Show last N history entries (default 20)
  apply --small 0|1      Enable/disable small model
  apply --large 0|1      Enable/disable large model
  apply --url URL         Set large model URL
  reload                  Reload bootstrap
  help                   Show this help

Examples:
  node bin/bootstrap-ai.js status
  node bin/bootstrap-ai.js history 50
  node bin/bootstrap-ai.js apply --small 1 --large 1 --url "https://..."
  node bin/bootstrap-ai.js reload

Environment:
  API_URL    Override API base URL (default: http://localhost:3000/api/bootstrap)
`);
}

async function request(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API);
    const opts = { hostname: url.hostname, port: url.port, path: url.pathname, method,
      headers: { 'Content-Type': 'application/json' } };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({ raw: data, status: res.statusCode }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function cmdStatus() {
  const r = await request('/status');
  if (!r.ok) return console.error('Error:', r.error);
  const s = r;
  console.log(`
📦 Bootstrap Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Small Model:  ${s.smallEnabled ? '✅ Enabled' : '❌ Disabled'} ${s.lightLoaded ? '✓ Loaded' : ''}
Large Model:  ${s.largeEnabled ? '✅ Enabled' : '❌ Disabled'} ${s.largeLoaded ? '✓ Loaded' : ''}
Large URL:    ${s.largeUrl || '(none)'}
Last Boot:   ${s.lastBootstrapTs ? new Date(s.lastBootstrapTs).toLocaleString() : 'Never'}
`);
}

async function cmdHealth() {
  const r = await request('/health');
  if (!r.ok) return console.error('Error:', r.error);
  const h = r;
  console.log(`
💚 Health Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Small Model: ${h.small?.healthy ? '✅ Healthy' : '⚠️ ' + (h.small?.exists ? 'Exists' : 'Missing')}
  Path:      ${h.small?.exists ? 'present' : 'absent'}
  Size:      ${h.small?.sizeMB ? h.small.sizeMB + ' MB' : 'N/A'}
Large Model: ${h.large?.healthy ? '✅ Healthy' : '⚠️ ' + (h.large?.exists ? 'Exists' : 'Missing')}
  Path:      ${h.large?.exists ? 'present' : 'absent'}
  Size:      ${h.large?.sizeMB ? h.large.sizeMB + ' MB' : 'N/A'}
Memory:     ${h.memoryUsageMB || 'N/A'} MB
Overall:    ${h.overall || 'unknown'}
Timestamp:  ${h.timestamp ? new Date(h.timestamp).toLocaleString() : 'N/A'}
`);
}

async function cmdHistory(n = 20) {
  const r = await request(`/history?limit=${n}`);
  if (!r.ok) return console.error('Error:', r.error);
  const items = r.history || [];
  if (!items.length) return console.log('No history yet.');
  console.log(`📋 Last ${items.length} Events\n`);
  items.reverse().forEach(i => {
    const ts = i.ts ? new Date(i.ts).toLocaleString() : '';
    const status = i.status === 'loaded' ? '✅' : i.status === 'error' ? '❌' : i.status === 'skip' ? '⏭️' : 'ℹ️';
    console.log(`${status} [${ts}] ${i.action} – ${i.status}${i.ms ? ` (${i.ms}ms)` : ''}`);
  });
}

async function cmdApply(args) {
  const cfg = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--small') cfg.small = parseInt(args[++i]);
    if (a === '--large') cfg.large = parseInt(args[++i]);
    if (a === '--url' || a === '--onnx-url') cfg.largeUrl = args[++i];
  }
  const r = await request('/configure', 'POST', cfg);
  if (!r.ok) return console.error('Error:', r.error);
  console.log('✅ Config applied');
  cmdStatus();
}

async function cmdReload() {
  console.log('🔄 Reloading bootstrap...');
  const r = await request('/reload', 'POST');
  if (!r.ok) return console.error('Error:', r.error);
  console.log('✅ Bootstrap reloaded');
  cmdStatus();
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || 'help';
  if (cmd === 'status') await cmdStatus();
  else if (cmd === 'health') await cmdHealth();
  else if (cmd === 'history') await cmdHistory(parseInt(args[1]) || 20);
  else if (cmd === 'apply') await cmdApply(args.slice(1));
  else if (cmd === 'reload') await cmdReload();
  else usage();
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });