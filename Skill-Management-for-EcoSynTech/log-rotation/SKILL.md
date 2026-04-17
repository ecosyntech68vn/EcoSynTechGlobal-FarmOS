# Log Rotation Skill

Tự động xoay, nén, và xóa log files để ngăn đầy disk và tiết kiệm storage.

## Mục tiêu

- Ngăn disk đầy do log files
- Nén log cũ để tiết kiệm không gian (90% reduction)
- Tự động xóa log quá cũ
- Giữ cấu trúc log để debug dễ dàng

## Chức năng chính

### 1. Log Rotation
```bash
# Xoay log khi đạt kích thước hoặc thời gian
logrotate -f /etc/logrotate.d/ecosyntech
```

### 2. Compression
```bash
gzip -9 logs/app.log.1    # Nén 90%
ls -lh logs/               # Kiểm tra kích thước
```

### 3. Cleanup
```bash
# Xóa log older than 30 days
find /var/log/ecosyntech -name "*.log.*" -mtime +30 -delete
```

## Triển khai

### Script: `scripts/log-rotation.js`

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOG_DIR = process.env.LOG_DIR || './logs';
const ARCHIVE_DIR = process.env.LOG_ARCHIVE_DIR || './logs/archive';
const MAX_SIZE_MB = parseInt(process.env.LOG_MAX_SIZE_MB) || 100;
const RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS) || 30;
const COMPRESS_AFTER_DAYS = parseInt(process.env.COMPRESS_AFTER_DAYS) || 1;

function getFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.log'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      size: fs.statSync(path.join(dir, f)).size,
      mtime: fs.statSync(path.join(dir, f)).mtime
    }));
}

function rotateLog(file) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rotatedName = `${file.name}.${timestamp}`;
  const rotatedPath = path.join(ARCHIVE_DIR, rotatedName);
  
  // Ensure archive dir exists
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
  
  // Rotate: copy and truncate
  fs.copyFileSync(file.path, rotatedPath);
  fs.truncateSync(file.path, 0);
  
  console.log(`[${new Date().toISOString()}] Rotated: ${file.name} -> ${rotatedName}`);
  return rotatedPath;
}

function compressFile(filePath) {
  try {
    execSync(`gzip -9 "${filePath}"`, { stdio: 'ignore' });
    const compressedPath = filePath + '.gz';
    const originalSize = fs.statSync(filePath).size;
    const compressedSize = fs.statSync(compressedPath).size;
    const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    
    console.log(`[${new Date().toISOString()}] Compressed: ${path.basename(filePath)} (${ratio}% reduction)`);
    return compressedPath;
  } catch (e) {
    console.error('Compression failed:', e.message);
    return filePath;
  }
}

function cleanupOldLogs() {
  const now = Date.now();
  const maxAge = RETENTION_DAYS * 24 * 60 * 60 * 1000;
  
  const files = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.log') || f.endsWith('.log.gz'))
    .map(f => ({
      name: f,
      path: path.join(ARCHIVE_DIR, f),
      mtime: fs.statSync(path.join(ARCHIVE_DIR, f)).mtime
    }));
  
  let deletedCount = 0;
  let freedSpace = 0;
  
  files.forEach(file => {
    if (now - file.mtime.getTime() > maxAge) {
      const size = fs.statSync(file.path).size;
      fs.unlinkSync(file.path);
      deletedCount++;
      freedSpace += size;
    }
  });
  
  if (deletedCount > 0) {
    const freedMB = (freedSpace / (1024 * 1024)).toFixed(2);
    console.log(`[${new Date().toISOString()}] Cleanup: deleted ${deletedCount} files, freed ${freedMB}MB`);
  }
}

