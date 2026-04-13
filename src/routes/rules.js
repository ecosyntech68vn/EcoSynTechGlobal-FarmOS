const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const { runQuery, getOne, getAll } = require('../config/database');
const logger = require('../config/logger');
const { auth } = require('../middleware/auth');

// Validation schema
const ruleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  enabled: Joi.boolean().default(true),
  condition: Joi.object({
    sensor: Joi.string().required(),
    operator: Joi.string().valid('<', '>', '<=', '>=', '==', '!=').required(),
    value: Joi.number().required()
  }).required(),
  action: Joi.object({
    type: Joi.string().valid('relay1_on', 'relay1_off', 'relay2_on', 'relay2_off', 'relay3_on', 'relay3_off', 'relay4_on', 'relay4_off', 'alert', 'notification', 'email', 'sms', 'webhook').required(),
    target: Joi.string().max(100).optional()
  }).required()
});

const updateRuleSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional(),
  enabled: Joi.boolean().optional(),
  threshold: Joi.number().optional(),
  action: Joi.string().valid('relay1_on', 'relay1_off', 'relay2_on', 'relay2_off', 'relay3_on', 'relay3_off', 'relay4_on', 'relay4_off', 'alert', 'notification', 'email', 'sms', 'webhook').optional(),
  actionTarget: Joi.string().max(100).optional(),
  hysteresis: Joi.number().min(0).optional(),
  durationSec: Joi.number().min(0).optional(),
  cooldownMin: Joi.number().min(0).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  notificationChannels: Joi.array().items(Joi.string()).optional()
});

// GET /api/rules - List all rules
router.get('/', auth, async (req, res) => {
  try {
    const { zone, enabled } = req.query;
    
    let query = 'SELECT * FROM rules WHERE 1=1';
    const params = [];

    if (zone) {
      query += ' AND zone = ?';
      params.push(zone);
    }
    if (enabled !== undefined) {
      query += ' AND enabled = ?';
      params.push(enabled === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    const rules = getAll(query, params);

    res.json({
      success: true,
      count: rules.length,
      rules: rules.map(r => ({
        ...r,
        condition: JSON.parse(r.condition || '{}'),
        action: JSON.parse(r.action || '{}')
      }))
    });
  } catch (err) {
    logger.error('[Rules] List error:', err);
    res.status(500).json({ error: 'Failed to fetch rules' });
  }
});

// GET /api/rules/:id - Get single rule
router.get('/:id', auth, async (req, res) => {
  try {
    const rule = getOne(`
      SELECT r.*, d.name as device_name 
      FROM rules r 
      LEFT JOIN devices d ON r.device_id = d.id 
      WHERE r.id = ?
    `, [req.params.id]);

    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Get rule execution history
    const history = getAll(
      'SELECT * FROM rule_history WHERE rule_id = ? ORDER BY executed_at DESC LIMIT 50',
      [req.params.id]
    );

    res.json({
      success: true,
      rule: {
        ...rule,
        condition: JSON.parse(rule.condition || '{}'),
        action_config: JSON.parse(rule.action_config || '{}')
      },
      history
    });
  } catch (err) {
    logger.error('[Rules] Get error:', err);
    res.status(500).json({ error: 'Failed to fetch rule' });
  }
});

// POST /api/rules - Create new rule
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = ruleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const ruleId = `RULE-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    runQuery(
      `INSERT INTO rules (id, name, description, enabled, condition, action, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ruleId,
        value.name,
        value.description || '',
        value.enabled ? 1 : 0,
        JSON.stringify(value.condition),
        JSON.stringify(value.action),
        new Date().toISOString()
      ]
    );

    const rule = getOne('SELECT * FROM rules WHERE id = ?', [ruleId]);

    logger.info(`[Rules] Created: ${ruleId} - ${value.name}`);

    res.status(201).json({
      success: true,
      message: 'Rule created successfully',
      rule: {
        ...rule,
        condition: JSON.parse(rule.condition),
        action: JSON.parse(rule.action)
      }
    });
  } catch (err) {
    logger.error('[Rules] Create error:', err);
    res.status(500).json({ error: 'Failed to create rule' });
  }
});

