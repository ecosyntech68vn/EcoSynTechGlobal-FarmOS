# Auto-Restart Skill

Tự động phát hiện và khởi động lại service khi crash hoặc không phản hồi.

## Mục tiêu

- Đảm bảo service luôn chạy 24/7
- Tự động recover từ crash mà không cần can thiệp thủ công
- Gửi thông báo khi restart xảy ra

## Chức năng chính

### 1. Health Check Endpoint
```bash
GET /api/health
```
Kiểm tra service có đang phản hồi không.

### 2. Process Monitoring
```javascript
// Kiểm tra process đang chạy
const isRunning = await checkProcess('node', 'server.js');

// Kiểm tra port
const isPortOpen = await checkPort(3000);
```

### 3. Auto-Restart Logic
```javascript
if (!isRunning || !isPortOpen) {
  console.log('Service crashed, restarting...');
  await restartService();
  await sendNotification('Service restarted automatically');
}
```

## Triển khai

### Script: `scripts/auto-restart.js`

```javascript
const { spawn } = require('child_process');
const http = require('http');

const SERVICE_NAME = 'ecosyntech-server';
const HEALTH_CHECK_URL = 'http://localhost:3000/api/health';
const HEALTH_CHECK_INTERVAL = 60000; // 1 phút
const MAX_RESTART_ATTEMPTS = 3;
const RESTART_COOLDOWN = 300000; // 5 phút

let restartAttempts = 0;
let lastRestartTime = 0;

async function checkHealth() {
  return new Promise((resolve) => {
    http.get(HEALTH_CHECK_URL, (res) => {
      resolve(res.statusCode === 200);
    }).on('error', () => resolve(false));
  });
}

async function restartService() {
  const now = Date.now();
  if (now - lastRestartTime < RESTART_COOLDOWN) {
    console.log('Restart cooldown active, skipping...');
    return false;
  }

  try {
    console.log(`[${new Date().toISOString()}] Restarting ${SERVICE_NAME}...`);
    
    // Kill existing process
    const killCmd = process.platform === 'win32' 
      ? 'taskkill /F /IM node.exe' 
      : 'pkill -f "node.*server.js"';
    
    require('child_process').execSync(killCmd, { stdio: 'ignore' });
    await sleep(2000);
    
    // Start new process
    const serviceProcess = spawn('node', ['server.js'], {
      detached: true,
      stdio: 'ignore'
    });
    serviceProcess.unref();
    
    lastRestartTime = now;
    restartAttempts++;
    
    console.log(`[${new Date().toISOString()}] Service restarted successfully`);
    return true;
  } catch (error) {
    console.error('Restart failed:', error.message);
    return false;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function monitor() {
  const isHealthy = await checkHealth();
  
  if (!isHealthy) {
    console.log('Service unhealthy, attempting restart...');
    const success = await restartService();
    
    if (!success && restartAttempts >= MAX_RESTART_ATTEMPTS) {
      console.error('Max restart attempts reached, alerting...');
      // Gửi alert
    }
  }
}

// Bắt đầu monitoring
setInterval(monitor, HEALTH_CHECK_INTERVAL);
console.log('Auto-restart monitoring started');
```

### Systemd Service (Backup)

```ini
[Unit]
Description=EcoSynTech Auto-Restart Watchdog
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node /root/ecosyntech-web/scripts/auto-restart.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## Cấu hình (`.env`)

```bash
# Auto-restart settings
AUTO_RESTART_ENABLED=true
HEALTH_CHECK_URL=http://localhost:3000/api/health
HEALTH_CHECK_INTERVAL=60000
MAX_RESTART_ATTEMPTS=3
RESTART_COOLDOWN=300000
```

## Monitoring

```bash
# Kiểm tra watchdog đang chạy
ps aux | grep auto-restart

# Xem logs
journalctl -u ecosyntech-auto-restart -f

# Số lần restart
grep "restarted successfully" /var/log/ecosyntech.log | wc -l
```

## Alerts

Thông báo Telegram khi restart:
```javascript
async function sendRestartAlert(attempt) {
  const message = `⚠️ *EcoSynTech Auto-Restart*
  
Service restarted automatically
Attempt: ${attempt}/${MAX_RESTART_ATTEMPTS}
Time: ${new Date().toISOString()}`;

  await sendTelegram(message);
}
```

## Metrics

| Metric | Description |
|--------|-------------|
| `auto_restart_count` | Tổng số lần restart |
| `auto_restart_last_time` | Thời gian restart gần nhất |
| `auto_restart_success_rate` | Tỷ lệ restart thành công |

## Kết hợp với Scheduler

```json
{
  "id": "sched-auto-restart-001",
  "name": "Auto-Restart Watchdog",
  "interval": "1m",
  "skills": ["auto-restart"],
  "enabled": true
}
```

## Troubleshooting

| Vấn đề | Giải pháp |
|---------|-----------|
| Restart loop | Kiểm tra `RESTART_COOLDOWN`, có thể service bị crash ngay |
| Không kill được process | Kiểm tra quyền root |
| Health check luôn fail | Kiểm tra service có đang listen đúng port không |
