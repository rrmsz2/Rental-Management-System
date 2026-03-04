#!/bin/bash

# Ubuntu 20.04 VPS Deployment Script
# For VPS M SSD configuration

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo "=========================================="
echo "   Rental Management System Deployment"
echo "   Ubuntu 20.04 VPS Setup"
echo "=========================================="
echo ""

# Check if running as root (we'll create a new user)
if [ "$EUID" -ne 0 ]; then
   print_error "Please run as root for initial setup"
   exit 1
fi

# Step 1: System Update and Basic Security
print_info "Updating system packages..."
apt update && apt upgrade -y

print_info "Installing essential packages..."
apt install -y \
    curl \
    wget \
    git \
    ufw \
    fail2ban \
    htop \
    nano \
    nginx \
    certbot \
    python3-certbot-nginx

# Step 2: Install Docker
if ! command -v docker &> /dev/null; then
    print_info "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_success "Docker installed"
else
    print_success "Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_info "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
else
    print_success "Docker Compose already installed"
fi

# Step 3: Create application user
print_info "Creating application user..."
if ! id -u rental_user > /dev/null 2>&1; then
    adduser --disabled-password --gecos "" rental_user
    usermod -aG docker rental_user
    usermod -aG sudo rental_user
    print_success "User 'rental_user' created"
else
    print_warning "User 'rental_user' already exists"
fi

# Step 4: Setup Firewall
print_info "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw --force enable
print_success "Firewall configured"

# Step 5: Setup Fail2ban
print_info "Configuring Fail2ban..."
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
EOF

systemctl restart fail2ban
print_success "Fail2ban configured"

# Step 6: Clone application
print_info "Setting up application directory..."
APP_DIR="/home/rental_user/rental-management"

if [ ! -d "$APP_DIR" ]; then
    sudo -u rental_user mkdir -p /home/rental_user
    cd /home/rental_user

    # Clone your repository (replace with your actual repo)
    # sudo -u rental_user git clone https://github.com/yourusername/rental-management.git

    # Or create directory structure
    sudo -u rental_user mkdir -p rental-management
    print_success "Application directory created"
else
    print_warning "Application directory already exists"
fi

# Step 7: Setup environment
print_info "Creating environment file..."
if [ ! -f "$APP_DIR/.env" ]; then
    cat > "$APP_DIR/.env" << 'EOF'
# Production Environment Configuration
ENVIRONMENT=production

# MongoDB
MONGO_URL=mongodb://rental-mongodb:27017
MONGO_ROOT_USER=rental_admin
MONGO_ROOT_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD_1
DB_NAME=rental_management

# JWT Configuration
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_64_CHARS
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Admin Account
CREATE_ADMIN=true
ADMIN_PHONE=+96812345678
ADMIN_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD_2
ADMIN_EMAIL=admin@yourcompany.om

# WhatsApp (Optional)
WHATSAPP_API_TOKEN=your-textmebot-token-here
WHATSAPP_INSTANCE_ID=your-instance-id

# CORS
CORS_ORIGINS=["http://75.119.156.14","http://localhost"]

# Application
RUN_MIGRATIONS=true
EOF
    chown rental_user:rental_user "$APP_DIR/.env"
    chmod 600 "$APP_DIR/.env"
    print_warning "Edit $APP_DIR/.env with your actual values!"
else
    print_warning "Environment file already exists"
fi

# Step 8: Create docker-compose file for VPS
print_info "Creating Docker Compose configuration..."
cat > "$APP_DIR/docker-compose.yml" << 'EOF'
version: '3.8'

networks:
  app-network:
    driver: bridge

volumes:
  mongodb_data:
  app_logs:

services:
  mongodb:
    image: mongo:7.0
    container_name: rental-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: ${DB_NAME}
    volumes:
      - mongodb_data:/data/db
    networks:
      - app-network
    ports:
      - "127.0.0.1:27017:27017"

  app:
    build:
      context: .
      dockerfile: Dockerfile.standalone
    container_name: rental-app
    restart: unless-stopped
    env_file:
      - .env
    depends_on:
      - mongodb
    networks:
      - app-network
    ports:
      - "127.0.0.1:8001:8001"
    volumes:
      - app_logs:/app/logs
EOF

chown rental_user:rental_user "$APP_DIR/docker-compose.yml"
print_success "Docker Compose configuration created"

# Step 9: Setup Nginx
print_info "Configuring Nginx..."

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create new site configuration
cat > /etc/nginx/sites-available/rental << 'EOF'
server {
    listen 80;
    server_name 75.119.156.14;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

ln -sf /etc/nginx/sites-available/rental /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
print_success "Nginx configured"

# Step 10: Create deployment script
cat > "$APP_DIR/deploy.sh" << 'EOF'
#!/bin/bash
cd /home/rental_user/rental-management
docker-compose down
docker-compose up -d --build
docker-compose logs -f
EOF

chmod +x "$APP_DIR/deploy.sh"
chown rental_user:rental_user "$APP_DIR/deploy.sh"

# Step 11: Create backup script
cat > "$APP_DIR/backup.sh" << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/rental_user/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup MongoDB
docker exec rental-mongodb mongodump --archive="$BACKUP_DIR/mongodb.archive" --gzip

# Backup environment
cp /home/rental_user/rental-management/.env "$BACKUP_DIR/"

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x "$APP_DIR/backup.sh"
chown rental_user:rental_user "$APP_DIR/backup.sh"

# Step 12: Setup cron jobs
print_info "Setting up automated tasks..."
(crontab -u rental_user -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh") | crontab -u rental_user -

# Final message
echo ""
echo "=========================================="
print_success "VPS Setup Completed!"
echo "=========================================="
echo ""
print_warning "IMPORTANT NEXT STEPS:"
echo ""
echo "1. CHANGE PASSWORDS in .env file:"
echo "   nano $APP_DIR/.env"
echo ""
echo "2. Copy your application files to:"
echo "   $APP_DIR/"
echo ""
echo "3. Switch to rental_user and deploy:"
echo "   su - rental_user"
echo "   cd rental-management"
echo "   ./deploy.sh"
echo ""
echo "4. Access your application:"
echo "   http://75.119.156.14"
echo ""
echo "5. Setup SSL (optional but recommended):"
echo "   certbot --nginx -d yourdomain.com"
echo ""
print_warning "Security Reminders:"
echo "  - Change root password: passwd"
echo "  - Setup SSH keys"
echo "  - Disable root login"
echo "  - Regular backups"
echo ""
echo "=========================================="