// PUT /api/rules/:id - Update rule
router.put('/:id', auth, async (req, res) => {
  try {
    const rule = getOne('SELECT * FROM rules WHERE id = ?', [req.params.id]);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const { error, value } = updateRuleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const updates = [];
    const params = [];

    if (value.name) {
      updates.push('name = ?');
      params.push(value.name);
    }
    if (value.description !== undefined) {
      updates.push('description = ?');
      params.push(value.description);
    }
    if (value.enabled !== undefined) {
      updates.push('enabled = ?');
      params.push(value.enabled ? 1 : 0);
    }
    if (value.threshold !== undefined) {
      updates.push('threshold = ?');
      params.push(value.threshold);
      // Update condition
      const condition = JSON.parse(rule.condition || '{}');
      condition.value = value.threshold;
      updates.push('condition = ?');
      params.push(JSON.stringify(condition));
    }
    if (value.action) {
      updates.push('action = ?');
      params.push(value.action);
      const actionConfig = JSON.parse(rule.action_config || '{}');
      actionConfig.type = value.action;
      updates.push('action_config = ?');
      params.push(JSON.stringify(actionConfig));
    }
    if (value.actionTarget !== undefined) {
      const actionConfig = JSON.parse(rule.action_config || '{}');
      actionConfig.target = value.actionTarget;
      updates.push('action_config = ?');
      params.push(JSON.stringify(actionConfig));
    }
    if (value.hysteresis !== undefined) {
      updates.push('hysteresis = ?');
      params.push(value.hysteresis);
    }
    if (value.durationSec !== undefined) {
      updates.push('duration_sec = ?');
      params.push(value.durationSec);
    }
    if (value.cooldownMin !== undefined) {
      updates.push('cooldown_min = ?');
      params.push(value.cooldownMin);
    }
    if (value.priority) {
      updates.push('priority = ?');
      params.push(value.priority);
    }
    if (value.notificationChannels) {
      const actionConfig = JSON.parse(rule.action_config || '{}');
      actionConfig.channels = value.notificationChannels;
      updates.push('action_config = ?');
      params.push(JSON.stringify(actionConfig));
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(req.params.id);

    runQuery(`UPDATE rules SET ${updates.join(', ')} WHERE id = ?`, params);

    const updatedRule = getOne('SELECT * FROM rules WHERE id = ?', [req.params.id]);

    logger.info(`[Rules] Updated: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Rule updated successfully',
      rule: {
        ...updatedRule,
        condition: JSON.parse(updatedRule.condition || '{}'),
        action_config: JSON.parse(updatedRule.action_config || '{}')
      }
    });
  } catch (err) {
    logger.error('[Rules] Update error:', err);
    res.status(500).json({ error: 'Failed to update rule' });
  }
});

// DELETE /api/rules/:id - Delete rule
router.delete('/:id', auth, async (req, res) => {
  try {
    const rule = getOne('SELECT * FROM rules WHERE id = ?', [req.params.id]);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    runQuery('DELETE FROM rules WHERE id = ?', [req.params.id]);

    logger.info(`[Rules] Deleted: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (err) {
    logger.error('[Rules] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete rule' });
  }
});

// POST /api/rules/:id/toggle - Toggle rule enabled/disabled
router.post('/:id/toggle', auth, async (req, res) => {
  try {
    const rule = getOne('SELECT * FROM rules WHERE id = ?', [req.params.id]);
    if (!rule) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    const newEnabled = rule.enabled ? 0 : 1;
    runQuery('UPDATE rules SET enabled = ?, updated_at = ? WHERE id = ?', [newEnabled, new Date().toISOString(), req.params.id]);

    logger.info(`[Rules] Toggled: ${req.params.id} -> ${newEnabled ? 'enabled' : 'disabled'}`);

    res.json({
      success: true,
      enabled: newEnabled === 1,
      message: `Rule ${newEnabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (err) {
    logger.error('[Rules] Toggle error:', err);
    res.status(500).json({ error: 'Failed to toggle rule' });
  }
});

// POST /api/rules/test - Test rule evaluation
router.post('/test', auth, async (req, res) => {
  try {
    const { sensor, operator, threshold, currentValue } = req.body;

    if (!sensor || !operator || threshold === undefined || currentValue === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let triggered = false;
    switch (operator) {
    case '<': triggered = currentValue < threshold; break;
    case '>': triggered = currentValue > threshold; break;
    case '<=': triggered = currentValue <= threshold; break;
    case '>=': triggered = currentValue >= threshold; break;
    case '==': triggered = currentValue === threshold; break;
    case '!=': triggered = currentValue !== threshold; break;
    }

    res.json({
      success: true,
      test: {
        sensor,
        operator,
        threshold,
        currentValue,
        triggered,
        evaluation: `${currentValue} ${operator} ${threshold} = ${triggered}`
      }
    });
  } catch (err) {
    logger.error('[Rules] Test error:', err);
    res.status(500).json({ error: 'Failed to test rule' });
  }
});

module.exports = router;
