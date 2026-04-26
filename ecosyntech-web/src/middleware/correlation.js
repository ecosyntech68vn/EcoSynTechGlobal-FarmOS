const crypto = require('crypto');

function generateCorrelationId() {
  return crypto.randomBytes(16).toString('hex');
}

function correlationMiddleware(req, res, next) {
  const id = req.headers['x-correlation-id'] || generateCorrelationId();
  req.correlationId = id;
  res.setHeader('X-Correlation-ID', id);
  
  res.on('finish', () => {
    req.logger = req.logger || console;
    if (req.logger && req.logger.info) {
      req.logger.info(`${req.method} ${req.path} completed`, {
        correlationId: id,
        status: res.statusCode,
        duration: Date.now() - (req.startTime || Date.now())
      });
    }
  });
  
  next();
}

function withCorrelation(fn) {
  return (req, res, next) => {
    const id = req.correlationId || generateCorrelationId();
    const originalSend = res.send;
    res.send = function(body) {
      res.setHeader('X-Correlation-ID', id);
      return originalSend.call(this, body);
    };
    fn(req, res, next);
  };
}

module.exports = {
  generateCorrelationId,
  correlationMiddleware,
  withCorrelation
};