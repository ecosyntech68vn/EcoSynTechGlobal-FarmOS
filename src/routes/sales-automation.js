const express = require('express');
const router = express.Router();
const { getOne, getAll, runQuery } = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const leadScoringSkill = require('../skills/sales/lead-scoring.skill');
const dealWorkflowSkill = require('../skills/sales/deal-workflow.skill');
const commissionSkill = require('../skills/sales/commission.skill');
const autoFollowupSkill = require('../skills/sales/auto-followup.skill');

router.get('/leads/scoring', auth, asyncHandler(async (req, res) => {
  const { minRating } = req.query;
  const leads = getAll('SELECT * FROM sales_leads ORDER BY created_at DESC');

  const scored = leadScoringSkill.batchScore(leads);

  res.json({
    leads: scored,
    summary: {
      total: scored.length,
      hot: scored.filter(l => l.rating.grade === 'A').length,
      warm: scored.filter(l => l.rating.grade === 'B').length,
      neutral: scored.filter(l => l.rating.grade === 'C').length,
      cold: scored.filter(l => l.rating.grade === 'D').length
    }
  });
}));

router.post('/leads/:id/score', auth, asyncHandler(async (req, res) => {
  const lead = getOne('SELECT * FROM sales_leads WHERE id = ?', [req.params.id]);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const behavior = req.body.behavior || {};
  const result = leadScoringSkill.process({ ...lead, ...behavior });

  runQuery('UPDATE sales_leads SET score = ?, updated_at = ? WHERE id = ?',
    [result.score, new Date().toISOString(), req.params.id]);

  res.json(result);
}));

router.get('/deals/workflow/:id', auth, asyncHandler(async (req, res) => {
  const deal = getOne('SELECT * FROM sales_deals WHERE id = ?', [req.params.id]);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  const result = dealWorkflowSkill.process(deal);

  res.json(result);
}));

router.post('/deals/:id/action-plan', auth, asyncHandler(async (req, res) => {
  const deal = getOne('SELECT * FROM sales_deals WHERE id = ?', [req.params.id]);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  const actionPlan = dealWorkflowSkill.createActionPlan(deal);

  res.json(actionPlan);
}));

router.get('/deals/workflow/alerts', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const deals = getAll("SELECT * FROM sales_deals WHERE status = 'open' ORDER BY updated_at ASC");

  const allAlerts = [];
  deals.forEach(deal => {
    const workflow = dealWorkflowSkill.process(deal);
    if (workflow.alerts.length > 0) {
      allAlerts.push({
        dealId: deal.id,
        dealName: deal.name,
        value: deal.value,
        stage: deal.stage,
        ...workflow
      });
    }
  });

  const urgent = allAlerts.filter(a => a.health < 50);
  const warning = allAlerts.filter(a => a.health >= 50 && a.health < 80);
  const healthy = allAlerts.filter(a => a.health >= 80);

  res.json({
    all: allAlerts,
    summary: {
      total: allAlerts.length,
      urgent: urgent.length,
      warning: warning.length,
      healthy: healthy.length,
      escalation: allAlerts.filter(a => a.shouldEscalate).length
    },
    urgent,
    warning
  });
}));

router.get('/commission/calculate', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const { dealId, userId } = req.query;

  const deal = dealId ? getOne('SELECT * FROM sales_deals WHERE id = ?', [dealId]) : null;
  const user = userId ? getOne('SELECT * FROM users WHERE id = ?', [userId]) : null;

  const wonDeals = getAll("SELECT * FROM sales_deals WHERE status = 'won' AND closed_at >= datetime('now', '-30 days')");
  const quota = user ? 100000000 : 0;

  const result = commissionSkill.process({
    deal: deal || { id: 'demo', value: 50000000 },
    user: user || {},
    quota,
    wonDeals
  });

  res.json(result);
}));

