# Device Health Skill

Theo dõi và giám sát health status của tất cả ESP32 devices trong hệ thống IoT.

## Mục tiêu

- Theo dõi online/offline status của tất cả devices
- Phát hiện devices không phản hồi
- Thu thập telemetry data (pin, signal, uptime)
- Cảnh báo khi device có vấn đề

## Chức năng chính

### 1. Device Registry
```javascript
// Lấy danh sách devices từ API
const devices = await api.get('/api/devices');
```

### 2. Health Check
```javascript
// Kiểm tra device có phản hồi không
const status = await deviceHealthCheck(deviceId);
```

### 3. Telemetry Collection
```javascript
// Thu thập sensor data
const telemetry = await getTelemetry(deviceId);
```

## Triển khai

### Script: `scripts/device-health.js`

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';
const HEALTH_THRESHOLDS = {
  offlineMinutes: 5,        // Offline > 5 phút = warning
  criticalOfflineMinutes: 15, // Offline > 15 phút = critical
  lowBattery: 20,            // Pin < 20% = warning
  criticalBattery: 10,       // Pin < 10% = critical
  weakSignal: -80,           // Signal < -80dBm = warning
};

const healthReport = {
  timestamp: null,
  total: 0,
  online: 0,
  offline: 0,
  warning: 0,
  critical: 0,
  devices: []
};

async function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: null });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function calculateStatus(device) {
  const now = Date.now();
  const lastSeen = device.last_seen ? new Date(device.last_seen).getTime() : 0;
  const offlineMinutes = (now - lastSeen) / (1000 * 60);
  
  // Determine status
  let status = 'online';
  let issues = [];
  
  if (offlineMinutes > HEALTH_THRESHOLDS.criticalOfflineMinutes) {
    status = 'critical';
    issues.push(`Offline for ${Math.floor(offlineMinutes)} minutes`);
  } else if (offlineMinutes > HEALTH_THRESHOLDS.offlineMinutes) {
    status = 'warning';
    issues.push(`Offline for ${Math.floor(offlineMinutes)} minutes`);
  }
  
  // Battery check
  if (device.battery !== undefined) {
    if (device.battery < HEALTH_THRESHOLDS.criticalBattery) {
      status = 'critical';
      issues.push(`Critical battery: ${device.battery}%`);
    } else if (device.battery < HEALTH_THRESHOLDS.lowBattery) {
      if (status !== 'critical') status = 'warning';
      issues.push(`Low battery: ${device.battery}%`);
    }
  }
  
  // Signal check
  if (device.rssi !== undefined && device.rssi < HEALTH_THRESHOLDS.weakSignal) {
    if (status !== 'critical') status = 'warning';
    issues.push(`Weak signal: ${device.rssi} dBm`);
  }
  
  return { status, issues, offlineMinutes: Math.floor(offlineMinutes) };
}

async function checkDeviceHealth(device) {
  const statusInfo = calculateStatus(device);
  
  return {
    deviceId: device.id,
    name: device.name || device.id,
    status: statusInfo.status,
    issues: statusInfo.issues,
    lastSeen: device.last_seen,
    offlineMinutes: statusInfo.offlineMinutes,
    battery: device.battery,
    rssi: device.rssi,
    firmware: device.firmware_version,
    type: device.type
  };
}

async function generateHealthReport() {
  console.log('='.repeat(60));
  console.log(`[${new Date().toISOString()}] Device Health Check Started`);
  console.log('='.repeat(60));
  
  try {
    // Get all devices
    const response = await apiRequest('/api/devices');
    const devices = response.data || [];
    
    healthReport.total = devices.length;
    healthReport.timestamp = new Date().toISOString();
    
    console.log(`Total devices: ${devices.length}`);
    
    // Check each device
    for (const device of devices) {
      const health = await checkDeviceHealth(device);
      healthReport.devices.push(health);
      
      // Update counters
      if (health.status === 'online') healthReport.online++;
      else if (health.status === 'offline') healthReport.offline++;
      else if (health.status === 'warning') healthReport.warning++;
      else if (health.status === 'critical') healthReport.critical++;
      
      // Log status
      const icon = health.status === 'online' ? '✓' 
        : health.status === 'warning' ? '⚠' 
        : health.status === 'critical' ? '✗' : '?';
      console.log(`  ${icon} ${health.name}: ${health.status}`);
      
      if (health.issues.length > 0) {
        health.issues.forEach(issue => console.log(`      - ${issue}`));
      }
    }
    
    // Print summary
    console.log('-'.repeat(60));
    console.log('Summary:');
    console.log(`  Online:   ${healthReport.online}`);
    console.log(`  Warning:  ${healthReport.warning}`);
    console.log(`  Critical: ${healthReport.critical}`);
    console.log(`  Offline:  ${healthReport.offline}`);
    console.log('='.repeat(60));
    
    // Save report
    saveReport(healthReport);
    
    // Alert if critical issues
    if (healthReport.critical > 0 || healthReport.offline > 0) {
      await sendAlert(healthReport);
    }
    
    return healthReport;
  } catch (error) {
    console.error('Health check failed:', error.message);
    throw error;
  }
}

