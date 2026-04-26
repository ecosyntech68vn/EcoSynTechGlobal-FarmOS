/**
 * Sales Funnel Automation
 * Tự động hóa phễu bán hàng từ lead đến deal
 * 
 * CẤU HÌNH:
 * - config.stages: Các stage của phễu
 * - config.autoActions: Hành động tự động theo stage
 * - config.timings: Thời gian chuyển stage
 * 
 * CÁCH SỬ DỤNG:
 * const funnel = new SalesFunnelAutomationSkill();
 * await funnel.execute({
 *   action: 'process_lead',  // 'process_lead' | 'advance_stage' | 'get_status'
 *   lead: { id: 'xxx', email: '...' },
 *   source: 'telegram'  // 'facebook' | 'zalo' | 'website' | 'other'
 * });
 */

class SalesFunnelAutomationSkill {
  static name = 'sales-funnel-automation';
  static description = 'Tự động hóa phễu bán hàng từ lead đến deal';

  constructor() {
    this.config = {
      stages: [
        { id: 1, name: 'New Lead', color: '#3498db', duration: 0 },
        { id: 2, name: 'Contacted', color: '#9b59b6', duration: 1 },
        { id: 3, name: 'Qualified', color: '#f39c12', duration: 2 },
        { id: 4, name: 'Proposal', color: '#e67e22', duration: 3 },
        { id: 5, name: 'Negotiation', color: '#1abc9c', duration: 5 },
        { id: 6, name: 'Closed Won', color: '#27ae60', duration: 0 },
        { id: 7, name: 'Closed Lost', color: '#e74c3c', duration: 0 }
      ],
      autoActions: {
        1: [{ type: 'welcome_email', delay: 0 }],
        2: [{ type: 'schedule_call', delay: 1 }],
        3: [{ type: 'send_catalog', delay: 1 }],
        4: [{ type: 'send_proposal', delay: 2 }],
        5: [{ type: 'follow_up', delay: 3 }],
        6: [{ type: 'onboarding', delay: 1 }]
      },
      leads: new Map()
    };
  }

  async execute(context) {
    const {
      action = 'process_lead',
      lead = {},
      source = 'other',
      forceAdvance = false
    } = context;

    switch (action) {
      case 'process_lead':
        return await this.processNewLead(lead, source);
      case 'advance_stage':
        return await this.advanceStage(lead.id, forceAdvance);
      case 'get_funnel':
        return this.getFunnelStatus();
      case 'get_lead':
        return this.getLeadStatus(lead.id);
      case 'assign':
        return await this.assignLeadToStage(lead.id, lead.stage);
      default:
        return { success: false, error: `Action ${action} not supported` };
    }
  }

  // ========== PROCESS NEW LEAD ==========
  async processNewLead(lead, source) {
    const leadId = lead.id || `LEAD-${Date.now()}`;
    const now = new Date();

    const newLead = {
      id: leadId,
      name: lead.name || 'Unknown',
      email: lead.email || '',
      phone: lead.phone || '',
      source,
      stage: 1, // New Lead
      score: this.calculateScore(lead),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      history: [{
        stage: 1,
        timestamp: now.toISOString(),
        action: 'Lead created from ' + source
      }],
      nextAction: this.config.autoActions[1]?.[0]
    };

    this.config.leads.set(leadId, newLead);
    
    const actions = this.scheduleActions(newLead);

    return {
      success: true,
      lead: newLead,
      stage: this.config.stages[0],
      scheduledActions: actions,
      message: `Lead ${lead.name} added to funnel at stage "New Lead"`
    };
  }

