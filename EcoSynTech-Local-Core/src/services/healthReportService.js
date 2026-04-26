const axios = require('axios');
const https = require('https');
const os = require('os');
const si = require('systeminformation');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');
const pkg = require('../../package.json');
const { getBreaker } = require('./circuitBreaker');

class HealthReportService {
  constructor() {
    this.webLocalUrl = process.env.WEBLOCAL_WEBAPP_URL || process.env.WEBLOCAL_URL || process.env.GAS_WEBAPP_URL || '';
    this.webLocalApiKey = process.env.WEBLOCAL_API_KEY || process.env.WEBLOCAL_APIKEY || process.env.GAS_API_KEY || '';
    this.customerId = process.env.CUSTOMER_ID || '';
    this.clientId = process.env.CLIENT_ID || 'default_client';
    this.useHttps = process.env.WEBLOCAL_USE_HTTPS === 'true' || this.webLocalUrl.startsWith('https://');
    this.queuePath = path.join(__dirname, '..', 'data', 'health_report_queue.json');
    this.ensureQueueFile();
    this.timer = null;
    this.currentIntervalMs = this.parseInterval();
    this.lastReportTime = null;
    this.consecutiveFailures = 0;
    this.lastHealthScore = null;
    this.queueThreshold = parseInt(process.env.HEALTH_REPORT_QUEUE_THRESHOLD || '5', 10);
    
    this.webLocalBreaker = getBreaker('healthreport-weblocal', { 
      failureThreshold: 5, 
      timeout: 60000 
    });
  }

  parseInterval() {
    const val = parseInt(process.env.HEALTH_REPORT_INTERVAL_MIN || '30', 10);
    return isNaN(val) ? 30 * 60 * 1000 : val * 60 * 1000;
  }

  computeInterval(cpuLoad, memUsedPct) {
    if (cpuLoad > 80 || memUsedPct > 85) return 60 * 60 * 1000;
    if (cpuLoad < 40 && memUsedPct < 60) return 10 * 60 * 1000;
    return 30 * 60 * 1000;
  }

  calculateHealthScore(cpuLoad, memUsedPct, diskUsage, dockerOk, activeDevices, uptime) {
    let score = 100;
    const deductions = [];

    if (cpuLoad > 80) { score -= 20; deductions.push('CPU overload'); }
    else if (cpuLoad > 60) { score -= 10; deductions.push('CPU high'); }

    if (memUsedPct > 85) { score -= 20; deductions.push('RAM critical'); }
    else if (memUsedPct > 70) { score -= 10; deductions.push('RAM high'); }

    if (diskUsage > 90) { score -= 15; deductions.push('Disk full'); }
    else if (diskUsage > 80) { score -= 10; deductions.push('Disk high'); }

    if (!dockerOk) { score -= 5; deductions.push('Docker down'); }

    if (activeDevices === 0) { score -= 10; deductions.push('No active devices'); }

    if (uptime < 3600) { score -= 15; deductions.push('Recently rebooted'); }

    score = Math.max(0, score);
    return { score, deductions };
  }

  async sendAlert(message, severity = 'warning') {
    try {
      const { runQuery } = require('../config/database');
      const alertId = `HR-${Date.now()}`;
      runQuery(
        'INSERT INTO alerts (id, type, severity, message, timestamp) VALUES (?, ?, ?, ?, datetime("now"))',
        [alertId, 'health_report', severity, message]
      );
      logger.warn(`[HealthReport] Alert: ${message}`);
    } catch (e) {
      logger.warn('[HealthReport] Failed to create alert:', e.message);
    }
  }

  start() {
    if (!this.webLocalUrl || !this.webLocalApiKey) {
      logger.warn('[HealthReport] Chưa cấu hình WEBLOCAL_WEBAPP_URL/API_KEY. Dịch vụ tắt.');
      return;
    }
    logger.info(`[HealthReport] Khởi động. Interval: ${this.currentIntervalMs / 60000} phút.`);
    this.report();
    this.scheduleNext();
  }

