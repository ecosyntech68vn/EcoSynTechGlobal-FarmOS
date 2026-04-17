# Uptime Monitor Skill

Theo dõi và đo lường uptime của hệ thống để đảm bảo SLA compliance.

## Mục tiêu

- Đo lường uptime percentage chính xác
- Phát hiện downtime nhanh chóng
- Báo cáo SLA metrics hàng ngày/tuần/tháng
- Cảnh báo khi uptime drop dưới threshold

## Chức năng chính

### 1. Health Check
```javascript
// Ping endpoint và đo response time
const { status, latency } = await healthCheck('http://localhost:3000/api/health');
```

### 2. Uptime Calculation
```javascript
// Tính uptime percentage
const uptime = calculateUptime(downtimes);
```

### 3. SLA Reporting
```javascript
// Báo cáo SLA
const sla = generateSLAReport(uptimeData);
```

## Triển khai

### Script: `scripts/uptime-monitor.js`

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHECK_URL = process.env.UPTIME_CHECK_URL || 'http://localhost:3000/api/health';
const CHECK_INTERVAL = parseInt(process.env.UPTIME_CHECK_INTERVAL) || 60000; // 1 phút
const DATA_DIR = './logs/uptime';
const SLA_TARGET = parseFloat(process.env.SLA_TARGET) || 99.9; // 99.9%
const ALERT_THRESHOLD = parseFloat(process.env.SLA_ALERT_THRESHOLD) || 99.0; // 99%

let lastStatus = true;
let lastCheckTime = Date.now();
let currentDowntimeStart = null;
let downtimeEvents = [];

const uptimeData = {
  startDate: null,
  totalChecks: 0,
  successfulChecks: 0,
  failedChecks: 0,
  totalDowntimeMs: 0,
  averageLatency: 0,
  maxLatency: 0,
  minLatency: Infinity,
  downtimeEvents: []
};

function init() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  // Load existing data
  loadData();
  
  if (!uptimeData.startDate) {
    uptimeData.startDate = new Date().toISOString();
    saveData();
  }
}

async function healthCheck(url) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    try {
      const req = http.get(url, { timeout: 10000 }, (res) => {
        const latency = Date.now() - startTime;
        resolve({
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          latency
        });
      });
      
      req.on('error', (err) => {
        resolve({
          success: false,
          error: err.message,
          latency: Date.now() - startTime
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'timeout',
          latency: Date.now() - startTime
        });
      });
    } catch (e) {
      resolve({
        success: false,
        error: e.message,
        latency: Date.now() - startTime
      });
    }
  });
}

function recordDowntimeStart() {
  if (currentDowntimeStart === null) {
    currentDowntimeStart = Date.now();
    console.log(`[${new Date().toISOString()}] ⬇️  DOWN - Service unavailable`);
  }
}

