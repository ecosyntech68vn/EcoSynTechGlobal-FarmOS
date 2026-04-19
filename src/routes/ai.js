const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const aiEngine = require('../services/aiEngine');
const { getAll, getOne, runQuery } = require('../config/database');

router.get('/predict/irrigation', auth, async (req, res) => {
  try {
    const farmId = req.query.farm_id || 'default';
    const prediction = await aiEngine.predictIrrigation(farmId);
    res.json({ ok: true, data: prediction });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/predict/fertilization', auth, async (req, res) => {
  try {
    const farmId = req.query.farm_id || 'default';
    const prediction = await aiEngine.predictFertilization(farmId);
    res.json({ ok: true, data: prediction });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/predict/yield', auth, async (req, res) => {
  try {
    const farmId = req.query.farm_id || 'default';
    const prediction = await aiEngine.predictYield(farmId);
    res.json({ ok: true, data: prediction });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/predict/disease-risk', auth, async (req, res) => {
  try {
    const farmId = req.query.farm_id || 'default';
    const risk = await aiEngine.diseaseRiskScore(farmId);
    res.json({ ok: true, data: risk });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/predict/anomaly', auth, async (req, res) => {
  try {
    const farmId = req.query.farm_id || 'default';
    const result = await aiEngine.detectAnomalies(farmId);
    res.json({ ok: true, data: result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/predict/all', auth, async (req, res) => {
  try {
    const farmId = req.query.farm_id || 'default';
    const results = await aiEngine.processAllPredictions(farmId);
    res.json({ ok: true, data: results });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/recommendations', auth, async (req, res) => {
  try {
    const { farm_id, category, status, priority } = req.query;
    let sql = 'SELECT * FROM recommendations WHERE 1=1';
    const params = [];
    if (farm_id) { sql += ' AND farm_id = ?'; params.push(farm_id); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (priority) { sql += ' AND priority = ?'; params.push(priority); }
    sql += ' ORDER BY created_at DESC LIMIT 50';
    
    const recommendations = getAll(sql, params);
    res.json({ ok: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/recommendations/:id/acknowledge', auth, async (req, res) => {
  try {
    const result = await aiEngine.acknowledgeRecommendation(req.params.id, req.user?.id, 'acknowledged');
    res.json({ ok: true, data: result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/recommendations/:id/complete', auth, async (req, res) => {
  try {
    runQuery('UPDATE recommendations SET status = "done", resolved_at = datetime("now") WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/recommendations/:id/dismiss', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    runQuery('UPDATE recommendations SET status = "dismissed", resolved_at = datetime("now") WHERE id = ?', [req.params.id]);
    if (reason) {
      const feedbackId = 'fb-' + Date.now();
      runQuery(
        `INSERT INTO ai_feedback (id, recommendation_id, user_id, feedback_type, comment, created_at)
         VALUES (?, ?, ?, ?, ?, datetime("now"))`,
        [feedbackId, req.params.id, req.user?.id, 'dismissed', reason]
      );
    }
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/anomalies', auth, async (req, res) => {
  try {
    const { farm_id, status, severity } = req.query;
    let sql = 'SELECT * FROM anomalies WHERE 1=1';
    const params = [];
    if (farm_id) { sql += ' AND farm_id = ?'; params.push(farm_id); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (severity) { sql += ' AND severity = ?'; params.push(severity); }
    sql += ' ORDER BY detected_at DESC LIMIT 50';
    
    const anomalies = getAll(sql, params);
    res.json({ ok: true, data: anomalies });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/anomalies/:id/acknowledge', auth, async (req, res) => {
  try {
    runQuery(
      'UPDATE anomalies SET status = "acknowledged", acknowledged_by = ? WHERE id = ?',
      [req.user?.id, req.params.id]
    );
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/predictions', auth, async (req, res) => {
  try {
    const { farm_id, target_type } = req.query;
    let sql = 'SELECT * FROM predictions WHERE 1=1';
    const params = [];
    if (farm_id) { sql += ' AND farm_id = ?'; params.push(farm_id); }
    if (target_type) { sql += ' AND target_type = ?'; params.push(target_type); }
    sql += ' ORDER BY created_at DESC LIMIT 30';
    
    const predictions = getAll(sql, params);
    res.json({ ok: true, data: predictions });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/summary/daily', auth, async (req, res) => {
  try {
    const farmId = req.query.farm_id || 'default';
    const summary = await aiEngine.generateSummary(farmId, 'daily');
    res.json({ ok: true, data: summary });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/summary/weekly', auth, async (req, res) => {
  try {
    const farmId = req.query.farm_id || 'default';
    const summary = await aiEngine.generateSummary(farmId, 'weekly');
    res.json({ ok: true, data: summary });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/feedback', auth, async (req, res) => {
  try {
    const { recommendation_id, prediction_id, feedback_type, comment } = req.body;
    const id = 'fb-' + Date.now();
    runQuery(
      `INSERT INTO ai_feedback (id, recommendation_id, prediction_id, user_id, feedback_type, comment, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime("now"))`,
      [id, recommendation_id, prediction_id, req.user?.id, feedback_type, comment]
    );
    res.json({ ok: true, data: { id } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/models', auth, async (req, res) => {
  try {
    const models = getAll('SELECT * FROM ai_models ORDER BY created_at DESC');
    res.json({ ok: true, data: models });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;