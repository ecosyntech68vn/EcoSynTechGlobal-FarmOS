const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const { runQuery, getOne, getAll } = require('../config/database');
const logger = require('../config/logger');
const { auth } = require('../middleware/auth');

const BASE_URL = process.env.BASE_URL || 'https://ecosyntech.com';

// Validation schemas
const batchSchema = Joi.object({
  batch_code: Joi.string().min(1).max(50).optional(),
  product_name: Joi.string().min(1).max(200).required(),
  product_type: Joi.string().valid('vegetable', 'fruit', 'herb', 'grain', 'other').required(),
  quantity: Joi.number().positive().optional(),
  unit: Joi.string().max(20).default('kg'),
  farm_name: Joi.string().max(200).optional(),
  zone: Joi.string().max(50).optional(),
  seed_variety: Joi.string().max(100).optional(),
  planting_date: Joi.date().iso().optional(),
  expected_harvest: Joi.date().iso().optional(),
  notes: Joi.string().max(500).optional()
});

const stageSchema = Joi.object({
  stage_name: Joi.string().min(1).max(100).required(),
  stage_type: Joi.string().valid('preparation', 'planting', 'growing', 'harvesting', 'processing', 'packaging', 'storage', 'transport').required(),
  description: Joi.string().max(500).optional(),
  performed_by: Joi.string().max(100).optional(),
  location: Joi.string().max(200).optional(),
  inputs_used: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    quantity: Joi.string().optional(),
    notes: Joi.string().optional()
  })).optional(),
  photos: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(500).optional()
});

// GET /api/traceability/batch/:code - Trace batch by QR code
router.get('/batch/:code', async (req, res) => {
  try {
    const batch = getOne('SELECT * FROM traceability_batches WHERE batch_code = ?', [req.params.code]);
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    // Get all stages
    const stages = getAll(
      'SELECT * FROM traceability_stages WHERE batch_id = ? ORDER BY stage_order ASC',
      [batch.id]
    );

    // Get device readings for this batch
    const readings = getAll(
      'SELECT * FROM traceability_readings WHERE batch_id = ? ORDER BY timestamp DESC LIMIT 100',
      [batch.id]
    );

    // Get associated sensors
    const sensors = getAll(
      'SELECT * FROM sensors WHERE sensor_id IN (SELECT device_id FROM devices WHERE zone = ?)',
      [batch.zone || 'default']
    );

    res.json({
      success: true,
      batch: {
        ...batch,
        metadata: JSON.parse(batch.metadata || '{}'),
        planting_date: batch.planting_date,
        expected_harvest: batch.expected_harvest,
        harvest_date: batch.harvest_date
      },
      stages,
      recent_readings: readings.slice(0, 20),
      current_sensors: sensors,
      trace_url: `${BASE_URL}/trace/${batch.batch_code}`
    });
  } catch (err) {
    logger.error('[Traceability] Get batch error:', err);
    res.status(500).json({ error: 'Failed to fetch batch' });
  }
});

// GET /api/traceability/batches - List all batches
router.get('/batches', auth, async (req, res) => {
  try {
    const { status, product_type, zone } = req.query;
    
    let query = 'SELECT * FROM traceability_batches WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (product_type) {
      query += ' AND product_type = ?';
      params.push(product_type);
    }
    if (zone) {
      query += ' AND zone = ?';
      params.push(zone);
    }

    query += ' ORDER BY created_at DESC';

    const batches = getAll(query, params);

    res.json({
      success: true,
      count: batches.length,
      batches
    });
  } catch (err) {
    logger.error('[Traceability] List batches error:', err);
    res.status(500).json({ error: 'Failed to fetch batches' });
  }
});