router.get('/commission/approve/:dealId', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const deal = getOne('SELECT * FROM sales_deals WHERE id = ?', [req.params.dealId]);
  if (!deal) {
    return res.status(404).json({ error: 'Deal not found' });
  }

  const approval = commissionSkill.requiresApproval(deal);

  res.json({
    dealId: deal.id,
    value: deal.value,
    approvalRequired: approval,
    canApprove: !approval || approval === req.user.role
  });
}));

router.get('/automation/followup', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const leads = getAll('SELECT * FROM sales_leads ORDER BY last_activity_at ASC');

  const actions = autoFollowupSkill.execute(leads);

  res.json({
    actions,
    summary: {
      total: actions.length,
      call: actions.filter(a => a.action.type === 'call').length,
      email: actions.filter(a => a.action.type === 'email').length,
      demo: actions.filter(a => a.action.type === 'demo').length,
      reengage: actions.filter(a => a.action.type === 're-engage').length
    }
  });
}));

router.get('/automation/schedule/:leadId', auth, asyncHandler(async (req, res) => {
  const lead = getOne('SELECT * FROM sales_leads WHERE id = ?', [req.params.leadId]);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const schedule = autoFollowupSkill.scheduleFollowups(lead);

  res.json({
    leadId: lead.id,
    schedule
  });
}));

router.get('/pipeline/health', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const deals = getAll("SELECT * FROM sales_deals WHERE status = 'open' ORDER BY value DESC");

  const healthScores = deals.map(deal => {
    const workflow = dealWorkflowSkill.process(deal);
    return {
      dealId: deal.id,
      dealName: deal.name,
      value: deal.value,
      stage: deal.stage,
      health: workflow.health,
      alerts: workflow.alerts,
      shouldEscalate: workflow.shouldEscalate
    };
  });

  const healthy = healthScores.filter(d => d.health >= 80);
  const warning = healthScores.filter(d => d.health >= 50 && d.health < 80);
  const critical = healthScores.filter(d => d.health < 50);

  res.json({
    deals: healthScores,
    summary: {
      total: deals.length,
      healthy: healthy.length,
      warning: warning.length,
      critical: critical.length,
      totalValue: deals.reduce((sum, d) => sum + d.value, 0),
      atRiskValue: critical.reduce((sum, d) => sum + d.value, 0)
    }
  });
}));

router.get('/reports/sales-performance', auth, requireRole('admin', 'manager'), asyncHandler(async (req, res) => {
  const { startDate, endDate, userId } = req.query;

  let dealsQuery = "SELECT * FROM sales_deals WHERE status = 'won'";
  const params = [];

  if (startDate) {
    dealsQuery += ' AND closed_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    dealsQuery += ' AND closed_at <= ?';
    params.push(endDate);
  }
  if (userId) {
    dealsQuery += ' AND owner_id = ?';
    params.push(userId);
  }

  const wonDeals = getAll(dealsQuery, params);

  const byMonth = {};
  const byUser = {};
  const byStage = {};

  wonDeals.forEach(deal => {
    const month = deal.closed_at?.substring(0, 7) || 'unknown';
    if (!byMonth[month]) byMonth[month] = { deals: 0, value: 0 };
    byMonth[month].deals++;
    byMonth[month].value += deal.value;

    if (!byUser[deal.owner_id]) byUser[deal.owner_id] = { deals: 0, value: 0 };
    byUser[deal.owner_id].deals++;
    byUser[deal.owner_id].value += deal.value;

    if (!byStage[deal.stage]) byStage[deal.stage] = { deals: 0, value: 0 };
    byStage[deal.stage].deals++;
    byStage[deal.stage].value += deal.value;
  });

  const totalValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const avgDealSize = wonDeals.length > 0 ? totalValue / wonDeals.length : 0;

  res.json({
    wonDeals,
    summary: {
      totalWon: wonDeals.length,
      totalValue,
      avgDealSize,
      winRate: 0
    },
    byMonth,
    byUser,
    byStage
  });
}));

module.exports = router;