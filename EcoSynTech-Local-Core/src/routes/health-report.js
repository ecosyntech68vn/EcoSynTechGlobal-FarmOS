const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const healthReportService = require('../services/healthReportService');

router.get('/settings', auth, async (req, res) => {
  try {
    const settings = await healthReportService.getSettings();
    res.json({ ok: true, data: settings });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.put('/settings', auth, async (req, res) => {
  try {
    const { url, apiKey, customerId, clientId, intervalMin, queueThreshold, useHttps } = req.body;
    const settings = await healthReportService.updateSettings({
      url, apiKey, customerId, clientId, intervalMin, queueThreshold, useHttps
    });
    res.json({ ok: true, data: settings });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/test', auth, async (req, res) => {
  try {
    await healthReportService.report();
    res.json({ ok: true, message: 'Test report sent' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/queue', auth, async (req, res) => {
  try {
    const queue = healthReportService.loadQueue();
    res.json({ ok: true, data: { queue, count: queue.length } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.delete('/queue', auth, async (req, res) => {
  try {
    healthReportService.saveQueue([]);
    res.json({ ok: true, message: 'Queue cleared' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;