// POST /api/traceability/batch - Create new batch
router.post('/batch', auth, async (req, res) => {
  try {
    const { error, value } = batchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const batchCode = value.batch_code || `BATCH-${Date.now().toString(36).toUpperCase()}-${uuidv4().substring(0, 4).toUpperCase()}`;
    const batchId = uuidv4();

    runQuery(
      `INSERT INTO traceability_batches 
       (id, batch_code, product_name, product_type, quantity, unit, farm_name, zone, 
        seed_variety, planting_date, expected_harvest, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        batchId,
        batchCode,
        value.product_name,
        value.product_type,
        value.quantity || null,
        value.unit,
        value.farm_name || '',
        value.zone || 'default',
        value.seed_variety || '',
        value.planting_date || null,
        value.expected_harvest || null,
        'active',
        new Date().toISOString()
      ]
    );

    // Generate QR code
    const traceUrl = `${BASE_URL}/trace/${batchCode}`;
    const qrDataUrl = await QRCode.toDataURL(traceUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#0f2b1f', light: '#ffffff' }
    });

    logger.info(`[Traceability] Batch created: ${batchCode}`);

    res.status(201).json({
      success: true,
      message: 'Batch created successfully',
      batch: {
        id: batchId,
        batch_code: batchCode,
        product_name: value.product_name,
        status: 'active'
      },
      qr_code: qrDataUrl,
      trace_url: traceUrl
    });
  } catch (err) {
    logger.error('[Traceability] Create batch error:', err);
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

// POST /api/traceability/batch/:code/stage - Add stage to batch
router.post('/batch/:code/stage', auth, async (req, res) => {
  try {
    const batch = getOne('SELECT * FROM traceability_batches WHERE batch_code = ?', [req.params.code]);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const { error, value } = stageSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Get current max stage order
    const maxOrder = getOne(
      'SELECT MAX(stage_order) as max_order FROM traceability_stages WHERE batch_id = ?',
      [batch.id]
    );
    const stageOrder = (maxOrder?.max_order || 0) + 1;

    const stageId = uuidv4();

    runQuery(
      `INSERT INTO traceability_stages 
       (id, batch_id, stage_name, stage_type, stage_order, description, performed_by, 
        location, inputs_used, photos, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stageId,
        batch.id,
        value.stage_name,
        value.stage_type,
        stageOrder,
        value.description || '',
        value.performed_by || '',
        value.location || '',
        JSON.stringify(value.inputs_used || []),
        JSON.stringify(value.photos || []),
        value.notes || '',
        new Date().toISOString()
      ]
    );

    logger.info(`[Traceability] Stage added: ${value.stage_name} to ${req.params.code}`);

    res.status(201).json({
      success: true,
      message: 'Stage added successfully',
      stage: {
        id: stageId,
        stage_name: value.stage_name,
        stage_type: value.stage_type,
        stage_order: stageOrder
      }
    });
  } catch (err) {
    logger.error('[Traceability] Add stage error:', err);
    res.status(500).json({ error: 'Failed to add stage' });
  }
});

// GET /api/traceability/batch/:code/qr - Get QR code for batch
router.get('/batch/:code/qr', async (req, res) => {
  try {
    const { format } = req.query;
    const batch = getOne('SELECT * FROM traceability_batches WHERE batch_code = ?', [req.params.code]);
    
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const traceUrl = `${BASE_URL}/trace/${batch.batch_code}`;

    if (format === 'svg') {
      const svg = await QRCode.toString(traceUrl, { type: 'svg', width: 300 });
      res.type('image/svg+xml').send(svg);
    } else {
      const dataUrl = await QRCode.toDataURL(traceUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#0f2b1f', light: '#ffffff' }
      });
      res.json({
        success: true,
        batch_code: batch.batch_code,
        product_name: batch.product_name,
        qr_code: dataUrl,
        trace_url: traceUrl
      });
    }
  } catch (err) {
    logger.error('[Traceability] QR generation error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// POST /api/traceability/batch/:code/harvest - Mark batch as harvested
router.post('/batch/:code/harvest', auth, async (req, res) => {
  try {
    const batch = getOne('SELECT * FROM traceability_batches WHERE batch_code = ?', [req.params.code]);
    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    const { harvest_quantity, harvest_notes } = req.body;

    runQuery(
      'UPDATE traceability_batches SET status = ?, harvest_date = ?, harvest_quantity = ?, harvest_notes = ?, updated_at = ? WHERE id = ?',
      ['harvested', new Date().toISOString(), harvest_quantity || null, harvest_notes || '', new Date().toISOString(), batch.id]
    );

    logger.info(`[Traceability] Batch harvested: ${req.params.code}`);

    res.json({
      success: true,
      message: 'Batch marked as harvested',
      batch_code: req.params.code,
      harvest_date: new Date().toISOString()
    });
  } catch (err) {
    logger.error('[Traceability] Harvest error:', err);
    res.status(500).json({ error: 'Failed to mark batch as harvested' });
  }
});

// GET /api/traceability/stats - Get traceability statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const totalBatches = getOne('SELECT COUNT(*) as count FROM traceability_batches');
    const activeBatches = getOne('SELECT COUNT(*) as count FROM traceability_batches WHERE status = \'active\'');
    const harvestedBatches = getOne('SELECT COUNT(*) as count FROM traceability_batches WHERE status = \'harvested\'');
    const totalStages = getOne('SELECT COUNT(*) as count FROM traceability_stages');

    const byProductType = getAll(
      'SELECT product_type, COUNT(*) as count FROM traceability_batches GROUP BY product_type'
    );

    const recentActivity = getAll(
      `SELECT bs.*, bb.batch_code, bb.product_name 
       FROM traceability_stages bs 
       JOIN traceability_batches bb ON bs.batch_id = bb.id 
       ORDER BY bs.created_at DESC LIMIT 10`
    );

    res.json({
      success: true,
      stats: {
        total_batches: totalBatches?.count || 0,
        active_batches: activeBatches?.count || 0,
        harvested_batches: harvestedBatches?.count || 0,
        total_stages: totalStages?.count || 0,
        by_product_type: byProductType
      },
      recent_activity: recentActivity
    });
  } catch (err) {
    logger.error('[Traceability] Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
