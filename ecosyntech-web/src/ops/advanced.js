const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function TelegramNotifier(config) {
  const botToken = (config && config.botToken) ? config.botToken : null;
  const chatId = (config && config.chatId) ? config.chatId : null;
  const enabled = botToken && chatId;

  function send(message, parseMode) {
    if (!enabled) return Promise.resolve({ ok: false, error: 'Not configured' });

    const url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
    const body = {
      chat_id: chatId,
      text: message,
      parse_mode: parseMode || 'HTML',
      disable_web_page_preview: true
    };

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function(res) {
      return res.json();
    }).catch(function(err) {
      return { ok: false, error: err.message };
    });
  }

  function sendAlert(alert, severity) {
    const emoji = severity === 'critical' ? '🔴' : (severity === 'high' ? '🟠' : '🟡');
    const msg = emoji + ' <b>ALERT</b>\n' +
      '<code>' + (alert.type || 'Unknown') + '</code>\n' +
      (alert.message || '') + '\n' +
      '<pre>' + JSON.stringify(alert, null, 2) + '</pre>';
    return send(msg);
  }

  function sendIncident(incident, action) {
    const msg = '⚠️ <b>INCIDENT</b>\n' +
      'ID: <code>' + incident.id + '</code>\n' +
      'Action: ' + action + '\n' +
      'Time: ' + new Date().toISOString();
    return send(msg);
  }

  function sendRecovery(action, status) {
    const emoji = status === 'success' ? '✅' : '❌';
    const msg = emoji + ' <b>RECOVERY</b>\n' +
      'Action: ' + action + '\n' +
      'Status: ' + status;
    return send(msg);
  }

  function sendHealthCheck(checks) {
    let msg = '📊 <b>HEALTH CHECK</b>\n';
    for (const key in checks) {
      const status = checks[key] ? '🟢' : '🔴';
      msg += status + ' ' + key + ': ' + checks[key] + '\n';
    }
    return send(msg);
  }

  return {
    send: send,
    sendAlert: sendAlert,
    sendIncident: sendIncident,
    sendRecovery: sendRecovery,
    sendHealthCheck: sendHealthCheck,
    get enabled() { return enabled; }
  };
}

function RootCauseAnalyzer(stateStore, logger) {
  function analyze(error, context) {
    const hints = [];
    let severity = 'low';
    let confidence = 0;

    const errorStr = String(error).toLowerCase();
    const contextStr = JSON.stringify(context || {}).toLowerCase();

    if (errorStr.indexOf('database') !== -1 || errorStr.indexOf('sql') !== -1) {
      hints.push('Check DB connection, query syntax, migration pending');
      confidence += 0.8;
      severity = 'high';
    }

    if (errorStr.indexOf('mqtt') !== -1 || errorStr.indexOf('connection') !== -1) {
      if (contextStr.indexOf('mqtt') !== -1) {
        hints.push('Check MQTT broker, network, firewall, TLS cert');
        confidence += 0.9;
      }
    }

    if (errorStr.indexOf('websocket') !== -1 || errorStr.indexOf('ws') !== -1) {
      hints.push('Check WS connection, ping timeout, auth token expired');
      confidence += 0.7;
    }

    if (errorStr.indexOf('memory') !== -1 || errorStr.indexOf('heap') !== -1) {
      hints.push('Memory leak detected, check allocations, restart may be needed');
      severity = 'critical';
      confidence += 0.9;
    }

    if (errorStr.indexOf('timeout') !== -1) {
      hints.push('Operation timeout, check network latency, resource contention');
      confidence += 0.6;
    }

    if (errorStr.indexOf('permission') !== -1 || errorStr.indexOf('access') !== -1) {
      hints.push('Permission denied, check RBAC, file system permissions');
      severity = 'high';
      confidence += 0.8;
    }

    if (errorStr.indexOf('jwt') !== -1 || errorStr.indexOf('token') !== -1) {
      hints.push('Auth token expired/invalid, check token refresh logic');
      confidence += 0.7;
    }

    if (contextStr.indexOf('device') !== -1) {
      hints.push('Device offline, check connectivity, firmware version');
      hints.push('Consider device reset or OTA rollback');
    }

    if (confidence < 0.5 && hints.length === 0) {
      hints.push('Unknown error, manual investigation required');
    }

    return {
      error: String(error),
      hints: hints,
      severity: severity,
      confidence: Math.min(confidence, 1),
      analyzedAt: new Date().toISOString()
    };
  }

  function getSimilarIncidents(type, limit) {
    const alerts = stateStore.get('alerts') || [];
    const similar = [];
    for (let i = 0; i < alerts.length; i++) {
      if (alerts[i].signature && alerts[i].signature.indexOf(type) !== -1) {
        similar.push(alerts[i]);
      }
    }
    return similar.slice(0, limit || 10);
  }

  return {
    analyze: analyze,
    getSimilarIncidents: getSimilarIncidents
  };
}

