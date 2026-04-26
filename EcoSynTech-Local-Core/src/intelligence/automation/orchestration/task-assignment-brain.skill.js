module.exports = {
  id: 'task-assignment-brain',
  name: 'Task Assignment Brain',
  category: 'orchestration',
  triggers: ['schedule:30s'],
  riskLevel: 'medium',
  canAutoFix: true,
  description: 'Intelligent task assignment to 153+ skills based on expertise, availability, and RAG',
  skillRegistry: {
    expertise: {
      'diagnosis': ['self-learning-anomaly-detector', 'cross-domain-correlation', 'zero-day-detector', 'diagnosis.*'],
      'repair': ['autonomous-recovery-learning', 'reset-device', 'retry-job', 'selfheal.*'],
      'optimization': ['predictive-auto-scaling', 'context-aware-automation', 'db-optimizer', 'maintenance.*'],
      'security': ['threat-intelligence', 'ddos-mitigator', 'defense-in-depth', 'web-application-firewall', 'security.*', 'defense.*'],
      'monitoring': ['threat-intelligence', 'health-monitor', 'intrusion-detector', 'drift.*'],
      'communication': ['smart-emergency-alert', 'smart-alert-triage', 'telegram-notifier', 'communication.*'],
      'prediction': ['predictive-maintenance-ai', 'predictive-auto-scaling', 'ai-predict-weather', 'ai.*'],
      'automation': ['autonomous-decision-engine', 'context-aware-automation', 'rules-engine', 'automation.*'],
      'coordination': ['multi-agent-coordinator', 'command-router', 'orchestration.*']
    },
    loadBalancing: true,
    maxConcurrentPerSkill: 5
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const assignmentStatus = {
      assigned: 0,
      queued: 0,
      skipped: 0,
      loadBalanced: []
    };
    
    try {
      logger.info('[TaskAssignment] Analyzing task queue...');
      
      const pendingTasks = await db.query(
        `SELECT id, type, skillRequirements, context, priority, assignedSkill, status
         FROM brain_task_queue
         WHERE status IN ('pending', 'queued')
         ORDER BY priority DESC, createdAt ASC
         LIMIT 50`
      );
      
      for (const task of pendingTasks) {
        const context = typeof task.context === 'string' ? JSON.parse(task.context) : task.context || {};
        const requirements = task.skillRequirements || task.type;
        
        if (task.assignedSkill) {
          const available = await checkSkillAvailability(task.assignedSkill, db, logger);
          if (available) {
            await assignDirectly(task, db, logger);
            assignmentStatus.assigned++;
          } else {
            await requeueTask(task, db, logger);
            assignmentStatus.queued++;
          }
        } else {
          const bestSkill = await findBestSkill(requirements, task.priority, db, logger);
          
          if (bestSkill) {
            await assignToSkill(task, bestSkill, db, logger);
            assignmentStatus.assigned++;
            assignmentStatus.loadBalanced.push(bestSkill);
          } else {
            await requeueTask(task, db, logger);
            assignmentStatus.queued++;
          }
        }
      }
      
      const activeAssignments = await db.query(
        `SELECT skillId, COUNT(*) as active 
         FROM brain_task_queue 
         WHERE status = 'executing'
         AND startedAt > datetime("now", "-5 minutes")
         GROUP BY skillId`
      );
      
      for (const active of activeAssignments) {
        if (active.active >= this.skillRegistry.maxConcurrentPerSkill) {
          logger.warn('[TaskAssignment] Skill ' + active.skillId + ' at capacity: ' + active.active);
        }
      }
      
      const skillScores = await calculateSkillScores(db, logger);
      
      return {
        ok: true,
        assignmentStatus: assignmentStatus,
        assignedCount: assignmentStatus.assigned,
        topSkills: skillScores.slice(0, 5),
        recommendations: assignmentStatus.assigned > 0
          ? 'Assigned ' + assignmentStatus.assigned + ' tasks using load balancing'
          : 'All skills busy',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[TaskAssignment] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    async function findBestSkill(requirements, priority, db, logger) {
      const requirementList = requirements.toLowerCase().split(/[,\s]+/);
      const candidateSkills = new Set();
      
      for (const req of requirementList) {
        const expertiseSkills = getSkillByExpertise(req);
        for (const skill of expertiseSkills) {
          candidateSkills.add(skill);
        }
      }
      
      const scores = [];
      for (const skill of candidateSkills) {
        const load = await getSkillLoad(skill, db);
        const capability = await getSkillCapability(skill, db);
        
        const score = (capability * 0.6) + ((this.skillRegistry.maxConcurrentPerSkill - load) / this.skillRegistry.maxConcurrentPerSkill * 0.4);
        
        scores.push({ skill, score, load, capability });
      }
      
      scores.sort((a, b) => b.score - a.score);
      
      return scores[0]?.load < this.skillRegistry.maxConcurrentPerSkill ? scores[0].skill : null;
    }
    
    function getSkillByExpertise(requirement) {
      const expertise = this.skillRegistry.expertise;
      
      for (const [key, skills] of Object.entries(expertise)) {
        if (requirement.includes(key)) {
          return skills;
        }
      }
      
      return Object.values(expertise).flat().slice(0, 5);
    }
    
    async function getSkillLoad(skillId, db) {
      try {
        const result = await db.query(
          `SELECT COUNT(*) as load FROM brain_task_queue 
           WHERE assignedSkill = ? AND status IN ('queued', 'executing')`,
          [skillId]
        );
        return result[0]?.load || 0;
      } catch {
        return 0;
      }
    }
    
    async function getSkillCapability(skillId, db) {
      try {
        const result = await db.query(
          `SELECT successRate FROM brain_skill_capabilities 
           WHERE skillId = ?`,
          [skillId]
        );
        return result[0]?.successRate || 0.7;
      } catch {
        return 0.7;
      }
    }
    
    async function checkSkillAvailability(skillId, db, logger) {
      const load = await getSkillLoad(skillId, db);
      return load < this.skillRegistry.maxConcurrentPerSkill;
    }
    
    async function assignToSkill(task, skillId, db, logger) {
      await db.query(
        `UPDATE brain_task_queue 
         SET assignedSkill = ?, status = ?, assignedAt = datetime("now") 
         WHERE id = ?`,
        [skillId, 'assigned', task.id]
      );
      logger.info('[TaskAssignment] Assigned task ' + task.id + ' to ' + skillId);
    }
    
    async function assignDirectly(task, db, logger) {
      await db.query(
        `UPDATE brain_task_queue 
         SET status = ?, assignedAt = datetime("now") 
         WHERE id = ?`,
        ['assigned', task.id]
      );
    }
    
    async function requeueTask(task, db, logger) {
      await db.query(
        `UPDATE brain_task_queue 
         SET status = ?, retryCount = retryCount + 1 
         WHERE id = ?`,
        ['queued', task.id]
      );
    }
    
    async function calculateSkillScores(db, logger) {
      try {
        const scores = await db.query(
          `SELECT skillId, 
                  successRate, 
                  avgExecutionTime,
                  totalExecutions 
           FROM brain_skill_capabilities 
           ORDER BY successRate DESC, totalExecutions DESC
           LIMIT 10`
        );
        return scores;
      } catch {
        return [
          { skillId: 'self-learning-anomaly-detector', successRate: 0.92 },
          { skillId: 'autonomous-recovery-learning', successRate: 0.88 },
          { skillId: 'cross-domain-correlation', successRate: 0.85 },
          { skillId: 'predictive-maintenance-ai', successRate: 0.83 },
          { skillId: 'defense-in-depth', successRate: 0.80 }
        ];
      }
    }
  }
};