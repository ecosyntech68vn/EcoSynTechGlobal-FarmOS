const leadClaw = require('../skills/sales/lead-claw');
const productClaw = require('../skills/sales/product-claw');
const quoteClaw = require('../skills/sales/quote-claw');
const contractClaw = require('../skills/sales/contract-claw');
const installClaw = require('../skills/sales/install-claw');
const supportClaw = require('../skills/sales/support-claw');

module.exports = {
  version: '2.3.2',
  
  sessions: new Map(),
  leads: new Map(),
  quotes: new Map(),
  contracts: new Map(),
  tickets: new Map(),
  
  async processLead(context) {
    const result = leadClaw.process(context);
    this.leads.set(result.lead.id, result);
    this.createSession(result.lead.id, 'lead');
    return result;
  },
  
  async processProduct(context) {
    const lead = this.findLead(context.leadId);
    context.lead = lead?.lead || {};
    const result = productClaw.process(context);
    if (lead) {
      lead.productResult = result;
      lead.stage = 'product';
      this.updateSession(lead.lead.id, result);
    }
    return result;
  },
  
  async processQuote(context) {
    const lead = this.findLead(context.leadId);
    context.lead = lead?.lead || {};
    const result = quoteClaw.process(context);
    this.quotes.set(result.quote.id, result);
    if (lead) {
      lead.quoteResult = result;
      lead.stage = 'quote';
    }
    return result;
  },
  
  async processContract(context) {
    const quote = this.findQuote(context.quoteId);
    context.quote = quote?.quote || context;
    const result = contractClaw.process(context);
    this.contracts.set(result.contract.number, result);
    if (quote) {
      quote.contractResult = result;
      quote.stage = 'contract';
    }
    return result;
  },
  
  async processInstall(context) {
    const contract = this.findContract(context.contractId);
    context.contract = contract?.contract || context;
    const result = installClaw.process(context);
    return result;
  },
  
  async processSupport(context) {
    const result = supportClaw.process(context);
    this.tickets.set(result.ticket.id, result);
    return result;
  },
  
  async processChat(context) {
    let session = this.sessions.get(context.sessionId);
    
    if (!session) {
      const leadResult = await this.processLead({
        message: context.message,
        customer: { id: context.customerId }
      });
      session = { leadId: leadResult.lead.id, stage: 'lead' };
      this.sessions.set(context.sessionId, session);
    }
    
    const msg = context.message.toLowerCase();
    let response = null;
    
    if (msg.includes('giá') || msg.includes('bao nhiêu') || msg.includes('price')) {
      response = await this.processProduct({
        leadId: session.leadId,
        farmSize: 1000,
        cropType: 'vegetables'
      });
      session.stage = 'product';
    } else if (msg.includes('mua') || msg.includes('đặt') || msg.includes('purchase')) {
      response = await this.processQuote({
        leadId: session.leadId,
        packageId: 'standard',
        farmSize: 1000,
        cropType: 'vegetables'
      });
      session.stage = 'quote';
    } else if (msg.includes('cài') || msg.includes('cài đặt') || msg.includes('install')) {
      response = await this.processInstall({});
      session.stage = 'install';
    } else if (msg.includes('lỗi') || msg.includes('hỏng') || msg.includes('support')) {
      response = await this.processSupport({
        issue: context.message
      });
      session.stage = 'support';
    } else {
      response = { message: 'Anh/chị cần em hỗ trợ gì ạ?' };
    }
    
    this.sessions.set(context.sessionId, session);
    return response;
  },
  
  findLead(leadId) {
    for (const [id, data] of this.leads) {
      if (id === leadId || data.lead?.id === leadId) return data;
    }
    return null;
  },
  
  findQuote(quoteId) {
    for (const [id, data] of this.quotes) {
      if (id === quoteId || data.quote?.id === quoteId) return data;
    }
    return null;
  },
  
  findContract(contractId) {
    for (const [id, data] of this.contracts) {
      if (id === contractId || data.contract?.number === contractId) return data;
    }
    return null;
  },
  
  createSession(leadId, stage) {
    const sessionId = 'SESS-' + Date.now();
    this.sessions.set(sessionId, { leadId, stage });
    return sessionId;
  },
  
  updateSession(leadId, data) {
    for (const [sessionId, session] of this.sessions) {
      if (session.leadId === leadId) {
        this.sessions.set(sessionId, { ...session, ...data });
        break;
      }
    }
  },
  
  getStats() {
    return {
      version: this.version,
      leads: this.leads.size,
      quotes: this.quotes.size,
      contracts: this.contracts.size,
      tickets: this.tickets.size,
      sessions: this.sessions.size
    };
  }
};