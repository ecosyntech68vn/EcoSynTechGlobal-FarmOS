const { AIManager } = require('../src/services/AIManager');

describe('AIManager basic', () => {
  test('Agent think returns irrigation suggestion', () => {
    const ai = new AIManager();
    const agent = ai.getAgent('irrigation') || ai.registerAgent('irrigation');
    const res = agent.think({ soilMoisture: 22, forecast: 'dry' });
    expect(res).toBeDefined();
    expect(res.action).toBeTruthy();
  });
  test('Agent memory persists lastDecision', () => {
    const ai = new AIManager();
    const agent = ai.getAgent('irrigation') || ai.registerAgent('irrigation');
    agent.think({ soilMoisture: 28 });
    expect(agent.memory.lastDecision).toBeDefined();
  });
});
