const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config');

module.exports = {
  id: 'qr-traceability',
  name: 'QR Code Traceability',
  triggers: ['event:traceability.create', 'event:traceability.qrgen', 'cron:1h'],
  riskLevel: 'low',
  canAutoFix: true,
  run: function(ctx) {
    const stateStore = ctx.stateStore;
    const event = ctx.event || {};
    
    const qrConfig = config.qrcode || {};
    if (!qrConfig.enabled) {
      return { ok: false, skipped: true, reason: 'QR Code disabled in config' };
    }
    
    const baseUrl = qrConfig.baseUrl || 'https://ecosyntech.com';
    let batchCode = event.data?.batchCode || stateStore.get('currentBatchCode');
    
    if (!batchCode) {
      const pendingBatches = stateStore.get('pendingQRBatches') || [];
      if (pendingBatches.length > 0) {
        batchCode = pendingBatches.shift();
        stateStore.set('pendingQRBatches', pendingBatches);
      }
    }
    
    if (!batchCode) {
      return { ok: true, skipped: true, reason: 'No batch code to process' };
    }
    
    const traceUrl = baseUrl + '/trace/' + batchCode;
    
    const qrResult = {
      ok: true,
      batchCode: batchCode,
      traceUrl: traceUrl,
      qrGenerated: false,
      qrDataUrl: null,
      qrSvg: null,
      timestamp: new Date().toISOString()
    };
    
    try {
      const dataUrl = QRCode.toDataURL(traceUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#0f2b1f', light: '#ffffff' }
      });
      qrResult.qrDataUrl = dataUrl;
      qrResult.qrGenerated = true;
      
      stateStore.set('lastQR_' + batchCode, {
        qrDataUrl: dataUrl,
        traceUrl: traceUrl,
        generatedAt: Date.now()
      });
      
      let qrHistory = stateStore.get('qrHistory') || [];
      qrHistory.unshift({
        batchCode: batchCode,
        traceUrl: traceUrl,
        generatedAt: Date.now()
      });
      if (qrHistory.length > 100) qrHistory = qrHistory.slice(0, 100);
      stateStore.set('qrHistory', qrHistory);
      
    } catch (err) {
      qrResult.ok = false;
      qrResult.error = err.message;
    }
    
    return qrResult;
  },
  
  generateQR: function(batchCode) {
    const qrConfig = config.qrcode || {};
    const baseUrl = qrConfig.baseUrl || 'https://ecosyntech.com';
    const traceUrl = baseUrl + '/trace/' + batchCode;
    
    return QRCode.toDataURL(traceUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#0f2b1f', light: '#ffffff' }
    });
  },
  
  getQRForBatch: function(batchCode) {
    const stateStore = this._stateStore;
    return stateStore ? stateStore.get('lastQR_' + batchCode) : null;
  },
  
  listHistory: function() {
    const stateStore = this._stateStore;
    return stateStore ? stateStore.get('qrHistory') || [] : [];
  }
};