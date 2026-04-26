const request = require('supertest')
const { createApp } = require('../server')
const dbModule = require('../src/config/database')

describe('Telemetry RBAC gating (mocked)', () => {
  let app

  beforeAll(async () => {
    await dbModule.initDatabase()
    app = createApp()
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
})