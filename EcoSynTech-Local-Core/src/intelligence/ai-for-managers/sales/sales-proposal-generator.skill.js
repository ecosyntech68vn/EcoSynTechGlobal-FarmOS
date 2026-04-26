class SalesProposalGeneratorSkill {
  static name = 'sales-proposal-generator';
  static description = 'Tạo proposal bán hàng tự động với AI';

  constructor() {
    this.templates = {
      standard: {
        sections: ['Executive Summary', 'Problem', 'Solution', 'Pricing', 'Timeline', 'Terms']
      }
    };
  }

  async execute(context) {
    const { customer = {}, requirements = {}, products = [] } = context;

    const analysis = this.analyzeRequirement(requirements);
    const proposal = this.generateProposal(analysis, customer, products);
    const pricing = this.calculatePricing(products, requirements);
    const timeline = this.generateTimeline(requirements);
    const documents = this.generateSupportingDocs(proposal);
    
    return {
      proposal,
      pricing,
      timeline,
      documents,
      templates: this.getTemplates(proposal)
    };
  }

  analyzeRequirement(requirements) {
    return {
      problem: requirements.problem || 'Nhu cầu kinh doanh',
      scope: requirements.scope || 'Toàn diện',
      complexity: requirements.complexity || 'medium',
      budget: requirements.budget || 50000000,
      timeline: requirements.timeline || '3 tháng',
      stakeholders: requirements.stakeholders || 3
    };
  }

  generateProposal(analysis, customer, products) {
    return {
      title: `Proposal: ${customer.company || 'Khách hàng'} - ${new Date().getFullYear()}`,
      date: new Date().toISOString().split('T')[0],
      number: 'PRO-' + Date.now(),
      
      sections: {
        executiveSummary: {
          title: 'Tóm tắt điều hành',
          content: `Chúng tôi hiểu nhu cầu của ${customer.company} về ${analysis.problem}. Giải pháp của EcoSynTech sẽ giúp quý khách đạt được mục tiêu trong ${analysis.timeline}.`
        },
        problem: {
          title: 'Vấn đề',
          content: analysis.problem,
          impact: 'Tác động đến doanh thu và hiệu suất'
        },
        solution: {
          title: 'Giải pháp',
          content: products.map(p => p.name).join(', '),
          benefits: ['Tăng hiệu suất', 'Giảm chi phí', 'Cải thiện quy trình']
        },
        approach: {
          title: 'Phương pháp tiếp cận',
          phases: [
            { name: 'Discovery', duration: '1 tuần', deliverables: ['Báo cáo'] },
            { name: 'Implementation', duration: analysis.timeline, deliverables: ['Sản phẩm'] },
            { name: 'Support', duration: ' ongoing', deliverables: ['Hỗ trợ'] }
          ]
        },
        pricing: {
          title: 'Báo giá',
          summary: this.calculateSummary(products, analysis),
          paymentTerms: ['50% trước', '50% sau']
        },
        timeline: {
          title: 'Lịch trình',
          phases: [
            { phase: 1, activity: 'Kick-off', duration: 'Tuần 1' },
            { phase: 2, activity: 'Development', duration: 'Tuần 2-' + analysis.timeline },
            { phase: 3, activity: 'Launch', duration: 'Final' }
          ]
        },
        terms: {
          title: 'Điều khoản',
          validity: '30 ngày',
          conditions: ['Thanh toán trong 30 ngày', 'Bảo hành 12 tháng']
        }
      },

      customer: {
        name: customer.name || 'Khách hàng',
        company: customer.company || 'Công ty',
        contact: customer.email || 'email@example.com'
      }
    };
  }

  calculatePricing(products, requirements) {
    const baseTotal = products.reduce((sum, p) => sum + (p.price || 10000000), 0);
    const discount = requirements.discount || 0;
    const subtotal = baseTotal * (1 - discount);
    const tax = subtotal * 0.1;
    
    return {
      items: products.map(p => ({ name: p.name, price: p.price || 10000000 })),
      subtotal,
      discount: (discount * 100).toFixed(0) + '%',
      tax,
      total: subtotal + tax,
      currency: 'VND',
      note: 'Chưa bao gồm các chi phí phát sinh'
    };
  }

  calculateSummary(products, analysis) {
    const total = products.reduce((sum, p) => sum + (p.price || 10000000), 0);
    return {
      total: total,
      breakdown: `${products.length} sản phẩm/dịch vụ`,
      scope: analysis.scope
    };
  }

  generateTimeline(requirements) {
    const months = parseInt(requirements.timeline || 3);
    return {
      totalDuration: `${months} tháng`,
      phases: [
        { phase: 1, name: 'Phân tích', duration: '2 tuần', milestone: 'Hoàn thành discovery' },
        { phase: 2, name: 'Triển khai', duration: `${months * 3 - 2} tuần`, milestone: 'Sản phẩm hoàn thành' },
        { phase: 3, name: 'Bàn giao', duration: '2 tuần', milestone: 'Go-live' }
      ],
      criticalPath: 'Triển khai'
    };
  }

  generateSupportingDocs(proposal) {
    return {
      caseStudies: [
        { title: 'Case Study: Enterprise Client', url: '/docs/case-study-1.pdf' },
        { title: 'Case Study: SMB Client', url: '/docs/case-study-2.pdf' }
      ],
      testimonials: [
        { company: 'Company A', quote: 'Great solution!', contact: 'manager@a.com' }
      ],
      capabilities: [
        { title: 'Company Profile', url: '/docs/profile.pdf' },
        { title: 'Service Overview', url: '/docs/services.pdf' }
      ]
    };
  }

  getTemplates(proposal) {
    return {
      brief: proposal.sections.executiveSummary.content,
      detailed: proposal,
      slideDeck: `/presentations/proposal-${proposal.number}.pptx`
    };
  }
}

module.exports = SalesProposalGeneratorSkill;