  // ========== ADVANCE STAGE ==========
  async advanceStage(leadId, forceAdvance = false) {
    const lead = this.config.leads.get(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    const currentStageIndex = this.config.stages.findIndex(s => s.id === lead.stage);
    const nextStage = this.config.stages[currentStageIndex + 1];
    
    if (!nextStage) {
      return { success: false, error: 'Lead already at final stage' };
    }

    // Check if can advance (time-based or force)
    const daysSinceUpdate = (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    const requiredDays = this.config.stages[currentStageIndex].duration;

    if (!forceAdvance && requiredDays > 0 && daysSinceUpdate < requiredDays) {
      return {
        success: false,
        error: `Need ${requiredDays - Math.floor(daysSinceUpdate)} more days`,
        canAdvance: false
      };
    }

    // Advance
    const oldStage = lead.stage;
    lead.stage = nextStage.id;
    lead.updatedAt = new Date().toISOString();
    lead.history.push({
      stage: nextStage.id,
      timestamp: lead.updatedAt,
      action: 'Auto-advanced from stage ' + oldStage
    });
    
    lead.nextAction = this.config.autoActions[nextStage.id]?.[0];
    this.config.leads.set(leadId, lead);

    // Execute scheduled actions
    const actionsResult = await this.executeScheduledActions(lead);

    return {
      success: true,
      lead,
      previousStage: oldStage,
      currentStage: nextStage,
      scheduledActions: actionsResult,
      message: `Advanced to "${nextStage.name}"`
    };
  }

  // ========== EXECUTE SCHEDULED ACTIONS ==========
  async executeScheduledActions(lead) {
    const results = [];
    const actions = this.config.autoActions[lead.stage] || [];

    for (const action of actions) {
      results.push({
        type: action.type,
        status: 'scheduled',
        delay: action.delay
      });
    }

    return results;
  }

  // ========== ASSIGN TO STAGE ==========
  async assignLeadToStage(leadId, stageId) {
    const lead = this.config.leads.get(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    const stage = this.config.stages.find(s => s.id === stageId);
    if (!stage) {
      return { success: false, error: 'Stage not found' };
    }

    lead.stage = stageId;
    lead.updatedAt = new Date().toISOString();
    lead.history.push({
      stage: stageId,
      timestamp: lead.updatedAt,
      action: 'Manually assigned to ' + stage.name
    });
    
    this.config.leads.set(leadId, lead);

    return {
      success: true,
      lead,
      stage
    };
  }

  // ========== SCORE ==========
  calculateScore(lead) {
    let score = 50;
    if (lead.email) score += 15;
    if (lead.phone) score += 15;
    if (lead.company) score += 10;
    if (lead.source === 'ads') score += 10;
    return Math.min(100, score);
  }

  // ========== SCHEDULE ACTIONS ==========
  scheduleActions(lead) {
    const actions = this.config.autoActions[lead.stage] || [];
    return actions.map(a => ({
      type: a.type,
      dueIn: a.delay + ' days'
    }));
  }

  // ========== GET FUNNEL STATUS ==========
  getFunnelStatus() {
    const byStage = {};
    this.config.stages.forEach(s => {
      byStage[s.id] = {
        ...s,
        count: 0,
        value: 0
      };
    });

    this.config.leads.forEach(lead => {
      if (byStage[lead.stage]) {
        byStage[lead.stage].count++;
      }
    });

    return {
      stages: Object.values(byStage),
      total: this.config.leads.size,
      conversion: this.calculateConversion()
    };
  }

  // ========== LEAD STATUS ==========
  getLeadStatus(leadId) {
    const lead = this.config.leads.get(leadId);
    if (!lead) {
      return { success: false, error: 'Lead not found' };
    }

    const stage = this.config.stages.find(s => s.id === lead.stage);
    return {
      success: true,
      lead,
      stage,
      nextAction: lead.nextAction
    };
  }

  // ========== CONVERSION ==========
  calculateConversion() {
    const total = this.config.leads.size;
    const won = Array.from(this.config.leads.values()).filter(l => l.stage === 6).length;
    const lost = Array.from(this.config.leads.values()).filter(l => l.stage === 7).length;
    
    return {
      won: won,
      lost: lost,
      rate: total > 0 ? ((won / total) * 100).toFixed(1) + '%' : '0%'
    };
  }
}

module.exports = SalesFunnelAutomationSkill;