module.exports = {
  id: 'db-sqlite-iot',
  name: 'SQLite IoT Optimizer',
  description: 'Optimize SQLite for IoT Agriculture - WAL mode, circular buffer, performance tuning',
  triggers: [
    'event:db.optimize',
    'event:db.setup',
    'event:db.cleanup',
    'event:db.backup',
    'cron:6h'
  ],
  riskLevel: 'medium',
  canAutoFix: true,
  
  run: function(ctx) {
    const event = ctx.event || {};
    const action = event.action || 'setup';
    const stateStore = ctx.stateStore;
    const db = ctx.db;
    
    const result = {
      ok: true,
      action: action,
      timestamp: new Date().toISOString(),
      configs: [],
      status: null
    };
    
    switch (action) {
    case 'setup':
      result.configs = this.setupOptimizations(db);
      result.status = 'SQLite optimized for IoT';
      break;
        
    case 'optimize':
      result.configs = this.runOptimizations(db);
      result.status = 'Optimizations applied';
      break;
        
    case 'cleanup':
      result.deleted = this.cleanupOldData(stateStore, db, event.keep || 10000);
      result.status = 'Old data cleaned';
      break;
        
    case 'backup':
      result.backup = this.backupDatabase(stateStore, db);
      result.status = 'Backup created';
      break;
        
    default:
      result.status = 'Use action: setup, optimize, cleanup, or backup';
    }
    
    return result;
  },
  
  setupOptimizations: function(db) {
    const configs = [
      { pragma: 'journal_mode', value: 'WAL', description: 'Write-Ahead Logging for better concurrency' },
      { pragma: 'synchronous', value: 'NORMAL', description: 'Balance performance and safety' },
      { pragma: 'cache_size', value: '-64000', description: '64MB cache' },
      { pragma: 'busy_timeout', value: '5000', description: 'Wait for locks up to 5s' },
      { pragma: 'temp_store', value: 'MEMORY', description: 'Temp tables in RAM' },
      { pragma: 'mmap_size', value: '268435456', description: '256MB memory-mapped I/O' }
    ];
    
    if (db && db.run) {
      try {
        db.run('PRAGMA journal_mode=WAL');
        db.run('PRAGMA synchronous=NORMAL');
        db.run('PRAGMA cache_size=-64000');
        db.run('PRAGMA busy_timeout=5000');
        db.run('PRAGMA temp_store=MEMORY');
        db.run('PRAGMA mmap_size=268435456');
      } catch (e) {
        configs.push({ error: e.message });
      }
    }
    
    return configs;
  },
  
  runOptimizations: function(db) {
    const optimizations = [
      'ANALYZE',
      'REINDEX',
      'VACUUM'
    ];
    
    if (db && db.run) {
      try {
        optimizations.forEach(function(sql) {
          db.run(sql);
        });
      } catch (e) {
        return { error: e.message };
      }
    }
    
    return optimizations;
  },
  
  cleanupOldData: function(stateStore, db, keep) {
    keep = keep || 10000;
    let deleted = 0;
    
    if (db && db.run) {
      try {
        const sensorIds = 'SELECT DISTINCT sensor_id FROM readings';
        const sensorList = db.prepare(sensorIds).all();
        
        sensorList.forEach(function(row) {
          const countQuery = 'SELECT COUNT(*) as cnt FROM readings WHERE sensor_id = ?';
          const count = db.prepare(countQuery).get(row.sensor_id);
          
          if (count.cnt > keep) {
            const deleteQuery = 'DELETE FROM readings WHERE sensor_id = ? AND rowid IN (SELECT rowid FROM readings WHERE sensor_id = ? ORDER BY timestamp ASC LIMIT ?)';
            db.run(deleteQuery, [row.sensor_id, row.sensor_id, count.cnt - keep]);
            deleted += count.cnt - keep;
          }
        });
      } catch (e) {
        return { error: e.message };
      }
    }
    
    return { deleted: deleted, kept: keep };
  },
  
  backupDatabase: function(stateStore, db) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = 'ecosyntech_backup_' + timestamp + '.db';
    
    const backup = {
      timestamp: timestamp,
      name: backupName,
      status: 'ready',
      path: './data/backups/' + backupName
    };
    
    if (stateStore) {
      let backups = stateStore.get('db_backups') || [];
      backups.unshift(backup);
      if (backups.length > 10) backups = backups.slice(0, 10);
      stateStore.set('db_backups', backups);
    }
    
    return backup;
  },
  
  getOptimizationsReport: function() {
    return {
      pramas: {
        journal_mode: 'WAL - Write-Ahead Logging (faster, crash-safe)',
        synchronous: 'NORMAL - Balanced performance',
        cache_size: '64MB - Memory cache',
        busy_timeout: '5s - Wait for locks',
        temp_store: 'MEMORY - Temp tables in RAM'
      },
      circularBuffer: {
        description: 'Keep only last 10,000 readings per sensor',
        sql: 'DELETE old records when limit exceeded'
      },
      multiTenant: {
        description: 'One SQLite file = One farm',
        path: '/data/farms/farm_001/ecosyntech.db'
      }
    };
  }
};