function AutoBackup(config, logger) {
  const backupDir = (config && config.backupDir) ? config.backupDir : path.join(process.cwd(), 'data', 'backups');
  const maxBackups = (config && config.maxBackups) ? config.maxBackups : 10;

  function createBackup(label) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, 'backup-' + timestamp + '-' + (label || 'manual') + '.json');

    try {
      fs.mkdirSync(backupDir, { recursive: true });

      const backupData = {
        timestamp: new Date().toISOString(),
        label: label || 'auto',
        version: require('./package.json').version,
        state: {
          beats: null,
          alerts: [],
          incidents: []
        }
      };

      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

      cleanupOldBackups();

      if (logger && logger.info) {
        logger.info('[Backup] Created: ' + backupFile);
      }

      return { ok: true, file: backupFile, timestamp: backupData.timestamp };
    } catch (err) {
      if (logger && logger.error) {
        logger.error('[Backup] Failed: ' + err.message);
      }
      return { ok: false, error: err.message };
    }
  }

  function restoreFromBackup(backupFile) {
    try {
      if (!fs.existsSync(backupFile)) {
        return { ok: false, error: 'File not found' };
      }

      const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

      if (logger && logger.info) {
        logger.info('[Backup] Restored from: ' + backupFile);
      }

      return { ok: true, data: data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  function restoreFromLatest() {
    const files = listBackups();
    if (files.length === 0) {
      return { ok: false, error: 'No backups found' };
    }
    return restoreFromBackup(files[0]);
  }

  function listBackups() {
    try {
      if (!fs.existsSync(backupDir)) return [];
      let files = fs.readdirSync(backupDir);
      files = files.filter(function(f) { return f.endsWith('.json'); });
      files = files.map(function(f) { return path.join(backupDir, f); });
      files.sort().reverse();
      return files;
    } catch (_) {
      return [];
    }
  }

  function cleanupOldBackups() {
    const files = listBackups();
    while (files.length > maxBackups) {
      const oldest = files.pop();
      try {
        fs.unlinkSync(oldest);
        if (logger && logger.info) {
          logger.info('[Backup] Deleted old: ' + oldest);
        }
      } catch (_) {}
    }
  }

  function getBackupInfo() {
    const files = listBackups();
    return {
      count: files.length,
      latest: files[0] || null,
      directory: backupDir,
      max: maxBackups
    };
  }

  return {
    createBackup: createBackup,
    restoreFromBackup: restoreFromBackup,
    restoreFromLatest: restoreFromLatest,
    listBackups: listBackups,
    getBackupInfo: getBackupInfo
  };
}

function VulnerabilityScanner(logger) {
  const knownPatterns = [
    { pattern: /eval\s*\(/, severity: 'high', name: 'Code injection risk (eval)' },
    { pattern: /exec\s*\(/, severity: 'high', name: 'Command injection risk (exec)' },
    { pattern: /password\s*=\s*['"][^'"]+['"]/, severity: 'medium', name: 'Hardcoded password' },
    { pattern: /secret\s*=\s*['"][^'"]+['"]/, severity: 'medium', name: 'Hardcoded secret' },
    { pattern: /WHERE.*=\s*['"][^'"]*['"]/i, severity: 'medium', name: 'SQL injection risk' },
    { pattern: /\.join\s*\([^,)]+\)/, severity: 'low', name: 'Path traversal risk' },
    { pattern: /process\.env\.[A-Z_]+/, severity: 'low', name: 'Sensitive env access' }
  ];

  function scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const findings = [];

      for (let i = 0; i < knownPatterns.length; i++) {
        const p = knownPatterns[i];
        const match = content.match(p.pattern);
        if (match) {
          findings.push({
            pattern: p.name,
            severity: p.severity,
            line: content.substring(0, match.index).split('\n').length
          });
        }
      }

      return {
        file: filePath,
        findings: findings,
        scannedAt: new Date().toISOString()
      };
    } catch (err) {
      return { file: filePath, error: err.message };
    }
  }

  function scanDirectory(dir, extensions) {
    extensions = extensions || ['.js'];
    const files = [];
    const results = [];

    function walk(d) {
      try {
        const entries = fs.readdirSync(d);
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const fullPath = path.join(d, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && !entry.startsWith('.')) {
            walk(fullPath);
          } else {
            for (let j = 0; j < extensions.length; j++) {
              if (entry.endsWith(extensions[j])) {
                files.push(fullPath);
                break;
              }
            }
          }
        }
      } catch (_) {}
    }

    walk(dir);

    for (let k = 0; k < files.length; k++) {
      const result = scanFile(files[k]);
      if (result.findings && result.findings.length > 0) {
        results.push(result);
      }
    }

    return results;
  }

  return {
    scanFile: scanFile,
    scanDirectory: scanDirectory
  };
}

