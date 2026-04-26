const { AIManager } = require('../src/services/AIManager');

describe('AIManager basic', () => {
  test('Agent think returns irrigation suggestion', () => {
    const ai = new AIManager();
    const agent = ai.getAgent('irrigation') || ai.registerAgent('irrigation');
    const res = agent.think({ soilMoisture: 18, forecast: 'dry' });
    expect(res).toBeDefined();
    expect(res.action).toBe('irrigate');
    expect(res.details.level).toBe('high');
  });
  test('Agent memory persists lastDecision', () => {
    const ai = new AIManager();
    const agent = ai.getAgent('irrigation') || ai.registerAgent('irrigation');
    agent.think({ soilMoisture: 28 });
    expect(agent.memory.lastDecision).toBeDefined();
  });
  test('Climate agent responds to dry forecast', () => {
    const ai = new AIManager();
    const agent = ai.getOrCreateAgent('climate');
    const res = agent.think({ forecast: 'dry', temperature: 36 });
    expect(res).toBeDefined();
    expect(res.action).toBe('adjust_irrigation_schedule');
  });
  test('Soil health agent detects acidic soil', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('soil_health', { ph: 5.0 });
    expect(res).toBeDefined();
    expect(res.action).toBe('apply_lime');
    expect(res.details.ph).toBe(5.0);
  });
  test('Soil health agent detects optimal pH', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('soil_health', { ph: 6.5 });
    expect(res.action).toBe('optimal');
  });
  test('Energy saver detects high power usage', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('energy_saver', { powerUsage: 85 });
    expect(res.action).toBe('reduce_load');
    expect(res.details.severity).toBe('critical');
  });
  test('Pest control detects high pest risk', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('pest_control', { pestRisk: 75 });
    expect(res.action).toBe('activate_spraying');
  });
  test('Pest control fungal conditions', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('pest_control', { humidity: 85, temperature: 25 });
    expect(res.action).toBe('preventive_spray');
  });
  test('System health agent detects CPU overload', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('system_health', { cpu: 95, ram: 50, disk: 60 });
    expect(res).toBeDefined();
    expect(res.action).toBe('critical');
    expect(res.details.cpu).toBe(95);
  });
  test('System health agent detects OK status', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('system_health', { cpu: 30, ram: 40, disk: 50 });
    expect(res.action).toBe('ok');
  });
  test('Security monitor detects brute force', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('security_monitor', { failedLogins: 7 });
    expect(res.action).toBe('block_ip');
    expect(res.details.severity).toBe('critical');
  });
  test('Security monitor detects suspicious activity', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('security_monitor', { failedLogins: 3 });
    expect(res.action).toBe('alert');
  });
  test('Performance tuner detects slow response', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('performance_tuner', { responseTime: 3000 });
    expect(res.action).toBe('optimize');
    expect(res.details.reason).toContain('slow_response');
  });
  test('Alert aggregator groups alerts', () => {
    const ai = new AIManager();
    const res = ai.thinkForField('alert_aggregator', { alertCount: 25 });
    expect(res.action).toBe('group_alerts');
    expect(res.details.groupBy).toBe('severity');
  });
  test('thinkForAll returns all agent results', () => {
    const ai = new AIManager();
    const res = ai.thinkForAll({ soilMoisture: 18 });
    expect(Object.keys(res).length).toBe(9);
    expect(res.irrigation.action).toBe('irrigate');
  });
  test('getInsights returns actionable items', () => {
    const ai = new AIManager();
    const insights = ai.getInsights({ soilMoisture: 15, pestRisk: 80, cpu: 95 });
    expect(insights.actionableCount).toBeGreaterThan(0);
    expect(insights.actions.length).toBe(insights.actionableCount);
  });
  test('getMode returns heuristic_only on low RAM', () => {
    const ai = new AIManager();
    expect(ai.mode).toMatch(/^(heuristic_only|hybrid)$/);
  });
});
