"use strict";

// Lightweight RBAC middleware for telemetry-related endpoints
// This is a preparatory hook for stricter access controls following ISO27001.

function telemetryAccess(req, res, next) {
  // In test environment, allow mocking a user role via header
  if (process.env.NODE_ENV === 'test') {
    const mockRole = (req.headers['x-mock-telemetry-role'] || '').toString().toLowerCase();
    if (mockRole) {
      // Apply the same RBAC logic in tests to ensure correctness
      const allowed = new Set(['telemetry_admin', 'telemetry_auditor', 'telemetry_user', 'admin']);
      if (allowed.has(mockRole)) {
        req.user = { role: mockRole };
        return next();
      }
      return res.status(403).json({ error: 'Insufficient permissions for telemetry' });
    }
    // If no mock role provided, enforce authentication requirement for safety in tests
    return res.status(401).json({ error: 'Authentication required' });
  }
  // Production/default behavior
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const role = (user.role || '').toString().toLowerCase();
  const allowed = new Set(['telemetry_admin', 'telemetry_auditor', 'telemetry_user', 'admin']);
  if (allowed.has(role)) {
    return next();
  }
  return res.status(403).json({ error: 'Insufficient permissions for telemetry' });
}

module.exports = { telemetryAccess };
