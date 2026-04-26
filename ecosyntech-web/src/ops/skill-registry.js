const versionDrift = require('../skills/drift/version-drift.skill');
const configDrift = require('../skills/drift/config-drift.skill');
const wsHeartbeat = require('../skills/network/ws-heartbeat.skill');
const mqttWatch = require('../skills/network/mqtt-watch.skill');
const alertDeduper = require('../skills/data/alert-deduper.skill');
const incidentCorrelator = require('../skills/data/incident-correlator.skill');
const buildTestGate = require('../skills/release/build-test-gate.skill');
const approvalGate = require('../skills/release/approval-gate.skill');

const routeMapper = require('../skills/diagnosis/route-mapper.skill');
const webhookCorrelator = require('../skills/diagnosis/webhook-correlator.skill');
const anomalyClassifier = require('../skills/diagnosis/anomaly-classifier.skill');
const deviceStateDiff = require('../skills/diagnosis/device-state-diff.skill');
const kpiDrift = require('../skills/diagnosis/kpi-drift.skill');
const rootCauseHint = require('../skills/diagnosis/root-cause-hint.skill');

const retryJob = require('../skills/selfheal/retry-job.skill');
const reconnectBridge = require('../skills/selfheal/reconnect-bridge.skill');
const resetDevice = require('../skills/selfheal/reset-device.skill');
const clearCache = require('../skills/selfheal/clear-cache.skill');
const rollbackOta = require('../skills/selfheal/rollback-ota.skill');
const autoAcknowledge = require('../skills/selfheal/auto-acknowledge.skill');

const rulesEngine = require('../skills/orchestration/rules-engine.skill');
const schedulesEngine = require('../skills/orchestration/schedules-engine.skill');
const webhookDispatch = require('../skills/orchestration/webhook-dispatch.skill');
const commandRouter = require('../skills/orchestration/command-router.skill');
const otaOrchestrator = require('../skills/orchestration/ota-orchestrator.skill');
const reportExport = require('../skills/orchestration/report-export.skill');

const rbacGuard = require('../skills/governance/rbac-guard.skill');
const auditTrail = require('../skills/governance/audit-trail.skill');
const secretsCheck = require('../skills/governance/secrets-check.skill');
const tenantIsolation = require('../skills/governance/tenant-isolation.skill');
const rateLimitGuard = require('../skills/governance/rate-limit-guard.skill');
const approvalGateAdvanced = require('../skills/governance/approval-gate-advanced.skill');

const rootCauseAnalyzer = require('../skills/analysis/root-cause-analyzer.skill');
const autoBackup = require('../skills/analysis/auto-backup.skill');
const anomalyPredictor = require('../skills/analysis/anomaly-predictor.skill');
const systemHealthScorer = require('../skills/analysis/system-health-scorer.skill');

const autoRestore = require('../skills/recovery/auto-restore.skill');

const vulnScanner = require('../skills/security/vuln-scanner.skill');

const intrusionDetector = require('../skills/defense/intrusion-detector.skill');

const telegramNotifier = require('../skills/communication/telegram-notifier.skill');

const weatherDecision = require('../skills/agriculture/weather-decision.skill');
const waterOptimization = require('../skills/agriculture/water-optimization.skill');
const cropGrowthTracker = require('../skills/agriculture/crop-growth-tracker.skill');
const pestAlert = require('../skills/agriculture/pest-alert.skill');
const fertilizerScheduler = require('../skills/agriculture/fertilizer-scheduler.skill');

const energySaver = require('../skills/iot/energy-saver.skill');
const predictiveMaintenance = require('../skills/iot/predictive-maintenance.skill');
const multiFarmManager = require('../skills/iot/multi-farm-manager.skill');

const reportGenerator = require('../skills/communication/report-generator.skill');
const voiceNotifier = require('../skills/communication/voice-notifier.skill');
const voiceAssistant = require('../skills/communication/voice-assistant.skill');

const languageSwitcher = require('../skills/communication/language-switcher.skill');

const cleanupAgent = require('../skills/maintenance/cleanup-agent.skill');
const logRotator = require('../skills/maintenance/log-rotator.skill');
const dbOptimizer = require('../skills/maintenance/db-optimizer.skill');
const aiPredictWeather = require('../skills/ai/ai-predict-weather.skill');

const qrTraceability = require('../skills/traceability/qr-traceability.skill');
const aptosBlockchain = require('../skills/traceability/aptos-blockchain.skill');
const aptosIntegration = require('../skills/traceability/aptos-integration.skill');
const aiInference = require('../skills/ai/ai-inference.skill');
const aiRAG = require('../skills/ai/ai-rag.skill');
const aiConversation = require('../skills/ai/ai-conversation.skill');
const roiCalculator = require('../skills/ai/roi-calculator.skill');
const dbSqliteIot = require('../skills/maintenance/db-sqlite-iot.skill');
const hybridSync = require('../skills/sync/hybrid-sync.skill');
const mobileDashboard = require('../skills/dashboard/mobile-dashboard.skill');
const costCalculator = require('../skills/ai/cost-calculator.skill');

const salesLeadClaw = require('../skills/sales/lead-claw');
const salesProductClaw = require('../skills/sales/product-claw');
const salesQuoteClaw = require('../skills/sales/quote-claw');
const salesContractClaw = require('../skills/sales/contract-claw');
const salesInstallClaw = require('../skills/sales/install-claw');
const salesSupportClaw = require('../skills/sales/support-claw');

const skills = [
  versionDrift,
  configDrift,
  wsHeartbeat,
  mqttWatch,
  alertDeduper,
  incidentCorrelator,
  buildTestGate,
  approvalGate,
  routeMapper,
  webhookCorrelator,
  anomalyClassifier,
  deviceStateDiff,
  kpiDrift,
  rootCauseHint,
  retryJob,
  reconnectBridge,
  resetDevice,
  clearCache,
  rollbackOta,
  autoAcknowledge,
  rulesEngine,
  schedulesEngine,
  webhookDispatch,
  commandRouter,
  otaOrchestrator,
  reportExport,
  rbacGuard,
  auditTrail,
  secretsCheck,
  tenantIsolation,
  rateLimitGuard,
  approvalGateAdvanced,
  rootCauseAnalyzer,
  autoBackup,
  anomalyPredictor,
  systemHealthScorer,
  autoRestore,
  vulnScanner,
  intrusionDetector,
  telegramNotifier,
  weatherDecision,
  waterOptimization,
  cropGrowthTracker,
  pestAlert,
  fertilizerScheduler,
  energySaver,
  predictiveMaintenance,
  multiFarmManager,
  reportGenerator,
  voiceNotifier,
  voiceAssistant,
  languageSwitcher,
  cleanupAgent,
  logRotator,
  dbOptimizer,
  aiPredictWeather,
  qrTraceability,
  aptosBlockchain,
  aptosIntegration,
  aiInference,
  aiRAG,
  aiConversation,
  roiCalculator,
  dbSqliteIot,
  hybridSync,
  mobileDashboard,
  costCalculator,
  salesLeadClaw,
  salesProductClaw,
  salesQuoteClaw,
  salesContractClaw,
  salesInstallClaw,
  salesSupportClaw
];

function buildRegistry() {
  const map = new Map();
  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    map.set(skill.id, skill);
  }
  return map;
}

module.exports = { buildRegistry: buildRegistry, skills: skills };