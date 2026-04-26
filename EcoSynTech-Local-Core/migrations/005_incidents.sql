-- Migration: Security Incident Management Tables
-- ISO 27001 A.8.16 - Incident Management

CREATE TABLE IF NOT EXISTS security_incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'security',
  source TEXT DEFAULT 'system',
  status TEXT DEFAULT 'detected',
  evidence TEXT,
  affected_systems TEXT,
  reported_by TEXT,
  assigned_to TEXT,
  resolved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_incident_notes (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',
  note TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES security_incidents(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON security_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_incident_notes ON security_incident_notes(incident_id);