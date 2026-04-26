const express = require('express');
const router = express.Router();
const { auth: authenticate } = require('../middleware/auth');

// Admin ping endpoint to verify admin RBAC (RBAC simplified for test)
router.get('/ping', authenticate, (req, res) => {
  // DEBUG: reveal current user for audit of RBAC logic during tests
  // console.debug('[ADMIN-TEST] req.user', req.user);
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json({ status: 'ok', admin: true, user: req.user });
});

module.exports = router;
