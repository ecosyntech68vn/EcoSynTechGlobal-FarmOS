const express = require('express');
const router = express.Router();
const { getAll, getOne, runQuery } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth: authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const ROLES = {
  admin: ['all'],
  manager: ['read', 'write', 'devices', 'sensors', 'rules', 'schedules'],
  operator: ['read', 'devices', 'sensors'],
  viewer: ['read']
};

const PERMISSIONS = {
  'all': ['*'],
  'read': ['GET'],
  'write': ['POST', 'PUT', 'DELETE'],
  'devices': ['devices', 'device-mgmt', 'firmware'],
  'sensors': ['sensors', 'analytics'],
  'rules': ['rules'],
  'schedules': ['schedules'],
  'alerts': ['alerts'],
  'traceability': ['traceability'],
  'admin': ['security', 'users', 'settings']
};

router.get('/roles', authenticate, asyncHandler(async (req, res) => {
  if (!hasPermission(req.user, 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const roles = Object.entries(ROLES).map(([name, perms]) => ({
    name,
    permissions: perms,
    description: getRoleDescription(name)
  }));
  
  res.json({ success: true, roles });
}));

function getRoleDescription(role) {
  const descriptions = {
    admin: 'Full access to all features and settings',
    manager: 'Manage devices, sensors, rules and schedules',
    operator: 'Monitor and control devices',
    viewer: 'View-only access to dashboard and data'
  };
  return descriptions[role] || '';
}

function hasPermission(user, requiredPermission) {
  if (!user) return false;
  
  const userRole = user.role || 'viewer';
  const rolePermissions = ROLES[userRole] || [];
  
  if (rolePermissions.includes('all')) return true;
  if (rolePermissions.includes(requiredPermission)) return true;
  
  return false;
}

function hasAnyPermission(user, permissions) {
  if (!user) return false;
  
  const userRole = user.role || 'viewer';
  const rolePermissions = ROLES[userRole] || [];
  
  if (rolePermissions.includes('all')) return true;
  
  return permissions.some(p => rolePermissions.includes(p));
}

router.get('/users', authenticate, asyncHandler(async (req, res) => {
  if (!hasPermission(req.user, 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const tenantId = req.user.tenant_id || null;
  const query = tenantId 
    ? 'SELECT id, email, name, role, tenant_id, created_at FROM users WHERE tenant_id = ? ORDER BY created_at DESC'
    : 'SELECT id, email, name, role, tenant_id, created_at FROM users ORDER BY created_at DESC';
  
  const users = tenantId ? getAll(query, [tenantId]) : getAll(query);
  
  res.json({ success: true, users: users.map(u => ({ ...u, password: undefined })) });
}));

router.post('/users', authenticate, asyncHandler(async (req, res) => {
  if (!hasPermission(req.user, 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { email, password, name, role, tenant_id } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password and name are required' });
  }
  
  const existing = getOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync(password, 10);
  const id = uuidv4();
  
  runQuery(
    'INSERT INTO users (id, email, password, name, role, tenant_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, email, hashedPassword, name, role || 'viewer', tenant_id || req.user.tenant_id, new Date().toISOString()]
  );
  
  res.json({ success: true, id, message: 'User created successfully' });
}));

router.put('/users/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, name, role, tenant_id, active } = req.body;
  
  if (!hasPermission(req.user, 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const user = getOne('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const updates = [];
  const params = [];
  
  if (email) { updates.push('email = ?'); params.push(email); }
  if (name) { updates.push('name = ?'); params.push(name); }
  if (role) { updates.push('role = ?'); params.push(role); }
  if (tenant_id !== undefined) { updates.push('tenant_id = ?'); params.push(tenant_id); }
  if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }
  
  if (updates.length > 0) {
    params.push(new Date().toISOString(), id);
    runQuery(`UPDATE users SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`, params);
  }
  
  res.json({ success: true, message: 'User updated successfully' });
}));

router.delete('/users/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!hasPermission(req.user, 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  if (id === req.user.sub) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  
  runQuery('DELETE FROM users WHERE id = ?', [id]);
  
  res.json({ success: true, message: 'User deleted successfully' });
}));

router.get('/permissions/check', authenticate, asyncHandler(async (req, res) => {
  const { permission, resource } = req.query;
  
  const hasAccess = hasPermission(req.user, permission) || hasAnyPermission(req.user, [resource]);
  
  res.json({ 
    success: true, 
    hasAccess,
    role: req.user.role,
    permissions: ROLES[req.user.role] || []
  });
}));

router.get('/tenants', authenticate, asyncHandler(async (req, res) => {
  if (!hasPermission(req.user, 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const tenants = getAll('SELECT * FROM tenants ORDER BY created_at DESC');
  
  res.json({ success: true, tenants });
}));

router.post('/tenants', authenticate, asyncHandler(async (req, res) => {
  if (!hasPermission(req.user, 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { name, domain, settings } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Tenant name is required' });
  }
  
  const id = uuidv4();
  runQuery(
    'INSERT INTO tenants (id, name, domain, settings, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, name, domain || null, JSON.stringify(settings || {}), new Date().toISOString()]
  );
  
  res.json({ success: true, id, message: 'Tenant created successfully' });
}));

router.put('/tenants/:id', authenticate, asyncHandler(async (req, res) => {
  if (!hasPermission(req.user, 'admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  const { id } = req.params;
  const { name, domain, settings, active } = req.body;
  
  const updates = [];
  const params = [];
  
  if (name) { updates.push('name = ?'); params.push(name); }
  if (domain !== undefined) { updates.push('domain = ?'); params.push(domain); }
  if (settings) { updates.push('settings = ?'); params.push(JSON.stringify(settings)); }
  if (active !== undefined) { updates.push('active = ?'); params.push(active ? 1 : 0); }
  
  if (updates.length > 0) {
    params.push(new Date().toISOString(), id);
    runQuery(`UPDATE tenants SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`, params);
  }
  
  res.json({ success: true, message: 'Tenant updated successfully' });
}));

function checkPermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user, permission) && !hasAnyPermission(req.user, [permission])) {
      return res.status(403).json({ error: `Permission denied. Required: ${permission}` });
    }
    next();
  };
}

module.exports = router;
module.exports.hasPermission = hasPermission;
module.exports.hasAnyPermission = hasAnyPermission;
module.exports.checkPermission = checkPermission;
module.exports.ROLES = ROLES;