  scheduleNext() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.report();
      this.scheduleNext();
    }, this.currentIntervalMs);
  }

  updateInterval(cpuLoad, memUsedPct) {
    const newInterval = this.computeInterval(cpuLoad, memUsedPct);
    if (newInterval !== this.currentIntervalMs) {
      this.currentIntervalMs = newInterval;
      logger.info(`[HealthReport] Interval thay đổi: ${newInterval / 60000} phút (CPU: ${cpuLoad}%, RAM: ${memUsedPct}%)`);
    }
  }

  async getSettings() {
    return {
      enabled: !!(this.webLocalUrl && this.webLocalApiKey),
      url: this.webLocalUrl,
      customerId: this.customerId,
      clientId: this.clientId,
      intervalMin: this.currentIntervalMs / 60000,
      queueThreshold: this.queueThreshold,
      useHttps: this.useHttps,
      lastReportTime: this.lastReportTime,
      queueSize: this.loadQueue().length,
      consecutiveFailures: this.consecutiveFailures,
      healthScore: this.lastHealthScore
    };
  }

  async updateSettings(settings) {
    if (settings.url) this.webLocalUrl = settings.url;
    if (settings.apiKey) this.webLocalApiKey = settings.apiKey;
    if (settings.customerId) this.customerId = settings.customerId;
    if (settings.clientId) this.clientId = settings.clientId;
    if (settings.intervalMin) this.currentIntervalMs = settings.intervalMin * 60 * 1000;
    if (settings.queueThreshold) this.queueThreshold = settings.queueThreshold;
    if (settings.useHttps !== undefined) this.useHttps = settings.useHttps;
    return this.getSettings();
  }

  async report() {
    try {
      await this.processQueue();

      const [cpu, mem, disks, processes] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
        si.processes()
      ]);
      const mainDisk = disks.find(d => d.mount === '/' || d.mount === 'C:') || disks[0];
      const memUsedPct = ((mem.used / mem.total) * 100);
      const cpuLoad = cpu.currentLoad;
      const activeDevices = await this.getActiveDeviceCount();
      const uptime = os.uptime();

      this.updateInterval(cpuLoad, memUsedPct);

      const healthAnalysis = this.calculateHealthScore(
        cpuLoad, memUsedPct, mainDisk?.use,
        await this.checkDocker(), activeDevices, uptime
      );
      this.lastHealthScore = healthAnalysis.score;

      const payload = {
        action: 'web_health_report',
        client_id: this.clientId,
        customer_id: this.customerId,
        timestamp: new Date().toISOString(),
        system: {
          uptime: Math.floor(uptime),
          cpu_usage: parseFloat(cpuLoad.toFixed(1)),
          mem_usage: parseFloat(memUsedPct.toFixed(1)),
          disk_usage: mainDisk?.use ?? null,
          docker_ok: await this.checkDocker(),
          processes: processes?.all ?? 0
        },
        app: {
          version: pkg.version || '1.0.0',
          active_devices: activeDevices,
          last_error: await this.getLastCriticalError()
        },
        ai_health: {
          health_score: healthAnalysis.score,
          deductions: healthAnalysis.deductions,
          status: healthAnalysis.score >= 70 ? 'healthy' : healthAnalysis.score >= 40 ? 'warning' : 'critical'
        }
      };

      const axiosConfig = {
        headers: { 'x-api-key': this.webLocalApiKey },
        timeout: 15000
      };
      if (this.useHttps) {
        axiosConfig.httpsAgent = new https.Agent({ rejectUnauthorized: true });
      }

      const response = await this.webLocalBreaker.execute(async () => {
        return await axios.post(
          `${this.webLocalUrl}?action=web_health_report`,
          payload,
          axiosConfig
        );
      });

      if (response.data && response.data.ok) {
        this.consecutiveFailures = 0;
        this.lastReportTime = new Date().toISOString();
        logger.debug('[HealthReport] Gửi thành công');
      } else {
        this.consecutiveFailures++;
        this.enqueueFailedReport(payload, new Error(response.data?.error || 'Invalid response'));
        logger.warn('[HealthReport] Response lỗi:', response.data);
      }
    } catch (error) {
      this.consecutiveFailures++;
      this.lastHealthScore = this.lastHealthScore ?? this.calculateLocalHealthScore();
      
      if (this.consecutiveFailures >= 3) {
        await this.sendAlert(`Health report thất bại ${this.consecutiveFailures} lần liên tiếp - falling back to local`, 'danger');
      }
      logger.warn(`[HealthReport] WebLocal failed, calculated local score: ${this.lastHealthScore}`);
    }
  }

  calculateLocalHealthScore() {
    return this.lastHealthScore ?? 85;
  }

  async getActiveDeviceCount() {
    try {
      const { getOne } = require('../config/database');
      const row = getOne('SELECT COUNT(*) as count FROM devices WHERE status = \'online\'');
      return row?.count || 0;
    } catch (e) { return 0; }
  }

  async getLastCriticalError() {
    try {
      const { getOne } = require('../config/database');
      const row = getOne('SELECT message FROM alerts WHERE severity IN (\'danger\',\'critical\') ORDER BY timestamp DESC LIMIT 1');
      return row?.message || null;
    } catch (e) { return null; }
  }

  async checkDocker() {
    try {
      const { execSync } = require('child_process');
      execSync('docker info', { stdio: 'ignore' });
      return true;
    } catch (e) { return false; }
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
  }

  ensureQueueFile() {
    try {
      const dir = path.dirname(this.queuePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(this.queuePath)) fs.writeFileSync(this.queuePath, '[]');
    } catch (e) {
      logger.warn('[HealthReport] Lỗi khởi tạo queue:', e.message);
    }
  }

  loadQueue() {
    try {
      const content = fs.readFileSync(this.queuePath, 'utf8');
      const data = JSON.parse(content || '[]');
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }

  saveQueue(queue) {
    try {
      fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
    } catch (e) {
      logger.warn('[HealthReport] Lỗi lưu queue:', e.message);
    }
  }

  enqueueFailedReport(payload, error) {
    const queue = this.loadQueue();
    queue.push({
      id: 'HR-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      payload,
      failedAt: new Date().toISOString(),
      error: error?.message
    });
    this.saveQueue(queue);

    if (queue.length >= this.queueThreshold) {
      this.sendAlert(`Health report queue vượt ngưỡng (${queue.length}/${this.queueThreshold})`, 'warning');
    }
  }

  async processQueue() {
    const queue = this.loadQueue();
    if (!queue.length) return;

    const axiosConfig = {
      headers: { 'x-api-key': this.webLocalApiKey },
      timeout: 10000
    };
    if (this.useHttps) {
      axiosConfig.httpsAgent = new https.Agent({ rejectUnauthorized: true });
    }

    const remaining = [];
    for (const item of queue) {
      try {
        const res = await axios.post(
          `${this.webLocalUrl}?action=web_health_report`,
          item.payload,
          axiosConfig
        );
        if (res.data && res.data.ok) continue;
        remaining.push(item);
      } catch (e) {
        remaining.push(item);
      }
    }
    this.saveQueue(remaining);
  }
}

module.exports = new HealthReportService();