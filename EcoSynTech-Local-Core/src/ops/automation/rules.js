const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne, getAll } = require('../config/database');
const logger = require('../config/logger');
const { auth } = require('../middleware/auth');
const { SmartControlEngine, AdvisoryEngine } = require('../modules/iot-engine');

const ruleSchema = Joi.object({
  type: Joi.string().valid('STATIC','ADAPTIVE').optional(),
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  enabled: Joi.boolean().default(true),
  condition: Joi.alternatives(
    Joi.object({
      sensor: Joi.string().required(),
      operator: Joi.string().valid('<', '>', '<=', '>=', '==', '!=', 'between').required(),
      value: Joi.number().required(),
      hysteresis: Joi.number().min(0).optional()
    }),
    Joi.object({
      type: Joi.string().valid('and', 'or').required(),
      conditions: Joi.array().required()
    })
  ).required(),
  action: Joi.object({
    type: Joi.string().valid(
      'relay_on', 'relay_off', 'relay1_on', 'relay1_off', 'relay2_on', 'relay2_off',
      'relay3_on', 'relay3_off', 'relay4_on', 'relay4_off',
      'alert', 'notification', 'email', 'sms', 'webhook', 'irrigate', 'fan_on', 'fan_off'
    ).required(),
    target: Joi.string().max(100).optional(),
    durationSec: Joi.number().min(0).optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    require_confirm: Joi.boolean().optional()
  }).required(),
  cooldownMinutes: Joi.number().min(0).default(30),
  hysteresis: Joi.number().min(0).optional(),
  timeWindow: Joi.object({
    startHour: Joi.number().min(0).max(23).optional(),
    endHour: Joi.number().min(0).max(23).optional(),
    daysOfWeek: Joi.array().items(Joi.string().valid('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')).optional()
  }).optional(),
  targetDevice: Joi.string().optional()
});

