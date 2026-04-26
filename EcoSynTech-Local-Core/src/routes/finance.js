const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getAll, getOne, runQuery } = require('../config/database');

router.get('/', auth, async (req, res) => {
  try {
    const { type, category, farm_id, start_date, end_date } = req.query;
    let sql = 'SELECT * FROM finance WHERE 1=1';
    const params = [];
    if (type) { sql += ' AND type = ?'; params.push(type); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (farm_id) { sql += ' AND farm_id = ?'; params.push(farm_id); }
    if (start_date) { sql += ' AND date >= ?'; params.push(start_date); }
    if (end_date) { sql += ' AND date <= ?'; params.push(end_date); }
    sql += ' ORDER BY date DESC';
    
    const transactions = getAll(sql, params);
    res.json({ ok: true, data: transactions });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/categories', auth, async (req, res) => {
  try {
    const categories = getAll('SELECT DISTINCT category FROM finance');
    res.json({ ok: true, data: categories.map(c => c.category) });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { type, category, amount, description, farm_id, date, payment_method, reference_id } = req.body;
    const id = 'fin-' + Date.now();
    runQuery(
      `INSERT INTO finance (id, type, category, amount, description, farm_id, date, payment_method, reference_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))`,
      [id, type, category, amount, description, farm_id, date, payment_method, reference_id]
    );
    
    await updateMonthlySummary(farm_id, date);
    res.json({ ok: true, data: { id, type, amount } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { type, category, amount, description, date, payment_method } = req.body;
    const existing = getOne('SELECT * FROM finance WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ ok: false, error: 'Transaction not found' });
    
    const updates = [];
    const params = [];
    if (type) { updates.push('type = ?'); params.push(type); }
    if (category) { updates.push('category = ?'); params.push(category); }
    if (amount) { updates.push('amount = ?'); params.push(amount); }
    if (description) { updates.push('description = ?'); params.push(description); }
    if (date) { updates.push('date = ?'); params.push(date); }
    if (payment_method) { updates.push('payment_method = ?'); params.push(payment_method); }
    params.push(req.params.id);
    
    runQuery(`UPDATE finance SET ${updates.join(', ')} WHERE id = ?`, params);
    await updateMonthlySummary(existing.farm_id, existing.date);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const existing = getOne('SELECT * FROM finance WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ ok: false, error: 'Transaction not found' });
    
    runQuery('DELETE FROM finance WHERE id = ?', [req.params.id]);
    await updateMonthlySummary(existing.farm_id, existing.date);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

async function updateMonthlySummary(farmId, date) {
  if (!date) return;
  const [year, month] = date.split('-').map(Number);
  const income = getOne(
    'SELECT SUM(amount) as total FROM finance WHERE type = \'income\' AND farm_id = ? AND strftime(\'%Y\', date) = ? AND strftime(\'%m\', date) = ?',
    [farmId, year.toString(), month.toString().padStart(2, '0')]
  );
  const expenses = getOne(
    'SELECT SUM(amount) as total FROM finance WHERE type = \'expense\' AND farm_id = ? AND strftime(\'%Y\', date) = ? AND strftime(\'%m\', date) = ?',
    [farmId, year.toString(), month.toString().padStart(2, '0')]
  );
  const workersCost = getOne(
    'SELECT SUM(daily_rate) as total FROM finance WHERE category = \'workers\' AND farm_id = ? AND strftime(\'%Y\', date) = ? AND strftime(\'%m\', date) = ?',
    [farmId, year.toString(), month.toString().padStart(2, '0')]
  );
  
  runQuery(
    `INSERT INTO finance_summary (id, farm_id, year, month, income, expenses, workers_cost, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))
     ON CONFLICT(farm_id, year, month) DO UPDATE SET income = ?, expenses = ?, workers_cost = ?, updated_at = datetime("now")`,
    [`summary-${farmId}-${year}-${month}`, farmId, year, month, income?.total || 0, expenses?.total || 0, workersCost?.total || 0, income?.total || 0, expenses?.total || 0, workersCost?.total || 0]
  );
}

router.get('/report', auth, async (req, res) => {
  try {
    const { farm_id, year, month } = req.query;
    const currentYear = parseInt(year || new Date().getFullYear());
    const currentMonth = parseInt(month || new Date().getMonth() + 1);
    
    const incomeByCategory = getAll(
      'SELECT category, SUM(amount) as total FROM finance WHERE type = \'income\' AND farm_id = ? AND strftime(\'%Y\', date) = ? AND strftime(\'%m\', date) = ? GROUP BY category',
      [farm_id, currentYear.toString(), currentMonth.toString().padStart(2, '0')]
    );
    const expenseByCategory = getAll(
      'SELECT category, SUM(amount) as total FROM finance WHERE type = \'expense\' AND farm_id = ? AND strftime(\'%Y\', date) = ? AND strftime(\'%m\', date) = ? GROUP BY category',
      [farm_id, currentYear.toString(), currentMonth.toString().padStart(2, '0')]
    );
    
    const totalIncome = incomeByCategory.reduce((sum, c) => sum + (c.total || 0), 0);
    const totalExpense = expenseByCategory.reduce((sum, c) => sum + (c.total || 0), 0);
    
    const workersExpense = expenseByCategory.find(e => e.category === 'workers')?.total || 0;
    const suppliesExpense = expenseByCategory.find(e => ['fertilizer', 'pesticide', 'seeds'].includes(e.category))?.total || 0;
    
    res.json({
      ok: true,
      data: {
        period: { year: currentYear, month: currentMonth },
        income: { total: totalIncome, byCategory: incomeByCategory.reduce((acc, c) => { acc[c.category] = c.total; return acc; }, {}) },
        expenses: { total: totalExpense, byCategory: expenseByCategory.reduce((acc, c) => { acc[c.category] = c.total; return acc; }, {}) },
        profit: totalIncome - totalExpense,
        roi: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) + '%' : '0%',
        breakdown: {
          workersCost: workersExpense,
          suppliesCost: suppliesExpense,
          otherCost: totalExpense - workersExpense - suppliesExpense
        }
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

router.get('/summary', auth, async (req, res) => {
  try {
    const { farm_id, year } = req.query;
    const currentYear = parseInt(year || new Date().getFullYear());
    
    const summaries = getAll(
      'SELECT * FROM finance_summary WHERE farm_id = ? AND year = ? ORDER BY month',
      [farm_id, currentYear]
    );
    
    const total = {
      income: summaries.reduce((s, i) => s + (i.income || 0), 0),
      expenses: summaries.reduce((s, i) => s + (i.expenses || 0), 0),
      workersCost: summaries.reduce((s, i) => s + (i.workers_cost || 0), 0)
    };
    total.profit = total.income - total.expenses;
    total.roi = total.income > 0 ? ((total.income - total.expenses) / total.income * 100).toFixed(1) + '%' : '0%';
    
    res.json({ ok: true, data: { yearly: summaries, total } });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;