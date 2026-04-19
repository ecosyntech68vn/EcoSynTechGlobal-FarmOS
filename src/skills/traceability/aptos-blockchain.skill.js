var crypto = require('crypto');
var config = require('../../config');

var BC_ENABLED = false;
var BC_NETWORK = 'testnet';
var BC_MODULE = '0x1';

function initBlockchain() {
  var bcConfig = config.blockchain || {};
  BC_ENABLED = bcConfig.enabled === true;
  BC_NETWORK = bcConfig.network || 'testnet';
  BC_MODULE = bcConfig.moduleAddress || '0x1';
}

function formatTimestamp(ts) {
  return new Date(ts).toISOString();
}

function computeBatchHash(batch, stages, readings) {
  var data = {
    batch_code: batch.batch_code,
    product_name: batch.product_name,
    product_type: batch.product_type,
    quantity: batch.quantity,
    farm_name: batch.farm_name,
    zone: batch.zone,
    seed_variety: batch.seed_variety,
    planting_date: batch.planting_date,
    harvest_date: batch.harvest_date,
    stages: stages.map(function(s) {
      return {
        stage_name: s.stage_name,
        stage_type: s.stage_type,
        stage_order: s.stage_order,
        performed_by: s.performed_by,
        location: s.location,
        created_at: s.created_at
      };
    }),
    readings_count: readings ? readings.length : 0,
    metadata: batch.metadata,
    farm_certifications: batch.farm_certifications
  };
  
  var canonical = JSON.stringify(data, Object.keys(data).sort());
  return '0x' + crypto.createHash('sha256').update(canonical).digest('hex');
}

function computeStageHash(stage) {
  var data = {
    stage_name: stage.stage_name,
    stage_type: stage.stage_type,
    stage_order: stage.stage_order,
    description: stage.description,
    performed_by: stage.performed_by,
    location: stage.location,
    inputs_used: stage.inputs_used,
    created_at: stage.created_at
  };
  var canonical = JSON.stringify(data, Object.keys(data).sort());
  return '0x' + crypto.createHash('sha256').update(canonical).digest('hex');
}

function computeHarvestHash(batch, harvestData) {
  var data = {
    batch_code: batch.batch_code,
    harvest_date: new Date().toISOString(),
    harvest_quantity: harvestData.harvest_quantity,
    harvest_notes: harvestData.harvest_notes,
    status: 'harvested'
  };
  var canonical = JSON.stringify(data, Object.keys(data).sort());
  return '0x' + crypto.createHash('sha256').update(canonical).digest('hex');
}

function computeExportHash(batch, exportData) {
  var data = {
    batch_code: batch.batch_code,
    export_date: new Date().toISOString(),
    buyer_name: exportData.buyer_name,
    buyer_contact: exportData.buyer_contact,
    export_price: exportData.export_price,
    export_unit: exportData.export_unit,
    status: 'exported'
  };
  var canonical = JSON.stringify(data, Object.keys(data).sort());
  return '0x' + crypto.createHash('sha256').update(canonical).digest('hex');
}

function computeCertHash(batch, certData) {
  var data = {
    batch_code: batch.batch_code,
    certification_name: certData.certification_name,
    certification_body: certData.certification_body,
    certification_date: certData.certification_date,
    certificate_number: certData.certificate_number,
    added_at: new Date().toISOString()
  };
  var canonical = JSON.stringify(data, Object.keys(data).sort());
  return '0x' + crypto.createHash('sha256').update(canonical).digest('hex');
}

function generateTxHash(data) {
  return '0x' + crypto.createHash('sha256').update(JSON.stringify(data) + Date.now().toString()).digest('hex');
}

function createTxRecord(txType, batchCode, dataHash, metadata) {
  return {
    txHash: generateTxHash({ type: txType, data: dataHash, metadata: metadata }),
    dataHash: dataHash,
    batchCode: batchCode,
    type: txType,
    network: BC_NETWORK,
    moduleAddress: BC_MODULE,
    status: 'confirmed',
    timestamp: formatTimestamp(Date.now()),
    metadata: metadata,
    confirmations: 1
  };
}

