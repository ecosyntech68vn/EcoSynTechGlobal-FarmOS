# SSL Auto-Renew Skill

Tự động renew SSL certificates trước khi hết hạn để tránh downtime và security issues.

## Mục tiêu

- Tự động phát hiện certificates sắp hết hạn
- Renew certificates không cần downtime
- Backup certificates cũ trước khi renew
- Gửi cảnh báo trước khi hết hạn

## Chức năng chính

### 1. Certificate Check
```bash
# Kiểm tra ngày hết hạn
openssl x509 -in cert.pem -noout -dates
```

### 2. Auto-Renew
```bash
# Renew với Let's Encrypt
certbot renew --quiet
```

### 3. Deployment
```bash
# Reload nginx/apache sau khi renew
systemctl reload nginx
```

## Triển khai

### Script: `scripts/ssl-auto-renew.js`

```javascript
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const SSL_DIR = process.env.SSL_DIR || '/etc/ssl/certs';
const BACKUP_DIR = process.env.SSL_BACKUP_DIR || '/root/ssl-backup';
const RENEW_BEFORE_DAYS = parseInt(process.env.RENEW_BEFORE_DAYS) || 30;
const LETSENCRYPT_EMAIL = process.env.LETSENCRYPT_EMAIL || '';
const DOMAIN = process.env.SSL_DOMAIN || 'ecosyntech.com';

const report = {
  timestamp: new Date().toISOString(),
  certificates: [],
  renewed: [],
  warnings: [],
  errors: []
};

function getDaysUntilExpiry(dateStr) {
  const expiry = new Date(dateStr);
  const now = new Date();
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
}

function parseCertificate(certPath) {
  try {
    const output = execSync(`openssl x509 -in "${certPath}" -noout -dates -subject 2>/dev/null`, {
      encoding: 'utf8'
    });
    
    const lines = output.split('\n');
    const cert = {
      path: certPath,
      filename: path.basename(certPath)
    };
    
    lines.forEach(line => {
      if (line.includes('notBefore=')) {
        cert.validFrom = line.split('=')[1];
      }
      if (line.includes('notAfter=')) {
        cert.validTo = line.split('=')[1];
        cert.daysUntilExpiry = getDaysUntilExpiry(cert.validTo);
      }
      if (line.includes('subject=')) {
        const cnMatch = line.match(/CN\s*=\s*([^\s,]+)/);
        if (cnMatch) cert.commonName = cnMatch[1];
      }
    });
    
    return cert;
  } catch (e) {
    return null;
  }
}

function getAllCertificates(dir) {
  const certs = [];
  
  if (!fs.existsSync(dir)) {
    console.log(`SSL directory not found: ${dir}`);
    return certs;
  }
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file.endsWith('.pem') || file.endsWith('.crt') || file.endsWith('.cer')) {
      const certPath = path.join(dir, file);
      const cert = parseCertificate(certPath);
      if (cert) certs.push(cert);
    }
  });
  
  return certs;
}

function backupCertificate(cert) {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${cert.filename}.backup.${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  fs.copyFileSync(cert.path, backupPath);
  console.log(`Backed up: ${cert.filename} -> ${backupName}`);
  
  return backupPath;
}

async function renewCertificate(cert) {
  console.log(`Attempting to renew: ${cert.filename}`);
  
  try {
    // Backup first
    backupCertificate(cert);
    
    // Method 1: Let's Encrypt with certbot
    if (LETSENCRYPT_EMAIL && DOMAIN) {
      try {
        execSync(`certbot certonly --webroot -w /var/www/html -d ${DOMAIN} --email ${LETSENCRYPT_EMAIL} --renew-by-default --quiet`, {
          stdio: 'inherit'
        });
        
        // Copy renewed cert
        const renewedPath = `/etc/letsencrypt/live/${DOMAIN}/fullchain.pem`;
        if (fs.existsSync(renewedPath)) {
          fs.copyFileSync(renewedPath, cert.path);
          console.log(`Renewed using Let's Encrypt: ${cert.filename}`);
          report.renewed.push(cert.filename);
          return true;
        }
      } catch (e) {
        console.log('certbot renewal failed, trying acme.sh...');
      }
    }
    
    // Method 2: acme.sh
    try {
      execSync(`/root/.acme.sh/acme.sh --renew -d ${cert.commonName || DOMAIN} --force`, {
        stdio: 'inherit'
      });
      console.log(`Renewed using acme.sh: ${cert.filename}`);
      report.renewed.push(cert.filename);
      return true;
    } catch (e) {
      // acme.sh also failed
    }
    
    report.errors.push(`Failed to renew: ${cert.filename}`);
    return false;
  } catch (error) {
    console.error(`Renewal error for ${cert.filename}:`, error.message);
    report.errors.push(`${cert.filename}: ${error.message}`);
    return false;
  }
}