router.get('/', auth, async (req, res) => {
  try {
    const { zone, enabled, priority } = req.query;
    
    let query = 'SELECT * FROM rules WHERE 1=1';
    const params = [];

    if (zone) {
      query += ' AND target_device = ?';
      params.push(zone);
    }
    if (enabled !== undefined) {
      query += ' AND enabled = ?';
      params.push(enabled === 'true' ? 1 : 0);
    }
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY priority DESC, created_at DESC';

    const rules = getAll(query, params);

    res.json({
      success: true,
      count: rules.length,
      rules: rules.map(r => ({
        ...r,
        condition: JSON.parse(r.condition || '{}'),
        action: JSON.parse(r.action || '{}'),
        time_window: r.time_window ? JSON.parse(r.time_window) : null
      }))
    });
  } catch (err) {
    logger.error('[Rules] List error:', err);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const stats = SmartControlEngine.getRuleStats();
    res.json({ success: true, stats });
  } catch (err) {
    logger.error('[Rules] Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const { ruleId, limit = 50 } = req.query;
    const history = SmartControlEngine.getRuleHistory(ruleId, parseInt(limit));
    res.json({ success: true, history });
  } catch (err) {
    logger.error('[Rules] History error:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.get('/test', auth, async (req, res) => {
  try {
    const { condition, readings } = req.query;
    const conditionObj = JSON.parse(condition || '{}');
    const readingsArr = JSON.parse(readings || '[]');
    
    const result = SmartControlEngine.testRule(conditionObj, readingsArr);
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error('[Rules] Test error:', err);
    res.status(500).json({ error: 'Failed to test rule' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const rule = getOne('SELECT * FROM rules WHERE id = ?', [req.params.id]);

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const history = getAll(
      'SELECT * FROM rule_history WHERE rule_id = ? ORDER BY executed_at DESC LIMIT 50',
      [req.params.id]
    );

    res.json({
      success: true,
      rule: {
        ...rule,
        condition: JSON.parse(rule.condition || '{}'),
        action: JSON.parse(rule.action || '{}'),
        time_window: rule.time_window ? JSON.parse(rule.time_window) : null
      },
      history
    });
  } catch (err) {
    logger.error('[Rules] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = ruleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    // Adaptive rule handling: convert strategy to a stored condition for compatibility
    if (value && value.type === 'ADAPTIVE') {
      if (!value.strategy) {
        return res.status(400).json({ error: 'strategy is required for ADAPTIVE rules' });
      }
      value.condition = { adaptive: value.strategy };
      delete value.strategy;
      value.type = 'ADAPTIVE';
    }

    const rule = SmartControlEngine.createRule(value.name, value.condition, value.action, {
      description: value.description,
      enabled: value.enabled,
      cooldownMinutes: value.cooldownMinutes,
      hysteresis: value.hysteresis,
      timeWindow: value.timeWindow,
      priority: value.action?.priority || 'normal',
      targetDevice: value.targetDevice
    });

    res.status(201).json({
      success: true,
      rule: {
        ...rule,
        condition: value.condition,
        action: value.action
      }
    });
  } catch (err) {
    logger.error('[Rules] Create error:', err);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const rule = getOne('SELECT * FROM rules WHERE id = ?', [req.params.id]);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.enabled !== undefined) updates.enabled = req.body.enabled ? 1 : 0;
    if (req.body.condition) updates.condition = req.body.condition;
    if (req.body.action) updates.action = req.body.action;
    if (req.body.cooldownMinutes) updates.cooldown_minutes = req.body.cooldownMinutes;
    if (req.body.hysteresis !== undefined) updates.hysteresis = req.body.hysteresis;
    if (req.body.timeWindow) updates.time_window = req.body.timeWindow;
    if (req.body.priority) updates.priority = req.body.priority;
    if (req.body.targetDevice) updates.target_device = req.body.targetDevice;

    SmartControlEngine.updateRule(req.params.id, updates);

    const updated = getOne('SELECT * FROM rules WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      rule: {
        ...updated,
        condition: JSON.parse(updated.condition || '{}'),
        action: JSON.parse(updated.action || '{}')
      }
    });
  } catch (err) {
    logger.error('[Rules] Update error:', err);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const rule = getOne('SELECT * FROM rules WHERE id = ?', [req.params.id]);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    SmartControlEngine.deleteRule(req.params.id);

    res.json({ success: true, message: 'Rule deleted successfully' });
  } catch (err) {
    logger.error('[Rules] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

router.post('/:id/toggle', auth, async (req, res) => {
  try {
    const rule = getOne('SELECT * FROM rules WHERE id = ?', [req.params.id]);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const newStatus = rule.enabled ? 0 : 1;
    runQuery('UPDATE rules SET enabled = ?, updated_at = ? WHERE id = ?', 
      [newStatus, new Date().toISOString(), req.params.id]);

    res.json({ 
      success: true, 
      enabled: newStatus === 1,
      message: `Rule ${newStatus ? 'enabled' : 'disabled'}` 
    });
  } catch (err) {
    logger.error('[Rules] Toggle error:', err);
    res.status(500).json({ error: 'Failed to toggle rule' });
  }
});

router.post('/:id/trigger', auth, async (req, res) => {
  try {
    const rule = getOne('SELECT * FROM rules WHERE id = ?', [req.params.id]);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const action = JSON.parse(rule.action || '{}');
    const result = await SmartControlEngine.executeAction({
      rule_id: rule.id,
      rule_name: rule.name,
      action: action.type,
      target: action.target,
      device_id: req.body.deviceId
    });

    res.json({ success: true, result });
  } catch (err) {
    logger.error('[Rules] Trigger error:', err);
    res.status(500).json({ error: 'Failed to trigger rule' });
  }
});

router.get('/advisory/rules', auth, async (req, res) => {
  try {
    const { AdvisoryEngine, ADVISORY_RULES } = require('../modules/iot-engine');
    res.json({ success: true, rules: ADVISORY_RULES });
  } catch (err) {
    logger.error('[Rules] Advisory rules error:', err);
    res.status(500).json({ error: 'Failed to fetch advisory rules' });
  }
});

module.exports = router;
