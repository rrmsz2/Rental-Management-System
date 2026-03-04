#!/bin/bash

# Safe Deployment Script - For servers with existing containers
# This script ensures no conflicts with existing services

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.production.yml"
APP_PORT=8001
MONGO_PORT=27027

# Functions
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo "=========================================="
echo "   Safe Deployment for Production Server"
echo "=========================================="
echo ""

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
   print_warning "Running as root is not recommended. Consider using a regular user with docker permissions."
fi

# Step 1: Check prerequisites
print_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

print_success "Docker and Docker Compose are installed"

# Step 2: Check for port conflicts
print_info "Checking for port conflicts..."

check_port() {
    local port=$1
    local name=$2

    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_error "Port $port is already in use (needed for $name)"
        print_info "Current process using port $port:"
        lsof -Pi :$port
        return 1
    else
        print_success "Port $port is available for $name"
        return 0
    fi
}

PORT_CONFLICTS=0
check_port $APP_PORT "Application" || PORT_CONFLICTS=1
check_port $MONGO_PORT "MongoDB" || PORT_CONFLICTS=1

if [ $PORT_CONFLICTS -eq 1 ]; then
    print_error "Port conflicts detected. Please resolve before continuing."
    print_info "You can change ports in $COMPOSE_FILE"
    exit 1
fi

# Step 3: Check for existing rental containers
print_info "Checking for existing rental containers..."

EXISTING_CONTAINERS=$(docker ps -a --filter "name=rental" --format "{{.Names}}" 2>/dev/null || true)
if [ ! -z "$EXISTING_CONTAINERS" ]; then
    print_warning "Found existing rental containers:"
    echo "$EXISTING_CONTAINERS"
    read -p "Do you want to stop and remove them? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f $COMPOSE_FILE down
        print_success "Existing containers removed"
    fi
fi

# Step 4: Check environment file
print_info "Checking environment configuration..."

if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        print_warning "Creating .env from .env.production template..."
        cp .env.production .env
        print_warning "Please edit .env file with your production values!"
        ${EDITOR:-nano} .env
    else
        print_error "No .env file found!"
        exit 1
    fi
fi

# Validate critical environment variables
source .env
MISSING_VARS=0

check_env_var() {
    local var_name=$1
    local var_value=${!var_name}

    if [ -z "$var_value" ] || [ "$var_value" = "changeme" ] || [ "$var_value" = "CHANGE_THIS" ]; then
        print_error "$var_name is not set or contains default value"
        MISSING_VARS=1
    else
        print_success "$var_name is configured"
    fi
}

check_env_var "MONGO_ROOT_PASSWORD"
check_env_var "JWT_SECRET"
check_env_var "ADMIN_PASSWORD"

if [ $MISSING_VARS -eq 1 ]; then
    print_error "Critical environment variables missing or contain default values!"
    print_info "Edit .env file and set proper values"
    exit 1
fi

# Step 5: Build and deploy
echo ""
print_info "Ready to deploy. This will:"
echo "  1. Build the application image"
echo "  2. Start MongoDB on port $MONGO_PORT"
echo "  3. Start the application on port $APP_PORT"
echo "  4. Create network: rental_management_network"
echo ""

read -p "Continue with deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled"
    exit 1
fi

# Deploy
print_info "Building and starting containers..."
docker-compose -f $COMPOSE_FILE up -d --build

# Wait for services
print_info "Waiting for services to start..."
sleep 10

# Health check
print_info "Performing health check..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://127.0.0.1:$APP_PORT/api/health &> /dev/null; then
        print_success "Application is healthy!"
        break
    else
        echo -n "."
        sleep 2
        RETRY_COUNT=$((RETRY_COUNT + 1))
    fi
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_error "Health check failed after $MAX_RETRIES attempts"
    print_info "Checking logs..."
    docker-compose -f $COMPOSE_FILE logs --tail 50
    exit 1
fi

# Step 6: Show summary
echo ""
echo "=========================================="
print_success "Deployment completed successfully!"
echo "=========================================="
echo ""

print_info "Container Status:"
docker ps --filter "name=rental" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
print_info "Access URLs:"
echo "  Internal API: http://127.0.0.1:$APP_PORT"
echo "  Health Check: http://127.0.0.1:$APP_PORT/api/health"
echo "  API Docs: http://127.0.0.1:$APP_PORT/docs"

echo ""
print_warning "Next Steps:"
echo "  1. Configure your existing Nginx:"
echo "     sudo cp nginx-site-config.conf /etc/nginx/sites-available/rental"
echo "     sudo ln -s /etc/nginx/sites-available/rental /etc/nginx/sites-enabled/"
echo "     sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "  2. Set up automated backups:"
echo "     chmod +x backup.sh"
echo "     crontab -e  # Add: 0 2 * * * /path/to/backup.sh"
echo ""
echo "  3. Monitor logs:"
echo "     docker-compose -f $COMPOSE_FILE logs -f"

echo ""
print_info "Useful Commands:"
echo "  Stop:    docker-compose -f $COMPOSE_FILE stop"
echo "  Restart: docker-compose -f $COMPOSE_FILE restart"
echo "  Logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo "  Remove:  docker-compose -f $COMPOSE_FILE down"

echo ""
echo "=========================================="