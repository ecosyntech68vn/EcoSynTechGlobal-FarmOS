/**
 * ISO 27001 Compliance & Audit API Routes
 */

const express = require('express');
const router = express.Router();
const { auth, requireAdmin } = require('../middleware/auth');
const complianceService = require('../services/complianceService');
const { getAll, runQuery } = require('../config/database');

// GET /api/compliance/summary - Get compliance summary
router.get('/summary', auth, async (req, res) => {
  try {
    const summary = complianceService.getControlsSummary();
    const score = complianceService.getComplianceScore();
    
    res.json({
      ok: true,
      data: {
        controls: summary,
        score
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/controls - Get all controls
router.get('/controls', auth, async (req, res) => {
  try {
    const { controlId } = req.query;
    
    if (controlId) {
      const control = complianceService.getControlStatus(controlId);
      return res.json({ ok: true, data: control });
    }
    
    const summary = complianceService.getControlsSummary();
    res.json({ ok: true, data: summary });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/compliance/audit - Run compliance audit
router.post('/audit', auth, requireAdmin, async (req, res) => {
  try {
    const audit = await complianceService.runAudit();
    res.json({
      ok: true,
      data: audit
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/audit/history - Get audit history
router.get('/audit/history', auth, requireAdmin, async (req, res) => {
  try {
    const history = complianceService.getAuditHistory(20);
    res.json({ ok: true, data: history });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/report - Generate compliance report
router.get('/report', auth, requireAdmin, async (req, res) => {
  try {
    const report = complianceService.generateReport();
    res.json({
      ok: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/technical - Run technical controls check
router.get('/technical', auth, async (req, res) => {
  try {
    const checks = complianceService.runTechnicalControls();
    res.json({
      ok: true,
      data: checks
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/score - Get compliance score
router.get('/score', auth, async (req, res) => {
  try {
    const score = complianceService.getComplianceScore();
    res.json({
      ok: true,
      data: score
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// POST /api/compliance/evidence - Submit evidence for control
router.post('/evidence', auth, requireAdmin, async (req, res) => {
  try {
    const { controlId, evidence, notes } = req.body;
    
    // Store evidence in database
    runQuery(
      `INSERT INTO compliance_evidence (control_id, evidence, notes, submitted_by, submitted_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [controlId, JSON.stringify(evidence), notes, req.user?.id || req.user?.sub]
    );
    
    res.json({
      ok: true,
      message: 'Evidence submitted successfully'
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/evidence/:controlId - Get evidence for control
router.get('/evidence/:controlId', auth, async (req, res) => {
  try {
    const { controlId } = req.params;
    const evidence = getAll(
      `SELECT * FROM compliance_evidence WHERE control_id = ? ORDER BY submitted_at DESC`,
      [controlId]
    );
    
    res.json({
      ok: true,
      data: evidence
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/evidence - Get all evidence from documents
router.get('/evidence', auth, async (req, res) => {
  try {
    const evidence = complianceService.getAllEvidence();
    res.json({
      ok: true,
      data: evidence
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/policies - Get available policies
router.get('/policies', auth, async (req, res) => {
  try {
    const policies = complianceService.getPolicies();
    res.json({
      ok: true,
      data: policies,
      count: Object.keys(policies).length
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/roles - Get ISMS roles
router.get('/roles', auth, async (req, res) => {
  try {
    const roles = complianceService.getISMSRoles();
    res.json({
      ok: true,
      data: roles
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/suppliers - Get suppliers list
router.get('/suppliers', auth, async (req, res) => {
  try {
    const suppliers = complianceService.getSuppliers();
    res.json({
      ok: true,
      data: suppliers,
      count: Object.keys(suppliers).length
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// GET /api/compliance/bcdr - Get BC/DR status
router.get('/bcdr', auth, async (req, res) => {
  try {
    const bcdr = complianceService.getBCDRStatus();
    res.json({
      ok: true,
      data: bcdr
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;