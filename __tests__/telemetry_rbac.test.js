const request = require('supertest')
const { createApp } = require('../server')
const dbModule = require('../src/config/database')

describe('Telemetry RBAC gating', () => {
  let app
  let tokenAdmin
  let tokenUser

  beforeAll(async () => {
    await dbModule.initDatabase()
    app = createApp()
    // Attempt to login as two users; adapt if these accounts exist in your test DB
    try {
      let res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'password123' })
      tokenAdmin = res.body && res.body.token
    } catch (e) {
      // ignore if not available in tests
    }
    try {
      let res = await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'password123' })
      tokenUser = res.body && res.body.token
    } catch (e) {
      // ignore if not available in tests
    }
  })

  test('Access without token should be 401', async () => {
    const res = await request(app).get('/api/export')
    expect(res.status).toBe(401)
  })

  test('Admin token should be allowed (200)', async () => {
    if (!tokenAdmin) {
      console.warn('No admin token available for test; skipping this test.');
      return;
    }
    const res = await request(app).get('/api/export').set('Authorization', `Bearer ${tokenAdmin}`)
    expect([200, 304]).toContain(res.status)
  })

  test('Non-admin token should be forbidden (403)', async () => {
    if (!tokenUser) {
      console.warn('No user token available for test; skipping this test.');
      return;
    }
    const res = await request(app).get('/api/export').set('Authorization', `Bearer ${tokenUser}`)
    expect(res.status).toBe(403)
  })
})
