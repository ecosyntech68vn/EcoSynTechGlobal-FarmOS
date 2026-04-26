const express = require('express');
const router = express.Router();
const { auth: authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  createIncident,
  updateIncidentStatus,
  getIncidents,
  getIncidentById,
  getIncidentStats,
  INCIDENT_SEVERITY,
  INCIDENT_STATUS
} = require('../services/incidentService');

router.post('/', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Admin or Manager role required' });
  }

  const incident = await createIncident({
    ...req.body,
    reportedBy: req.user.email,
    initialEvidence: {
      ip: req.ip,
      timestamp: new Date().toISOString()
    }
  });

  res.json({ success: true, incident });
}));

router.get('/', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { severity, status, limit = 50 } = req.query;
  const incidents = await getIncidents({ severity, status, limit: parseInt(limit) });

  res.json({ success: true, incidents });
}));

router.get('/stats', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const stats = await getIncidentStats();

  res.json({ success: true, stats });
}));

router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const incident = await getIncidentById(req.params.id);

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  res.json({ success: true, incident });
}));

router.patch('/:id/status', authenticate, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { status, notes, assignedTo } = req.body;

  if (!status || !INCIDENT_STATUS[status.toUpperCase()]) {
    return res.status(400).json({ error: 'Invalid status. Use: detected, contained, eradicated, recovered, closed' });
  }

  const result = await updateIncidentStatus(req.params.id, status, notes, assignedTo);

  res.json({ success: true, ...result });
}));

router.get('/severity/list', (req, res) => {
  res.json({ success: true, severity: INCIDENT_SEVERITY });
});

router.get('/status/list', (req, res) => {
  res.json({ success: true, status: INCIDENT_STATUS });
});

module.exports = router;