function recordDowntimeEnd() {
  if (currentDowntimeStart !== null) {
    const duration = Date.now() - currentDowntimeStart;
    uptimeData.totalDowntimeMs += duration;
    
    uptimeData.downtimeEvents.push({
      start: new Date(currentDowntimeStart).toISOString(),
      end: new Date().toISOString(),
      durationMs: duration,
      durationReadable: formatDuration(duration)
    });
    
    console.log(`[${new Date().toISOString()}] ⬆️  UP - Downtime: ${formatDuration(duration)}`);
    currentDowntimeStart = null;
  }
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function calculateUptime() {
  const totalTimeMs = Date.now() - new Date(uptimeData.startDate).getTime();
  const uptimeMs = totalTimeMs - uptimeData.totalDowntimeMs;
  const uptimePercent = (uptimeMs / totalTimeMs) * 100;
  
  return {
    uptimePercent: uptimePercent.toFixed(3),
    downtimePercent: (100 - uptimePercent).toFixed(3),
    totalDowntime: formatDuration(uptimeData.totalDowntimeMs),
    downtimeEvents: uptimeData.downtimeEvents.length
  };
}

async function runCheck() {
  const now = new Date().toISOString();
  console.log(`[${now}] Checking uptime...`);
  
  uptimeData.totalChecks++;
  
  const result = await healthCheck(CHECK_URL);
  
  // Update latency stats
  if (result.latency) {
    uptimeData.averageLatency = (
      (uptimeData.averageLatency * (uptimeData.totalChecks - 1) + result.latency)
      / uptimeData.totalChecks
    );
    uptimeData.maxLatency = Math.max(uptimeData.maxLatency, result.latency);
    uptimeData.minLatency = Math.min(uptimeData.minLatency, result.latency);
  }
  
  if (result.success) {
    uptimeData.successfulChecks++;
    lastStatus = true;
    recordDowntimeEnd();
  } else {
    uptimeData.failedChecks++;
    lastStatus = false;
    recordDowntimeStart();
    
    console.log(`  ❌ Failed: ${result.error || result.statusCode}`);
    console.log(`  Latency: ${result.latency}ms`);
  }
  
  // Calculate current uptime
  const currentUptime = calculateUptime();
  
  // Log status
  console.log(`  ✓ Current Uptime: ${currentUptime.uptimePercent}%`);
  console.log(`  Latency: ${result.latency || 'N/A'}ms`);
  
  // Check SLA threshold
  if (parseFloat(currentUptime.uptimePercent) < ALERT_THRESHOLD) {
    console.log(`  ⚠️  WARNING: Uptime below ${ALERT_THRESHOLD}% threshold!`);
    // await sendSLAAlert(currentUptime);
  }
  
  // Save data periodically
  saveData();
  
  // Generate daily report
  generateDailyReport(currentUptime);
  
  return result;
}

function saveData() {
  const dataFile = path.join(DATA_DIR, 'uptime-data.json');
  fs.writeFileSync(dataFile, JSON.stringify(uptimeData, null, 2));
}

function loadData() {
  const dataFile = path.join(DATA_DIR, 'uptime-data.json');
  
  if (fs.existsSync(dataFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
      Object.assign(uptimeData, data);
    } catch (e) {
      console.error('Failed to load uptime data:', e.message);
    }
  }
}

function generateDailyReport(currentUptime) {
  const today = new Date().toISOString().split('T')[0];
  const reportFile = path.join(DATA_DIR, `uptime-${today}.json`);
  
  const report = {
    date: today,
    generatedAt: new Date().toISOString(),
    uptime: currentUptime,
    statistics: {
      totalChecks: uptimeData.totalChecks,
      successfulChecks: uptimeData.successfulChecks,
      failedChecks: uptimeData.failedChecks,
      successRate: ((uptimeData.successfulChecks / uptimeData.totalChecks) * 100).toFixed(2) + '%',
      averageLatency: uptimeData.averageLatency.toFixed(2) + 'ms',
      maxLatency: uptimeData.maxLatency + 'ms',
      minLatency: uptimeData.minLatency === Infinity ? 'N/A' : uptimeData.minLatency + 'ms'
    },
    sla: {
      target: SLA_TARGET + '%',
      current: currentUptime.uptimePercent + '%',
      status: parseFloat(currentUptime.uptimePercent) >= SLA_TARGET ? '✅ PASS' : '❌ FAIL'
    },
    recentDowntime: uptimeData.downtimeEvents.slice(-5)
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  return report;
}

function generateWeeklyReport() {
  const reports = fs.readdirSync(DATA_DIR)
    .filter(f => f.startsWith('uptime-') && f.endsWith('.json'))
    .map(f => {
      const content = fs.readFileSync(path.join(DATA_DIR, f), 'utf8');
      return JSON.parse(content);
    })
    .slice(-7); // Last 7 days
  
  if (reports.length === 0) return null;
  
  const avgUptime = reports.reduce((sum, r) => sum + parseFloat(r.uptime.uptimePercent), 0) / reports.length;
  const totalDowntime = reports.reduce((sum, r) => {
    // Estimate downtime from uptime percentage
    return sum + ((100 - parseFloat(r.uptime.uptimePercent)) / 100) * 24 * 60 * 60 * 1000;
  }, 0);
  
  return {
    period: 'weekly',
    dateRange: `${reports[0].date} to ${reports[reports.length - 1].date}`,
    averageUptime: avgUptime.toFixed(3) + '%',
    totalDowntime: formatDuration(totalDowntime),
    days: reports.length,
    slaCompliance: avgUptime >= SLA_TARGET ? '✅ PASS' : '❌ FAIL'
  };
}

async function sendSLAAlert(uptime) {
  const message = `⚠️ *EcoSynTech SLA Alert*
  
Uptime dropped below ${ALERT_THRESHOLD}%
Current Uptime: ${uptime.uptimePercent}%

Please investigate immediately.`;

  console.log('Alert:', message);
  // await sendTelegram(message);
}

function printStatus() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 EcoSynTech Uptime Monitor');
  console.log('='.repeat(50));
  
  const currentUptime = calculateUptime();
  
  console.log(`\n⏱️  Current Status:`);
  console.log(`   Uptime: ${currentUptime.uptimePercent}%`);
  console.log(`   SLA Target: ${SLA_TARGET}%`);
  console.log(`   SLA Status: ${parseFloat(currentUptime.uptimePercent) >= SLA_TARGET ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log(`\n📈 Statistics:`);
  console.log(`   Total Checks: ${uptimeData.totalChecks}`);
  console.log(`   Successful: ${uptimeData.successfulChecks}`);
  console.log(`   Failed: ${uptimeData.failedChecks}`);
  console.log(`   Avg Latency: ${uptimeData.averageLatency.toFixed(2)}ms`);
  console.log(`   Max Latency: ${uptimeData.maxLatency}ms`);
  
  console.log(`\n⏰ Downtime:`);
  console.log(`   Total: ${currentUptime.totalDowntime}`);
  console.log(`   Events: ${currentUptime.downtimeEvents}`);
  
  console.log('\n' + '='.repeat(50));
}

// Export functions
module.exports = {
  runCheck,
  calculateUptime,
  generateDailyReport,
  generateWeeklyReport,
  printStatus
};

// Run if called directly
if (require.main === module) {
  init();
  
  const args = process.argv.slice(2);
  
  if (args[0] === '--once') {
    // Run single check
    runCheck().then(() => {
      printStatus();
      process.exit(0);
    });
  } else if (args[0] === '--report') {
    // Generate report
    const report = generateDailyReport(calculateUptime());
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } else if (args[0] === '--weekly') {
    // Generate weekly report
    const report = generateWeeklyReport();
    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } else {
    // Start monitoring loop
    console.log(`Starting uptime monitor (interval: ${CHECK_INTERVAL}ms)`);
    printStatus();
    
    setInterval(runCheck, CHECK_INTERVAL);
    runCheck(); // Initial check
  }
}
```

## API Endpoints

### GET /api/stats/uptime
```json
{
  "uptime": {
    "uptimePercent": "99.985",
    "downtimePercent": "0.015",
    "totalDowntime": "2m 30s",
    "downtimeEvents": 1
  },
  "statistics": {
    "totalChecks": 1440,
    "successfulChecks": 1439,
    "failedChecks": 1,
    "averageLatency": "45ms"
  },
  "sla": {
    "target": "99.9%",
    "current": "99.985%",
    "status": "PASS"
  }
}
```

## Cấu hình (`.env`)

```bash
# Uptime monitoring
UPTIME_CHECK_URL=http://localhost:3000/api/health
UPTIME_CHECK_INTERVAL=60000
SLA_TARGET=99.9
SLA_ALERT_THRESHOLD=99.0
```

## Dashboard Metrics

```javascript
const metrics = {
  uptime_percent: parseFloat(uptime.uptimePercent),
  sla_compliant: parseFloat(uptime.uptimePercent) >= SLA_TARGET,
  total_downtime_ms: uptimeData.totalDowntimeMs,
  downtime_events: uptimeData.downtimeEvents.length,
  average_latency_ms: uptimeData.averageLatency,
  max_latency_ms: uptimeData.maxLatency
};
```

## Kết hợp với Scheduler

```json
{
  "id": "sched-uptime-001",
  "name": "Uptime Monitor",
  "interval": "5m",
  "skills": ["uptime-monitor"],
  "enabled": true
}
```

## SLA Tiers

| SLA Tier | Monthly Downtime | Yearly Downtime |
|----------|-----------------|-----------------|
| 99% | 7h 18m | 3d 15h |
| 99.5% | 3h 39m | 1d 19h |
| 99.9% | 43m 49s | 8h 45m |
| 99.99% | 4m 22s | 52m 35s |

## Troubleshooting

| Vấn đề | Giải pháp |
|---------|-----------|
| Always down | Kiểm tra server có đang chạy không |
| Latency high | Kiểm tra network, database queries |
| Data not persisting | Kiểm tra DATA_DIR permissions |
| Uptime calculation wrong | Kiểm tra timezone, system time |
