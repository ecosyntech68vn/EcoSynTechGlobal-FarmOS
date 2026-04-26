#!/bin/bash
set -e

# EcoSynTech Deployment Script
# Usage: ./deploy.sh [start|stop|restart|build|logs|refresh]

APP_NAME="ecosyntech"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_env() {
    if [ ! -f .env.production ]; then
        log_error ".env.production not found!"
        log_info "Copy .env.production.example to .env.production and update values"
        exit 1
    fi
    
    if grep -q "CHANGE_ME" .env.production; then
        log_error "Please update CHANGE_ME values in .env.production"
        exit 1
    fi
}

case "${1:-}" in
    start)
        log_info "Starting $APP_NAME..."
        check_env
        docker-compose -f $COMPOSE_FILE up -d
        log_info "Started! Visit http://localhost"
        ;;
    
    stop)
        log_info "Stopping $APP_NAME..."
        docker-compose -f $COMPOSE_FILE down
        log_info "Stopped!"
        ;;
    
    restart)
        log_info "Restarting $APP_NAME..."
        docker-compose -f $COMPOSE_FILE restart
        log_info "Restarted!"
        ;;
    
    build)
        log_info "Building $APP_NAME..."
        docker-compose -f $COMPOSE_FILE build --no-cache
        log_info "Built!"
        ;;
    
    logs)
        docker-compose -f $COMPOSE_FILE logs -f --tail=50
        ;;
    
    refresh)
        log_info "Pulling latest code..."
        git pull origin main
        log_info "Building..."
        docker-compose -f $COMPOSE_FILE build
        log_info "Restarting..."
        docker-compose -f $COMPOSE_FILE up -d --force-recreate
        log_info "Done! Check with: docker-compose -f $COMPOSE_FILE ps"
        ;;
    
    status)
        docker-compose -f $COMPOSE_FILE ps
        ;;
    
    health)
        curl -sf http://localhost/api/health || log_error "Health check failed!"
        ;;
    
    *)
        echo "Usage: $0 {start|stop|restart|build|logs|refresh|status|health}"
        exit 1
        ;;
esac