async function runRotation() {
  console.log('='.repeat(50));
  console.log(`[${new Date().toISOString()}] Log Rotation Started`);
  console.log('='.repeat(50));
  
  // Ensure directories exist
  [LOG_DIR, ARCHIVE_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  // Get log files
  const files = getFiles(LOG_DIR);
  const maxSize = MAX_SIZE_MB * 1024 * 1024;
  
  let rotatedCount = 0;
  let compressedCount = 0;
  
  files.forEach(file => {
    // Rotate if over size limit
    if (file.size > maxSize) {
      const rotatedPath = rotateLog(file);
      rotatedCount++;
      
      // Compress immediately
      compressFile(rotatedPath);
      compressedCount++;
    }
  });
  
  // Compress old uncompressed logs
  const archiveFiles = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.log') && !f.endsWith('.gz'))
    .forEach(f => {
      const filePath = path.join(ARCHIVE_DIR, f);
      const mtime = fs.statSync(filePath).mtime;
      const age = Date.now() - mtime.getTime();
      
      if (age > COMPRESS_AFTER_DAYS * 24 * 60 * 60 * 1000) {
        compressFile(filePath);
        compressedCount++;
      }
    });
  
  // Cleanup old logs
  cleanupOldLogs();
  
  // Report
  const stats = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.gz'))
    .reduce((acc, f) => {
      acc.count++;
      acc.size += fs.statSync(path.join(ARCHIVE_DIR, f)).size;
      return acc;
    }, { count: 0, size: 0 });
  
  console.log('='.repeat(50));
  console.log(`Summary:`);
  console.log(`  Rotated: ${rotatedCount} files`);
  console.log(`  Compressed: ${compressedCount} files`);
  console.log(`  Archived: ${stats.count} files (${(stats.size / (1024*1024)).toFixed(2)}MB)`);
  console.log('='.repeat(50));
}

function getStats() {
  const files = fs.readdirSync(ARCHIVE_DIR)
    .filter(f => f.endsWith('.gz'))
    .map(f => fs.statSync(path.join(ARCHIVE_DIR, f)));
  
  const totalSize = files.reduce((sum, f) => sum + f.size, 0);
  const oldest = files.length > 0 
    ? new Date(Math.min(...files.map(f => f.mtime.getTime()))).toISOString()
    : 'N/A';
  const newest = files.length > 0
    ? new Date(Math.max(...files.map(f => f.mtime.getTime()))).toISOString()
    : 'N/A';
  
  return {
    archivedFiles: files.length,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    oldestLog: oldest,
    newestLog: newest
  };
}

// Export for use
module.exports = { runRotation, getStats };

// Run if called directly
if (require.main === module) {
  runRotation().catch(console.error);
}
```

### Logrotate Config: `/etc/logrotate.d/ecosyntech`

```
/root/ecosyntech-web/logs/*.log {
    daily
    rotate 7
    missingok
    notifempty
    compress
    delaycompress
    create 0640 root root
    postrotate
        # Signal server to reopen logs
        kill -USR1 $(cat /var/run/ecosyntech.pid 2>/dev/null) 2>/dev/null || true
    endscript
}
```

## Cấu hình (`.env`)

```bash
# Log rotation settings
LOG_DIR=./logs
LOG_ARCHIVE_DIR=./logs/archive
LOG_MAX_SIZE_MB=100
LOG_RETENTION_DAYS=30
COMPRESS_AFTER_DAYS=1
```

## Monitoring

```bash
# Kiểm tra disk usage của logs
du -sh logs/archive/

# Số lượng files đã archive
find logs/archive -name "*.gz" | wc -l

# Xem log của script
./scripts/log-rotation.js 2>&1 | tee logs/rotation.log
```

## Metrics

| Metric | Description |
|--------|-------------|
| `log_rotation_count` | Số lần rotation |
| `log_compression_ratio` | Tỷ lệ nén trung bình |
| `log_storage_used_mb` | Tổng storage đã dùng |
| `log_cleanup_files_deleted` | Số files đã xóa |

## Disk Alert

```javascript
async function checkDiskSpace() {
  const { execSync } = require('child_process');
  const usage = execSync("df -h / | tail -1 | awk '{print $5}'").toString().trim();
  const percent = parseInt(usage);
  
  if (percent > 90) {
    await sendAlert(`⚠️ Disk usage critical: ${usage}`);
    await runRotation(); // Force rotation
  }
}
```

## Kết hợp với Scheduler

```json
{
  "id": "sched-log-rotation-001",
  "name": "Log Rotation",
  "interval": "1h",
  "skills": ["log-rotation"],
  "enabled": true
}
```

## Troubleshooting

| Vấn đề | Giải pháp |
|---------|-----------|
| Disk vẫn đầy | Tăng `RETENTION_DAYS`, xóa manual archive |
| Compression fail | Kiểm tra `gzip` đã được cài |
| Permission denied | Chạy với quyền root |
| Log không xoay | Kiểm tra `MAX_SIZE_MB` có phù hợp |
