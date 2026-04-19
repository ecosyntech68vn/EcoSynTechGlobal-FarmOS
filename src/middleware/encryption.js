const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  if (!ENCRYPTION_KEY) return null;
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

function encrypt(plaintext) {
  const key = getEncryptionKey();
  if (!key || !plaintext) return plaintext;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    data: encrypted,
    tag: authTag.toString('hex')
  };
}

function decrypt(encryptedObj) {
  const key = getEncryptionKey();
  if (!key || !encryptedObj || typeof encryptedObj !== 'object') return encryptedObj;

  try {
    const iv = Buffer.from(encryptedObj.iv, 'hex');
    const authTag = Buffer.from(encryptedObj.tag, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedObj.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    return null;
  }
}

function encryptField(fieldValue) {
  if (!fieldValue) return fieldValue;
  if (typeof fieldValue !== 'string') return fieldValue;
  
  const encrypted = encrypt(fieldValue);
  if (typeof encrypted === 'string') return encrypted;
  return JSON.stringify(encrypted);
}

function decryptField(fieldValue) {
  if (!fieldValue) return fieldValue;
  if (typeof fieldValue !== 'string') return fieldValue;

  try {
    const parsed = JSON.parse(fieldValue);
    if (parsed.iv && parsed.data && parsed.tag) {
      return decrypt(parsed);
    }
    return fieldValue;
  } catch {
    return fieldValue;
  }
}

function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  try {
    const parsed = JSON.parse(value);
    return !!(parsed.iv && parsed.data && parsed.tag);
  } catch {
    return false;
  }
}

function encryptMiddleware(req, res, next) {
  const sensitiveFields = ['password', 'secret', 'token', 'apiKey', 'privateKey', 'creditCard'];
  
  if (req.body) {
    for (const field of sensitiveFields) {
      if (req.body[field] && typeof req.body[field] === 'string' && !isEncrypted(req.body[field])) {
        req.body[field] = encryptField(req.body[field]);
      }
    }
  }
  next();
}

module.exports = {
  encrypt,
  decrypt,
  encryptField,
  decryptField,
  isEncrypted,
  encryptMiddleware
};