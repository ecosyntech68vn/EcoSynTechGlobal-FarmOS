'use strict';

const path = require('path');
const fs = require('fs');

// Logger with safe fallback
let logger = null;
try { logger = require('../../config/logger'); } catch (e) { logger = console; }

// ── Ring Buffer History (max 100 entries, auto-cleanup) ──────────────────────
const HISTORY_MAX = 100;
const historyRing = [];
function historyPush(entry) {
  historyRing.push({ ts: new Date().toISOString(), ...entry });
  if (historyRing.length > HISTORY_MAX) historyRing.shift();
}
function historyGet(n = 20) { return historyRing.slice(-n); }

// ── Bootstrap State ────────────────────────────────────────────────────────────
const state = {
  smallEnabled: (process.env.AI_SMALL_MODEL ?? '1') !== '0' && (process.env.AI_SMALL_MODEL ?? '1') !== 'false',
  largeEnabled: (process.env.AI_LARGE_MODEL ?? '0') === '1' || (process.env.AI_LARGE_MODEL ?? '0') === 'true',
  largeUrl: process.env.AI_ONNX_URL || '',
  lastBootstrapTs: null
};

// ── Model Instances ─────────────────────────────────────────────────────────────
let light = null;
let large = null;

// ── Registry Helpers ───────────────────────────────────────────────────────────
const REGISTRY_PATH = path.join(__dirname, '../../models/registry.json');

function readRegistry() {
  try {
    const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) { return null; }
}

function writeRegistry(data) {
  try {
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (e) { return false; }
}

function updateRegistryModel(id, patch) {
  const reg = readRegistry();
  if (!reg || !reg.models) return false;
  const idx = reg.models.findIndex(m => m.id === id);
  if (idx < 0) return false;
  Object.assign(reg.models[idx], patch);
  return writeRegistry(reg);
}

// ── Health Check ───────────────────────────────────────────────────────────────
function healthCheck() {
  const modelsDir = path.join(__dirname, '../../models');
  const smallPath = path.join(modelsDir, 'plant_disease.tflite');
  const largePath = path.join(modelsDir, 'irrigation_lstm.onnx');

  const check = (file, id, name) => {
    const exists = fs.existsSync(file);
    const sizeMB = exists ? (fs.statSync(file).size / 1024 / 1024).toFixed(2) : null;
    const loaded = id === 'model-001' ? !!light : !!large;
    const healthy = exists && loaded;
    return { id, name, exists, sizeMB, loaded, healthy };
  };

  return {
    timestamp: new Date().toISOString(),
    small: check(smallPath, 'model-001', 'Plant Disease Detector'),
    large: check(largePath, 'model-002', 'Irrigation LSTM Predictor'),
    overall: !!light || !state.smallEnabled ? 'healthy' : 'degraded',
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  };
}

// ── Download Helpers ───────────────────────────────────────────────────────────
async function download(url, dest) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    const req = mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.headers.location) {
        download(res.headers.location, dest).then(resolve).catch(() => resolve(false));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(30000, () => { req.destroy(); resolve(false); });
  });
}

