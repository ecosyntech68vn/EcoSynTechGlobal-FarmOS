#!/usr/bin/env node
/* Node-based validation for investor demo branch */
const fs = require('fs');
const path = require('path');

function exists(p) {
  try { return fs.existsSync(p); } catch (e) { return false; }
}

let errors = 0;
let warnings = 0;

const root = path.resolve(__dirname, '..');

console.log('--- Investor Demo Validation (Node) ---');

// 1) Validate AI placeholders exist in demo placeholders
const aiPlaceholders = [
  path.join(root, 'src', 'services', 'ai', 'tfliteDiseasePredictor.js'),
  path.join(root, 'src', 'services', 'ai', 'lstmIrrigationPredictor.js')
];
let aiOk = true;
aiPlaceholders.forEach((p) => {
  if (exists(p)) {
    const c = fs.readFileSync(p, 'utf8');
    if (!c.includes('EcoSynTech Farm OS - AI Service Placeholder')) {
      aiOk = false;
      console.warn('AI placeholder not found content-wise:', p);
    }
  } else {
    aiOk = false;
    console.warn('AI placeholder file missing:', p);
  }
});
if (!aiOk) {
  console.error('AI placeholders not properly installed for demo.');
  errors++;
}

// 2) Ensure blacklist of sensitive files is sanitized in demo (heuristic)
const sensitiveFiles = [
  path.join(root, 'models', 'plant_disease.tflite'),
  path.join(root, 'models', 'irrigation_lstm.onnx'),
  path.join(root, '.env'),
  path.join(root, '.env.production')
];
for (const f of sensitiveFiles) {
  if (exists(f)) {
    // If the file exists on disk, it might be in workspace; warn but don't fail hard for local checks
    console.warn('Warning: sensitive file present on disk (may be sanitized in demo):', f);
    warnings++;
  }
}

// 3) Check README demo notice
const readme = path.join(root, 'README.md');
if (exists(readme)) {
  const r = fs.readFileSync(readme, 'utf8');
  if (!r.includes('public demo') && !r.includes('DEMO VERSION')) {
    console.warn('Demo notice missing in README.');
    warnings++;
  }
} else {
  errors++;
  console.warn('README.md missing');
}

// 4) Optional: verify docs exist for investor sharing SOP
const sopPath = path.join(root, 'docs', 'security', 'DEMO_SHARING_SOP.md');
if (!exists(sopPath)) {
  console.warn('Missing investor sharing SOP: docs/security/DEMO_SHARING_SOP.md');
  warnings++;
}

if (errors > 0) {
  console.error('Validation FAILED with errors.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('Validation PASSED with warnings. Review recommended.');
  process.exit(0);
} else {
  console.log('Validation PASSED. Demo branch is sanitized for investor review.');
  process.exit(0);
}
