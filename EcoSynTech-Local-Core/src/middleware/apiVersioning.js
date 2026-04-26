const express = require('express');

const API_VERSIONS = ['v1', 'v2'];
const DEFAULT_VERSION = 'v1';

function versionMiddleware(req, res, next) {
  const acceptHeader = req.headers.accept || '';
  const versionFromHeader = acceptHeader.includes('version=') 
    ? acceptHeader.match(/version=(\w+)/)?.[1] 
    : null;
  
  const version = req.query.api_version || versionFromHeader || DEFAULT_VERSION;
  
  if (!API_VERSIONS.includes(version)) {
    return res.status(400).json({
      error: 'Invalid API version',
      supported: API_VERSIONS,
      current: DEFAULT_VERSION
    });
  }
  
  req.apiVersion = version;
  res.setHeader('X-API-Version', version);
  next();
}

function versionGuard(versions = API_VERSIONS) {
  return (req, res, next) => {
    if (!versions.includes(req.apiVersion)) {
      return res.status(410).json({
        error: 'API version no longer supported',
        supported: versions,
        yourVersion: req.apiVersion
      });
    }
    next();
  };
}

function createVersionedRouter(version) {
  const router = express.Router();
  router.apiVersion = version;
  return router;
}

function deprecationMiddleware(req, res, next) {
  const version = req.apiVersion;
  const deprecationDate = new Date('2026-12-31');
  
  if (version === 'v1') {
    res.setHeader('Deprecation', deprecationDate.toISOString());
    res.setHeader('Link', '</api/v2>; rel="successor-version"');
  }
  next();
}

module.exports = {
  versionMiddleware,
  versionGuard,
  createVersionedRouter,
  deprecationMiddleware,
  API_VERSIONS,
  DEFAULT_VERSION
};