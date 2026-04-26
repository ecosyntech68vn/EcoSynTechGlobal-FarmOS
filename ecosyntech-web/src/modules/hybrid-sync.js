module.exports = {
  id: 'hybrid-sync',
  name: 'Hybrid Sync Module',
  version: '2.3.2',
  description: 'Edge SQLite + Cloud Sync - Offline-first data synchronization',
  
  config: {
    syncInterval: 300000,
    maxRetries: 3,
    retryDelay: 5000,
    batchSize: 100,
    conflictResolution: 'last-write-wins'
  },
  
  init: function(ctx) {
    this.state = {
      lastSync: null,
      pendingChanges: [],
      syncStatus: 'idle',
      offline: true,
      conflicts: [],
      stats: { uploaded: 0, downloaded: 0, conflicts: 0 }
    };
    return this;
  },
  
  isOnline: function() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },
  
  getPendingChanges: function(db, since) {
    since = since || new Date(0).toISOString();
    const changes = [];
    
    if (db && db.prepare) {
      try {
        const query = 'SELECT * FROM sync_queue WHERE timestamp > ? ORDER BY timestamp ASC LIMIT ?';
        const rows = db.prepare(query).all(since, this.config.batchSize);
        
        rows.forEach(function(row) {
          changes.push({
            id: row.id,
            table: row.table,
            operation: row.operation,
            recordId: row.record_id,
            data: JSON.parse(row.data || '{}'),
            timestamp: row.timestamp
          });
        });
      } catch (e) {
        changes.push({ error: e.message });
      }
    }
    
    return changes;
  },
  
  queueChange: function(db, table, operation, recordId, data) {
    const timestamp = new Date().toISOString();
    
    if (db && db.run) {
      try {
        const sql = 'INSERT INTO sync_queue (table, operation, record_id, data, timestamp) VALUES (?, ?, ?, ?, ?)';
        db.run(sql, [table, operation, recordId, JSON.stringify(data), timestamp]);
        
        this.state.pendingChanges.push({
          table: table,
          operation: operation,
          recordId: recordId,
          timestamp: timestamp
        });
        
        return { ok: true, queued: 1 };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    }
    
    return { ok: false, error: 'No database' };
  },
  
  sync: function(ctx) {
    const self = this;
    const db = ctx.db;
    const cloudEndpoint = ctx.config.cloudEndpoint;
    
    const result = {
      timestamp: new Date().toISOString(),
      status: 'idle',
      uploaded: 0,
      downloaded: 0,
      conflicts: 0,
      errors: []
    };
    
    if (!this.isOnline()) {
      result.status = 'offline';
      this.state.syncStatus = 'offline';
      this.state.offline = true;
      return result;
    }
    
    this.state.offline = false;
    result.status = 'syncing';
    this.state.syncStatus = 'syncing';
    
    const since = this.state.lastSync || new Date(0).toISOString();
    const changes = this.getPendingChanges(db, since);
    
    if (changes.length > 0 && cloudEndpoint) {
      let uploaded = 0;
      
      changes.forEach(function(change) {
        if (change.error) {
          result.errors.push(change.error);
          return;
        }
        
        try {
          const synced = self.uploadChange(cloudEndpoint, change);
          if (synced.ok) {
            uploaded++;
            self.markSynced(db, change.id);
          } else if (synced.conflict) {
            result.conflicts++;
            self.state.conflicts.push(change);
            self.resolveConflict(db, change, synced.serverVersion);
          }
        } catch (e) {
          result.errors.push(e.message);
        }
      });
      
      result.uploaded = uploaded;
      this.state.stats.uploaded += uploaded;
    }
    
    if (cloudEndpoint) {
      const downloaded = this.downloadChanges(cloudEndpoint, since);
      result.downloaded = downloaded.count;
      this.state.stats.downloaded += downloaded.count;
      
      if (downloaded.changes) {
        downloaded.changes.forEach(function(change) {
          self.applyChange(db, change);
        });
      }
    }
    
    result.status = 'completed';
    this.state.syncStatus = 'completed';
    this.state.lastSync = result.timestamp;
    
    return result;
  },
  
  uploadChange: function(endpoint, change) {
    return { ok: true };
  },
  
  downloadChanges: function(endpoint, since) {
    return { count: 0, changes: [] };
  },
  
  markSynced: function(db, changeId) {
    if (db && db.run) {
      try {
        db.run('DELETE FROM sync_queue WHERE id = ?', [changeId]);
      } catch (e) {}
    }
  },
  
  resolveConflict: function(db, localChange, serverVersion) {
    const resolution = this.config.conflictResolution;
    
    if (resolution === 'last-write-wins') {
      return { resolved: true, strategy: 'server-wins' };
    }
    
    return { resolved: false, strategy: resolution };
  },
  
  applyChange: function(db, change) {
    if (!db || !db.run) return { ok: false };
    
    try {
      const table = change.table;
      const recordId = change.recordId;
      const data = change.data;
      const operation = change.operation;
      
      switch (operation) {
      case 'INSERT':
        db.run('INSERT OR REPLACE INTO ' + table + ' VALUES (?, ?, ?)', [recordId, JSON.stringify(data), new Date().toISOString()]);
        break;
      case 'UPDATE':
        db.run('UPDATE ' + table + ' SET data = ?, updated = ? WHERE id = ?', [JSON.stringify(data), new Date().toISOString(), recordId]);
        break;
      case 'DELETE':
        db.run('DELETE FROM ' + table + ' WHERE id = ?', [recordId]);
        break;
      }
      
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  },
  
  getSyncStatus: function() {
    return {
      status: this.state.syncStatus,
      lastSync: this.state.lastSync,
      offline: this.state.offline,
      pendingChanges: this.state.pendingChanges.length,
      stats: this.state.stats,
      conflicts: this.state.conflicts.length
    };
  },
  
  getStats: function() {
    return {
      totalUploaded: this.state.stats.uploaded,
      totalDownloaded: this.state.stats.downloaded,
      totalConflicts: this.state.stats.conflicts,
      lastSync: this.state.lastSync,
      syncStatus: this.state.syncStatus
    };
  },
  
  run: function(ctx) {
    return this.sync(ctx);
  }
};