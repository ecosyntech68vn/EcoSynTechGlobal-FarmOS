const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getSecurityStatus } = require('../middleware/security-audit');

router.get('/status', auth, (req, res) => {
  const status = getSecurityStatus();
  const issues = [];
  
  if (status.nodeEnv === 'production' && !status.jwtConfigured) {
    issues.push('JWT_SECRET is not configured - cannot run in production');
  }
  
  res.json({
    ok: true,
    environment: status.nodeEnv,
    secretsConfigured: {
      JWT: status.jwtConfigured,
      HMAC: status.hmacConfigured
    },
    issues: issues.length > 0 ? issues : null,
    auditTime: status.auditTime
  });
});

module.exports = router;