async function reloadWebServer() {
  const servers = ['nginx', 'apache2', 'httpd'];
  
  for (const server of servers) {
    try {
      const isActive = execSync(`systemctl is-active ${server}`, { encoding: 'utf8' }).trim();
      if (isActive === 'active') {
        execSync(`systemctl reload ${server}`);
        console.log(`Reloaded ${server}`);
        
        // Verify reload
        await sleep(2000);
        const isRunning = execSync(`systemctl is-active ${server}`, { encoding: 'utf8' }).trim();
        if (isRunning === 'active') {
          console.log(`✓ ${server} reloaded successfully`);
          return true;
        }
      }
    } catch (e) {
      // Server not active, try next
    }
  }
  
  console.log('No web server reload needed or possible');
  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function renewExpiringCertificates() {
  console.log('='.repeat(60));
  console.log(`[${new Date().toISOString()}] SSL Certificate Check`);
  console.log('='.repeat(60));
  
  // Check all certificates
  const certs = getAllCertificates(SSL_DIR);
  console.log(`Found ${certs.length} certificate(s)\n`);
  
  for (const cert of certs) {
    console.log(`Certificate: ${cert.filename}`);
    console.log(`  CN: ${cert.commonName || 'N/A'}`);
    console.log(`  Valid Until: ${cert.validTo}`);
    console.log(`  Days Until Expiry: ${cert.daysUntilExpiry}`);
    
    if (cert.daysUntilExpiry <= 0) {
      // Already expired!
      console.log('  ⚠️  EXPIRED!');
      report.warnings.push(`${cert.filename}: EXPIRED`);
    } else if (cert.daysUntilExpiry <= RENEW_BEFORE_DAYS) {
      // Needs renewal
      console.log(`  ⚠️  Expiring soon, attempting renewal...`);
      await renewCertificate(cert);
    } else {
      console.log('  ✓ OK');
    }
    console.log('');
  }
  
  // Reload web server if any certs were renewed
  if (report.renewed.length > 0) {
    console.log('Reloading web server...');
    await reloadWebServer();
  }
  
  // Print summary
  console.log('-'.repeat(60));
  console.log('Summary:');
  console.log(`  Total Certificates: ${certs.length}`);
  console.log(`  Valid: ${certs.filter(c => c.daysUntilExpiry > RENEW_BEFORE_DAYS).length}`);
  console.log(`  Expiring Soon: ${certs.filter(c => c.daysUntilExpiry <= RENEW_BEFORE_DAYS && c.daysUntilExpiry > 0).length}`);
  console.log(`  Expired: ${certs.filter(c => c.daysUntilExpiry <= 0).length}`);
  console.log(`  Renewed: ${report.renewed.length}`);
  console.log(`  Errors: ${report.errors.length}`);
  console.log('='.repeat(60));
  
  // Save report
  saveReport(report);
  
  // Send alerts if needed
  if (report.warnings.length > 0 || report.errors.length > 0) {
    await sendAlert(report);
  }
  
  return report;
}

function saveReport(report) {
  const reportDir = './logs/ssl-health';
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const filename = `ssl-${new Date().toISOString().split('T')[0]}.json`;
  fs.writeFileSync(
    path.join(reportDir, filename),
    JSON.stringify(report, null, 2)
  );
}

async function sendAlert(report) {
  let message = `🔒 *SSL Certificate Alert*\n\n`;
  message += `Time: ${report.timestamp}\n\n`;
  
  if (report.warnings.length > 0) {
    message += `⚠️ *Warnings:*\n`;
    report.warnings.forEach(w => message += `• ${w}\n`);
    message += '\n';
  }
  
  if (report.errors.length > 0) {
    message += `❌ *Errors:*\n`;
    report.errors.forEach(e => message += `• ${e}\n`);
  }
  
  console.log('Alert:', message);
  // await sendTelegram(message);
}

// Run if called directly
if (require.main === module) {
  renewExpiringCertificates()
    .then(report => {
      process.exit(report.errors.length > 0 ? 1 : 0);
    })
    .catch(err => {
      console.error('SSL check failed:', err);
      process.exit(1);
    });
}

module.exports = { renewExpiringCertificates, getAllCertificates };
```

## Manual Commands

```bash
# Check certificate
openssl x509 -in /etc/ssl/certs/server.crt -noout -dates

# Renew with certbot
certbot renew --dry-run

# Force renew
certbot renew --force-renewal

# Check Let's Encrypt
certbot certificates
```

## Cấu hình (`.env`)

```bash
# SSL settings
SSL_DIR=/etc/ssl/certs
SSL_BACKUP_DIR=/root/ssl-backup
RENEW_BEFORE_DAYS=30
LETSENCRYPT_EMAIL=admin@ecosyntech.com
SSL_DOMAIN=ecosyntech.com
```

## Cron Job

```bash
# Add to crontab
0 0 * * * /usr/bin/node /root/ecosyntech-web/scripts/ssl-auto-renew.js >> /var/log/ssl-renewal.log 2>&1
```

## Metrics

| Metric | Description |
|--------|-------------|
| `ssl_certs_total` | Tổng số certificates |
| `ssl_certs_expiring_soon` | Số certs sắp hết hạn |
| `ssl_certs_expired` | Số certs đã hết hạn |
| `ssl_renewals_success` | Số lần renew thành công |
| `ssl_renewals_failed` | Số lần renew thất bại |

## Kết hợp với Scheduler

```json
{
  "id": "sched-ssl-renew-001",
  "name": "SSL Certificate Check",
  "interval": "1d",
  "skills": ["ssl-auto-renew"],
  "enabled": true
}
```

## Troubleshooting

| Vấn đề | Giải pháp |
|---------|-----------|
| certbot not found | Cài đặt: `apt install certbot` |
| Renewal failed | Kiểm tra DNS, firewall, port 80/443 |
| Web server not reloaded | Kiểm tra systemctl permissions |
| Permission denied | Chạy với quyền root |
