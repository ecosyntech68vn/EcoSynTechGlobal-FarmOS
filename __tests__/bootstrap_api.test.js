const ml = require('../src/bootstrap/modelLoader');

describe('Bootstrap API (modelLoader) - internal API', () => {
  test('applyConfig updates internal bootstrap state', () => {
    ml.applyConfig({ small: false, large: true, largeUrl: 'https://example.com/model.onnx' });
    const s = ml.getStatus();
    expect(s.smallEnabled).toBe(false);
    expect(s.largeEnabled).toBe(true);
    expect(typeof s.largeUrl).toBe('string');
  });

  test('reloadBootstrap reloads predictors', async () => {
    await ml.reloadBootstrap();
    const s = ml.getStatus();
    // Should still provide a status object
    expect(s).toHaveProperty('smallEnabled');
  });
});
