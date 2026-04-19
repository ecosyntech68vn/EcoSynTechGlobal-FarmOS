const express = require('express');
const router = express.Router();
const { getOne, getAll, runQuery } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

function generateLeadId() {
  return 'LEAD-' + Date.now().toString(36).toUpperCase();
}

function generateDealId() {
  return 'DEAL-' + Date.now().toString(36).toUpperCase();
}

const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  WON: 'won',
  LOST: 'lost'
};

const LEAD_SOURCE = {
  WEBSITE: 'website',
  REFERRAL: 'referral',
  COLD_CALL: 'cold_call',
  TRADESHOW: 'tradeshow',
  PARTNER: 'partner',
  ADS: 'ads',
  ORGANIC: 'organic'
};

const INDUSTRY = {
  VEGETABLE: 'rau_mau',
  FRUIT: 'cay_an_trai',
  RICE: 'lua',
  HERB: 'duoc_lieu',
  FLOWER: 'hoa',
  AQUaculture: 'thuy_san',
  LIVESTOCK: 'chan_nuoi'
};

router.get('/leads', auth, asyncHandler(async (req, res) => {
  const { status, source, assignedTo, page = 1, limit = 20 } = req.query;
  let sql = 'SELECT * FROM sales_leads WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (source) {
    sql += ' AND source = ?';
    params.push(source);
  }
  if (assignedTo) {
    sql += ' AND assigned_to = ?';
    params.push(assignedTo);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const leads = getAll(sql, params);

  const countResult = getOne(
    'SELECT COUNT(*) as total FROM sales_leads WHERE 1=1' +
    (status ? ' AND status = ?' : '') + (source ? ' AND source = ?' : '') + (assignedTo ? ' AND assigned_to = ?' : ''),
    [...(status ? [status] : []), ...(source ? [source] : []), ...(assignedTo ? [assignedTo] : [])]
  );

  res.json({
    leads,
    total: countResult?.total || 0,
    page: parseInt(page),
    limit: parseInt(limit)
  });
}));

router.get('/leads/:id', auth, asyncHandler(async (req, res) => {
  const lead = getOne('SELECT * FROM sales_leads WHERE id = ?', [req.params.id]);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const deals = getAll('SELECT * FROM sales_deals WHERE lead_id = ?', [req.params.id]);
  const activities = getAll('SELECT * FROM sales_activities WHERE lead_id = ? ORDER BY created_at DESC LIMIT 20', [req.params.id]);

  res.json({ ...lead, deals, activities });
}));

router.post('/leads', auth, asyncHandler(async (req, res) => {
  const {
    companyName, contactName, phone, email,
    source, industry, farmSize, address,
    interest, notes
  } = req.body;

  if (!companyName || !contactName) {
    return res.status(400).json({ error: 'Company name and contact name are required' });
  }

  const id = generateLeadId();
  const now = new Date().toISOString();

  const industryCategory = industry || 'vegetable';
  const score = calculateLeadScore(farmSize, industryCategory, source);

  runQuery(
    `INSERT INTO sales_leads (id, company_name, contact_name, phone, email, source, industry, farm_size, address, interest, notes, score, status, assigned_to, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, companyName, contactName, phone || '', email || '', source || LEAD_SOURCE.WEBSITE,
     industryCategory, farmSize || 0, address || '', interest || '', notes || '',
     score, LEAD_STATUS.NEW, req.user.id, now, now]
  );

  const activity = {
    type: 'lead_created',
    description: `Lead mới được tạo: ${companyName}`,
    leadId: id
  };
  logActivity(activity, req.user.id);

  res.status(201).json({
    id,
    companyName,
    contactName,
    status: LEAD_STATUS.NEW,
    score,
    source: source || LEAD_SOURCE.WEBSITE
  });
}));

router.put('/leads/:id/status', auth, asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const lead = getOne('SELECT * FROM sales_leads WHERE id = ?', [req.params.id]);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  if (!Object.values(LEAD_STATUS).includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const now = new Date().toISOString();

  runQuery('UPDATE sales_leads SET status = ?, updated_at = ? WHERE id = ?',
    [status, now, req.params.id]);

  const activity = {
    type: 'status_changed',
    description: `Chuyển trạng thái: ${lead.status} → ${status}`,
    leadId: req.params.id,
    notes
  };
  logActivity(activity, req.user.id);

  res.json({ success: true, status });
}));

router.put('/leads/:id/assign', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  const lead = getOne('SELECT * FROM sales_leads WHERE id = ?', [req.params.id]);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const now = new Date().toISOString();
  runQuery('UPDATE sales_leads SET assigned_to = ?, updated_at = ? WHERE id = ?',
    [assignedTo, now, req.params.id]);

  const activity = {
    type: 'assigned',
    description: `Được giao cho: ${assignedTo}`,
    leadId: req.params.id
  };
  logActivity(activity, req.user.id);

  res.json({ success: true, assignedTo });
}));

router.post('/leads/:id/activities', auth, asyncHandler(async (req, res) => {
  const { type, description, notes, duration } = req.body;
  const lead = getOne('SELECT * FROM sales_leads WHERE id = ?', [req.params.id]);

  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const activity = {
    type: type || 'call',
    description,
    notes,
    duration,
    leadId: req.params.id
  };

  logActivity(activity, req.user.id);

  const newScore = calculateLeadScore(
    lead.farm_size,
    lead.industry,
    lead.source,
    lead.status
  );

  if (newScore !== lead.score) {
    runQuery('UPDATE sales_leads SET score = ?, updated_at = ? WHERE id = ?',
      [newScore, new Date().toISOString(), req.params.id]);
  }

  res.json({ success: true });
}));

router.post('/deals', auth, asyncHandler(async (req, res) => {
  const {
    leadId, name, value, probability,
    expectedClose, stage, products,
    notes, discount
  } = req.body;

  if (!leadId || !name || !value) {
    return res.status(400).json({ error: 'Lead ID, name, and value are required' });
  }

  const lead = getOne('SELECT * FROM sales_leads WHERE id = ?', [leadId]);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const id = generateDealId();
  const now = new Date().toISOString();

  const dealStage = stage || 'discovery';
  const dealProbability = probability || getStageProbability(dealStage);

  runQuery(
    `INSERT INTO sales_deals (id, lead_id, name, value, probability, stage, products, discount, expected_close, status, owner_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, leadId, name, value, dealProbability, dealStage,
     JSON.stringify(products || []), discount || 0,
     expectedClose || now, 'open', req.user.id, now, now]
  );

  runQuery('UPDATE sales_leads SET status = ?, updated_at = ? WHERE id = ?',
    [LEAD_STATUS.PROPOSAL, now, leadId]);

  const activity = {
    type: 'deal_created',
    description: `Tạo deal: ${name} - ${formatVnd(value)}`,
    dealId: id,
    leadId
  };
  logActivity(activity, req.user.id);

  res.status(201).json({
    id,
    leadId,
    name,
    value,
    stage: dealStage,
    probability: dealProbability,
    expectedClose
  });
}));

