module.exports = {
  id: 'knowledge-graph-ai',
  name: 'Knowledge Graph AI',
  category: 'intelligence',
  triggers: ['schedule:5m'],
  riskLevel: 'low',
  canAutoFix: true,
  description: 'Xây dựng đồ thị tri thức liên kết tất cả entities và relationships',
  graphSchema: {
    entities: ['device', 'farm', 'crop', 'sensor', 'rule', 'alert', 'user', 'task', 'skill'],
    relationships: ['controls', 'monitors', 'triggers', 'belongs_to', 'affects', 'depends_on']
  },
  run: async function(ctx) {
    const logger = ctx.logger || console;
    const db = ctx.db;
    
    const graphStatus = {
      nodes: 0,
      edges: 0,
      insights: [],
      recommendations: []
    };
    
    try {
      logger.info('[KnowledgeGraph] Building knowledge graph...');
      
      const entities = await extractEntities(db, logger);
      graphStatus.nodes = entities.length;
      
      const relationships = await extractRelationships(entities, db, logger);
      graphStatus.edges = relationships.length;
      
      const insights = await generateInsights(entities, relationships, db, logger);
      graphStatus.insights = insights;
      
      const recommendations = await generateRecommendations(insights, db, logger);
      graphStatus.recommendations = recommendations;
      
      await storeGraph(entities, relationships, db, logger);
      
      return {
        ok: true,
        graphStatus: graphStatus,
        nodes: graphStatus.nodes,
        edges: graphStatus.edges,
        insightsCount: graphStatus.insights.length,
        recommendations: graphStatus.recommendations.slice(0, 5),
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      logger.error('[KnowledgeGraph] Error:', err.message);
      return { ok: false, error: err.message };
    }
    
    async function extractEntities(db, logger) {
      const entities = [];
      
      try {
        const devices = await db.query('SELECT id, name, type, status FROM devices LIMIT 100');
        for (const d of devices) {
          entities.push({ id: 'device:' + d.id, type: 'device', name: d.name, properties: { status: d.status, type: d.type } });
        }
      } catch {}
      
      try {
        const farms = await db.query('SELECT id, name, location FROM farms LIMIT 50');
        for (const f of farms) {
          entities.push({ id: 'farm:' + f.id, type: 'farm', name: f.name, properties: { location: f.location } });
        }
      } catch {}
      
      try {
        const crops = await db.query('SELECT id, name, stage FROM crops LIMIT 50');
        for (const c of crops) {
          entities.push({ id: 'crop:' + c.id, type: 'crop', name: c.name, properties: { stage: c.stage } });
        }
      } catch {}
      
      try {
        const sensors = await db.query('SELECT id, deviceId, type FROM sensors LIMIT 100');
        for (const s of sensors) {
          entities.push({ id: 'sensor:' + s.id, type: 'sensor', name: s.type, properties: { deviceId: s.deviceId } });
        }
      } catch {}
      
      try {
        const rules = await db.query('SELECT id, name, enabled FROM rules LIMIT 50');
        for (const r of rules) {
          entities.push({ id: 'rule:' + r.id, type: 'rule', name: r.name, properties: { enabled: r.enabled } });
        }
      } catch {}
      
      return entities;
    }
    
    async function extractRelationships(entities, db, logger) {
      const relationships = [];
      
      for (const e of entities) {
        if (e.type === 'sensor' && e.properties.deviceId) {
          relationships.push({
            from: 'device:' + e.properties.deviceId,
            to: e.id,
            type: 'has_sensor'
          });
        }
        
        if (e.type === 'device' && e.properties.farmId) {
          relationships.push({
            from: 'farm:' + e.properties.farmId,
            to: e.id,
            type: 'contains'
          });
        }
      }
      
      return relationships;
    }
    
    async function generateInsights(entities, relationships, db, logger) {
      const insights = [];
      
      const devices = entities.filter(e => e.type === 'device');
      const offlineDevices = devices.filter(d => d.properties.status === 'offline');
      
      if (offlineDevices.length > devices.length * 0.3) {
        insights.push({
          type: 'anomaly',
          message: offlineDevices.length + ' devices offline - possible network issue',
          confidence: 0.85
        });
      }
      
      const farms = entities.filter(e => e.type === 'farm');
      if (farms.length > 0 && devices.length / farms.length < 10) {
        insights.push({
          type: 'opportunity',
          message: 'Consider adding more devices per farm for efficiency',
          confidence: 0.70
        });
      }
      
      return insights;
    }
    
    async function generateRecommendations(insights, db, logger) {
      const recommendations = [];
      
      for (const insight of insights) {
        if (insight.type === 'anomaly') {
          recommendations.push('Run diagnostic on offline devices');
        }
        if (insight.type === 'opportunity') {
          recommendations.push('Scale IoT infrastructure');
        }
      }
      
      return recommendations;
    }
    
    async function storeGraph(entities, relationships, db, logger) {
      try {
        await db.query('DELETE FROM knowledge_graph_nodes');
        await db.query('DELETE FROM knowledge_graph_edges');
        
        for (const e of entities) {
          await db.query(
            'INSERT INTO knowledge_graph_nodes (id, type, name, properties) VALUES (?, ?, ?, ?)',
            [e.id, e.type, e.name, JSON.stringify(e.properties)]
          );
        }
        
        for (const r of relationships) {
          await db.query(
            'INSERT INTO knowledge_graph_edges (from_node, to_node, relationship) VALUES (?, ?, ?)',
            [r.from, r.to, r.type]
          );
        }
      } catch (err) {
        logger.warn('[KnowledgeGraph] Store warning:', err.message);
      }
    }
  }
};