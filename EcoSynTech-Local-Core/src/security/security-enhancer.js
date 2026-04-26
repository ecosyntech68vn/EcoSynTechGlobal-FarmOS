module.exports = {
  version: '2.3.2',
  
  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.'
  },
  
  // Security Headers
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': 'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data:; font-src \'self\' data:;'
  },
  
  // 2FA Configuration
  twoFactor: {
    enabled: true,
    issuer: 'EcoSynTech',
    algorithm: 'sha1',
    digits: 6,
    window: 1
  },
  
  // Audit Logger
  auditLog: [],
  
  log: function(action, user, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      action: action,
      user: user || 'anonymous',
      details: details || {},
      ip: details.ip || 'unknown'
    };
    this.auditLog.push(entry);
    
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
    
    return entry;
  },
  
  getAuditLogs: function(filters) {
    let logs = [...this.auditLog];
    
    if (filters.action) {
      logs = logs.filter(l => l.action === filters.action);
    }
    if (filters.user) {
      logs = logs.filter(l => l.user === filters.user);
    }
    if (filters.from) {
      logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.from));
    }
    if (filters.to) {
      logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.to));
    }
    
    return logs.slice(-100);
  },
  
  // Backup System
  backups: [],
  autoBackup: function(data) {
    const backup = {
      id: 'BK-' + Date.now(),
      timestamp: new Date().toISOString(),
      size: JSON.stringify(data).length,
      data: data
    };
    
    this.backups.unshift(backup);
    
    if (this.backups.length > 7) {
      this.backups = this.backups.slice(0, 7);
    }
    
    return backup;
  },
  
  getLatestBackup: function() {
    return this.backups[0] || null;
  },
  
  restoreBackup: function(backupId) {
    const backup = this.backups.find(b => b.id === backupId);
    return backup ? backup.data : null;
  },
  
  cleanOldBackups: function() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.backups = this.backups.filter(b => new Date(b.timestamp) > cutoff);
  }
};