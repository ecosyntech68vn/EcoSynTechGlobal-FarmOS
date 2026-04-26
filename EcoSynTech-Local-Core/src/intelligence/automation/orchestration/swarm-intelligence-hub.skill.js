module.exports = {
  id: 'swarm-intelligence-hub',
  name: 'Swarm Intelligence Hub',
  category: 'automation',
  triggers: ['schedule:1m', 'event:swarm-task'],
  riskLevel: 'medium',
  canAutoFix: true,
  description: 'Điều phối drone/robot swarm cho nông nghiệp - tưới, phun thuốc, giám sát',
  swarmFramework: {
    maxAgents: 50,
    coordinationMethod: 'flocking',
    taskTypes: ['spraying', 'monitoring', 'harvesting', 'seeding'],
    safetyDistance: 5
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = db || {};
    const event = ctx.event || {};
    
    const swarmStatus = {
      activeAgents: 0,
      tasks: [],
      formations: [],
      collisions: 0,
      efficiency: 0,
      recommendations: []
    };
    
    try {
      logger.info('[SwarmIntelligence] Coordinating swarm...');
      
      const agents = await getAvailableAgents(db, logger);
      swarmStatus.activeAgents = agents.length;
      
      const pendingTasks = await getPendingTasks(db, logger);
      
      for (const task of pendingTasks) {
        const assignment = await assignTaskToSwarm(task, agents, db, logger);
        
        if (assignment.success) {
          swarmStatus.tasks.push({
            taskId: task.id,
            type: task.type,
            agents: assignment.assignedAgents,
            status: 'in-progress'
          });
          
          await executeSwarmTask(task, assignment.agents, db, logger);
        }
      }
      
      const formations = await calculateFormations(agents, swarmStatus.tasks, db, logger);
      swarmStatus.formations = formations;
      
      const collisions = await detectCollisions(agents, db, logger);
      swarmStatus.collisions = collisions;
      
      swarmStatus.efficiency = calculateEfficiency(agents, swarmStatus.tasks);
      
      if (collisions > 0) {
        swarmStatus.recommendations.push({
          priority: 'high',
          action: 'Review swarm safety protocols',
          reason: collisions + ' near-collisions detected'
        });
      }
      
      if (swarmStatus.efficiency < 0.7) {
        swarmStatus.recommendations.push({
          priority: 'medium',
          action: 'Optimize task allocation',
          reason: 'Efficiency below threshold'
        });
      }
      
      return {
        ok: swarmStatus.collisions === 0,
        swarmStatus: swarmStatus,
        activeAgents: swarmStatus.activeAgents,
        tasksInProgress: swarmStatus.tasks.length,
        efficiency: swarmStatus.efficiency,
        recommendations: swarmStatus.recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[SwarmIntelligence] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    async function getAvailableAgents(db, logger) {
      try {
        const agents = await db.query(
          'SELECT * FROM swarm_agents WHERE status = "idle" LIMIT ?',
          [this.swarmFramework.maxAgents]
        );
        
        if (agents.length > 0) return agents;
      } catch {}
      
      return generateMockAgents(10);
    }
    
    function generateMockAgents(count) {
      const agents = [];
      for (let i = 0; i < count; i++) {
        agents.push({
          id: 'drone-' + i,
          type: 'drone',
          status: 'idle',
          battery: 80 + Math.random() * 20,
          position: { x: Math.random() * 100, y: Math.random() * 100 },
          capabilities: ['spraying', 'monitoring']
        });
      }
      return agents;
    }
    
    async function getPendingTasks(db, logger) {
      try {
        const tasks = await db.query(
          'SELECT * FROM swarm_tasks WHERE status = "pending" ORDER BY priority DESC LIMIT 5'
        );
        
        if (tasks.length > 0) return tasks;
      } catch {}
      
      return [
        { id: 'task-1', type: 'spraying', area: { x: 10, y: 10, width: 50, height: 50 }, priority: 1 },
        { id: 'task-2', type: 'monitoring', area: { x: 20, y: 20, width: 30, height: 30 }, priority: 2 }
      ];
    }
    
    async function assignTaskToSwarm(task, agents, db, logger) {
      const requiredAgents = getRequiredAgents(task.type);
      const suitableAgents = agents
        .filter(a => a.capabilities.includes(task.type))
        .filter(a => a.battery > 30)
        .slice(0, requiredAgents);
      
      if (suitableAgents.length < requiredAgents) {
        return { success: false, reason: 'Insufficient agents' };
      }
      
      return {
        success: true,
        assignedAgents: suitableAgents.map(a => a.id)
      };
    }
    
    function getRequiredAgents(taskType) {
      const agentRequirements = {
        'spraying': 5,
        'monitoring': 3,
        'harvesting': 8,
        'seeding': 6
      };
      
      return agentRequirements[taskType] || 3;
    }
    
    async function executeSwarmTask(task, agentIds, db, logger) {
      logger.info('[SwarmIntelligence] Executing task ' + task.id + ' with ' + agentIds.length + ' agents');
      
      const waypoints = calculateWaypoints(task.area, agentIds.length);
      
      for (let i = 0; i < agentIds.length; i++) {
        try {
          await db.query(
            'UPDATE swarm_agents SET status = ?, current_task = ?, waypoints = ? WHERE id = ?',
            ['executing', task.id, JSON.stringify(waypoints[i]), agentIds[i]]
          );
        } catch {}
      }
      
      return { status: 'completed', waypoints };
    }
    
    function calculateWaypoints(area, agentCount) {
      const waypoints = [];
      const cols = Math.ceil(Math.sqrt(agentCount));
      const rows = Math.ceil(agentCount / cols);
      
      const cellWidth = area.width / cols;
      const cellHeight = area.height / rows;
      
      for (let i = 0; i < agentCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        waypoints.push([
          { x: area.x + col * cellWidth + cellWidth / 2, y: area.y + row * cellHeight + cellHeight / 2 },
          { x: area.x + col * cellWidth + cellWidth / 3, y: area.y + row * cellHeight + cellHeight / 3 },
          { x: area.x + (col + 1) * cellWidth - cellWidth / 3, y: area.y + (row + 1) * cellHeight - cellHeight / 3 }
        ]);
      }
      
      return waypoints;
    }
    
    async function calculateFormations(agents, tasks, db, logger) {
      const formations = [];
      
      formations.push({
        type: 'line',
        description: 'Agents move in single file for monitoring',
        agents: agents.slice(0, 5).map(a => a.id)
      });
      
      formations.push({
        type: 'grid',
        description: 'Agents spread evenly for spraying',
        agents: agents.slice(5, 10).map(a => a.id)
      });
      
      formations.push({
        type: 'v-formation',
        description: 'Energy-efficient formation for long distances',
        agents: agents.slice(10).map(a => a.id)
      });
      
      return formations;
    }
    
    async function detectCollisions(agents, db, logger) {
      let collisions = 0;
      
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const distance = Math.sqrt(
            Math.pow(agents[i].position.x - agents[j].position.x, 2) +
            Math.pow(agents[i].position.y - agents[j].position.y, 2)
          );
          
          if (distance < this.swarmFramework.safetyDistance) {
            collisions++;
            
            try {
              await db.query(
                'INSERT INTO swarm_alerts (type, agents, distance, created_at) VALUES (?, ?, ?, datetime("now"))',
                ['collision-warning', JSON.stringify([agents[i].id, agents[j].id]), distance]
              );
            } catch {}
          }
        }
      }
      
      return collisions;
    }
    
    function calculateEfficiency(agents, tasks) {
      if (agents.length === 0 || tasks.length === 0) return 0;
      
      const activeAgents = agents.filter(a => a.status === 'executing').length;
      const taskCompletion = tasks.filter(t => t.status === 'completed').length / tasks.length;
      
      return (activeAgents / agents.length) * 0.7 + taskCompletion * 0.3;
    }
  }
};