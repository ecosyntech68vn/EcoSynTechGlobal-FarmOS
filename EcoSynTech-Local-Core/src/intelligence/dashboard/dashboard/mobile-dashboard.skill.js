module.exports = {
  id: 'mobile-dashboard',
  name: 'PWA Mobile Dashboard',
  description: 'Mobile Dashboard for Farmers - Quick access, offline-first, Vietnamese UI',
  version: '2.3.2',
  triggers: [
    'event:dashboard.show',
    'event:dashboard.refresh',
    'cron:1m'
  ],
  riskLevel: 'low',
  canAutoFix: false,
  
  run: function(ctx) {
    const event = ctx.event || {};
    const action = event.action || 'dashboard';
    const stateStore = ctx.stateStore;
    
    const result = {
      ok: true,
      action: action,
      timestamp: new Date().toISOString(),
      version: '2.3.2'
    };
    
    switch (action) {
    case 'dashboard':
      result.dashboard = this.getDashboard(stateStore);
      break;
        
    case 'summary':
      result.summary = this.getSummary(stateStore);
      break;
        
    case 'alerts':
      result.alerts = this.getAlerts(stateStore);
      break;
        
    case 'sensors':
      result.sensors = this.getSensors(stateStore);
      break;
        
    case 'stats':
      result.stats = this.getStats(stateStore);
      break;
        
    case 'recommendations':
      result.recommendations = this.getRecommendations(stateStore);
      break;
        
    default:
      result.dashboard = this.getDashboard(stateStore);
    }
    
    return result;
  },
  
  getDashboard: function(stateStore) {
    return {
      title: 'EcoSynTech - Dashboard Nông Trại',
      version: '2.3.2',
      widgets: [
        { type: 'weather', label: 'Thời tiết', icon: '🌤️' },
        { type: 'soil', label: 'Độ ẩm đất', icon: '💧' },
        { type: 'temp', label: 'Nhiệt độ', icon: '🌡️' },
        { type: 'humidity', label: 'Độ ẩm không khí', icon: '💨' },
        { type: 'light', label: 'Ánh sáng', icon: '☀️' },
        { type: 'alerts', label: 'Cảnh báo', icon: '⚠️', badge: 0 }
      ],
      quickActions: [
        { action: 'pump.on', label: 'Bật máy bơm', icon: '💦' },
        { action: 'fan.on', label: 'Bật quạt', icon: '🌀' },
        { action: 'light.on', label: 'Bật đèn', icon: '💡' },
        { action: 'fertilizer', label: 'Bón phân', icon: '🌱' },
        { action: 'irrigate', label: 'Tưới nước', icon: '🚿' }
      ],
      navigation: [
        { path: '/dashboard', label: 'Tổng quan', icon: '🏠' },
        { path: '/sensors', label: 'Cảm biến', icon: '📡' },
        { path: '/devices', label: 'Thiết bị', icon: '🔌' },
        { path: '/history', label: 'Lịch sử', icon: '📊' },
        { path: '/settings', label: 'Cài đặt', icon: '⚙️' }
      ]
    };
  },
  
  getSummary: function(stateStore) {
    const sensors = stateStore ? stateStore.get('sensors_summary') : null;
    
    return {
      totalSensors: sensors ? sensors.count : 0,
      onlineSensors: sensors ? sensors.online : 0,
      alerts: sensors ? sensors.alerts : 0,
      lastUpdate: new Date().toISOString(),
      status: 'normal'
    };
  },
  
  getAlerts: function(stateStore) {
    const alerts = stateStore ? stateStore.get('alerts') : [];
    
    return {
      count: alerts.length,
      items: alerts.slice(0, 10),
      timestamp: new Date().toISOString()
    };
  },
  
  getSensors: function(stateStore) {
    const sensors = stateStore ? stateStore.get('sensors') : [];
    
    return {
      count: sensors.length,
      items: sensors.slice(0, 20),
      timestamp: new Date().toISOString()
    };
  },
  
  getStats: function(stateStore) {
    return {
      uptime: '24h',
      syncStatus: 'online',
      lastSync: new Date().toISOString(),
      dataPoints: 1000,
      timestamp: new Date().toISOString()
    };
  },
  
  getRecommendations: function(stateStore) {
    const recommendations = [
      { type: 'water', message: 'Độ ẩm đất thấp - nên tưới nước', priority: 'high' },
      { type: 'fertilizer', message: 'Cần bón phân cho cây trồng', priority: 'medium' },
      { type: 'weather', message: 'Dự báo mưa - chuẩn bị thu hoạch', priority: 'low' }
    ];
    
    return {
      count: recommendations.length,
      items: recommendations,
      timestamp: new Date().toISOString()
    };
  },
  
  getUIMobile: function() {
    return {
      layout: 'mobile-first',
      theme: 'light',
      language: 'vi',
      colors: {
        primary: '#2E7D32',
        secondary: '#43A047',
        accent: '#81C784',
        warning: '#FFA726',
        danger: '#EF5350',
        background: '#F5F5F5'
      },
      fonts: {
        primary: 'Roboto, sans-serif',
        size: { base: '16px', large: '20px', small: '12px' }
      },
      offlineMode: true,
      pwa: {
        manifest: '/manifest.json',
        serviceWorker: '/sw.js',
        installable: true
      }
    };
  }
};