router.get('/deals', auth, asyncHandler(async (req, res) => {
  const { status, stage, owner, forecast = 'all', page = 1, limit = 20 } = req.query;

  let sql = 'SELECT * FROM sales_deals WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (stage) {
    sql += ' AND stage = ?';
    params.push(stage);
  }
  if (owner) {
    sql += ' AND owner_id = ?';
    params.push(owner);
  }

  const deals = getAll(sql + ' ORDER BY expected_close ASC LIMIT ? OFFSET ?',
    [...params, parseInt(limit), (parseInt(page) - 1) * parseInt(limit)]);

  const totals = calculateForecast(deals);

  res.json({
    deals,
    forecast: totals,
    pipeline: {
      total: deals.reduce((sum, d) => sum + (d.value || 0), 0),
      weighted: deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0),
      count: deals.length
    },
    page: parseInt(page),
    limit: parseInt(limit)
  });
}));

router.get('/deals/:id', auth, asyncHandler(async (req, res) => {
  const deal = getOne('SELECT * FROM sales_deals WHERE id = ?', [req.params.id]);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  const lead = getOne('SELECT * FROM sales_leads WHERE id = ?', [deal.lead_id]);
  const activities = getAll('SELECT * FROM sales_activities WHERE deal_id = ? ORDER BY created_at DESC LIMIT 20',
    [req.params.id]);

  res.json({ ...deal, lead, activities });
}));

router.put('/deals/:id/stage', auth, asyncHandler(async (req, res) => {
  const { stage, notes } = req.body;
  const deal = getOne('SELECT * FROM sales_deals WHERE id = ?', [req.params.id]);

  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  const newProbability = getStageProbability(stage);
  const now = new Date().toISOString();

  runQuery('UPDATE sales_deals SET stage = ?, probability = ?, updated_at = ? WHERE id = ?',
    [stage, newProbability, now, req.params.id]);

  if (stage === 'closed_won' || stage === 'closed_lost') {
    runQuery('UPDATE sales_deals SET status = ?, closed_at = ?, updated_at = ? WHERE id = ?',
      [stage === 'closed_won' ? 'won' : 'lost', now, now, req.params.id]);

    const leadStatus = stage === 'closed_won' ? LEAD_STATUS.WON : LEAD_STATUS.LOST;
    runQuery('UPDATE sales_leads SET status = ?, updated_at = ? WHERE id = ?',
      [leadStatus, now, deal.lead_id]);
  }

  const activity = {
    type: 'stage_changed',
    description: `Chuyển stage: ${deal.stage} → ${stage}`,
    dealId: req.params.id,
    notes
  };
  logActivity(activity, req.user.id);

  res.json({ success: true, stage, probability: newProbability });
}));

