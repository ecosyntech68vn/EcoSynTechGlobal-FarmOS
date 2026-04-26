const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getAll, getOne, runQuery } = require('../config/database');

router.get('/', auth, async (req, res) => {
  try {
    const { category, farm_id, low_stock } = req.query;
    let sql = 'SELECT * FROM inventory WHERE status = "active"';
    const params = [];
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (farm_id) { sql += ' AND farm_id = ?'; params.push(farm_id); }
    if (low_stock === 'true') { sql += ' AND quantity <= min_quantity'; }
    sql += ' ORDER BY name';
    
    const items = getAll(sql, params);
    res.json({ ok: true, data: items });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/categories', auth, async (req, res) => {
  try {
    const categories = getAll('SELECT DISTINCT category FROM inventory WHERE category IS NOT NULL');
    res.json({ ok: true, data: categories.map(c => c.category) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const item = getOne('SELECT * FROM inventory WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ ok: false, error: 'Item not found' });
    
    const logs = getAll(
      'SELECT * FROM inventory_log WHERE inventory_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.params.id]
    );
    res.json({ ok: true, data: { item, logs } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, category, unit, quantity, min_quantity, cost_per_unit, supplier, farm_id, expiry_date } = req.body;
    const id = 'inv-' + Date.now();
    runQuery(
      `INSERT INTO inventory (id, name, category, unit, quantity, min_quantity, cost_per_unit, supplier, farm_id, expiry_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
      [id, name, category, unit, quantity || 0, min_quantity || 0, cost_per_unit || 0, supplier, farm_id, expiry_date]
    );
    res.json({ ok: true, data: { id, name } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, category, unit, quantity, min_quantity, cost_per_unit, supplier, status } = req.body;
    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (category) { updates.push('category = ?'); params.push(category); }
    if (unit) { updates.push('unit = ?'); params.push(unit); }
    if (quantity !== undefined) { updates.push('quantity = ?'); params.push(quantity); }
    if (min_quantity) { updates.push('min_quantity = ?'); params.push(min_quantity); }
    if (cost_per_unit) { updates.push('cost_per_unit = ?'); params.push(cost_per_unit); }
    if (supplier) { updates.push('supplier = ?'); params.push(supplier); }
    if (status) { updates.push('status = ?'); params.push(status); }
    params.push(req.params.id);
    
    runQuery(`UPDATE inventory SET ${updates.join(', ')}, updated_at = datetime("now") WHERE id = ?`, params);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    runQuery('UPDATE inventory SET status = "inactive", updated_at = datetime("now") WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/:id/adjust', auth, async (req, res) => {
  try {
    const { type, quantity, notes } = req.body;
    const item = getOne('SELECT * FROM inventory WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ ok: false, error: 'Item not found' });
    
    let newQty = item.quantity;
    if (type === 'in') newQty += quantity;
    else if (type === 'out') newQty -= quantity;
    else if (type === 'set') newQty = quantity;
    else return res.status(400).json({ ok: false, error: 'Invalid type' });
    
    runQuery('UPDATE inventory SET quantity = ?, updated_at = datetime("now") WHERE id = ?', [newQty, req.params.id]);
    
    const logId = 'log-' + Date.now();
    runQuery(
      'INSERT INTO inventory_log (id, inventory_id, type, quantity, notes, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
      [logId, req.params.id, type, quantity, notes]
    );
    
    res.json({ ok: true, data: { oldQuantity: item.quantity, newQuantity: newQty } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/stats/summary', auth, async (req, res) => {
  try {
    const total = getOne('SELECT COUNT(*) as count, SUM(quantity * cost_per_unit) as value FROM inventory WHERE status = "active"');
    const lowStock = getOne('SELECT COUNT(*) as count FROM inventory WHERE status = "active" AND quantity <= min_quantity');
    const byCategory = getAll('SELECT category, COUNT(*) as count, SUM(quantity * cost_per_unit) as value FROM inventory WHERE status = "active" GROUP BY category');
    
    res.json({
      ok: true,
      data: {
        totalItems: total?.count || 0,
        totalValue: total?.value || 0,
        lowStock: lowStock?.count || 0,
        byCategory: byCategory.reduce((acc, c) => { acc[c.category] = { count: c.count, value: c.value }; return acc; }, {})
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;