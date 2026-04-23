const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const modelLoader = require('./modelLoader');

// Status: GET /api/bootstrap/status
router.get('/status', auth, (req, res) => {
  try {
    const status = modelLoader.getStatus();
    res.json({ ok: true, status });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Configure: POST /api/bootstrap/configure
router.post('/configure', auth, (req, res) => {
  const { small, large, largeUrl } = req.body || {};
  try {
    modelLoader.applyConfig({ small, large, largeUrl });
    res.json({ ok: true, status: modelLoader.getStatus() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Reload bootstrap: POST /api/bootstrap/reload
router.post('/reload', auth, async (req, res) => {
  try {
    await modelLoader.reloadBootstrap();
    res.json({ ok: true, status: modelLoader.getStatus() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

module.exports = router;
