const request = require('supertest')
const { createApp } = require('../server')
const dbModule = require('../src/config/database')

describe('Telemetry RBAC gating (mocked)', () => {
  let app

  beforeAll(async () => {
    // Initialize DB first to avoid "Database not initialized" during export
    await dbModule.initDatabase()
    app = createApp()
  })

  test('Access without mock header should be 401', async () => {
    const res = await request(app).post('/api/export')
    // Without mock header, gating should require auth
    expect(res.status).toBe(401)
  })

  test('Admin mock role should be allowed (200/304)', async () => {
    const res = await request(app)
      .post('/api/export')
      .set('X-Mock-Telemetry-Role', 'telemetry_admin')
    expect([200, 304]).toContain(res.status)
  })

  test('Telemetry_user mock role should be allowed (200/304)', async () => {
    const res = await request(app)
      .post('/api/export')
      .set('X-Mock-Telemetry-Role', 'telemetry_user')
    expect([200, 304]).toContain(res.status)
  })

  test('Unknown/mock guest role should be forbidden (403)', async () => {
    const res = await request(app)
      .post('/api/export')
      .set('X-Mock-Telemetry-Role', 'guest')
    expect(res.status).toBe(403)
  })
})
