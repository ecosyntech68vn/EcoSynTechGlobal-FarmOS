const logger = require('../config/logger');
const { getAll, getOne, runQuery } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const INCIDENT_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

const INCIDENT_STATUS = {
  DETECTED: 'detected',
  CONTAINED: 'contained',
  ERADICATED: 'eradicated',
  RECOVERED: 'recovered',
  CLOSED: 'closed'
};

async function createIncident(data) {
  const {
    title,
    description,
    severity = 'medium',
    category,
    source,
    affectedSystems = [],
    initialEvidence = {}
  } = data;

  const id = uuidv4();
  const incident = {
    id,
    title,
    description,
    severity,
    category: category || 'security',
    source: source || 'system',
    status: INCIDENT_STATUS.DETECTED,
    evidence: JSON.stringify({
      ip: initialEvidence.ip,
      timestamp: initialEvidence.timestamp,
      logs: initialEvidence.logs,
      screenshots: initialEvidence.screenshots
    }),
    affectedSystems: JSON.stringify(affectedSystems),
    reportedBy: initialEvidence.reportedBy || 'system',
    reportedAt: new Date().toISOString(),
    assignedTo: null,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await runQuery(
    `INSERT INTO security_incidents 
     (id, title, description, severity, category, source, status, evidence, affected_systems, reported_by, assigned_to, resolved_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    Object.values(incident)
  );

  logger.warn(`[INCIDENT] ${severity.toUpperCase()}: ${title} - ID: ${id}`);

  return incident;
}

async function updateIncidentStatus(id, status, notes = '', assignedTo = null) {
  const updateData = {
    status,
    assignedTo,
    updatedAt: new Date().toISOString()
  };

  if (status === INCIDENT_STATUS.CLOSED) {
    updateData.resolvedAt = new Date().toISOString();
  }

  const sets = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updateData), id];

  await runQuery(`UPDATE security_incidents SET ${sets} WHERE id = ?`, values);

  await addIncidentNote(id, notes, 'status_update');

  return { success: true, incidentId: id, status };
}

async function addIncidentNote(id, note, noteType = 'general') {
  await runQuery(
    `INSERT INTO security_incident_notes (id, incident_id, note_type, note, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [uuidv4(), id, noteType, note, new Date().toISOString()]
  );
}

async function getIncidents(filters = {}) {
  let sql = 'SELECT * FROM security_incidents WHERE 1=1';
  const params = [];

  if (filters.severity) {
    sql += ' AND severity = ?';
    params.push(filters.severity);
  }

  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.fromDate) {
    sql += ' AND created_at >= ?';
    params.push(filters.fromDate);
  }

  if (filters.toDate) {
    sql += ' AND created_at <= ?';
    params.push(filters.toDate);
  }

  sql += ' ORDER BY created_at DESC';

  if (filters.limit) {
    sql += ' LIMIT ?';
    params.push(filters.limit);
  }

  return getAll(sql, params);
}

async function getIncidentById(id) {
  const incident = getOne('SELECT * FROM security_incidents WHERE id = ?', [id]);
  
  if (incident) {
    const notes = getAll(
      'SELECT * FROM security_incident_notes WHERE incident_id = ? ORDER BY created_at',
      [id]
    );
    incident.notes = notes;
  }

  return incident;
}

async function getIncidentStats() {
  const bySeverity = getAll(
    'SELECT severity, COUNT(*) as count FROM security_incidents GROUP BY severity'
  );
  
  const byStatus = getAll(
    'SELECT status, COUNT(*) as count FROM security_incidents GROUP BY status'
  );
  
  const last30Days = getOne(
    'SELECT COUNT(*) as count FROM security_incidents WHERE created_at >= datetime(\'now\', \'-30 days\')'
  );
  
  return {
    bySeverity: bySeverity.reduce((acc, s) => ({ ...acc, [s.severity]: s.count }), {}),
    byStatus: byStatus.reduce((acc, s) => ({ ...acc, [s.status]: s.count }), {}),
    last30Days: last30Days?.count || 0
  };
}

function getIncidentSeverityFromAlert(alert) {
  if (alert.type === 'intrusion' || alert.type === 'malware') {
    return INCIDENT_SEVERITY.CRITICAL;
  }
  if (alert.type === 'unauthorized_access') {
    return INCIDENT_SEVERITY.HIGH;
  }
  if (alert.type === 'suspicious_activity') {
    return INCIDENT_SEVERITY.MEDIUM;
  }
  return INCIDENT_SEVERITY.LOW;
}

module.exports = {
  createIncident,
  updateIncidentStatus,
  addIncidentNote,
  getIncidents,
  getIncidentById,
  getIncidentStats,
  getIncidentSeverityFromAlert,
  INCIDENT_SEVERITY,
  INCIDENT_STATUS
};