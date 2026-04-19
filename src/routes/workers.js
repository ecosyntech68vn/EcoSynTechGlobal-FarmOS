const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getAll, getOne, runQuery } = require('../config/database');

router.get('/', auth, async (req, res) => {
  try {
    const workers = getAll('SELECT * FROM workers ORDER BY created_at DESC');
    res.json({ ok: true, data: workers });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const worker = getOne('SELECT * FROM workers WHERE id = ?', [req.params.id]);
    if (!worker) return res.status(404).json({ ok: false, error: 'Worker not found' });
    
    const attendance = getAll(
      'SELECT * FROM worker_attendance WHERE worker_id = ? ORDER BY date DESC LIMIT 30',
      [req.params.id]
    );
    const totalHours = getOne(
      'SELECT SUM(hours_worked) as total FROM worker_attendance WHERE worker_id = ?',
      [req.params.id]
    );
    
    res.json({ ok: true, data: { worker, attendance, totalHours: totalHours?.total || 0 } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, role, phone, farm_id, daily_rate, hire_date } = req.body;
    const id = 'worker-' + Date.now();
    runQuery(
      'INSERT INTO workers (id, name, role, phone, farm_id, daily_rate, hire_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))',
      [id, name, role, phone, farm_id, daily_rate, hire_date]
    );
    res.json({ ok: true, data: { id, name } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, role, phone, farm_id, daily_rate, status } = req.body;
    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (role) { updates.push('role = ?'); params.push(role); }
    if (phone) { updates.push('phone = ?'); params.push(phone); }
    if (farm_id) { updates.push('farm_id = ?'); params.push(farm_id); }
    if (daily_rate) { updates.push('daily_rate = ?'); params.push(daily_rate); }
    if (status) { updates.push('status = ?'); params.push(status); }
    params.push(req.params.id);
    
    runQuery(`UPDATE workers SET ${updates.join(', ')}, updated_at = datetime("now") WHERE id = ?`, params);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    runQuery('UPDATE workers SET status = "inactive", updated_at = datetime("now") WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/:id/checkin', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = getOne(
      'SELECT * FROM worker_attendance WHERE worker_id = ? AND date = ?',
      [req.params.id, today]
    );
    if (existing) {
      return res.status(400).json({ ok: false, error: 'Already checked in today' });
    }
    
    const id = 'att-' + Date.now();
    runQuery(
      'INSERT INTO worker_attendance (id, worker_id, date, check_in, created_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))',
      [id, req.params.id, today]
    );
    res.json({ ok: true, data: { id, checkIn: new Date().toISOString() } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/:id/checkout', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendance = getOne(
      'SELECT * FROM worker_attendance WHERE worker_id = ? AND date = ?',
      [req.params.id, today]
    );
    if (!attendance) return res.status(400).json({ ok: false, error: 'Not checked in today' });
    
    const checkIn = new Date(attendance.check_in).getTime();
    const hoursWorked = (Date.now() - checkIn) / 3600000;
    const { task, notes } = req.body;
    
    runQuery(
      'UPDATE worker_attendance SET check_out = datetime("now"), hours_worked = ?, task = ?, notes = ? WHERE id = ?',
      [hoursWorked.toFixed(1), task, notes, attendance.id]
    );
    res.json({ ok: true, data: { hoursWorked: hoursWorked.toFixed(1) } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/:id/stats', auth, async (req, res) => {
  try {
    const worker = getOne('SELECT * FROM workers WHERE id = ?', [req.params.id]);
    if (!worker) return res.status(404).json({ ok: false, error: 'Worker not found' });
    
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthly = getOne(
      'SELECT SUM(hours_worked) as hours, COUNT(*) as days FROM worker_attendance WHERE worker_id = ? AND date LIKE ?',
      [req.params.id, thisMonth + '%']
    );
    const allTime = getOne(
      'SELECT SUM(hours_worked) as hours, COUNT(*) as days FROM worker_attendance WHERE worker_id = ?',
      [req.params.id]
    );
    
    res.json({
      ok: true,
      data: {
        worker,
        thisMonth: { hours: monthly?.hours || 0, days: monthly?.days || 0 },
        allTime: { hours: allTime?.hours || 0, days: allTime?.days || 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;