---
name: ssl-manager
description: "Manage SSL certificates, Let's Encrypt renewals"
user-invocable: true
agent: explore
---

# SSL Manager Skill for EcoSynTech

Manage SSL certificates and renewals.

## 1. Check Certificate Status

```bash
# Check expiry
openssl x509 -enddate -noout -in certs/server.crt

# Check days remaining
certbot certificates
```

## 2. Install Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d example.com -d www.example.com
```

## 3. Auto-Renewal

```yaml
# crontab - renew at 3am daily
0 3 * * * certbot renew --quiet --deploy-hook "pm2 restart ecosyntech"
```

## 4. Manual Renew

```bash
# Dry run first
certbot renew --dry-run

# Actually renew
certbot renew

# Restart service
pm2 restart ecosyntech
```

Execute:

```
## SSL Status

### Current Certificate
- Domain: ecosyntech.com
- Valid until: 2026-07-15 (89 days)
- Issuer: Let's Encrypt
- Auto-renew: ENABLED

### Actions
[ ] Renew Now
[ ] Install New Domain
[ ] View Certificate Details
[ ] Configure Auto-Renewal
```