module.exports = {
  version: '2.3.2',
  
  // Analytics Data
  salesData: {
    leads: [],
    quotes: [],
    orders: [],
    revenue: []
  },
  
  // Track Lead
  trackLead: function(data) {
    const lead = {
      id: 'LEAD-' + Date.now(),
      timestamp: new Date().toISOString(),
      source: data.source || 'website',
      campaign: data.campaign || null,
      ...data
    };
    this.salesData.leads.push(lead);
    return lead;
  },
  
  // Track Quote
  trackQuote: function(data) {
    const quote = {
      id: 'QT-' + Date.now(),
      timestamp: new Date().toISOString(),
      package: data.package,
      value: data.value,
      ...data
    };
    this.salesData.quotes.push(quote);
    return quote;
  },
  
  // Track Order
  trackOrder: function(data) {
    const order = {
      id: 'ORD-' + Date.now(),
      timestamp: new Date().toISOString(),
      quoteId: data.quoteId,
      value: data.value,
      status: 'new',
      customer: data.customer,
      ...data
    };
    this.salesData.orders.push(order);
    return order;
  },
  
  // Track Revenue
  trackRevenue: function(data) {
    const revenue = {
      timestamp: new Date().toISOString(),
      amount: data.amount,
      source: data.source || 'sales',
      ...data
    };
    this.salesData.revenue.push(revenue);
    return revenue;
  },
  
  // Calculate KPIs
  getKPIs: function(period = 30) {
    const cutoff = new Date(Date.now() - period * 24 * 60 * 60 * 1000);
    
    const leadsInPeriod = this.salesData.leads.filter(l => new Date(l.timestamp) > cutoff);
    const ordersInPeriod = this.salesData.orders.filter(o => new Date(o.timestamp) > cutoff);
    const revenueInPeriod = this.salesData.revenue.filter(r => new Date(r.timestamp) > cutoff);
    
    const totalRevenue = revenueInPeriod.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalOrders = ordersInPeriod.length;
    const closedOrders = ordersInPeriod.filter(o => o.status === 'closed').length;
    
    const previousPeriod = new Date(Date.now() - period * 2 * 24 * 60 * 60 * 1000);
    const prevLeads = this.salesData.leads.filter(l => {
      const d = new Date(l.timestamp);
      return d > previousPeriod && d <= cutoff;
    });
    const prevOrders = this.salesData.orders.filter(o => {
      const d = new Date(o.timestamp);
      return d > previousPeriod && d <= cutoff;
    });
    
    const leadGrowth = prevLeads.length > 0 ? 
      ((leadsInPeriod.length - prevLeads.length) / prevLeads.length * 100).toFixed(1) : 0;
    const orderGrowth = prevOrders.length > 0 ?
      ((totalOrders - prevOrders.length) / prevOrders.length * 100).toFixed(1) : 0;
    
    return {
      period: period,
      leads: {
        total: leadsInPeriod.length,
        growth: parseFloat(leadGrowth)
      },
      orders: {
        total: totalOrders,
        closed: closedOrders,
        growth: parseFloat(orderGrowth)
      },
      revenue: {
        total: totalRevenue,
        avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        growth: 0
      },
      conversion: {
        rate: leadsInPeriod.length > 0 ?
          ((closedOrders / leadsInPeriod.length) * 100).toFixed(1) : 0
      },
      cac: {
        estimate: totalRevenue > 0 && totalOrders > 0 ?
          Math.round(totalRevenue / totalOrders) : 0
      },
      ltv: {
        estimate: 0
      }
    };
  },
  
  // Sales Funnel
  getFunnel: function() {
    return {
      leads: this.salesData.leads.length,
      quotes: this.salesData.quotes.length,
      orders: this.salesData.orders.length,
      closed: this.salesData.orders.filter(o => o.status === 'closed').length
    };
  },
  
  // Product Performance
  getProductPerformance: function() {
    const products = {};
    
    this.salesData.orders.forEach(order => {
      const pkg = order.package || 'unknown';
      if (!products[pkg]) {
        products[pkg] = { orders: 0, revenue: 0 };
      }
      products[pkg].orders++;
      products[pkg].revenue += order.value || 0;
    });
    
    return products;
  },
  
  // Revenue by Period
  getRevenueByPeriod: function(granularity = 'daily') {
    const revenue = {};
    
    this.salesData.revenue.forEach(r => {
      const date = new Date(r.timestamp);
      let key;
      
      switch (granularity) {
        case 'hourly':
          key = date.toISOString().slice(0, 13) + ':00';
          break;
        case 'daily':
          key = date.toISOString().slice(0, 10);
          break;
        case 'weekly':
          const week = Math.ceil(date.getDate() / 7);
          key = date.toISOString().slice(0, 4) + '-W' + week;
          break;
        case 'monthly':
          key = date.toISOString().slice(0, 7);
          break;
        default:
          key = date.toISOString().slice(0, 10);
      }
      
      if (!revenue[key]) {
        revenue[key] = 0;
      }
      revenue[key] += r.amount || 0;
    });
    
    return revenue;
  },
  
  // Conversion Report
  getConversionReport: function() {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    
    const getStats = (from) => {
      const leads = this.salesData.leads.filter(l => l.timestamp >= from).length;
      const quotes = this.salesData.quotes.filter(q => q.timestamp >= from).length;
      const orders = this.salesData.orders.filter(o => o.timestamp >= from).length;
      return { leads, quotes, orders };
    };
    
    return {
      today: getStats(today),
      week: getStats(weekAgo),
      month: getStats(monthAgo)
    };
  },
  
  // Export Report
  exportReport: function(format = 'json') {
    const report = {
      generated: new Date().toISOString(),
      kpis: this.getKPIs(),
      funnel: this.getFunnel(),
      products: this.getProductPerformance(),
      conversion: this.getConversionReport()
    };
    
    if (format === 'csv') {
      let csv = 'Date,Leads,Quotes,Orders,Revenue\n';
      const revenue = this.getRevenueByPeriod('daily');
      Object.keys(revenue).sort().forEach(date => {
        csv += `${date},,${revenue[date]}\n`;
      });
      return csv;
    }
    
    return report;
  }
};