function saveReport(report) {
  const reportDir = './logs/device-health';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const filename = `health-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(
    path.join(reportDir, filename),
    JSON.stringify(report, null, 2)
  );
  
  // Keep last 30 days
  const oldFiles = fs.readdirSync(reportDir)
    .filter(f => f.startsWith('health-') && f.endsWith('.json'))
    .map(f => ({ name: f, path: path.join(reportDir, f), mtime: fs.statSync(path.join(reportDir, f)).mtime }))
    .filter(f => Date.now() - f.mtime.getTime() > 30 * 24 * 60 * 60 * 1000);
  
  oldFiles.forEach(f => fs.unlinkSync(f.path));
}

async function sendAlert(report) {
  const criticalDevices = report.devices.filter(d => d.status === 'critical');
  const offlineDevices = report.devices.filter(d => d.status === 'offline');
  
  let message = `🔴 *EcoSynTech Device Health Alert*\n\n`;
  message += `Time: ${report.timestamp}\n\n`;
  
  if (criticalDevices.length > 0) {
    message += `⚠️ *Critical Issues:*\n`;
    criticalDevices.forEach(d => {
      message += `• ${d.name}: ${d.issues.join(', ')}\n`;
    });
    message += '\n';
  }
  
  if (offlineDevices.length > 0) {
    message += `❌ *Offline Devices:*\n`;
    offlineDevices.forEach(d => {
      message += `• ${d.name} (offline ${d.offlineMinutes} min)\n`;
    });
  }
  
  console.log('Alert:', message);
  // await sendTelegram(message);
}

// Run if called directly
if (require.main === module) {
  generateHealthReport()
    .then(report => {
      console.log('Health check completed successfully');
      process.exit(report.critical > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('Health check failed:', err);
      process.exit(1);
    });
}

module.exports = { generateHealthReport, checkDeviceHealth };
```

## API Endpoints

### GET /api/devices
```json
{
  "data": [
    {
      "id": "esp32-001",
      "name": "Garden Sensor 1",
      "type": "esp32",
      "last_seen": "2026-04-17T10:30:00Z",
      "battery": 85,
      "rssi": -65,
      "firmware_version": "2.1.0",
      "status": "online"
    }
  ]
}
```

## Cấu hình (`.env`)

```bash
# Device health settings
API_BASE_URL=http://localhost:3000
DEVICE_OFFLINE_THRESHOLD_MINUTES=5
DEVICE_CRITICAL_OFFLINE_MINUTES=15
DEVICE_LOW_BATTERY_THRESHOLD=20
DEVICE_WEAK_SIGNAL_DBM=-80
```

## Health Dashboard Data

```javascript
{
  timestamp: "2026-04-17T10:30:00.000Z",
  total: 25,
  online: 23,
  offline: 1,
  warning: 1,
  critical: 0,
  devices: [
    {
      deviceId: "esp32-001",
      name: "Garden Sensor 1",
      status: "online",
      issues: [],
      lastSeen: "2026-04-17T10:30:00Z",
      battery: 85,
      rssi: -65,
      firmware: "2.1.0"
    }
  ]
}
```

## Metrics

| Metric | Description |
|--------|-------------|
| `devices_total` | Tổng số devices |
| `devices_online` | Số devices đang online |
| `devices_offline` | Số devices offline |
| `devices_low_battery` | Số devices pin yếu |
| `devices_weak_signal` | Số devices tín hiệu yếu |

## Kết hợp với Scheduler

```json
{
  "id": "sched-device-health-001",
  "name": "Device Health Check",
  "interval": "5m",
  "skills": ["device-health"],
  "enabled": true
}
```

## Troubleshooting

| Vấn đề | Giải pháp |
|---------|-----------|
| Device luôn offline | Kiểm tra WiFi, nguồn device |
| Battery không hiển thị | Device không gửi battery data |
| RSSI luôn null | Kiểm tra MQTT topic |
| Quá nhiều offline | Kiểm tra network coverage |
