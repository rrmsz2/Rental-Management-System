#!/bin/bash

# Backup Script for Rental Management System

set -e

# Configuration
BACKUP_BASE_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/$TIMESTAMP"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "=========================================="
echo "   Rental Management System Backup"
echo "   Timestamp: $TIMESTAMP"
echo "=========================================="
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup MongoDB
print_warning "Backing up MongoDB database..."
docker exec rental-mongodb mongodump --archive=/tmp/mongodb_backup.archive --gzip 2>/dev/null || {
    print_error "MongoDB backup failed"
    exit 1
}
docker cp rental-mongodb:/tmp/mongodb_backup.archive "$BACKUP_DIR/mongodb_backup.archive"
docker exec rental-mongodb rm /tmp/mongodb_backup.archive
print_success "MongoDB backup completed"

# Backup environment file
if [ -f .env ]; then
    print_warning "Backing up environment configuration..."
    cp .env "$BACKUP_DIR/env_backup"
    print_success "Environment backup completed"
fi

# Backup uploaded files (if any)
if [ -d "uploads" ]; then
    print_warning "Backing up uploaded files..."
    tar -czf "$BACKUP_DIR/uploads_backup.tar.gz" uploads/
    print_success "Uploads backup completed"
fi

# Create backup info file
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Backup Information
==================
Date: $(date)
Type: Full Backup
MongoDB: Yes
Environment: Yes
Uploads: $([ -d "uploads" ] && echo "Yes" || echo "No")

Restore Instructions:
1. Stop the application: docker-compose down
2. Restore MongoDB: docker exec -i rental-mongodb mongorestore --archive --gzip < mongodb_backup.archive
3. Restore environment: cp env_backup ../.env
4. Restore uploads: tar -xzf uploads_backup.tar.gz -C ../
5. Start the application: docker-compose up -d
EOF

# Create compressed archive
print_warning "Creating compressed backup archive..."
cd "$BACKUP_BASE_DIR"
tar -czf "backup_$TIMESTAMP.tar.gz" "$TIMESTAMP/"
cd - > /dev/null
print_success "Backup archive created: $BACKUP_BASE_DIR/backup_$TIMESTAMP.tar.gz"

# Clean up old backups
print_warning "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_BASE_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \; 2>/dev/null || true
print_success "Cleanup completed"

# Calculate backup size
BACKUP_SIZE=$(du -h "$BACKUP_BASE_DIR/backup_$TIMESTAMP.tar.gz" | cut -f1)

echo ""
echo "=========================================="
print_success "Backup completed successfully!"
echo "  Location: $BACKUP_BASE_DIR/backup_$TIMESTAMP.tar.gz"
echo "  Size: $BACKUP_SIZE"
echo "=========================================="