async function downloadDrive(url, dest) {
  const id = url.match(/\/d\/([^/?]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
  if (!id) { logger.warn('[Bootstrap] Could not extract Drive ID'); return false; }
  const tmpJar = '/tmp/bs_drive_cookie';
  try {
    await download(`https://drive.google.com/uc?export=download&id=${id}`, tmpJar);
    const confirm = (fs.readFileSync(tmpJar, 'utf8').match(/download\s+(\w+)/) || [])[1] || '';
    if (confirm) {
      const ok = await download(
        `https://drive.google.com/uc?export=download&confirm=${confirm}&id=${id}`, dest
      );
      return ok;
    }
    return await download(`https://drive.google.com/uc?export=download&id=${id}`, dest);
  } catch (e) { return false; }
}

// ── SHA256 Checksum Verification ───────────────────────────────────────────────
function computeSha256(filePath) {
  try {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    const data = fs.readFileSync(filePath);
    hash.update(data);
    return hash.digest('hex');
  } catch (e) {
    logger.warn('[Bootstrap] SHA256 compute failed:', e.message);
    return null;
  }
}

function verifyChecksum(filePath, expectedSha256) {
  if (!expectedSha256 || expectedSha256 === 'placeholder_for_model_001_sha256') {
    historyPush({ action: 'checksum_skip', reason: 'no_checksum_defined' });
    return true;
  }
  const actual = computeSha256(filePath);
  if (!actual) return false;
  const match = actual === expectedSha256;
  if (match) {
    historyPush({ action: 'checksum_verified', file: filePath });
  } else {
    historyPush({ action: 'checksum_mismatch', file: filePath, expected: expectedSha256, actual });
  }
  return match;
}

function getExpectedChecksum(modelId) {
  const reg = readRegistry();
  if (!reg || !reg.models) return null;
  const model = reg.models.find(m => m.id === modelId);
  return model?.checksum?.value || null;
}

// ── Model Loading ──────────────────────────────────────────────────────────────
async function loadLight() {
  if (light) return light;
  const smallPath = path.join(__dirname, '../../models/plant_disease.tflite');
  const labelsPath = path.join(__dirname, '../../models/labels.txt');
  if (!fs.existsSync(smallPath)) {
    historyPush({ action: 'load_small', status: 'skip', reason: 'file_not_found' });
    return null;
  }

  const expectedSha256 = getExpectedChecksum('model-001');
  if (expectedSha256 && verifyChecksum(smallPath, expectedSha256) === false) {
    historyPush({ action: 'checksum_failed', modelId: 'model-001' });
    updateRegistryModel('model-001', { healthStatus: 'checksum_failed' });
    logger.warn('[Bootstrap] Small model checksum mismatch - rejecting model');
    light = null;
    return null;
  }

  try {
    const Cls = require('../services/ai/tfliteDiseasePredictor');
    light = new Cls();
    const t0 = Date.now();
    await light.loadModel(smallPath, labelsPath);
    historyPush({ action: 'load_small', status: 'loaded', ms: Date.now() - t0 });
    updateRegistryModel('model-001', { loaded: true, loadedAt: new Date().toISOString(), healthStatus: 'healthy' });
    updateRegistryModel('model-001', { checksum: { algorithm: 'SHA256', value: expectedSha256, verifiedAt: new Date().toISOString() } });
    logger.info('[Bootstrap] Small model loaded');
    return light;
  } catch (e) {
    historyPush({ action: 'load_small', status: 'error', error: e?.message });
    updateRegistryModel('model-001', { healthStatus: 'error' });
    logger.warn('[Bootstrap] Small model load failed:', e?.message);
    light = null;
    return null;
  }
}

async function loadLarge() {
  if (large) return large;
  const onnxPath = path.join(__dirname, '../../models/irrigation_lstm.onnx');
  if (!state.largeEnabled) return null;

  const downloadNeeded = state.largeUrl && !fs.existsSync(onnxPath);
  if (downloadNeeded) {
    const ok = state.largeUrl.includes('drive.google.com')
      ? await downloadDrive(state.largeUrl, onnxPath)
      : await download(state.largeUrl, onnxPath);
    if (!ok) {
      historyPush({ action: 'download_large', status: 'error', url: state.largeUrl });
      updateRegistryModel('model-002', { healthStatus: 'download_failed' });
      return null;
    }
    historyPush({ action: 'download_large', status: 'ok', url: state.largeUrl });

    const expectedSha256 = getExpectedChecksum('model-002');
    if (expectedSha256 && expectedSha256 !== 'placeholder') {
      if (!verifyChecksum(onnxPath, expectedSha256)) {
        historyPush({ action: 'checksum_failed', modelId: 'model-002' });
        updateRegistryModel('model-002', { healthStatus: 'checksum_failed' });
        logger.warn('[Bootstrap] Large model checksum mismatch - rejecting model');
        return null;
      }
    }
  }

  if (!fs.existsSync(onnxPath)) {
    historyPush({ action: 'load_large', status: 'skip', reason: 'file_not_found' });
    return null;
  }

  const expectedSha256 = getExpectedChecksum('model-002');
  if (expectedSha256 && expectedSha256 !== 'placeholder') {
    if (downloadNeeded) {
      if (!verifyChecksum(onnxPath, expectedSha256)) {
        historyPush({ action: 'checksum_failed', modelId: 'model-002', reason: 'post_download' });
        updateRegistryModel('model-002', { healthStatus: 'checksum_failed' });
        logger.warn('[Bootstrap] Large model checksum mismatch - rejecting model');
        return null;
      }
    } else if (!fs.existsSync(onnxPath)) {
      historyPush({ action: 'load_large', status: 'skip', reason: 'file_not_found' });
      return null;
    } else {
      if (!verifyChecksum(onnxPath, expectedSha256)) {
        historyPush({ action: 'checksum_failed', modelId: 'model-002', reason: 'existing_file' });
        updateRegistryModel('model-002', { healthStatus: 'checksum_failed' });
        logger.warn('[Bootstrap] Large model existing file checksum mismatch');
        return null;
      }
    }
  }

  if (!fs.existsSync(onnxPath)) {
    historyPush({ action: 'load_large', status: 'skip', reason: 'file_not_found' });
    return null;
  }

  try {
    const Cls = require('../services/ai/lstmIrrigationPredictor');
    large = new Cls(onnxPath);
    const t0 = Date.now();
    await large.loadModel();
    historyPush({ action: 'load_large', status: 'loaded', ms: Date.now() - t0 });
    updateRegistryModel('model-002', { loaded: true, loadedAt: new Date().toISOString(), healthStatus: 'healthy' });
    logger.info('[Bootstrap] Large model loaded');
    return large;
  } catch (e) {
    historyPush({ action: 'load_large', status: 'error', error: e?.message });
    updateRegistryModel('model-002', { healthStatus: 'error' });
    logger.warn('[Bootstrap] Large model load failed:', e?.message);
    large = null;
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────
async function initialize() {
  historyPush({ action: 'bootstrap_start', small: state.smallEnabled, large: state.largeEnabled });
  state.lastBootstrapTs = new Date().toISOString();

  if (state.smallEnabled) await loadLight();
  else light = null;

  await loadLarge();

  historyPush({ action: 'bootstrap_end', smallLoaded: !!light, largeLoaded: !!large });
  return { light: !!light, large: !!large };
}

async function reload() {
  historyPush({ action: 'reload', ts: state.lastBootstrapTs });
  light = null;
  large = null;
  return initialize();
}

function getStatus() {
  return {
    smallEnabled: state.smallEnabled,
    largeEnabled: state.largeEnabled,
    largeUrl: state.largeUrl,
    lastBootstrapTs: state.lastBootstrapTs,
    lightLoaded: !!light,
    largeLoaded: !!large,
    health: healthCheck()
  };
}

function applyConfig({ small, large: largeFlag, largeUrl }) {
  const prev = JSON.stringify({ s: state.smallEnabled, l: state.largeEnabled, u: state.largeUrl });
  if (small != null) state.smallEnabled = !!small;
  if (largeFlag != null) state.largeEnabled = !!largeFlag;
  if (typeof largeUrl === 'string') state.largeUrl = largeUrl;
  const next = JSON.stringify({ s: state.smallEnabled, l: state.largeEnabled, u: state.largeUrl });
  if (prev !== next) {
    historyPush({ action: 'config_change', from: JSON.parse(prev), to: JSON.parse(next) });
  }
}

function getHistory(n) { return historyGet(n); }
function getHealth() { return healthCheck(); }
function getLight() { return light; }
function getLarge() { return large; }

module.exports = {
  initialize, reload, getStatus, applyConfig,
  getHistory, getHealth, getLight, getLarge
};