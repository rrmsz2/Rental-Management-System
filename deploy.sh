#!/bin/bash

# Rental Management System - Deployment Script
# This script automates the deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Header
echo "=========================================="
echo "   Rental Management System Deployment"
echo "=========================================="
echo ""

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_success "Prerequisites check passed"
echo ""

# Environment setup
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        print_warning "No .env file found. Creating from .env.production..."
        cp .env.production .env
        print_warning "Please edit .env file with your production values!"
        print_info "Opening .env in editor..."
        ${EDITOR:-nano} .env
    else
        print_error "No .env or .env.production file found!"
        exit 1
    fi
fi

# Confirm deployment
echo ""
read -p "Are you ready to deploy? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Deployment cancelled"
    exit 1
fi

# Stop existing containers
if [ "$(docker ps -q -f name=rental-)" ]; then
    print_info "Stopping existing containers..."
    docker-compose down
    print_success "Existing containers stopped"
fi

# Build and start
print_info "Building Docker images..."
docker-compose build --no-cache

print_info "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_info "Waiting for services to be ready..."
sleep 10

# Health check
print_info "Performing health check..."
if curl -f http://localhost/api/health &> /dev/null; then
    print_success "Application is healthy!"
else
    print_error "Health check failed. Checking logs..."
    docker-compose logs --tail 50 app
    exit 1
fi

# Show status
echo ""
print_success "Deployment completed successfully!"
echo ""
print_info "Services status:"
docker-compose ps

echo ""
print_info "Application URLs:"
echo "  - Frontend: http://localhost"
echo "  - API Docs: http://localhost/docs"
echo "  - Health Check: http://localhost/api/health"

echo ""
print_info "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - Stop services: docker-compose down"
echo "  - Restart services: docker-compose restart"
echo "  - Backup database: ./backup.sh"

echo ""
print_warning "Don't forget to:"
echo "  1. Set up HTTPS/SSL for production"
echo "  2. Configure firewall rules"
echo "  3. Set up automated backups"
echo "  4. Monitor logs and health"

echo ""
echo "=========================================="
print_success "Deployment complete!"
echo "=========================================="