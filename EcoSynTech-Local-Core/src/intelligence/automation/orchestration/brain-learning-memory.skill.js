module.exports = {
  id: 'brain-learning-memory',
  name: 'Brain Learning and Memory System',
  category: 'orchestration',
  triggers: ['schedule:5m', 'event:completion'],
  riskLevel: 'low',
  canAutoFix: true,
  description: 'Learning from successes/failures, updating skill capabilities, building memory',
  memory: {
    shortTermSize: 1000,
    longTermThreshold: 5,
    consolidationInterval: 60,
    importanceThreshold: 0.7
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    const event = ctx.event || {};
    
    const memoryStatus = {
      learned: 0,
      consolidated: 0,
      memorySize: 0,
      patternsIdentified: 0
    };
    
    try {
      logger.info('[BrainMemory] Processing learning and memory...');
      
      const recentResults = await db.query(
        `SELECT id, type, context, result, success, timestamp
         FROM brain_memory
         WHERE timestamp > datetime("now", "-1 hour")
         ORDER BY timestamp DESC
         LIMIT 50`
      );
      
      for (const result of recentResults) {
        if (!result.success) {
          await learnFromFailure(result, db, logger);
        } else {
          await learnFromSuccess(result, db, logger);
        }
        memoryStatus.learned++;
      }
      
      const skillStats = await db.query(
        `SELECT skillId, 
                SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
                COUNT(*) as total,
                AVG(executionTime) as avgTime
         FROM brain_memory
         WHERE timestamp > datetime("now", "-7 days")
         GROUP BY skillId`
      );
      
      for (const stat of skillStats) {
        const successRate = stat.total > 0 ? stat.successes / stat.total : 0;
        
        await db.query(
          `INSERT INTO brain_skill_capabilities (skillId, successRate, avgExecutionTime, totalExecutions, lastUpdated)
           VALUES (?, ?, ?, ?, datetime("now"))
           ON CONFLICT(skillId) DO UPDATE SET 
             successRate = ?,
             avgExecutionTime = ?,
             totalExecutions = totalExecutions + ?,
             lastUpdated = datetime("now")`,
          [stat.skillId, successRate, stat.avgTime, stat.total, successRate, stat.avgTime, stat.total]
        );
      }
      
      memoryStatus.memorySize = recentResults.length;
      
      const patterns = await identifyPatterns(db, logger);
      memoryStatus.patternsIdentified = patterns.length;
      
      for (const pattern of patterns) {
        await storeLongTerm(pattern, db, logger);
        memoryStatus.consolidated++;
      }
      
      await pruneOldMemory(db, logger);
      
      return {
        ok: true,
        memoryStatus: memoryStatus,
        learnedCount: memoryStatus.learned,
        consolidatedCount: memoryStatus.consolidated,
        patternsDetected: memoryStatus.patternsIdentified,
        recommendations: memoryStatus.learned > 0
          ? 'Learned from ' + memoryStatus.learned + ' results, identified ' + memoryStatus.patternsIdentified + ' patterns'
          : 'Memory stable',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[BrainMemory] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    async function learnFromSuccess(result, db, logger) {
      const importance = calculateImportance(result, true);
      
      if (importance >= this.memory.importanceThreshold) {
        await db.query(
          `INSERT INTO brain_long_term (type, context, pattern, importance, successCount, timestamp)
           VALUES (?, ?, ?, ?, 1, datetime("now"))
           ON CONFLICT(type, context) DO UPDATE SET 
             successCount = successCount + 1,
             importance = MAX(importance, importance),
             lastSuccess = datetime("now")`,
          [result.type, result.context, result.result, importance]
        );
        
        logger.info('[BrainMemory] Learned: ' + result.type + ' (importance: ' + importance.toFixed(2) + ')');
      }
    }
    
    async function learnFromFailure(result, db, logger) {
      const context = typeof result.context === 'string' ? JSON.parse(result.context) : result.context || {};
      
      await db.query(
        `INSERT INTO brain_learning (problemType, failCount, lastFailure, timestamp)
         VALUES (?, 1, datetime("now"), datetime("now"))
         ON CONFLICT(problemType) DO UPDATE SET 
           failCount = failCount + 1,
           lastFailure = datetime("now")`,
        [result.type]
      );
      
      if (context.lastAction) {
        logger.warn('[BrainMemory] Failure from: ' + context.lastAction);
      }
    }
    
    function calculateImportance(result, success) {
      let importance = 0.5;
      
      if (result.type?.includes('critical') || result.type?.includes('security')) {
        importance += 0.3;
      }
      
      const context = typeof result.context === 'string' ? JSON.parse(result.context) : {};
      if (context.repeated) importance += 0.1;
      if (context.affectsUsers) importance += 0.1;
      
      return Math.min(1, importance);
    }
    
    async function identifyPatterns(db, logger) {
      const patterns = [];
      
      try {
        const freqPatterns = await db.query(
          `SELECT type, COUNT(*) as count, AVG(success) as avgSuccess
           FROM brain_memory
           WHERE timestamp > datetime("now", "-24 hours")
           GROUP BY type
           HAVING count >= 3`
        );
        
        for (const p of freqPatterns) {
          if (p.count >= 5 || p.avgSuccess > 0.8) {
            patterns.push({
              type: 'frequency',
              pattern: p.type,
              occurrences: p.count,
              successRate: p.avgSuccess
            });
          }
        }
        
        const timePatterns = await db.query(
          `SELECT strftime('%H', timestamp) as hour, 
                  COUNT(*) as count
           FROM brain_memory
           WHERE timestamp > datetime("now", "-24 hours")
           GROUP BY hour
           HAVING count > 10`
        );
        
        for (const p of timePatterns) {
          patterns.push({
            type: 'time-based',
            pattern: 'hour-' + p.hour,
            occurrences: p.count
          });
        }
      } catch (err) {
        logger.warn('[BrainMemory] Pattern warning:', err.message);
      }
      
      return patterns;
    }
    
    async function storeLongTerm(pattern, db, logger) {
      try {
        await db.query(
          `INSERT INTO brain_long_term (type, pattern, importance, successCount, timestamp)
           VALUES (?, ?, ?, ?, datetime("now"))
           ON CONFLICT(type, pattern) DO UPDATE SET 
             successCount = successCount + ?`,
          [pattern.type, JSON.stringify(pattern), pattern.occurrences || 1, pattern.successRate || 0.5, 1]
        );
      } catch (err) {
        logger.warn('[BrainMemory] Store warning:', err.message);
      }
    }
    
    async function pruneOldMemory(db, logger) {
      try {
        const deleted = await db.query(
          `DELETE FROM brain_memory 
           WHERE timestamp < datetime("now", "-30 days")
           AND id NOT IN (
             SELECT id FROM brain_memory 
             ORDER BY timestamp DESC LIMIT ?)`,
          [this.memory.shortTermSize]
        );
        
        if (deleted.length > 0) {
          logger.info('[BrainMemory] Pruned ' + deleted.length + ' old memories');
        }
      } catch (err) {
        logger.warn('[BrainMemory] Prune warning:', err.message);
      }
    }
  }
};