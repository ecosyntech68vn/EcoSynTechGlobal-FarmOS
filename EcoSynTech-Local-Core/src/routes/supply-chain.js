const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getAll, getOne, runQuery } = require('../config/database');

router.get('/', auth, async (req, res) => {
  try {
    const { status, farm_id } = req.query;
    let sql = 'SELECT * FROM supply_chain WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (farm_id) { sql += ' AND source_farm_id = ?'; params.push(farm_id); }
    sql += ' ORDER BY created_at DESC';
    
    const batches = getAll(sql, params);
    res.json({ ok: true, data: batches });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const batch = getOne('SELECT * FROM supply_chain WHERE id = ?', [req.params.id]);
    if (!batch) return res.status(404).json({ ok: false, error: 'Batch not found' });
    res.json({ ok: true, data: batch });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { batch_code, product_name, quantity, unit, source_farm_id, destination } = req.body;
    const id = 'sc-' + Date.now();
    runQuery(
      `INSERT INTO supply_chain (id, batch_code, product_name, quantity, unit, source_farm_id, destination, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
      [id, batch_code, product_name, quantity, unit, source_farm_id, destination]
    );
    res.json({ ok: true, data: { id, batch_code } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { product_name, quantity, unit, destination, status, notes } = req.body;
    const updates = [];
    const params = [];
    if (product_name) { updates.push('product_name = ?'); params.push(product_name); }
    if (quantity) { updates.push('quantity = ?'); params.push(quantity); }
    if (unit) { updates.push('unit = ?'); params.push(unit); }
    if (destination) { updates.push('destination = ?'); params.push(destination); }
    if (status) { 
      updates.push('status = ?'); params.push(status);
      if (status === 'shipped') updates.push('shipped_date = datetime("now")');
      if (status === 'delivered') updates.push('delivered_date = datetime("now")');
    }
    if (notes) { updates.push('notes = ?'); params.push(notes); }
    params.push(req.params.id);
    
    runQuery(`UPDATE supply_chain SET ${updates.join(', ')}, updated_at = datetime("now") WHERE id = ?`, params);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/:id/harvest', auth, async (req, res) => {
  try {
    const { temperature, humidity, quality_check, notes } = req.body;
    runQuery(
      `UPDATE supply_chain SET status = 'harvested', harvest_date = datetime("now"),
       temperature = ?, humidity = ?, quality_check = ?, notes = ?, updated_at = datetime("now")
       WHERE id = ?`,
      [temperature, humidity, quality_check, notes, req.params.id]
    );
    res.json({ ok: true, message: 'Harvest recorded' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/:id/ship', auth, async (req, res) => {
  try {
    const { temperature, humidity } = req.body;
    runQuery(
      `UPDATE supply_chain SET status = 'shipped', shipped_date = datetime("now"),
       temperature = ?, humidity = ?, updated_at = datetime("now")
       WHERE id = ?`,
      [temperature, humidity, req.params.id]
    );
    res.json({ ok: true, message: 'Shipped' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/:id/deliver', auth, async (req, res) => {
  try {
    const { quality_check, notes } = req.body;
    runQuery(
      `UPDATE supply_chain SET status = 'delivered', delivered_date = datetime("now"),
       quality_check = ?, notes = ?, updated_at = datetime("now")
       WHERE id = ?`,
      [quality_check, notes, req.params.id]
    );
    res.json({ ok: true, message: 'Delivered' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const total = getOne('SELECT COUNT(*) as count FROM supply_chain');
    const byStatus = getAll('SELECT status, COUNT(*) as count FROM supply_chain GROUP BY status');
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthly = getOne(
      'SELECT COUNT(*) as count FROM supply_chain WHERE created_at LIKE ?',
      [thisMonth + '%']
    );
    
    res.json({
      ok: true,
      data: {
        total: total?.count || 0,
        byStatus: byStatus.reduce((acc, s) => { acc[s.status] = s.count; return acc; }, {}),
        thisMonth: monthly?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;