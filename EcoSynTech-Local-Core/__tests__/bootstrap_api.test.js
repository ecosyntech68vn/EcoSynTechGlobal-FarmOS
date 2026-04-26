const ml = require('../src/bootstrap/modelLoader');

describe('Bootstrap API (modelLoader) - internal API', () => {
  test('applyConfig updates internal bootstrap state', () => {
    ml.applyConfig({ small: false, large: true, largeUrl: 'https://example.com/model.onnx' });
    const s = ml.getStatus();
    expect(s.smallEnabled).toBe(false);
    expect(s.largeEnabled).toBe(true);
    expect(typeof s.largeUrl).toBe('string');
  });

  test('getStatus returns expected shape', () => {
    const s = ml.getStatus();
    expect(s).toHaveProperty('smallEnabled');
    expect(s).toHaveProperty('largeEnabled');
    expect(s).toHaveProperty('largeUrl');
    expect(s).toHaveProperty('lastBootstrapTs');
    expect(s).toHaveProperty('lightLoaded');
    expect(s).toHaveProperty('largeLoaded');
    expect(s).toHaveProperty('health');
    expect(s.health).toHaveProperty('timestamp');
    expect(s.health).toHaveProperty('small');
    expect(s.health).toHaveProperty('large');
    expect(s.health).toHaveProperty('overall');
    expect(s.health).toHaveProperty('memoryUsageMB');
  });

  test('getHealth returns health check result', () => {
    const h = ml.getHealth();
    expect(h).toHaveProperty('timestamp');
    expect(h).toHaveProperty('small');
    expect(h).toHaveProperty('large');
    expect(h.small).toHaveProperty('id', 'model-001');
    expect(h.small).toHaveProperty('name', 'Plant Disease Detector');
    expect(h.small).toHaveProperty('exists');
    expect(h.small).toHaveProperty('healthy');
  });

  test('getHistory returns array', () => {
    const hist = ml.getHistory(5);
    expect(Array.isArray(hist)).toBe(true);
  });

  test('applyConfig with no args does not throw', () => {
    expect(() => ml.applyConfig({})).not.toThrow();
  });

  test('reload resolves without error', async () => {
    await ml.reload();
    const s = ml.getStatus();
    expect(s).toHaveProperty('smallEnabled');
  }, 30000);
});
