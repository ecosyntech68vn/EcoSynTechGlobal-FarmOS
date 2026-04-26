function paginate(req, defaultLimit = 50, maxLimit = 500) {
  const page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || defaultLimit;
  
  limit = Math.min(Math.max(1, limit), maxLimit);
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

function paginatedResponse(data, total, { page, limit }) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

function validateLimit(limit, max = 500) {
  const parsed = parseInt(limit);
  if (isNaN(parsed) || parsed < 1) return 1;
  if (parsed > max) return max;
  return parsed;
}

function validateOffset(offset) {
  const parsed = parseInt(offset);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

function sanitizeInput(value) {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeInput(value);
  }
  return sanitized;
}

module.exports = {
  paginate,
  paginatedResponse,
  validateLimit,
  validateOffset,
  sanitizeInput,
  sanitizeObject
};