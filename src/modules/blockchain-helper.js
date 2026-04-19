var config = require('../config');

var BC_ENABLED = false;

function init() {
  var bcConfig = config.blockchain || {};
  BC_ENABLED = bcConfig.enabled === true;
}

function isEnabled() {
  init();
  return BC_ENABLED;
}

function createHarvestMetadata(harvestQuantity, harvestNotes) {
  return {
    harvest_quantity: harvestQuantity,
    harvest_notes: harvestNotes,
    timestamp: new Date().toISOString()
  };
}

function createExportMetadata(buyerName, buyerContact, exportPrice, exportUnit, notes) {
  return {
    buyer_name: buyerName,
    buyer_contact: buyerContact,
    export_price: exportPrice,
    export_unit: exportUnit,
    export_notes: notes,
    timestamp: new Date().toISOString()
  };
}

function createCertMetadata(certificationName, certificationBody, certificationDate, certificationExpire, certificateNumber) {
  return {
    certification_name: certificationName,
    certification_body: certificationBody,
    certification_date: certificationDate,
    certification_expire: certificationExpire,
    certificate_number: certificateNumber,
    timestamp: new Date().toISOString()
  };
}

function createStageMetadata(stage) {
  return {
    stage: stage,
    timestamp: new Date().toISOString()
  };
}

function shouldRecordToBlockchain() {
  init();
  return BC_ENABLED;
}

module.exports = {
  isEnabled: isEnabled,
  shouldRecordToBlockchain: shouldRecordToBlockchain,
  createHarvestMetadata: createHarvestMetadata,
  createExportMetadata: createExportMetadata,
  createCertMetadata: createCertMetadata,
  createStageMetadata: createStageMetadata
};