module.exports = {
  id: 'context-aware-automation',
  name: 'Context-Aware Automation Engine',
  category: 'automation',
  triggers: ['schedule:2m'],
  riskLevel: 'medium',
  canAutoFix: true,
  description: 'Executes actions based on environmental context, time, weather, season, and user patterns',
  contextDimensions: {
    time: ['hour', 'dayOfWeek', 'isWeekend'],
    weather: ['temp', 'humidity', 'rain'],
    season: ['spring', 'summer', 'fall', 'winter'],
    events: ['farming', 'harvest', 'maintenance']
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const contextActions = {
      executed: [],
      skipped: [],
      pending: []
    };
    
    try {
      logger.info('[ContextAutomation] Analyzing context...');
      
      const context = {
        hour: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        isWeekend: new Date().getDay() === 0 || new Date().getDay() === 6,
        month: new Date().getMonth(),
        season: getSeason(new Date().getMonth())
      };
      
      const weather = await getCurrentWeather(db);
      context.weather = weather;
      
      const farmingContext = await getFarmingContext(db);
      context.farming = farmingContext;
      
      const rules = await db.query(
        `SELECT id, name, conditions, action, enabled
         FROM context_rules
         WHERE enabled = 1`
      );
      
      for (const rule of rules) {
        const conditions = typeof rule.conditions === 'string' 
          ? JSON.parse(rule.conditions) 
          : rule.conditions;
        
        const shouldExecute = evaluateContextConditions(conditions, context);
        
        if (shouldExecute) {
          const result = await executeAction(rule.action, db, context);
          contextActions.executed.push({
            rule: rule.name,
            action: result,
            reason: conditions.description || 'Conditions met'
          });
          
          await db.query(
            'INSERT INTO context_executions (ruleId, executedAt, result) VALUES (?, datetime("now"), ?)',
            [rule.id, result]
          );
        } else {
          contextActions.skipped.push({
            rule: rule.name,
            reason: 'Conditions not met'
          });
        }
      }
      
      const now = new Date();
      if (context.hour >= 5 && context.hour <= 7) {
        await executeMorningRoutine(db, context);
        contextActions.executed.push({ routine: 'morning-startup' });
      }
      if (context.hour >= 22 || context.hour <= 4) {
        await executeNightMode(db);
        contextActions.executed.push({ routine: 'night-mode' });
      }
      if (weather.rain > 70) {
        await triggerRain Protocols(db);
        contextActions.executed.push({ routine: 'rain-protocol' });
      }
      
      return {
        ok: true,
        context: context,
        actions: contextActions,
        executedCount: contextActions.executed.length,
        recommendations: contextActions.executed.length > 0
          ? 'Executed ' + contextActions.executed.length + ' context-aware actions'
          : 'No context triggers',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[ContextAutomation] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    function getSeason(month) {
      if (month >= 2 && month <= 4) return 'spring';
      if (month >= 5 && month <= 7) return 'summer';
      if (month >= 8 && month <= 10) return 'fall';
      return 'winter';
    }
    
    async function getCurrentWeather(db) {
      try {
        const weather = await db.query(
          'SELECT temp, humidity, rainfall FROM weather_current ORDER BY timestamp DESC LIMIT 1'
        );
        return weather[0] || { temp: 25, humidity: 70, rain: 0 };
      } catch {
        return { temp: 25, humidity: 70, rainfall: 0 };
      }
    }
    
    async function getFarmingContext(db) {
      try {
        const crops = await db.query(
          'SELECT status, COUNT(*) as count FROM crops GROUP BY status'
        );
        const phases = {};
        for (const c of crops) {
          phases[c.status] = c.count;
        }
        return phases;
      } catch {
        return {};
      }
    }
    
    function evaluateContextConditions(conditions, context) {
      if (conditions.timeRange) {
        const [start, end] = conditions.timeRange;
        if (context.hour < start || context.hour > end) return false;
      }
      if (conditions.weekendOnly && !context.isWeekend) return false;
      if (conditions.season && conditions.season !== context.season) return false;
      if (conditions.weather && context.weather) {
        if (conditions.weather.rain && context.weather.rainfall > conditions.weather.rain) return false;
      }
      return true;
    }
    
    async function executeAction(action, db, context) {
      await db.query(
        'INSERT INTO automation_log (action, context, timestamp) VALUES (?, ?, datetime("now"))',
        [action, JSON.stringify(context)]
      );
      return 'Executed: ' + action;
    }
    
    async function executeMorningRoutine(db, context) {
      const devices = await db.query(
        'UPDATE devices SET status = "active" WHERE status = "standby" AND activeHours LIKE "%' + context.hour + '%"'
      );
    }
    
    async function executeNightMode(db) {
      await db.query(
        'UPDATE devices SET status = "low-power" WHERE status = "active"'
      );
    }
    
    async function triggerRain Protocols(db) {
      await db.query(
        'INSERT INTO events (type, data, timestamp) VALUES (?, ?, datetime("now"))',
        ['rain.protocol', JSON.stringify({ action: 'close-shutters' })]
      );
    }
  }
};