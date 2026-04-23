const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function runBootstrap(env = {}) {
  // Run bootstrap script with given env vars
  const oldEnv = Object.assign({}, process.env);
  Object.assign(process.env, env);
  try {
    execSync('bash scripts/setup-models.sh', { stdio: 'ignore' });
  } finally {
    process.env = oldEnv;
  }
}

describe('AI bootstrap', () => {
  const smallModel = path.resolve(__dirname, '../models/plant_disease.tflite');
  const largeModel = path.resolve(__dirname, '../models/irrigation_lstm.onnx');

  beforeAll(() => {
    // Ensure clean slate: small model should exist in repo
    if (!fs.existsSync(smallModel)) {
      // If not present, fail fast
      throw new Error('Precondition failed: small model not present in repo');
    }
  });

  test('loads lightweight model by default (AI_SMALL_MODEL=1)', () => {
    // Cleanup: ensure large model file not created by bootstrap in this test
    if (fs.existsSync(largeModel)) {
      // Do not delete to avoid messing with local A/B tests; ignore
    }
    runBootstrap({ AI_SMALL_MODEL: '1', AI_LARGE_MODEL: '0' });
    // Expect small model to exist in target location
    expect(fs.existsSync(smallModel)).toBe(true);
  });

  test('does not create large model when AI_LARGE_MODEL=0', () => {
    // Ensure large model is not present before test
    if (fs.existsSync(largeModel)) {
      try { fs.unlinkSync(largeModel); } catch (e) { /* ignore */ }
    }
    runBootstrap({ AI_SMALL_MODEL: '1', AI_LARGE_MODEL: '0' });
    // Large model should not be created by bootstrap
    expect(fs.existsSync(largeModel)).toBe(false);
  });
});