function IntrusionDetector(logger) {
  const failedLogins = {};
  const suspiciousIPs = {};
  const blockedIPs = {};
  const thresholds = {
    maxFailedLogins: 5,
    maxRequestsPerMinute: 100,
    blockDuration: 300000
  };

  function recordLoginAttempt(ip, success) {
    if (!failedLogins[ip]) failedLogins[ip] = { count: 0, firstAttempt: Date.now() };

    if (success) {
      delete failedLogins[ip];
    } else {
      failedLogins[ip].count++;
      if (failedLogins[ip].count >= thresholds.maxFailedLogins) {
        blockIP(ip);
      }
    }
  }

  function recordRequestRate(ip) {
    if (!suspiciousIPs[ip]) {
      suspiciousIPs[ip] = { count: 1, windowStart: Date.now() };
    } else {
      suspiciousIPs[ip].count++;
      if (suspiciousIPs[ip].count > thresholds.maxRequestsPerMinute) {
        blockIP(ip);
      }
    }
  }

  function blockIP(ip) {
    blockedIPs[ip] = { blockedAt: Date.now() };
    if (logger && logger.warn) {
      logger.warn('[Intrusion] Blocked IP: ' + ip);
    }
  }

  function unblockIP(ip) {
    delete blockedIPs[ip];
  }

  function isBlocked(ip) {
    const blocked = blockedIPs[ip];
    if (!blocked) return false;

    if (Date.now() - blocked.blockedAt > thresholds.blockDuration) {
      unblockIP(ip);
      return false;
    }
    return true;
  }

  function getThreats() {
    return {
      blocked: Object.keys(blockedIPs),
      suspicious: Object.keys(suspiciousIPs).filter(function(ip) {
        return suspiciousIPs[ip].count > thresholds.maxRequestsPerMinute * 0.5;
      }),
      failedLogins: Object.keys(failedLogins)
    };
  }

  return {
    recordLoginAttempt: recordLoginAttempt,
    recordRequestRate: recordRequestRate,
    blockIP: blockIP,
    unblockIP: unblockIP,
    isBlocked: isBlocked,
    getThreats: getThreats
  };
}

function SessionGuard(logger) {
  const sessions = {};
  const maxSessions = 1000;
  const sessionTimeout = 3600000;

  function createSession(userId, metadata) {
    const sessionId = crypto.randomBytes(32).toString('hex');

    sessions[sessionId] = {
      userId: userId,
      created: Date.now(),
      lastActivity: Date.now(),
      metadata: metadata || {}
    };

    if (Object.keys(sessions).length > maxSessions) {
      cleanupOldSessions();
    }

    return sessionId;
  }

  function validateSession(sessionId) {
    const session = sessions[sessionId];
    if (!session) return false;

    if (Date.now() - session.lastActivity > sessionTimeout) {
      delete sessions[sessionId];
      return false;
    }

    session.lastActivity = Date.now();
    return true;
  }

  function destroySession(sessionId) {
    delete sessions[sessionId];
  }

  function cleanupOldSessions() {
    const now = Date.now();
    for (const id in sessions) {
      if (now - sessions[id].lastActivity > sessionTimeout) {
        delete sessions[id];
      }
    }
  }

  function getActiveSessions() {
    return Object.keys(sessions).length;
  }

  return {
    createSession: createSession,
    validateSession: validateSession,
    destroySession: destroySession,
    getActiveSessions: getActiveSessions
  };
}

module.exports = {
  TelegramNotifier: TelegramNotifier,
  RootCauseAnalyzer: RootCauseAnalyzer,
  AutoBackup: AutoBackup,
  VulnerabilityScanner: VulnerabilityScanner,
  IntrusionDetector: IntrusionDetector,
  SessionGuard: SessionGuard
};