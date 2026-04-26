const fs = require('fs');
const path = require('path');
const aiTelemetry = require('../src/services/aiTelemetry');
const aiEngine = require('../src/services/aiEngine');

const REQUIRED_EVIDENCE_FILES = [
  'ISMS_POLICY.md',
  'RISK_REGISTER.md',
  'SOP_AI_GOVERNANCE.md',
  'AI_EVIDENCE_PACK.md',
  'IoT_DATA_TAXONOMY.md',
  'ANNEX_A_MAPPING.md',
  'INCIDENT_RESPONSE_SOP.md',
  'AUDIT_CHECKLIST.md',
  'AUDIT_EXECUTIVE_SUMMARY.md',
  'models/registry.json',
  'src/bootstrap/modelLoader.js',
  'src/bootstrap/bootstrap_api.js',
  'src/services/aiTelemetry.js',
  'src/services/aiEngine.js',
  'scripts/setup-models.sh',
  'bin/bootstrap-ai.js',
  'public/bootstrap.html',
  '__tests__/ai_telemetry.test.js',
  '__tests__/bootstrap_api.test.js',
  '__tests__/bootstrap_ai.test.js',
  'migrations/007_ai_telemetry_governance.sql'
];

describe('Audit Evidence Collection', () => {
  describe('File Evidence', () => {
    for (const file of REQUIRED_EVIDENCE_FILES) {
      test(`${file} exists`, () => {
        const fullPath = path.join(__dirname, '..', file);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    }
  });

  describe('Model Registry', () => {
    test('registry has both models documented', () => {
      const raw = fs.readFileSync(path.join(__dirname, '../models/registry.json'), 'utf8');
      const reg = JSON.parse(raw);
      expect(reg.models.length).toBeGreaterThanOrEqual(2);
    });

    test('model-001 has SHA256 checksum', () => {
      const raw = fs.readFileSync(path.join(__dirname, '../models/registry.json'), 'utf8');
      const reg = JSON.parse(raw);
      const m1 = reg.models.find(m => m.id === 'model-001');
      expect(m1?.checksum?.algorithm).toBe('SHA256');
      expect(m1?.checksum?.value).not.toBe('placeholder_for_model_001_sha256');
    });

    test('model-002 has checksum object', () => {
      const raw = fs.readFileSync(path.join(__dirname, '../models/registry.json'), 'utf8');
      const reg = JSON.parse(raw);
      const m2 = reg.models.find(m => m.id === 'model-002');
      expect(m2?.checksum).toBeDefined();
    });
  });

  describe('AI Telemetry Service', () => {
    test('validates sensor values correctly', () => {
      const r = aiTelemetry.validateSensorValue('soil', 50);
      expect(r.valid).toBe(true);
      expect(r.quality).toBe('good');
    });

    test('assesses data quality with score and grade', () => {
      const q = aiTelemetry.assessDataQuality({ soil: 50, temperature: 28, humidity: 70 });
      expect(q.score).toBe(100);
      expect(q.grade).toBe('A');
      expect(q.meetsMinimumQuality).toBe(true);
    });

    test('classifies data types correctly', () => {
      expect(aiTelemetry.getClassification('prediction_input')).toBe('Internal');
      expect(aiTelemetry.getClassification('anomaly')).toBe('Confidential');
    });

    test('hashes data consistently', () => {
      const h1 = aiTelemetry.hashData({ a: 1, b: 2 });
      const h2 = aiTelemetry.hashData({ b: 2, a: 1 });
      expect(h1).toBe(h2);
    });

    test('logs prediction audit', () => {
      const entry = aiTelemetry.logPredictionAudit({
        predictionType: 'irrigation',
        modelId: 'model-001',
        qualityScore: 95
      });
      expect(entry.id).toBeTruthy();
      expect(entry.predictionType).toBe('irrigation');
    });
  });

  describe('AI Engine Integration', () => {
    test('getTelemetryHealth returns governance report', () => {
      const report = aiEngine.getTelemetryHealth();
      expect(report).toHaveProperty('timestamp');
    });

    test('validateInputData returns quality assessment', () => {
      const result = aiEngine.validateInputData({ soil: 50 });
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('grade');
      expect(result).toHaveProperty('meetsMinimumQuality');
    });

    test('getAuditTrail returns array', () => {
      const trail = aiEngine.getAuditTrail(5);
      expect(Array.isArray(trail)).toBe(true);
    });
  });

  describe('Model Loader Checksum', () => {
    test('computes SHA256 for model file', () => {
      const ml = require('../src/bootstrap/modelLoader');
      const computeSha256 = () => {
        const crypto = require('crypto');
        const filePath = path.join(__dirname, '../models/plant_disease.tflite');
        const hash = crypto.createHash('sha256');
        const data = fs.readFileSync(filePath);
        hash.update(data);
        return hash.digest('hex');
      };
      const sha = computeSha256();
      expect(sha).toBeTruthy();
      expect(sha).toHaveLength(64);
    });

    test('registry SHA256 matches computed SHA256', () => {
      const crypto = require('crypto');
      const filePath = path.join(__dirname, '../models/plant_disease.tflite');
      const actualSha = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
      const raw = fs.readFileSync(path.join(__dirname, '../models/registry.json'), 'utf8');
      const reg = JSON.parse(raw);
      const m1 = reg.models.find(m => m.id === 'model-001');
      expect(m1?.checksum?.value).toBe(actualSha);
    });
  });

  describe('Bootstrap History', () => {
    test('getHistory returns array', () => {
      const ml = require('../src/bootstrap/modelLoader');
      const hist = ml.getHistory(5);
      expect(Array.isArray(hist)).toBe(true);
    });

    test('getStatus returns expected shape', () => {
      const ml = require('../src/bootstrap/modelLoader');
      const s = ml.getStatus();
      expect(s).toHaveProperty('smallEnabled');
      expect(s).toHaveProperty('largeEnabled');
      expect(s).toHaveProperty('health');
      expect(s.health).toHaveProperty('small');
      expect(s.health).toHaveProperty('large');
    });

    test('getHealth returns health check', () => {
      const ml = require('../src/bootstrap/modelLoader');
      const h = ml.getHealth();
      expect(h).toHaveProperty('small');
      expect(h.small).toHaveProperty('id', 'model-001');
      expect(h.small).toHaveProperty('exists');
    });
  });

  describe('AI Evidence Pack Completeness', () => {
    test('evidence pack references all Phase 2 artifacts', () => {
      const content = fs.readFileSync(path.join(__dirname, '../AI_EVIDENCE_PACK.md'), 'utf8');
      expect(content).toContain('aiTelemetry.js');
      expect(content).toContain('E-A14.3-07');
      expect(content).toContain('E-A14.4-08');
      expect(content).toContain('ai_prediction_audit');
      expect(content).toContain('6.1.0');
    });

    test('audit checklist has 93 controls documented', () => {
      const content = fs.readFileSync(path.join(__dirname, '../AUDIT_CHECKLIST.md'), 'utf8');
      expect(content).toContain('93');
    });

    test('audit executive summary references all phases', () => {
      const content = fs.readFileSync(path.join(__dirname, '../AUDIT_EXECUTIVE_SUMMARY.md'), 'utf8');
      expect(content).toContain('A.14');
      expect(content).toContain('Phase');
      expect(content).toContain('SHA256');
      expect(content).toContain('100%');
    });
  });

  describe('Migration Schema', () => {
    test('migration 007 creates ai_prediction_audit table', () => {
      const content = fs.readFileSync(path.join(__dirname, '../migrations/007_ai_telemetry_governance.sql'), 'utf8');
      expect(content).toContain('ai_prediction_audit');
      expect(content).toContain('prediction_type');
      expect(content).toContain('input_hash');
      expect(content).toContain('output_hash');
      expect(content).toContain('quality_score');
      expect(content).toContain('data_classification');
      expect(content).toContain('data_quality_logs');
    });
  });
});