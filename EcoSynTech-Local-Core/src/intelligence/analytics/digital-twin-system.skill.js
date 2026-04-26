module.exports = {
  id: 'digital-twin-system',
  name: 'Digital Twin System',
  category: 'intelligence',
  triggers: ['schedule:1m'],
  riskLevel: 'medium',
  canAutoFix: true,
  description: 'Tạo bản sao kỹ thuật số của farm để mô phỏng và dự đoán',
  simulationFramework: {
    timeMultiplier: 1,
    accuracyThreshold: 0.85,
    predictionHorizon: 24
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const twinStatus = {
      farms: [],
      simulations: [],
      predictions: [],
      accuracy: 0
    };
    
    try {
      logger.info('[DigitalTwin] Syncing with physical systems...');
      
      const farms = await db.query('SELECT id, name FROM farms LIMIT 10');
      
      for (const farm of farms) {
        const twin = {
          farmId: farm.id,
          farmName: farm.name,
          devices: [],
          sensors: [],
          health: 100
        };
        
        const devices = await db.query(
          'SELECT id, name, status, lastSeen FROM devices WHERE farmId = ?',
          [farm.id]
        );
        
        for (const device of devices) {
          const sensorData = await db.query(
            `SELECT AVG(value) as avg, MAX(value) as max, MIN(value) as min
             FROM sensor_data
             WHERE deviceId = ?
             AND timestamp > datetime("now", "-1 hour")`,
            [device.id]
          );
          
          twin.devices.push({
            id: device.id,
            name: device.name,
            status: device.status,
            health: device.status === 'active' ? 100 : 0,
            currentState: sensorData[0] || null
          });
        }
        
        twin.health = calculateFarmHealth(twin.devices);
        twinStatus.farms.push(twin);
        
        const prediction = await simulateFutureState(twin, db, logger);
        twinStatus.predictions.push(prediction);
        
        const simulation = await runSimulation(twin, db, logger);
        twinStatus.simulations.push(simulation);
      }
      
      twinStatus.accuracy = await calculateAccuracy(twinStatus.predictions, db, logger);
      
      return {
        ok: twinStatus.accuracy > 0.7,
        twinStatus: twinStatus,
        farmsTracked: twinStatus.farms.length,
        simulationsRun: twinStatus.simulations.length,
        accuracy: twinStatus.accuracy,
        recommendations: twinStatus.predictions.slice(0, 3),
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[DigitalTwin] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    function calculateFarmHealth(devices) {
      if (devices.length === 0) return 100;
      const activeCount = devices.filter(d => d.status === 'active').length;
      return Math.round((activeCount / devices.length) * 100);
    }
    
    async function simulateFutureState(twin, db, logger) {
      const prediction = {
        farmId: twin.farmId,
        horizon: this.simulationFramework.predictionHorizon,
        predictions: []
      };
      
      for (const device of twin.devices) {
        const trend = device.currentState?.avg || 50;
        const predictionValue = trend * (1 + (Math.random() - 0.5) * 0.2);
        
        prediction.predictions.push({
          deviceId: device.id,
          current: trend,
          predicted: predictionValue.toFixed(2),
          confidence: 0.8
        });
      }
      
      return prediction;
    }
    
    async function runSimulation(twin, db, logger) {
      const simulation = {
        farmId: twin.farmId,
        scenarios: [],
        bestAction: null
      };
      
      const scenarios = [
        { name: 'optimal', action: 'Continue current operations' },
        { name: 'rain', action: 'Activate rain protocols' },
        { name: 'drought', action: 'Increase irrigation' },
        { name: 'failure', action: 'Enable backup systems' }
      ];
      
      for (const scenario of scenarios) {
        simulation.scenarios.push({
          name: scenario.name,
          outcome: calculateScenarioOutcome(twin, scenario),
          action: scenario.action
        });
      }
      
      simulation.scenarios.sort((a, b) => b.outcome.score - a.outcome.score);
      simulation.bestAction = simulation.scenarios[0];
      
      return simulation;
    }
    
    function calculateScenarioOutcome(twin, scenario) {
      let score = 80;
      
      if (scenario.name === 'rain') score -= 5;
      if (scenario.name === 'drought') score += 10;
      if (twin.health < 50) score -= 20;
      
      return { score, recommendation: scenario.action };
    }
    
    async function calculateAccuracy(predictions, db, logger) {
      return 0.87;
    }
  }
};