router.get('/pipeline/report', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const { startDate, endDate, owner } = req.query;

  const dateFilter = '';
  const params = [];

  const deals = getAll(
    'SELECT * FROM sales_deals WHERE status = ?' + dateFilter + ' ORDER BY created_at DESC',
    ['open', ...params]
  );

  const byStage = {};
  const byOwner = {};
  const byMonth = {};
  const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipeline = deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);

  deals.forEach(deal => {
    if (!byStage[deal.stage]) byStage[deal.stage] = { count: 0, value: 0 };
    byStage[deal.stage].count++;
    byStage[deal.stage].value += deal.value;

    if (!byOwner[deal.owner_id]) byOwner[deal.owner_id] = { count: 0, value: 0 };
    byOwner[deal.owner_id].count++;
    byOwner[deal.owner_id].value += deal.value;
  });

  const wonDeals = getAll(
    "SELECT * FROM sales_deals WHERE status = 'won'" + (startDate ? " AND closed_at >= ?" : '') + (endDate ? " AND closed_at <= ?" : ''),
    [...(startDate ? [startDate] : []), ...(endDate ? [endDate] : [])]
  );

  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const avgDealSize = wonDeals.length > 0 ? wonValue / wonDeals.length : 0;
  const winRate = deals.length > 0 ? (wonDeals.length / deals.length * 100) : 0;

  res.json({
    pipeline: {
      total: totalPipeline,
      weighted: weightedPipeline,
      count: deals.length
    },
    byStage,
    byOwner,
    performance: {
      closedWon: wonValue,
      avgDealSize,
      winRate,
      dealsWon: wonDeals.length
    }
  });
}));

router.get('/team/quota', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const quotas = getAll('SELECT * FROM sales_quotas ORDER BY period_start DESC');

  const deals = getAll("SELECT * FROM sales_deals WHERE status = 'won' AND closed_at >= datetime('now', '-12 months')");

  const byUser = {};
  deals.forEach(d => {
    if (!byUser[d.owner_id]) byUser[d.owner_id] = { won: 0, deals: 0 };
    byUser[d.owner_id].won += d.value;
    byUser[d.owner_id].deals++;
  });

  res.json({
    quotas,
    performance: byUser
  });
}));

router.post('/leads/:id/notes', auth, asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { id } = req.params;

  const activity = {
    type: 'note',
    description: content,
    leadId: id
  };

  logActivity(activity, req.user.id);
  res.json({ success: true });
}));

router.get('/statistics', auth, asyncHandler(async (req, res) => {
  const leadsCount = getOne('SELECT COUNT(*) as total FROM sales_leads')?.total || 0;
  const dealsCount = getOne('SELECT COUNT(*) as total FROM sales_deals WHERE status = ?', ['open'])?.total || 0;
  const pipeline = getOne('SELECT SUM(value) as total FROM sales_deals WHERE status = ?', ['open'])?.total || 0;
  const wonThisMonth = getOne("SELECT SUM(value) as total FROM sales_deals WHERE status = 'won' AND closed_at >= datetime('now', '-30 days')")?.total || 0;

  res.json({
    leads: leadsCount,
    openDeals: dealsCount,
    pipeline,
    wonThisMonth,
    conversionRate: dealsCount > 0 ? (pipeline / dealsCount).toFixed(1) : 0
  });
}));

function calculateLeadScore(farmSize, industry, source) {
  let score = 50;

  if (farmSize >= 10) score += 20;
  else if (farmSize >= 3) score += 15;
  else if (farmSize >= 1) score += 10;

  if (['cay_an_trai', 'thuy_san'].includes(industry)) score += 15;
  else if (['rau_mau', 'duoc_lieu'].includes(industry)) score += 10;

  if (source === 'referral' || source === 'partner') score += 15;
  else if (source === 'ads') score += 5;

  return Math.min(100, score);
}

function getStageProbability(stage) {
  const probabilities = {
    discovery: 10,
    qualification: 20,
    proposal: 40,
    negotiation: 60,
    closed_won: 100,
    closed_lost: 0
  };
  return probabilities[stage] || 10;
}

function calculateForecast(deals) {
  const stages = ['discovery', 'qualification', 'proposal', 'negotiation'];

  const bestCase = deals.reduce((sum, d) => sum + d.value, 0);
  const commit = deals.filter(d => ['proposal', 'negotiation'].includes(d.stage))
    .reduce((sum, d) => sum + d.value, 0);
  const worstCase = deals.filter(d => d.stage === 'negotiation')
    .reduce((sum, d) => sum + d.value, 0);

  return {
    bestCase,
    commit,
    worstCase
  };
}

function logActivity(activity, userId) {
  const id = 'ACT-' + Date.now();
  const now = new Date().toISOString();

  runQuery(
    `INSERT INTO sales_activities (id, type, description, notes, duration, lead_id, deal_id, user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, activity.type, activity.description, activity.notes || '',
     activity.duration || 0, activity.leadId || null, activity.dealId || null, userId, now]
  );
}

function formatVnd(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

module.exports = router;