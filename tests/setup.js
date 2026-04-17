beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.HMAC_SECRET = process.env.HMAC_SECRET || 'test-hmac-secret-for-ci';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-ci';
  process.env.WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'webhook-secret';
});

afterAll(async () => {
  const db = require('../src/config/database');
  if (db && db.closeDatabase) {
    await db.closeDatabase();
  }
});
