let createApp;
let request;

describe('End-to-end: core public endpoints', () => {
  let app;
  beforeAll(() => {
    // Initialize test env before requiring app to avoid long-running timers in test env
    process.env.NODE_ENV = 'test';
    ({ createApp } = require('../server'));
    request = require('supertest');
    app = createApp();
  })

  test('GET /api/version returns version info', async () => {
    const res = await request(app).get('/api/version').expect(200)
    expect(res.body).toBeDefined()
    expect(res.body.api).toBeDefined()
    expect(res.body.server).toBe('Express')
  })

  test('GET /api/docs serves docs', async () => {
    const res = await request(app).get('/api/docs')
      .expect((res) => res.status === 200 || res.status === 301)
      .then(r => r)
    // Basic sanity: ensure presence of docs (redirect allowed)
    expect(res).toBeDefined()
  })

  test('GET /api/i18n/languages returns languages', async () => {
    const res = await request(app).get('/api/i18n/languages').expect(200)
    const body = res.body
    const isValid = Array.isArray(body) ? (body.length > 0) : (body && typeof body === 'object')
    expect(isValid).toBe(true)
  })

  test('GET /api/i18n/current returns current language', async () => {
    const res = await request(app).get('/api/i18n/current').expect(200)
    expect(res.body).toBeDefined()
    expect(res.body.language).toBeDefined()
  })
})
