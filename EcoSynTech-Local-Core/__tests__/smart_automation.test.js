const { SmartAutomationEngine, ContextualLearning, PredictiveAlerting, SelfOptimizingPipeline } = require('../src/services/smartAutomationEngine');
const { SkillOrchestrator, getOrchestrator } = require('../src/services/skillOrchestrator');

describe('SmartAutomationEngine', () => {
  test('Engine initializes with AI agents', () => {
    const engine = new SmartAutomationEngine({ enabled: true });
    expect(engine.enabled).toBe(true);
    expect(engine.aiManager).toBeDefined();
    expect(engine.aiManager.agents.size).toBe(9);
  });

  test('Process returns insights and executions', async () => {
    const engine = new SmartAutomationEngine({ enabled: true });
    const result = await engine.process({ cpu: 30, ram: 40 });
    expect(result.insights).toBeDefined();
    expect(result.insights.totalAgents).toBe(9);
  });

  test('Process with critical values triggers actions', async () => {
    const engine = new SmartAutomationEngine({ enabled: true });
    const result = await engine.process({ cpu: 95, ram: 50, soilMoisture: 15 });
    expect(result.insights.actionableCount).toBeGreaterThan(0);
  });

  test('GetStats returns comprehensive stats', () => {
    const engine = new SmartAutomationEngine({ enabled: true });
    const stats = engine.getStats();
    expect(stats.enabled).toBe(true);
    expect(stats.aiAgents).toBe(9);
    expect(stats.learning).toBeDefined();
  });
});

describe('ContextualLearning', () => {
  test('Records and learns from outcomes', () => {
    const learning = new ContextualLearning();
    learning.record('system_health', { cpu: 90 }, { action: 'warning' }, 'success');
    learning.record('system_health', { cpu: 95 }, { action: 'critical' }, 'success');
    
    const insights = learning.getInsights();
    expect(insights.totalRecords).toBe(2);
    expect(insights.agents).toContainEqual(expect.objectContaining({ agent: 'system_health' }));
  });

  test('Adapts thresholds based on history', () => {
    const learning = new ContextualLearning();
    for (let i = 0; i < 20; i++) {
      learning.record('system_health', { cpu: 50 + i }, { action: 'ok' }, 'success');
    }
    const adapted = learning.adaptThreshold('system_health', 'cpu', 75, 80);
    expect(adapted).toBeLessThan(80);
  });
});

describe('PredictiveAlerting', () => {
  test('Records baseline and predicts anomalies', () => {
    const predictor = new PredictiveAlerting({ anomalyThreshold: 2.0 });
    const now = Date.now();
    
    for (let i = 0; i < 15; i++) {
      predictor.record('cpu', 30 + Math.random() * 10, now - (15 - i) * 1000);
    }
    
    const prediction = predictor.predict('cpu', 80);
    expect(prediction.predicted).toBe(true);
  });

  test('Returns false for insufficient data', () => {
    const predictor = new PredictiveAlerting();
    predictor.record('test', 50);
    
    const prediction = predictor.predict('test', 100);
    expect(prediction.predicted).toBe(false);
  });
});

describe('SelfOptimizingPipeline', () => {
  test('Records metrics and analyzes', () => {
    const pipeline = new SelfOptimizingPipeline();
    for (let i = 0; i < 15; i++) {
      pipeline.record(100 + i * 10, i < 12);
    }
    
    const analysis = pipeline.analyze();
    expect(analysis.status).toBeDefined();
    expect(analysis.errorRate).toBeDefined();
  });

  test('Applies optimizations', () => {
    const pipeline = new SelfOptimizingPipeline();
    pipeline.applyOptimization('cache_ttl', { increase: 1.5 });
    
    expect(pipeline.optimizations.length).toBe(1);
    expect(pipeline.optimizations[0].type).toBe('cache_ttl');
  });
});

describe('SkillOrchestrator', () => {
  test('Orchestrator initializes with default mappings', () => {
    const orch = getOrchestrator();
    const mappings = orch.registry.getSkillsForAgent('system_health');
    expect(mappings.length).toBeGreaterThan(0);
  });

  test('Executes skill mappings for agent', async () => {
    const orch = getOrchestrator();
    const result = await orch.orchestrate('system_health', { cpu: 50 });
    expect(result.agent).toBe('system_health');
  });

  test('Returns stats', () => {
    const orch = getOrchestrator();
    const stats = orch.getStats();
    expect(stats.mappings).toBeGreaterThan(0);
  });
});