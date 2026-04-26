module.exports = {
  id: 'climate-resilience-engine',
  name: 'Climate Resilience Engine',
  category: 'intelligence',
  triggers: ['schedule:1h', 'event:weather-extreme'],
  riskLevel: 'high',
  canAutoFix: true,
  description: 'Thích ứng biến đổi khí hậu, dự đoán và giảm thiểu tác động',
  climateFramework: {
    forecastHorizon: 30,
    adaptationThreshold: 0.7,
    resilienceScore: 0
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    const event = ctx.event || {};
    
    const climateStatus = {
      resilienceScore: 0,
      risks: [],
      adaptations: [],
      predictions: [],
      recommendations: []
    };
    
    try {
      logger.info('[ClimateResilience] Analyzing climate patterns...');
      
      const climateData = await fetchClimateData(db, logger);
      
      const predictions = await predictClimateImpact(climateData, db, logger);
      climateStatus.predictions = predictions;
      
      const risks = await identifyClimateRisks(predictions, db, logger);
      climateStatus.risks = risks;
      
      const adaptations = await generateAdaptationPlan(risks, climateData, db, logger);
      climateStatus.adaptations = adaptations;
      
      climateStatus.resilienceScore = calculateResilienceScore(adaptations, risks);
      
      if (climateStatus.resilienceScore < 60) {
        climateStatus.recommendations.push({
          priority: 'high',
          action: 'Review climate adaptation plan',
          reason: 'Resilience score below threshold'
        });
      }
      
      await executeAdaptations(adaptations, db, logger);
      
      return {
        ok: climateStatus.resilienceScore > 50,
        climateStatus: climateStatus,
        resilienceScore: climateStatus.resilienceScore,
        risksCount: climateStatus.risks.length,
        adaptationsCount: climateStatus.adaptations.length,
        recommendations: climateStatus.recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[ClimateResilience] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    async function fetchClimateData(db, logger) {
      try {
        const weather = await db.query(
          'SELECT * FROM weather_forecast ORDER BY date DESC LIMIT 30'
        );
        
        if (weather.length > 0) return weather;
      } catch {}
      
      return generateMockClimateData();
    }
    
    function generateMockClimateData() {
      const data = [];
      for (let i = 0; i < 30; i++) {
        data.push({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          temp: 25 + Math.random() * 10,
          humidity: 60 + Math.random() * 30,
          rainfall: Math.random() > 0.7 ? Math.random() * 50 : 0,
          extreme: Math.random() > 0.9
        });
      }
      return data;
    }
    
    async function predictClimateImpact(data, db, logger) {
      const predictions = [];
      
      const extremeDays = data.filter(d => d.extreme || d.rainfall > 40);
      const droughtDays = data.filter(d => d.rainfall < 5 && d.temp > 30);
      const floodDays = data.filter(d => d.rainfall > 30);
      
      if (extremeDays.length > 5) {
        predictions.push({
          type: 'extreme-weather',
          probability: extremeDays.length / data.length,
          impact: 'high',
          description: extremeDays.length + ' days with extreme weather predicted'
        });
      }
      
      if (droughtDays.length > 10) {
        predictions.push({
          type: 'drought',
          probability: droughtDays.length / data.length,
          impact: 'high',
          description: 'Drought conditions expected for ' + droughtDays.length + ' days'
        });
      }
      
      if (floodDays.length > 3) {
        predictions.push({
          type: 'flood',
          probability: floodDays.length / data.length,
          impact: 'critical',
          description: 'Flood risk for ' + floodDays.length + ' days'
        });
      }
      
      predictions.push({
        type: 'temperature-trend',
        average: data.reduce((s, d) => s + d.temp, 0) / data.length,
        trend: 'stable',
        description: 'Average temperature: ' + (data.reduce((s, d) => s + d.temp, 0) / data.length).toFixed(1) + '°C'
      });
      
      return predictions;
    }
    
    async function identifyClimateRisks(predictions, db, logger) {
      const risks = [];
      
      for (const pred of predictions) {
        if (pred.impact === 'critical' || pred.impact === 'high') {
          risks.push({
            type: pred.type,
            probability: pred.probability,
            impact: pred.impact,
            severity: pred.probability * (pred.impact === 'critical' ? 1.5 : 1)
          });
        }
      }
      
      return risks.sort((a, b) => b.severity - a.severity);
    }
    
    async function generateAdaptationPlan(risks, climateData, db, logger) {
      const adaptations = [];
      
      for (const risk of risks) {
        if (risk.type === 'drought') {
          adaptations.push({
            action: 'increase-irrigation-frequency',
            reason: 'Drought risk predicted',
            crops: ['rice', 'vegetables'],
            schedule: 'twice-daily'
          });
          
          adaptations.push({
            action: 'mulching',
            reason: 'Reduce water evaporation',
            area: 'all-fields'
          });
        }
        
        if (risk.type === 'flood') {
          adaptations.push({
            action: 'drainage-preparation',
            reason: 'Flood risk predicted',
            priority: 'high'
          });
          
          adaptations.push({
            action: 'move-equipment-higher',
            reason: 'Protect assets',
            priority: 'high'
          });
        }
        
        if (risk.type === 'extreme-weather') {
          adaptations.push({
            action: 'greenhouse-strengthening',
            reason: 'Extreme weather expected',
            priority: 'medium'
          });
        }
      }
      
      if (climateData.length > 0 && climateData.some(d => d.temp > 35)) {
        adaptations.push({
          action: 'shade-net-deployment',
          reason: 'High temperature expected',
          crops: ['leafy-greens', 'seedlings']
        });
      }
      
      return adaptations;
    }
    
    function calculateResilienceScore(adaptations, risks) {
      if (risks.length === 0) return 85;
      
      const adaptationCoverage = Math.min(adaptations.length / risks.length, 1.5);
      const riskMitigation = risks.length > 0 ? 1 - (risks.reduce((s, r) => s + r.severity, 0) / risks.length) : 1;
      
      return Math.round((adaptationCoverage * 50 + riskMitigation * 50));
    }
    
    async function executeAdaptations(adaptations, db, logger) {
      for (const adaptation of adaptations) {
        try {
          await db.query(
            'INSERT INTO climate_adaptations (action, reason, status, created_at) VALUES (?, ?, ?, datetime("now"))',
            [adaptation.action, adaptation.reason, 'executed']
          );
          
          logger.info('[ClimateResilience] Executed: ' + adaptation.action);
        } catch {}
      }
    }
  }
};