module.exports = {
  id: 'aptos-blockchain',
  name: 'Aptos Blockchain Handler',
  triggers: ['event:blockchain.record', 'event:traceability.harvest', 'event:traceability.export', 'cron:5m'],
  riskLevel: 'medium',
  canAutoFix: false,
  
  init: function(stateStore) {
    this._stateStore = stateStore;
  },
  
  run: function(ctx) {
    initBlockchain();
    
    var stateStore = ctx.stateStore;
    var event = ctx.event || {};
    
    if (!BC_ENABLED) {
      return { 
        ok: true, 
        skipped: true, 
        reason: 'Blockchain disabled in config (BLOCKCHAIN_ENABLED=false)',
        enabled: false
      };
    }
    
    var txType = event.type || event.data?.txType || 'batch_record';
    var batchData = event.data?.batch || event.data;
    var metadata = event.data?.metadata || {};
    
    if (!batchData || !batchData.batch_code) {
      var pendingTxs = stateStore.get('pendingBlockchainTxs') || [];
      if (pendingTxs.length > 0) {
        var nextTx = pendingTxs.shift();
        stateStore.set('pendingBlockchainTxs', pendingTxs);
        batchData = nextTx.batchData;
        txType = nextTx.txType || txType;
        metadata = nextTx.metadata || {};
      }
    }
    
    if (!batchData || !batchData.batch_code) {
      return { ok: true, skipped: true, reason: 'No batch data to process' };
    }
    
    var dataHash;
    var stages = batchData.stages || [];
    var readings = batchData.readings || [];
    
    switch (txType) {
      case 'traceability.harvest':
        dataHash = computeHarvestHash(batchData, metadata);
        break;
      case 'traceability.export':
        dataHash = computeExportHash(batchData, metadata);
        break;
      case 'traceability.certify':
        dataHash = computeCertHash(batchData, metadata);
        break;
      case 'traceability.stage':
        dataHash = computeStageHash(metadata.stage || {});
        break;
      default:
        dataHash = computeBatchHash(batchData, stages, readings);
    }
    
    var txRecord = createTxRecord(txType, batchData.batch_code, dataHash, metadata);
    
    var txHistory = stateStore.get('blockchainTxHistory') || [];
    txHistory.unshift(txRecord);
    if (txHistory.length > 200) txHistory = txHistory.slice(0, 200);
    stateStore.set('blockchainTxHistory', txHistory);
    
    var pendingBatches = stateStore.get('blockchainPendingBatches') || {};
    delete pendingBatches[batchData.batch_code];
    stateStore.set('blockchainPendingBatches', pendingBatches);
    
    var stats = stateStore.get('blockchainStats') || { totalTxs: 0, byType: {} };
    stats.totalTxs++;
    stats.byType[txType] = (stats.byType[txType] || 0) + 1;
    stateStore.set('blockchainStats', stats);
    
    return {
      ok: true,
      enabled: true,
      recorded: true,
      txHash: txRecord.txHash,
      dataHash: txRecord.dataHash,
      batchCode: batchData.batch_code,
      type: txType,
      network: BC_NETWORK,
      timestamp: txRecord.timestamp,
      confirmations: 1
    };
  },
  
  queueTransaction: function(batchCode, txType, batchData, metadata) {
    return { batchCode: batchCode, txType: txType, batchData: batchData, metadata: metadata, queuedAt: Date.now() };
  },
  
  computeBatchHash: computeBatchHash,
  computeHarvestHash: computeHarvestHash,
  computeExportHash: computeExportHash,
  computeCertHash: computeCertHash,
  
  getTransactionHistory: function(limit) {
    var stateStore = this._stateStore;
    var history = stateStore ? (stateStore.get('blockchainTxHistory') || []) : [];
    return limit ? history.slice(0, limit) : history;
  },
  
  getStats: function() {
    var stateStore = this._stateStore;
    return stateStore ? (stateStore.get('blockchainStats') || { totalTxs: 0 }) : { totalTxs: 0 };
  },
  
  isEnabled: function() {
    initBlockchain();
    return BC_ENABLED;
  },
  
  getConfig: function() {
    initBlockchain();
    return { enabled: BC_ENABLED, network: BC_NETWORK, moduleAddress: BC_MODULE };
  }
};