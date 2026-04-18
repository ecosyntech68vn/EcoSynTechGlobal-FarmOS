const leadClaw = require('./lead-claw');
const productClaw = require('./product-claw');
const quoteClaw = require('./quote-claw');
const contractClaw = require('./contract-claw');
const installClaw = require('./install-claw');
const supportClaw = require('./support-claw');

module.exports = {
  version: '2.3.2',
  claws: {
    lead: leadClaw,
    product: productClaw,
    quote: quoteClaw,
    contract: contractClaw,
    install: installClaw,
    support: supportClaw
  },
  
  process: async function(stage, context) {
    const claw = this.claws[stage];
    if (!claw) {
      return { error: 'Unknown stage: ' + stage };
    }
    return claw.process(context);
  },
  
  workflow: async function(initialMessage, customerInfo) {
    const workflow = { stages: [], results: {} };
    
    const leadResult = await this.process('lead', {
      message: initialMessage,
      customer: customerInfo
    });
    workflow.stages.push('lead');
    workflow.results.lead = leadResult;
    
    const productResult = await this.process('product', {
      lead: leadResult.lead,
      ...customerInfo
    });
    workflow.stages.push('product');
    workflow.results.product = productResult;
    
    const quoteResult = await this.process('quote', {
      packageId: customerInfo.packageId || 'standard',
      ...customerInfo,
      lead: leadResult.lead
    });
    workflow.stages.push('quote');
    workflow.results.quote = quoteResult;
    
    return workflow;
  },
  
  getAvailableStages: function() {
    return Object.keys(this.claws);
  }
};