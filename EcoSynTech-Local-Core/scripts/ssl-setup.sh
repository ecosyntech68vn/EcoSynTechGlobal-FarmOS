#!/bin/bash
# EcoSynTech - SSL Setup Script
# Auto setup SSL với Let's Encrypt

set -e

# ==========================================
# CONFIGURATION
# ==========================================
DOMAIN=""
EMAIL=""
SSL_DIR="/etc/letsencrypt/live"
NGINX_SSL_CONFIG="/etc/nginx/sites-available/ecosyntech-ssl"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[SSL]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ==========================================
# CHECK REQUIREMENTS
# ==========================================

check_requirements() {
    log "Checking requirements..."
    
    if [ "$EUID" -ne 0 ]; then
        log_error "Please run as root (sudo)"
        exit 1
    fi
    
    # Check nginx
    if ! command -v nginx &> /dev/null; then
        log_error "Nginx not installed"
        echo "Install: sudo apt install nginx"
        exit 1
    fi
    
    # Check certbot
    if ! command -v certbot &> /dev/null; then
        log_error "Certbot not installed"
        echo "Install: sudo apt install certbot python3-certbot-nginx"
        exit 1
    fi
    
    log "All requirements met"
}

# ==========================================
# DNS SETUP
# ==========================================

verify_dns() {
    log "Verifying DNS for $DOMAIN..."
    
    # Check A record
    local ip=$(dig +short A "$DOMAIN" | tail -1)
    local current_ip=$(curl -s ifconfig.me)
    
    if [ "$ip" != "$current_ip" ]; then
        log_error "DNS not pointing to this server"
        echo "Current IP: $current_ip"
        echo "DNS A record: $ip"
        echo "Please update DNS A record to: $current_ip"
        exit 1
    fi
    
    log "DNS verified"
}

# ==========================================
# OBTAIN SSL CERTIFICATE
# ==========================================

obtain_cert() {
    log "Obtaining SSL certificate for $DOMAIN..."
    
    certbot certonly --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
        --agree-tos --email "$EMAIL" --non-interactive \
        --rsa-key-size 4096 \
        --deploy-hook "systemctl reload nginx"
    
    if [ -d "$SSL_DIR/$DOMAIN" ]; then
        log "Certificate obtained successfully"
    else
        log_error "Failed to obtain certificate"
        exit 1
    fi
}

# ==========================================
# NGINX SSL CONFIG
# ==========================================

create_nginx_config() {
    log "Creating Nginx SSL configuration..."
    
    cat > "$NGINX_SSL_CONFIG" << EOF
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Certificate
    ssl_certificate $SSL_DIR/$DOMAIN/fullchain.pem;
    ssl_certificate_key $SSL_DIR/$DOMAIN/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }

    access_log /var/log/nginx/${DOMAIN}_access.log;
    error_log /var/log/nginx/${DOMAIN}_error.log;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$host\$request_uri;
}
EOF
    
    # Enable site
    ln -sf "$NGINX_SSL_CONFIG" "/etc/nginx/sites-enabled/"
    
    # Test and reload
    nginx -t && systemctl reload nginx
    
    log "Nginx configured"
}

# ==========================================
# AUTO RENEWAL
# ==========================================

setup_renewal() {
    log "Setting up auto-renewal..."
    
    # Add to crontab
    (crontab -l 2>/dev/null | grep -v "certbot renew"; echo "0 2 * * * certbot renew --quiet --deploy-hook 'systemctl reload nginx'") | crontab -
    
    # Test renewal
    certbot renew --dry-run
    
    log "Auto-renewal configured (runs daily at 2am)"
}

# ==========================================
# MAIN
# ==========================================

main() {
    if [ -z "$DOMAIN" ]; then
        read -p "Enter your domain (e.g., example.com): " DOMAIN
    fi
    
    if [ -z "$EMAIL" ]; then
        read -p "Enter your email: " EMAIL
    fi
    
    echo ""
    echo "========================================"
    echo "SSL Setup for $DOMAIN"
    echo "========================================"
    
    verify_dns
    obtain_cert
    create_nginx_config
    setup_renewal
    
    echo ""
    echo "========================================"
    echo "SSL SETUP COMPLETE!"
    echo "========================================"
    echo ""
    echo "Your site is now available at:"
    echo "  https://$DOMAIN"
    echo ""
    echo "Certificate will auto-renew on: $(certbot renew --quiet --dry-run 2>&1 | grep "next renewal" || echo "See crontab")"
}

main "$@"