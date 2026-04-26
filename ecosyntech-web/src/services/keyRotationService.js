"use strict";

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const config = require('../config');
const logger = require('../config/logger');

const DEFAULT_ROTATION_DAYS = 90;
const KEY_DIR = path.join(__dirname, '../../keys');

class KeyRotationService {
  constructor(options = {}) {
    this.rotationDays = options.rotationDays || DEFAULT_ROTATION_DAYS;
    this.keys = new Map();
    this.lastRotation = null;
    this.autoRotate = options.autoRotate !== false;
  }

  ensureKeyDir() {
    if (!fs.existsSync(KEY_DIR)) {
      fs.mkdirSync(KEY_DIR, { recursive: true });
    }
  }

  generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  createKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
  }

  generateApiKey() {
    return crypto.randomBytes(32).toString('base64url');
  }

  saveKey(keyId, keyData) {
    this.ensureKeyDir();
    const keyPath = path.join(KEY_DIR, `${keyId}.json`);
    
    const keyInfo = {
      id: keyId,
      key: keyData,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + this.rotationDays * 24 * 60 * 60 * 1000).toISOString(),
      rotated: 0
    };
    
    fs.writeFileSync(keyPath, JSON.stringify(keyInfo, null, 2));
    this.keys.set(keyId, keyInfo);
    logger.info(`[KeyRotation] Key created: ${keyId}`);
    return keyInfo;
  }

  getKey(keyId) {
    if (this.keys.has(keyId)) {
      return this.keys.get(keyId);
    }
    
    const keyPath = path.join(KEY_DIR, `${keyId}.json`);
    if (fs.existsSync(keyPath)) {
      const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      this.keys.set(keyId, keyData);
      return keyData;
    }
    return null;
  }

  rotateKey(keyId) {
    const currentKey = this.getKey(keyId);
    if (!currentKey) {
      logger.warn(`[KeyRotation] Key not found: ${keyId}`);
      return null;
    }
    
    const newKeyId = `${keyId}_${Date.now()}`;
    const newKey = this.generateApiKey();
    const rotated = this.saveKey(newKeyId, newKey);
    
    rotated.previousKeyId = keyId;
    rotated.previousExpiry = currentKey.expires;
    rotated.rotated = currentKey.rotated + 1;
    
    logger.info(`[KeyRotation] Key rotated: ${keyId} -> ${newKeyId} (rotation #${rotated.rotated})`);
    return rotated;
  }

  shouldRotate(keyId) {
    const key = this.getKey(keyId);
    if (!key) return true;
    
    const expires = new Date(key.expires);
    const now = new Date();
    const daysUntilExpiry = (expires - now) / (24 * 60 * 60 * 1000);
    
    return daysUntilExpiry <= 7;
  }

  isExpired(keyId) {
    const key = this.getKey(keyId);
    if (!key) return true;
    
    return new Date(key.expires) < new Date();
  }

  listKeys() {
    const keys = [];
    if (fs.existsSync(KEY_DIR)) {
      const files = fs.readdirSync(KEY_DIR).filter(f => f.endsWith('.json'));
      files.forEach(file => {
        const keyId = file.replace('.json', '');
        const key = this.getKey(keyId);
        if (key) keys.push(key);
      });
    }
    return keys;
  }

  deleteKey(keyId) {
    const keyPath = path.join(KEY_DIR, `${keyId}.json`);
    if (fs.existsSync(keyPath)) {
      fs.unlinkSync(keyPath);
      this.keys.delete(keyId);
      logger.info(`[KeyRotation] Key deleted: ${keyId}`);
      return true;
    }
    return false;
  }

  startAutoRotation() {
    if (!this.autoRotate) return;
    
    setInterval(() => {
      const keys = this.listKeys();
      keys.forEach(key => {
        if (this.shouldRotate(key.id)) {
          this.rotateKey(key.id);
        }
      });
    }, 24 * 60 * 60 * 1000);
    
    logger.info('[KeyRotation] Auto-rotation started (daily check)');
  }

  getStatus() {
    const keys = this.listKeys();
    const now = new Date();
    let active = 0, expiring = 0, expired = 0;
    
    keys.forEach(key => {
      if (this.isExpired(key.id)) expired++;
      else if (this.shouldRotate(key.id)) expiring++;
      else active++;
    });
    
    return {
      total: keys.length,
      active,
      expiring,
      expired,
      nextRotation: this.lastRotation,
      rotationDays: this.rotationDays
    };
  }
}

let keyService = null;

function getKeyService() {
  if (!keyService) {
    keyService = new KeyRotationService();
    keyService.ensureKeyDir();
  }
  return keyService;
}

function generateApiKey() {
  return getKeyService().generateApiKey();
}

function rotateKey(keyId) {
  return getKeyService().rotateKey(keyId);
}

function shouldRotate(keyId) {
  return getKeyService().shouldRotate(keyId);
}

module.exports = {
  KeyRotationService,
  getKeyService,
  generateApiKey,
  rotateKey,
  shouldRotate
};