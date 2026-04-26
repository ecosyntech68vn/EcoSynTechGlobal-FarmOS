#!/bin/bash
# EcoSynTech - Auto Backup Script
# Tự động backup dữ liệu và đẩy lên cloud storage
# 
# Cron setup (chạy hàng ngày lúc 2h sáng):
#   crontab -e
#   0 2 * * * /path/to/auto-backup.sh

set -e

# ==========================================
# CONFIGURATION
# ==========================================
APP_NAME="EcoSynTech Local Core"
VERSION="3.0.0"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./data/backups"
DATA_DIR="./data"
LOG_FILE="./logs/backup.log"

# Cloud storage config (tùy chọn)
S3_ENABLED=false
S3_BUCKET=""
S3_REGION="ap-southeast-1"
DROPBOX_ENABLED=false
DROPBOX_TOKEN=""
GDRIVE_ENABLED=false
GDRIVE_FOLDER_ID=""

# Retention
DAILY_RETENTION=7    # Giữ 7 bản daily
WEEKLY_RETENTION=4     # Giữ 4 bản weekly
MONTHLY_RETENTION=12   # Giữ 12 bản monthly

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ==========================================
# FUNCTIONS
# ==========================================

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN:${NC} $1" | tee -a "$LOG_FILE"
}

load_config() {
    # Load from .env if exists
    if [ -f .env ]; then
        source .env
    fi
    
    # Override with defaults
    BACKUP_DIR=${BACKUP_DIR:-"./data/backups"}
    DATA_DIR=${DATA_DIR:-"./data"}
    S3_ENABLED=${S3_ENABLED:-false}
    DROPBOX_ENABLED=${DROPBOX_ENABLED:-false}
}

create_backup() {
    local backup_name="ecosyntech_backup_${TIMESTAMP}"
    local backup_path="${BACKUP_DIR}/${backup_name}"
    
    log "Creating backup: ${backup_name}"
    
    # Create backup directory
    mkdir -p "$backup_path"
    
    # Backup database
    if [ -f "$DATA_DIR/ecosyntech.db" ]; then
        log "Backing up database..."
        cp "$DATA_DIR/ecosyntech.db" "${backup_path}/ecosyntech.db"
        gzip "${backup_path}/ecosyntech.db"
    fi
    
    # Backup config files
    log "Backing up configuration..."
    cp .env "${backup_path}/.env" 2>/dev/null || true
    cp package.json "${backup_path}/" 2>/dev/null || true
    
    # Backup logs
    if [ -d "./logs" ]; then
        log "Backing up recent logs..."
        cp -r ./logs "${backup_path}/"logs 2>/dev/null || true
    fi
    
    # Get sizes
    local size=$(du -sh "$backup_path" | cut -f1)
    log "Backup created: ${size}"
    
    echo "$backup_path"
}

backup_to_s3() {
    local backup_path=$1
    local bucket=$S3_BUCKET
    
    if [ "$S3_ENABLED" = "false" ]; then
        log_warn "S3 not enabled - skipping"
        return 1
    fi
    
    log "Uploading to S3: $bucket"
    
    if command -v aws &> /dev/null; then
        aws s3 sync "$backup_path" "s3://$bucket/backups/${TIMESTAMP}/"
        log "Uploaded to S3 successfully"
    else
        log_warn "AWS CLI not installed - install with: pip install awscli"
        return 1
    fi
}

backup_to_dropbox() {
    local backup_path=$1
    
    if [ "$DROPBOX_ENABLED" = "false" ]; then
        log_warn "Dropbox not enabled - skipping"
        return 1
    fi
    
    log "Uploading to Dropbox..."
    
    if command -v curl &> /dev/null; then
        # Use Dropbox Uploader script
        if [ -f "./scripts/dropbox_uploader.sh" ]; then
            ./scripts/dropbox_uploader.sh upload "$backup_path" "/backups/${TIMESTAMP}/"
            log "Uploaded to Dropbox successfully"
        else
            log_warn "Dropbox uploader not found"
        fi
    fi
}

backup_to_google_drive() {
    local backup_path=$1
    
    if [ "$GDRIVE_ENABLED" = "false" ]; then
        log_warn "Google Drive not enabled - skipping"
        return 1
    fi
    
    log "Uploading to Google Drive..."
    
    if command -v gdrive &> /dev/null; then
        gdrive upload --recursive "$backup_path" --parent "$GDRIVE_FOLDER_ID"
        log "Uploaded to Google Drive successfully"
    else
        log_warn "gdrive CLI not installed"
    fi
}

cleanup_old_backups() {
    log "Cleaning up old backups..."
    
    # Find and delete old daily backups
    find "$BACKUP_DIR" -name "ecosyntech_backup_*" -type d -mtime +$DAILY_RETENTION -exec rm -rf {} \; 2>/dev/null || true
    
    local remaining=$(find "$BACKUP_DIR" -name "ecosyntech_backup_*" -type d | wc -l)
    log "Remaining backups: $remaining"
}

send_notification() {
    local status=$1
    local message=$2
    
    # Telegram notification
    if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_CHAT_ID}&text=${APP_NAME} Backup: ${status} - ${message}" \
            > /dev/null 2>&1 || true
    fi
    
    # Log file notification
    log "$message"
}

# ==========================================
# MAIN
# ==========================================

main() {
    log "=========================================="
    log "$APP_NAME V$VERSION - Auto Backup"
    log "=========================================="
    
    # Load configuration
    load_config
    
    # Create directories
    mkdir -p "$BACKUP_DIR" "$DATA_DIR" ./logs
    
    # Create backup
    local backup_path=$(create_backup)
    
    # Upload to cloud (optional)
    if [ "$S3_ENABLED" = "true" ]; then
        backup_to_s3 "$backup_path"
    fi
    
    if [ "$DROPBOX_ENABLED" = "true" ]; then
        backup_to_dropbox "$backup_path"
    fi
    
    if [ "$GDRIVE_ENABLED" = "true" ]; then
        backup_to_google_drive "$backup_path"
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Send notification
    send_notification "SUCCESS" "Backup completed: $(du -sh "$backup_path" | cut -f1)"
    
    log "=========================================="
    log "BACKUP COMPLETED"
    log "=========================================="
}

# Run main
main "$@"

# Restore database (if needed)
# Usage: ./auto-backup.sh --restore backup_YYYYMMDD_HHMMSS
if [ "$1" = "--restore" ]; then
    backup_name="ecosyntech_backup_$2"
    if [ -d "$BACKUP_DIR/$backup_name" ]; then
        log "Restoring from $backup_name..."
        cp "$BACKUP_DIR/$backup_name/ecosyntech.db" "$DATA_DIR/ecosyntech.db"
        gunzip "$DATA_DIR/ecosyntech.db" 2>/dev/null || true
        log "Restore completed"
    else
        log_error "Backup not found: $backup_name"
    fi
fi