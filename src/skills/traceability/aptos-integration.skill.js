var crypto = require('crypto');
var config = require('../../config');

function getBlockchainConfig() {
  return config.blockchain || {};
}

function generateAptosAddress(pubkey) {
  var hash = crypto.createHash('sha3-256');
  hash.update(pubkey);
  return '0x' + hash.digest('hex').substring(0, 64);
}

function simulateAptosTx(payload) {
  var txHash = '0x' + crypto.createHash('sha256').update(JSON.stringify(payload) + Date.now()).digest('hex');
  var vmHash = '0x' + crypto.createHash('sha256').update('vm_execution' + txHash).digest('hex');
  
  return {
    hash: txHash,
    state_root_hash: vmHash,
    gas_used: Math.floor(Math.random() * 5000) + 1000,
    success: true,
    version: Math.floor(Math.random() * 10000000) + 5000000,
    timestamp: Math.floor(Date.now() * 1000)
  };
}

module.exports = {
  id: 'aptos-integration',
  name: 'Aptos Integration Service',
  triggers: ['event:aptos.submit', 'event:traceability.certify', 'cron:10m'],
  riskLevel: 'medium',
  canAutoFix: false,
  
  run: function(ctx) {
    var bcConfig = getBlockchainConfig();
    var stateStore = ctx.stateStore;
    var event = ctx.event || {};
    
    if (!bcConfig.enabled) {
      return { ok: true, skipped: true, reason: 'Aptos integration disabled' };
    }
    
    var network = bcConfig.network || 'testnet';
    var moduleAddress = bcConfig.moduleAddress || '0x1';
    
    var payload = event.data?.payload || event.payload || {};
    var txType = event.data?.type || 'unknown';
    
    if (!payload.batchCode && !payload.certificateId) {
      return { ok: false, skipped: true, reason: 'No valid payload' };
    }
    
    var simulated = simulateAptosTx(payload);
    
    var result = {
      ok: true,
      network: network,
      txHash: simulated.hash,
      version: simulated.version,
      gasUsed: simulated.gas_used,
      status: simulated.success ? 'success' : 'failed',
      timestamp: new Date().toISOString(),
      payload: payload,
      simulated: true
    };
    
    var history = stateStore.get('aptosHistory') || [];
    history.unshift(result);
    if (history.length > 100) history = history.slice(0, 100);
    stateStore.set('aptosHistory', history);
    
    return result;
  },
  
  submitTransaction: function(payload) {
    var bcConfig = getBlockchainConfig();
    if (!bcConfig.enabled) {
      return { error: 'Aptos disabled' };
    }
    return simulateAptosTx(payload);
  },
  
  verifyTransaction: function(txHash) {
    return { verified: true, txHash: txHash, status: 'confirmed' };
  },
  
  getConfig: getBlockchainConfig
};