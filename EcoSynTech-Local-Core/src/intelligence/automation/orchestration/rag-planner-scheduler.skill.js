module.exports = {
  id: 'rag-planner-scheduler',
  name: 'RAG Planner and Task Scheduler',
  category: 'orchestration',
  triggers: ['schedule:1m', 'event:new-goal'],
  riskLevel: 'high',
  canAutoFix: true,
  description: 'Planning and task assignment using Retrieval Augmented Generation with learned patterns',
  ragFramework: {
    retrievalTopK: 5,
    similarityThreshold: 0.6,
    taskBankSize: 100
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    const event = ctx.event || {};
    
    const plannerStatus = {
      goalsProcessed: 0,
      tasksCreated: 0,
      learningsRetrieved: 0,
      scheduled: []
    };
    
    try {
      logger.info('[Planner] Processing goals with RAG...');
      
      const pendingGoals = await db.query(
        `SELECT id, goal, context, priority, status, deadline, createdAt
         FROM brain_goals
         WHERE status IN ('pending', 'planning')
         ORDER BY priority DESC, deadline ASC
         LIMIT 20`
      );
      
      for (const goal of pendingGoals) {
        await db.query(
          'UPDATE brain_goals SET status = ?, plannedAt = datetime("now") WHERE id = ?',
          ['planning', goal.id]
        );
        
        plannerStatus.goalsProcessed++;
        
        const similarTasks = await retrieveSimilarTasks(
          goal.goal, 
          this.ragFramework.retrievalTopK, 
          db, 
          logger
        );
        
        plannerStatus.learningsRetrieved += similarTasks.length;
        
        const context = typeof goal.context === 'string' 
          ? JSON.parse(goal.context) 
          : goal.context || {};
        
        const taskPlan = await generateTaskPlan(
          goal, 
          similarTasks, 
          context, 
          db, 
          logger
        );
        
        for (const task of taskPlan.tasks) {
          const scheduledTime = calculateScheduleTime(
            task, 
            goal.deadline, 
            taskPlan.startTime
          );
          
          await db.query(
            `INSERT INTO brain_schedule (goalId, taskId, skillId, action, params, scheduledAt, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [goal.id, task.id, task.skillId, task.action, JSON.stringify(task.params), scheduledTime, 'scheduled']
          );
          
          plannerStatus.tasksCreated++;
          plannerStatus.scheduled.push({
            task: task.action,
            scheduledAt: scheduledTime
          });
        }
        
        await db.query(
          'UPDATE brain_goals SET status = ?, taskPlan = ?, confidence = ? WHERE id = ?',
          ['planned', JSON.stringify(taskPlan), taskPlan.confidence, goal.id]
        );
        
        logger.info('[Planner] Goal ' + goal.id + ' planned with ' + taskPlan.tasks.length + ' tasks');
      }
      
      const dueTasks = await db.query(
        `SELECT bs.id, bs.skillId, bs.action, bs.params, bs.scheduledAt
         FROM brain_schedule bs
         WHERE bs.status = 'scheduled'
         AND bs.scheduledAt <= datetime("now")
         AND bs.scheduledAt > datetime("now", "-5 minutes")
         LIMIT 20`
      );
      
      for (const task of dueTasks) {
        await db.query(
          'UPDATE brain_schedule SET status = ?, executedAt = datetime("now") WHERE id = ?',
          ['executing', task.id]
        );
        
        logger.info('[Planner] Executing scheduled task: ' + task.action);
      }
      
      return {
        ok: true,
        plannerStatus: plannerStatus,
        totalTasksScheduled: plannerStatus.tasksCreated,
        learningsUsed: plannerStatus.learningsRetrieved,
        recommendations: plannerStatus.goalsProcessed > 0
          ? 'Processed ' + plannerStatus.goalsProcessed + ' goals, created ' + plannerStatus.tasksCreated + ' tasks'
          : 'No pending goals',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[Planner] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    async function retrieveSimilarTasks(query, topK, db, logger) {
      try {
        const learned = await db.query(
          `SELECT goal, solution, success, timestamp 
           FROM brain_learning 
           WHERE success > 0
           ORDER BY success DESC 
           LIMIT ?`,
          [topK]
        );
        
        const results = [];
        for (const item of learned) {
          const similarity = calculateSimilarity(query, item.goal);
          if (similarity >= 0.3) {
            results.push({ ...item, similarity });
          }
        }
        
        return results.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
      } catch (err) {
        logger.warn('[Planner] Retrieval warning:', err.message);
        return [];
      }
    }
    
    function calculateSimilarity(query1, query2) {
      const words1 = new Set(query1.toLowerCase().split(' '));
      const words2 = new Set(query2?.toLowerCase().split(' ') || []);
      
      const intersection = [...words1].filter(w => words2.has(w));
      const union = new Set([...words1, ...words2]);
      
      return intersection.length / union.size;
    }
    
    async function generateTaskPlan(goal, similarTasks, context, db, logger) {
      const taskPlan = {
        strategy: 'auto-generated',
        confidence: 0,
        tasks: [],
        startTime: new Date(),
        learnedPatterns: []
      };
      
      for (const similar of similarTasks.slice(0, 3)) {
        if (similar.solution) {
          try {
            const parsed = JSON.parse(similar.solution);
            if (parsed.tasks) {
              taskPlan.tasks.push(...parsed.tasks);
              taskPlan.learnedPatterns.push(similar.goal);
            }
          } catch {}
        }
      }
      
      if (taskPlan.tasks.length === 0) {
        taskPlan.tasks = generateDefaultTasks(goal, context);
      }
      
      taskPlan.confidence = similarTasks.length > 0 
        ? Math.min(0.9, 0.5 + (similarTasks.length * 0.15))
        : 0.4;
      
      return taskPlan;
    }
    
    function generateDefaultTasks(goal, context) {
      const taskTemplates = {
        'fix': [
          { id: 'task-1', skillId: 'cross-domain-correlation', action: 'investigate', params: {} },
          { id: 'task-2', skillId: 'autonomous-recovery-learning', action: 'fix', params: {} },
          { id: 'task-3', skillId: 'smart-alert-triage', action: 'verify', params: {} }
        ],
        'optimize': [
          { id: 'task-1', skillId: 'self-learning-anomaly-detector', action: 'analyze', params: {} },
          { id: 'task-2', skillId: 'predictive-auto-scaling', action: 'scale', params: {} },
          { id: 'task-3', skillId: 'context-aware-automation', action: 'optimize', params: {} }
        ],
        'monitor': [
          { id: 'task-1', skillId: 'threat-intelligence', action: 'monitor', params: {} },
          { id: 'task-2', skillId: 'defense-in-depth', action: 'defend', params: {} }
        ]
      };
      
      const type = goal.goal?.toLowerCase() || '';
      for (const [key, tasks] of Object.entries(taskTemplates)) {
        if (type.includes(key)) return tasks;
      }
      
      return taskTemplates['fix'];
    }
    
    function calculateScheduleTime(task, deadline, startTime) {
      if (!deadline) return new Date().toISOString();
      
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const totalMinutes = (deadlineDate - now) / 1000 / 60;
      
      const taskDelays = { 'investigate': 0.3, 'fix': 0.4, 'verify': 0.2, 'optimize': 0.1 };
      const ratio = taskDelays[task.action] || 0.3;
      
      const scheduled = new Date(now.getTime() + (totalMinutes * ratio * 60 * 1000));
      return scheduled.toISOString();
    }
  }
};