const logger = require('../config/logger');

const nodeEnv = process.env.NODE_ENV;
const JWT_SECRET = process.env.JWT_SECRET;
const HMAC_SECRET = process.env.HMAC_SECRET;

function securityAudit(req, res, next) {
  const issues = [];
  
  if (!JWT_SECRET && nodeEnv === 'production') {
    issues.push('JWT_SECRET not set in production');
  }
  
  if (!HMAC_SECRET) {
    issues.push('HMAC_SECRET not configured');
  }
  
  const hasIssues = issues.length > 0;
  
  if (hasIssues) {
    logger.warn('[SECURITY AUDIT] Issues found:', issues);
  }
  
  req.securityAudit = {
    passed: !hasIssues,
    issues,
    timestamp: new Date().toISOString()
  };
  
  next();
}

function requireSecrets() {
  return (req, res, next) => {
    const missing = [];
    
    if (!JWT_SECRET) missing.push('JWT_SECRET');
    if (!HMAC_SECRET) missing.push('HMAC_SECRET');
    
    if (missing.length > 0 && nodeEnv === 'production') {
      logger.error('[SECURITY] Missing required secrets:', missing);
      return res.status(500).json({
        error: 'Server configuration incomplete',
        missing
      });
    }
    
    next();
  };
}

function getSecurityStatus() {
  return {
    nodeEnv,
    jwtConfigured: !!JWT_SECRET,
    hmacConfigured: !!HMAC_SECRET,
    auditTime: new Date().toISOString()
  };
}

module.exports = {
  securityAudit,
  requireSecrets,
  getSecurityStatus
};