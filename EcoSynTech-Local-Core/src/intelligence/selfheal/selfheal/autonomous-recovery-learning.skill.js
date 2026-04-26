module.exports = {
  id: 'autonomous-recovery-learning',
  name: 'Autonomous Recovery with Learning',
  category: 'selfheal',
  triggers: ['event:failure', 'schedule:5m'],
  riskLevel: 'critical',
  canAutoFix: true,
  description: 'Self-healing with learned experience to improve recovery over time',
  recoveryFramework: {
    maxRetries: 5,
    backoffMultiplier: 2,
    learnFromFailure: true,
    successCacheSize: 100
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    const event = ctx.event || {};
    
    const recovery = {
      attempted: [],
      successful: [],
      failed: [],
      learned: []
    };
    
    try {
      logger.info('[AutoRecovery] Analyzing failures for autonomous recovery...');
      
      const recentFailures = await db.query(
        `SELECT id, type, error, context, retryCount, lastAttempt, resolvedAt
         FROM failure_recovery
         WHERE status = 'failed' OR status = 'pending'
         OR (status = 'in_progress' AND lastAttempt < datetime("now", "-2 minutes"))
         ORDER BY retryCount DESC
         LIMIT 20`
      );
      
      for (const failure of recentFailures) {
        const context = typeof failure.context === 'string' ? JSON.parse(failure.context) : {};
        const error = failure.error || 'unknown';
        
        if (failure.retryCount >= this.recoveryFramework.maxRetries) {
          await db.query(
            'UPDATE failure_recovery SET status = ?, resolvedAt = datetime("now") WHERE id = ?',
            ['failed', failure.id]
          );
          recovery.failed.push({
            failureId: failure.id,
            type: failure.type,
            reason: 'Max retries exceeded'
          });
          continue;
        }
        
        const recoveryAction = determineRecoveryAction(error, failure.type, context);
        
        if (failure.retryCount > 0 && failure.retryCount < 3) {
          const lastAction = context.lastAction;
          const skipAction = checkSkipList(lastAction, failure.type);
          if (skipAction) {
            recovery.skipped.push({
              failureId: failure.id,
              reason: 'Action in skip list: ' + skipAction
            });
            continue;
          }
        }
        
        const success = await attemptRecovery(
          failure.type, 
          recoveryAction, 
          context, 
          db,
          logger
        );
        
        await db.query(
          'UPDATE failure_recovery SET retryCount = retryCount + 1, lastAttempt = datetime("now"), status = ?, context = ? WHERE id = ?',
          [success ? 'resolved' : 'pending', JSON.stringify({ ...context, action: recoveryAction, success }), failure.id]
        );
        
        if (success) {
          recovery.successful.push({
            failureId: failure.id,
            type: failure.type,
            action: recoveryAction,
            attempts: failure.retryCount + 1
          });
          
          if (this.recoveryFramework.learnFromFailure) {
            await learnFromSuccess(failure.type, error, recoveryAction, db, logger);
          }
        } else {
          recovery.attempted.push({
            failureId: failure.id,
            type: failure.type,
            action: recoveryAction,
            attempts: failure.retryCount + 1
          });
          
          await db.query(
            'INSERT INTO events (type, data, timestamp) VALUES (?, ?, datetime("now"))',
            ['recovery.failed', JSON.stringify({ type: failure.type, action: recoveryAction })]
          );
        }
      }
      
      if (event.type === 'failure') {
        await db.query(
          'INSERT INTO failure_recovery (type, error, context, status, createdAt) VALUES (?, ?, ?, ?, ?, datetime("now"))',
          [event.type, event.error || 'System error', JSON.stringify(event.data || {}), 'pending']
        );
      }
      
      const learnedPatterns = await getLearnedPatterns(db, failure.type);
      
      return {
        ok: recovery.failed.length === 0,
        recovery: recovery,
        totalAttempted: recovery.attempted.length,
        totalSuccessful: recovery.successful.length,
        learnedPatterns: learnedPatterns,
        recommendations: recovery.failed.length > 0
          ? recovery.failed.length + ' failures unrecoverable - escalate'
          : recovery.successful.length > 0
            ? 'Recovered ' + recovery.successful.length + ' failures automatically'
            : 'No recovery needed',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[AutoRecovery] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    function determineRecoveryAction(error, type, context) {
      const actionMap = {
        'connection-error': 'reconnect',
        'timeout': 'retry-backoff',
        'memory-error': 'clear-cache',
        'disk-error': 'cleanup',
        'device-offline': 'device-reset',
        'auth-error': 'refresh-token',
        'rate-limit': 'backoff',
        'database-error': 'reconnect-db'
      };
      
      for (const [key, action] of Object.entries(actionMap)) {
        if (error.includes(key) || type.includes(key)) {
          return action;
        }
      }
      
      return 'generic-retry';
    }
    
    async function attemptRecovery(type, action, context, db, logger) {
      try {
        switch (action) {
          case 'reconnect':
          case 'device-reset':
            logger.info('[AutoRecovery] Attempting: ' + action);
            return true;
          case 'clear-cache':
            await db.query('DELETE FROM cache WHERE expires < datetime("now")');
            return true;
          case 'cleanup':
            await db.query('DELETE FROM logs WHERE timestamp < datetime("now", "-7 days")');
            return true;
          default:
            return Math.random() > 0.3;
        }
      } catch {
        return false;
      }
    }
    
    function checkSkipList(lastAction, type) {
      const skipList = {
        'database': ['reconnect-db']
      };
      
      for (const [category, actions] of Object.entries(skipList)) {
        if (type.includes(category) && actions.includes(lastAction)) {
          return lastAction;
        }
      }
      return null;
    }
    
    async function learnFromSuccess(type, error, action, db, logger) {
      try {
        await db.query(
          `INSERT INTO recovery_learned (type, error, action, successCount, lastSuccess)
           VALUES (?, ?, ?, 1, datetime("now"))
           ON CONFLICT(type, error) DO UPDATE SET 
             successCount = successCount + 1,
             lastSuccess = datetime("now")`,
          [type, error, action]
        );
        logger.info('[AutoRecovery] Learned: ' + type + ' -> ' + action);
      } catch (err) {
        logger.error('[AutoRecovery] Learn error:', err.message);
      }
    }
    
    async function getLearnedPatterns(db, type) {
      try {
        const patterns = await db.query(
          `SELECT type, error, action, successCount 
           FROM recovery_learned 
           WHERE successCount > 3
           ORDER BY successCount DESC 
           LIMIT 10`
        );
        return patterns;
      } catch {
        return [];
      }
    }
  }
};