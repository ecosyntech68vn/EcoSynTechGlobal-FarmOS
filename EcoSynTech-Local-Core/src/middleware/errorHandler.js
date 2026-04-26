const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

const ERROR_CATEGORIES = {
  VALIDATION: 'ValidationError',
  AUTH: 'UnauthorizedError',
  NOT_FOUND: 'NotFoundError',
  CONFLICT: 'ConflictError',
  RATE_LIMIT: 'RateLimitError',
  EXTERNAL: 'ExternalServiceError',
  INTERNAL: 'InternalError',
  TIMEOUT: 'TimeoutError'
};

function errorHandler(err, req, res, _next) {
  const requestId = req.requestId || uuidv4();
  
  const errorInfo = {
    requestId,
    error: err.message,
    category: categorizeError(err),
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  };

  logger.error('Error occurred:', {
    ...errorInfo,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = getErrorMessage(err, statusCode);

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || errorInfo.category,
      message,
      requestId,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        details: err.details 
      })
    }
  });
}

function categorizeError(err) {
  if (err.name === 'ValidationError') return ERROR_CATEGORIES.VALIDATION;
  if (err.name === 'UnauthorizedError' || err.message?.includes('token')) {
    return ERROR_CATEGORIES.AUTH;
  }
  if (err.statusCode === 404 || err.name === 'NotFoundError') {
    return ERROR_CATEGORIES.NOT_FOUND;
  }
  if (err.code === 'SQLITE_CONSTRAINT') return ERROR_CATEGORIES.CONFLICT;
  if (err.statusCode === 429 || err.message?.includes('rate limit')) {
    return ERROR_CATEGORIES.RATE_LIMIT;
  }
  if (err.message?.includes('timeout') || err.code === 'ETIMEDOUT') {
    return ERROR_CATEGORIES.TIMEOUT;
  }
  if (err.message?.includes('ECONNREFUSED') || err.message?.includes('fetch')) {
    return ERROR_CATEGORIES.EXTERNAL;
  }
  return ERROR_CATEGORIES.INTERNAL;
}

function getErrorMessage(err, statusCode) {
  if (statusCode === 500) {
    return process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error';
  }
  return err.message;
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId || uuidv4()
    }
  });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    req.requestId = req.requestId || uuidv4();
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function createError(category, message, statusCode = 500) {
  const error = new Error(message);
  error.name = category;
  error.statusCode = statusCode;
  error.timestamp = new Date().toISOString();
  return error;
}

function isRetryable(error) {
  const retryableCategories = [
    ERROR_CATEGORIES.EXTERNAL,
    ERROR_CATEGORIES.TIMEOUT
  ];
  return retryableCategories.includes(categorizeError(error));
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createError,
  isRetryable,
  ERROR_CATEGORIES
};