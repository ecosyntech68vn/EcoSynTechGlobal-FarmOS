 'use strict';

 const path = require('path');
 const fs = require('fs');

 // Simple, safe logger fallback
 let logger = null;
 try {
   logger = require('../../config/logger');
 } catch (e) {
   logger = console;
 }

 // Lightweight bootstrap state and on-demand URL for large model
 const bootstrapState = {
   smallEnabled: (process.env.AI_SMALL_MODEL ?? '1') !== '0' && (process.env.AI_SMALL_MODEL ?? '1') !== 'false',
   largeEnabled: (process.env.AI_LARGE_MODEL ?? '0') === '1' || (process.env.AI_LARGE_MODEL ?? '0') === 'true',
   largeUrl: process.env.AI_ONNX_URL || ''
 };

 // Internal predictors
 let lightPredictor = null;
 let largePredictor = null;

 // Helpers
 function notLoaded(p) { return !p; }
 function ensureDir(p) { try { fs.mkdirSync(p, { recursive: true }); } catch (e) { /* ignore */ } }

 async function loadLightModel() {
   if (lightPredictor) return lightPredictor;
  try {
    const TFLiteDiseasePredictor = require('../services/ai/tfliteDiseasePredictor');
     const smallPath = path.join(__dirname, '../../models/plant_disease.tflite');
     const labelsPath = path.join(__dirname, '../../models/labels.txt');
     lightPredictor = new TFLiteDiseasePredictor();
     await lightPredictor.loadModel(smallPath, labelsPath);
     logger.info('[Bootstrap] Lightweight AI model loaded (from bootstrap)');
     return lightPredictor;
   } catch (e) {
     logger.warn('[Bootstrap] Failed to load lightweight AI model:', e?.message || e);
     lightPredictor = null;
     return null;
   }
 }

 async function downloadRemote(url, dest) {
   // Simple http(s) download; does not handle Drive two-step auth. Used for non-Drive URLs.
   try {
     const protocol = url.startsWith('https') ? require('https') : require('http');
     return new Promise((resolve, reject) => {
       const req = protocol.get(url, res => {
         if (res.statusCode >= 300 && res.headers.location) {
           return resolve(downloadRemote(res.headers.location, dest));
         }
         const file = fs.createWriteStream(dest);
         res.pipe(file);
         file.on('finish', () => {
           file.close(() => resolve(true));
         });
       });
       req.on('error', reject);
     });
   } catch (err) {
     return false;
   }
 }

 async function downloadDriveLike(url, dest) {
   // Placeholder for Drive download; attempt direct or redirect download
   try {
     return await downloadRemote(url, dest);
   } catch (e) {
     return false;
   }
 }

 async function loadLargeModel() {
   if (largePredictor) return largePredictor;
   if (!bootstrapState.largeEnabled) return null;
   const onnxPath = path.join(__dirname, '../../models/irrigation_lstm.onnx');
   try {
     // Attempt to download if URL provided
     if (bootstrapState.largeUrl) {
       // Resolve to ONNX file path (Drive or direct URL)
       const ok = bootstrapState.largeUrl.includes('drive.google.com') ? await downloadDriveLike(bootstrapState.largeUrl, onnxPath) : await downloadRemote(bootstrapState.largeUrl, onnxPath);
       if (ok) {
         // Instantiate predictor if downloaded
  const LSTMIrrigationPredictor = require('../services/ai/lstmIrrigationPredictor');
         largePredictor = new LSTMIrrigationPredictor(onnxPath);
         await largePredictor.loadModel();
         logger.info('[Bootstrap] Large ONNX AI model loaded (after download)');
       }
     }
     if (!largePredictor && fs.existsSync(onnxPath)) {
       const LSTMIrrigationPredictor = require('../ai/lstmIrrigationPredictor');
       largePredictor = new LSTMIrrigationPredictor(onnxPath);
       await largePredictor.loadModel();
       logger.info('[Bootstrap] Large ONNX AI model loaded (local path)');
     }
     return largePredictor;
   } catch (e) {
     logger.warn('[Bootstrap] Failed to load large ONNX AI model:', e?.message || e);
     largePredictor = null;
     return null;
   }
 }

 async function initialize() {
   // Keep local bootstrapped state in sync with config
   // Small model
   if (bootstrapState.smallEnabled) {
     await loadLightModel();
   } else {
     lightPredictor = null;
   }

   // Large model
   await loadLargeModel();

   return {
     light: !!lightPredictor,
     large: !!largePredictor
   };
 }

 async function reloadBootstrap() {
   lightPredictor = null;
   largePredictor = null;
   await initialize();
 }

 function getStatus() {
   return {
     smallEnabled: bootstrapState.smallEnabled,
     largeEnabled: bootstrapState.largeEnabled,
     largeUrl: bootstrapState.largeUrl,
     lightLoaded: !!lightPredictor,
     largeLoaded: !!largePredictor
   };
 }

 function applyConfig({ small, large, largeUrl }) {
   bootstrapState.smallEnabled = small != null ? !!small : bootstrapState.smallEnabled;
   bootstrapState.largeEnabled = large != null ? !!large : bootstrapState.largeEnabled;
   if (typeof largeUrl === 'string') bootstrapState.largeUrl = largeUrl;
 }

 module.exports = {
   initialize,
   getLight: () => lightPredictor,
   getLarge: () => largePredictor,
   getStatus,
   applyConfig,
   reloadBootstrap
 };
