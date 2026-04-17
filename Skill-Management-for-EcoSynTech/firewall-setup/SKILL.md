---
name: firewall-setup
description: "Configure firewall and security rules for EcoSynTech"
user-invocable: true
agent: explore
---

# Firewall Setup Skill for EcoSynTech-web

Configure security rules and firewall.

## 1. UFW Firewall (Ubuntu/Debian)

### Default Rules
```bash
# Default deny incoming
ufw default deny incoming
# Default allow outgoing  
ufw default allow outgoing
```

### Allow Rules
```bash
# SSH (limited attempts)
ufw limit 22/tcp comment 'SSH with rate limit'

# HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# MQTT (internal only)
ufw allow from 192.168.1.0/24 port 1883 comment 'MQTT internal'

# Node.js app
ufw allow 3000/tcp comment 'EcoSynTech API'

# Prometheus
ufw allow 9090/tcp comment 'Prometheus'
```

### Block Rules
```bash
# Block common attack ports
ufw deny 23/tcp    # Telnet
ufw deny 135/tcp   # MSRPC
ufw deny 139/tcp   # NetBIOS
ufw deny 445/tcp    # SMB
```

## 2. IPtables Rules

### Basic Protection
```bash
# Drop spoofed packets
iptables -A INPUT -s 127.0.0.0/8 -j DROP

# Drop land attack
iptables -A INPUT -p tcp -m tcp --tcp-flags SYN,RST SYN,RST -j DROP

# Rate limiting
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --set
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 -j DROP
```

## 3. Fail2ban Configuration

```ini
# /etc/fail2ban/jail.local
[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[sshd]
enabled = true
port = ssh
filter = sshd
maxretry = 3
bantime = 7200
```

## 4. Allowed IPs

```yaml
# config/allowed_ips.yml
admin:
  - 127.0.0.1
  - 192.168.1.0/24  # Local network
  
partners:
  - 203.0.113.0/24  # Partner VPN
  
iot_devices:
  - 10.0.0.0/8     # IoT network
  - 192.168.5.0/24 # Sensor network
```

## 5. Security Check

```bash
# Check open ports
ss -tulpn

# Check firewall status
ufw status verbose

# Check blocked IPs
fail2ban-client status sshd

# Check recent attacks
tail -100 /var/log/auth.log | grep 'Failed'
```

Execute:

```
## Firewall Configuration

### Current Rules
| Port | Service | Status | Policy |
|------|---------|--------|--------|
| 22 | SSH | RATE-LIMITED | ALLOW |
| 80 | HTTP | ALLOW |
| 443 | HTTPS | ALLOW |
| 1883 | MQTT | INTERNAL | ALLOW |
| 3000 | EcoSynTech | ALLOW |

### Blocked IPs
- Total blocked: 12
- Last 24h: 3

### Security Headers
| Header | Status |
|--------|--------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | NOSNIFF |
| X-XSS-Protection | ENABLED |
| HSTS | ENABLED |

### Actions
[ ] Review blocked IPs
[ ] Update allowed list
[ ] Enable fail2ban
[ ] Check logs for attacks
```