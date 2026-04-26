const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ml = require('./modelLoader');

// GET /api/bootstrap/status
router.get('/status', auth, (req, res) => {
  try {
    res.json({ ok: true, ...ml.getStatus() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// GET /api/bootstrap/health
router.get('/health', auth, (req, res) => {
  try {
    res.json({ ok: true, ...ml.getHealth() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// GET /api/bootstrap/history
router.get('/history', auth, (req, res) => {
  try {
    const n = Math.min(parseInt(req.query.limit) || 20, 100);
    res.json({ ok: true, history: ml.getHistory(n) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// POST /api/bootstrap/configure
router.post('/configure', auth, (req, res) => {
  const { small, large, largeUrl } = req.body || {};
  try {
    ml.applyConfig({ small, large, largeUrl });
    res.json({ ok: true, status: ml.getStatus() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// POST /api/bootstrap/reload
router.post('/reload', auth, async (req, res) => {
  try {
    const result = await ml.reload();
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

module.exports = router;