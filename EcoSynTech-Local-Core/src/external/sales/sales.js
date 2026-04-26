const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const salesModule = require('../modules/sales-integration');

router.post('/lead', asyncHandler(async (req, res) => {
  const { message, customer, source } = req.body;
  const result = await salesModule.processLead({ message, customer, source });
  res.json(result);
}));

router.post('/product', asyncHandler(async (req, res) => {
  const { leadId, farmSize, cropType, budget, packageId } = req.body;
  const result = await salesModule.processProduct({ leadId, farmSize, cropType, budget, packageId });
  res.json(result);
}));

router.post('/quote', asyncHandler(async (req, res) => {
  const { leadId, packageId, farmSize, cropType } = req.body;
  const result = await salesModule.processQuote({ leadId, packageId, farmSize, cropType });
  res.json(result);
}));

router.post('/contract', asyncHandler(async (req, res) => {
  const { quoteId, customer, payment } = req.body;
  const result = await salesModule.processContract({ quoteId, customer, payment });
  res.json(result);
}));

router.post('/install', asyncHandler(async (req, res) => {
  const { contractId } = req.body;
  const result = await salesModule.processInstall({ contractId });
  res.json(result);
}));

router.post('/support', asyncHandler(async (req, res) => {
  const { issue, customerId, contractId } = req.body;
  const result = await salesModule.processSupport({ issue, customerId, contractId });
  res.json(result);
}));

router.post('/chat', asyncHandler(async (req, res) => {
  const { message, customerId, sessionId } = req.body;
  const result = await salesModule.processChat({ message, customerId, sessionId });
  res.json(result);
}));

router.get('/status', asyncHandler(async (req, res) => {
  const stats = salesModule.getStats();
  res.json(stats);
}));

module.exports = router;