var versionDrift = require('../skills/drift/version-drift.skill');
var configDrift = require('../skills/drift/config-drift.skill');
var wsHeartbeat = require('../skills/network/ws-heartbeat.skill');
var mqttWatch = require('../skills/network/mqtt-watch.skill');
var alertDeduper = require('../skills/data/alert-deduper.skill');
var incidentCorrelator = require('../skills/data/incident-correlator.skill');
var buildTestGate = require('../skills/release/build-test-gate.skill');
var approvalGate = require('../skills/release/approval-gate.skill');

var routeMapper = require('../skills/diagnosis/route-mapper.skill');
var webhookCorrelator = require('../skills/diagnosis/webhook-correlator.skill');
var anomalyClassifier = require('../skills/diagnosis/anomaly-classifier.skill');
var deviceStateDiff = require('../skills/diagnosis/device-state-diff.skill');
var kpiDrift = require('../skills/diagnosis/kpi-drift.skill');
var rootCauseHint = require('../skills/diagnosis/root-cause-hint.skill');

var retryJob = require('../skills/selfheal/retry-job.skill');
var reconnectBridge = require('../skills/selfheal/reconnect-bridge.skill');
var resetDevice = require('../skills/selfheal/reset-device.skill');
var clearCache = require('../skills/selfheal/clear-cache.skill');
var rollbackOta = require('../skills/selfheal/rollback-ota.skill');
var autoAcknowledge = require('../skills/selfheal/auto-acknowledge.skill');

var rulesEngine = require('../skills/orchestration/rules-engine.skill');
var schedulesEngine = require('../skills/orchestration/schedules-engine.skill');
var webhookDispatch = require('../skills/orchestration/webhook-dispatch.skill');
var commandRouter = require('../skills/orchestration/command-router.skill');
var otaOrchestrator = require('../skills/orchestration/ota-orchestrator.skill');
var reportExport = require('../skills/orchestration/report-export.skill');

var rbacGuard = require('../skills/governance/rbac-guard.skill');
var auditTrail = require('../skills/governance/audit-trail.skill');
var secretsCheck = require('../skills/governance/secrets-check.skill');
var tenantIsolation = require('../skills/governance/tenant-isolation.skill');
var rateLimitGuard = require('../skills/governance/rate-limit-guard.skill');
var approvalGateAdvanced = require('../skills/governance/approval-gate-advanced.skill');

var rootCauseAnalyzer = require('../skills/analysis/root-cause-analyzer.skill');
var autoBackup = require('../skills/analysis/auto-backup.skill');
var anomalyPredictor = require('../skills/analysis/anomaly-predictor.skill');
var systemHealthScorer = require('../skills/analysis/system-health-scorer.skill');

var autoRestore = require('../skills/recovery/auto-restore.skill');

var vulnScanner = require('../skills/security/vuln-scanner.skill');

var intrusionDetector = require('../skills/defense/intrusion-detector.skill');

var telegramNotifier = require('../skills/communication/telegram-notifier.skill');

var weatherDecision = require('../skills/agriculture/weather-decision.skill');
var waterOptimization = require('../skills/agriculture/water-optimization.skill');
var cropGrowthTracker = require('../skills/agriculture/crop-growth-tracker.skill');
var pestAlert = require('../skills/agriculture/pest-alert.skill');
var fertilizerScheduler = require('../skills/agriculture/fertilizer-scheduler.skill');

var energySaver = require('../skills/iot/energy-saver.skill');
var predictiveMaintenance = require('../skills/iot/predictive-maintenance.skill');
var multiFarmManager = require('../skills/iot/multi-farm-manager.skill');

var reportGenerator = require('../skills/communication/report-generator.skill');
var voiceNotifier = require('../skills/communication/voice-notifier.skill');
var voiceAssistant = require('../skills/communication/voice-assistant.skill');

var languageSwitcher = require('../skills/communication/language-switcher.skill');

var cleanupAgent = require('../skills/maintenance/cleanup-agent.skill');
var logRotator = require('../skills/maintenance/log-rotator.skill');
var dbOptimizer = require('../skills/maintenance/db-optimizer.skill');
var aiPredictWeather = require('../skills/ai/ai-predict-weather.skill');

var qrTraceability = require('../skills/traceability/qr-traceability.skill');
var aptosBlockchain = require('../skills/traceability/aptos-blockchain.skill');
var aptosIntegration = require('../skills/traceability/aptos-integration.skill');
var aiInference = require('../skills/ai/ai-inference.skill');

var skills = [
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
];

function buildRegistry() {
  var map = new Map();
  for (var i = 0; i < skills.length; i++) {
    var skill = skills[i];
    map.set(skill.id, skill);
  }
  return map;
}

module.exports = { buildRegistry: buildRegistry, skills: skills };