module.exports = {
  id: 'hybrid-sync',
  name: 'Hybrid Sync Module',
  description: 'Edge SQLite + Cloud Sync - Offline-first data synchronization với conflict resolution',
  version: '2.3.2',
  triggers: [
    'event:sync.now',
    'event:sync.status',
    'cron:5m',
    'event:online',
    'event:offline'
  ],
  riskLevel: 'medium',
  canAutoFix: true,
  
  run: function(ctx) {
    const event = ctx.event || {};
    const action = event.action || 'sync';
    const stateStore = ctx.stateStore;
    const db = ctx.db;
    
    const syncModule = ctx.hybridSync || require('../../modules/hybrid-sync.js');
    const instance = syncModule.init ? syncModule.init(ctx) : syncModule;
    
    const result = {
      ok: true,
      action: action,
      timestamp: new Date().toISOString(),
      version: '2.3.2'
    };
    
    switch (action) {
    case 'sync':
      result.sync = instance.sync(ctx);
      result.status = instance.getSyncStatus();
      break;
        
    case 'status':
      result.status = instance.getSyncStatus();
      result.stats = instance.getStats();
      break;
        
    case 'queue':
      result.queued = instance.queueChange(
        db,
        event.table || 'readings',
        event.operation || 'INSERT',
        event.recordId || event.id,
        event.data || {}
      );
      break;
        
    case 'check':
      result.online = instance.isOnline();
      result.status = instance.getSyncStatus();
      break;
        
    default:
      result.status = 'Use action: sync, status, queue, or check';
    }
    
    return result;
  },
  
  getCapabilities: function() {
    return {
      offlineFirst: true,
      conflictResolution: 'last-write-wins',
      batchSync: true,
      incrementalSync: true,
      autoSync: true,
      maxBatchSize: 100,
      syncInterval: '5 phút'
    };
  },
  
  getArchitecture: function() {
    return {
      description: 'Hybrid Edge-Cloud Architecture',
      components: {
        edge: {
          local: 'SQLite với WAL mode',
          storage: '10,000 readings/sensor max',
          offline: '100% offline-capable'
        },
        sync: {
          queue: 'sync_queue table',
          interval: '5 phút',
          batch: '100 changes per sync'
        },
        cloud: {
          endpoint: 'configurable',
          conflict: 'last-write-wins'
        }
      },
      benefits: [
        'Hoạt động 100% offline',
        'Tự động sync khi có mạng',
        'Không mất dữ liệu khi mất kết nối',
        'Phù hợp nông thôn Việt Nam'
      ]
    };
  }
};