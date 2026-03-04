#!/bin/bash

# Automated Deployment Script for Rental Management System
# This script will setup everything automatically

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
NEW_USER="rental_admin"
APP_DIR="/opt/rental-management"
DOMAIN_OR_IP="75.119.156.14"

# Functions
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_step() { echo -e "\n${CYAN}▶ $1${NC}\n"; }

# Header
clear
echo -e "${CYAN}=========================================="
echo "   🚀 RENTAL MANAGEMENT SYSTEM"
echo "      Automated Deployment Script"
echo "==========================================${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   print_error "Please run as root"
fi

# Step 1: Update System
print_step "STEP 1: Updating System Packages"
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git nano ufw fail2ban htop net-tools software-properties-common
print_success "System updated"

# Step 2: Setup Firewall
print_step "STEP 2: Configuring Firewall"
ufw --force disable
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8001/tcp
yes | ufw --force enable
print_success "Firewall configured"

# Step 3: Install Docker
print_step "STEP 3: Installing Docker"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
    print_success "Docker installed"
else
    print_warning "Docker already installed"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
else
    print_warning "Docker Compose already installed"
fi

# Step 4: Install Nginx
print_step "STEP 4: Installing and Configuring Nginx"
apt-get install -y -qq nginx
systemctl enable nginx

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Create Nginx configuration
cat > /etc/nginx/sites-available/rental << 'NGINX_EOF'
upstream rental_backend {
    server 127.0.0.1:8001;
    keepalive 32;
}

server {
    listen 80;
    server_name 75.119.156.14;

    client_max_body_size 20M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend API & Docs
    location /api {
        proxy_pass http://rental_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
        proxy_connect_timeout 90s;
        proxy_send_timeout 90s;
    }

    location /docs {
        proxy_pass http://rental_backend/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /redoc {
        proxy_pass http://rental_backend/redoc;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /openapi.json {
        proxy_pass http://rental_backend/openapi.json;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://rental_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/rental_access.log;
    error_log /var/log/nginx/rental_error.log;
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/rental /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
print_success "Nginx configured"

# Step 5: Create Application Directory
print_step "STEP 5: Setting Up Application Directory"
mkdir -p $APP_DIR
cd $APP_DIR

# Step 6: Create Backend Files
print_step "STEP 6: Creating Application Files"

# Create directory structure
mkdir -p backend frontend/build docker

# Create requirements.txt
cat > backend/requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn[standard]==0.24.0
motor==3.3.2
pymongo==4.6.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
python-dotenv==1.0.0
httpx==0.25.1
pydantic==2.5.0
pydantic-settings==2.1.0
aiofiles==23.2.1
reportlab==4.0.7
openpyxl==3.1.2
arabic-reshaper==3.0.0
python-bidi==0.4.2
qrcode[pil]==7.4.2
Pillow==10.1.0
EOF

# Create simple server.py
cat > backend/server.py << 'EOF'
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(title="Rental Management System", version="1.0.0")

# MongoDB connection
try:
    mongo_url = os.getenv("MONGO_URL", "mongodb://mongodb:27017")
    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[os.getenv("DB_NAME", "rental_management")]
except Exception as e:
    print(f"MongoDB connection error: {e}")
    db = None

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {
        "message": "Rental Management System API",
        "version": "1.0.0",
        "status": "running"
    }

@api_router.get("/health")
async def health_check():
    try:
        if db and client:
            await client.server_info()
            db_status = "healthy"
        else:
            db_status = "unhealthy"
    except Exception:
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status
    }

# Mount API router
app.include_router(api_router)

# Serve frontend build if exists
frontend_path = Path(__file__).parent.parent / "frontend" / "build"
if frontend_path.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_path / "static")), name="static")

    @app.get("/{path:path}")
    async def serve_frontend(path: str):
        if path.startswith("api/") or path in ["docs", "redoc", "openapi.json"]:
            return JSONResponse({"detail": "Not Found"}, status_code=404)

        file_path = frontend_path / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))

        return FileResponse(str(frontend_path / "index.html"))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
EOF

# Create basic frontend
mkdir -p frontend/build/static
cat > frontend/build/index.html << 'EOF'
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>نظام إدارة التأجير - Rental Management System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 3rem;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            text-align: center;
            max-width: 500px;
            margin: 20px;
        }
        h1 {
            color: #333;
            margin-bottom: 1.5rem;
            font-size: 2rem;
        }
        .status {
            display: inline-block;
            padding: 0.5rem 1rem;
            background: #10b981;
            color: white;
            border-radius: 50px;
            margin: 1rem 0;
            font-weight: bold;
        }
        .info {
            margin: 2rem 0;
            padding: 1.5rem;
            background: #f3f4f6;
            border-radius: 10px;
            text-align: left;
            direction: ltr;
        }
        .info p {
            margin: 0.5rem 0;
            color: #4b5563;
        }
        .btn {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 8px;
            margin: 0.5rem;
            transition: transform 0.2s;
        }
        .btn:hover {
            transform: translateY(-2px);
            background: #5a67d8;
        }
        .ar { direction: rtl; text-align: right; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 نظام إدارة التأجير</h1>
        <h2>Rental Management System</h2>
        <div class="status">✅ النظام يعمل - System Online</div>

        <div class="info">
            <p><strong>API Status:</strong> <span id="api-status">Checking...</span></p>
            <p><strong>Database:</strong> <span id="db-status">Checking...</span></p>
            <p><strong>Version:</strong> 1.0.0</p>
        </div>

        <div class="ar">
            <p style="margin: 2rem 0; color: #6b7280;">
                مرحباً بك في نظام إدارة التأجير<br>
                Welcome to Rental Management System
            </p>
        </div>

        <div>
            <a href="/docs" class="btn">📚 API Docs</a>
            <a href="/api/health" class="btn">🏥 Health Check</a>
        </div>
    </div>

    <script>
        fetch('/api/health')
            .then(res => res.json())
            .then(data => {
                document.getElementById('api-status').textContent = '🟢 ' + data.status;
                document.getElementById('db-status').textContent = data.database === 'healthy' ? '🟢 Connected' : '🔴 Disconnected';
            })
            .catch(err => {
                document.getElementById('api-status').textContent = '🔴 Offline';
                document.getElementById('db-status').textContent = '🔴 Unknown';
            });
    </script>
</body>
</html>
EOF

# Step 7: Create Dockerfile
print_step "STEP 7: Creating Docker Configuration"

cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY backend/ ./backend/
COPY frontend/build/ ./frontend/build/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8001/api/health || exit 1

WORKDIR /app/backend
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
EOF

# Step 8: Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

networks:
  rental-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local

services:
  mongodb:
    image: mongo:7.0
    container_name: rental-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USER:-admin}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-changeme123}
      MONGO_INITDB_DATABASE: ${DB_NAME:-rental_management}
    volumes:
      - mongodb_data:/data/db
    networks:
      - rental-network
    ports:
      - "127.0.0.1:27017:27017"
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: rental-app
    restart: unless-stopped
    environment:
      MONGO_URL: mongodb://mongodb:27017
      DB_NAME: ${DB_NAME:-rental_management}
      JWT_SECRET: ${JWT_SECRET:-your-secret-key-change-this}
      ENVIRONMENT: production
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - rental-network
    ports:
      - "127.0.0.1:8001:8001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF

# Step 9: Create .env file
cat > .env << 'EOF'
# MongoDB Configuration
MONGO_ROOT_USER=rental_admin
MONGO_ROOT_PASSWORD=RentalPass2024Secure!
DB_NAME=rental_management

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-64-chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Application
ENVIRONMENT=production
EOF

# Step 10: Build and Run
print_step "STEP 8: Building and Starting Application"

# Stop any existing containers
docker-compose down 2>/dev/null || true

# Build and start
docker-compose up -d --build

# Wait for services to start
print_info "Waiting for services to start..."
sleep 15

# Step 11: Test deployment
print_step "STEP 9: Testing Deployment"

# Check if services are running
if docker ps | grep -q rental-app; then
    print_success "Application container is running"
else
    print_error "Application container failed to start"
fi

if docker ps | grep -q rental-mongodb; then
    print_success "MongoDB container is running"
else
    print_error "MongoDB container failed to start"
fi

# Test health endpoint
if curl -f -s http://localhost:8001/api/health > /dev/null; then
    print_success "Health check passed"
else
    print_warning "Health check failed - checking logs..."
    docker logs rental-app --tail 20
fi

# Test through Nginx
if curl -f -s http://localhost/api/health > /dev/null; then
    print_success "Nginx proxy working"
else
    print_warning "Nginx proxy not working properly"
fi

# Step 12: Create helper scripts
print_step "STEP 10: Creating Helper Scripts"

# Create status script
cat > /usr/local/bin/rental-status << 'EOF'
#!/bin/bash
echo "=== Rental Management System Status ==="
docker ps | grep rental
echo ""
echo "=== Health Check ==="
curl -s http://localhost:8001/api/health | python3 -m json.tool
echo ""
echo "=== Logs (last 10 lines) ==="
docker logs rental-app --tail 10
EOF
chmod +x /usr/local/bin/rental-status

# Create restart script
cat > /usr/local/bin/rental-restart << 'EOF'
#!/bin/bash
cd /opt/rental-management
docker-compose restart
EOF
chmod +x /usr/local/bin/rental-restart

# Create logs script
cat > /usr/local/bin/rental-logs << 'EOF'
#!/bin/bash
docker logs rental-app -f
EOF
chmod +x /usr/local/bin/rental-logs

# Final Summary
echo ""
echo -e "${GREEN}=========================================="
echo "   ✅ DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "==========================================${NC}"
echo ""
print_info "Application Details:"
echo -e "  📍 URL: ${CYAN}http://$DOMAIN_OR_IP${NC}"
echo -e "  📚 API Docs: ${CYAN}http://$DOMAIN_OR_IP/docs${NC}"
echo -e "  🏥 Health: ${CYAN}http://$DOMAIN_OR_IP/api/health${NC}"
echo ""
print_info "Useful Commands:"
echo "  • rental-status  - Check system status"
echo "  • rental-logs    - View application logs"
echo "  • rental-restart - Restart application"
echo ""
print_info "Docker Commands:"
echo "  • docker ps                      - List containers"
echo "  • docker-compose logs -f         - View all logs"
echo "  • docker-compose restart         - Restart services"
echo "  • docker exec -it rental-mongodb mongosh  - Access MongoDB"
echo ""
print_warning "Next Steps:"
echo "  1. Upload your actual application files"
echo "  2. Update .env with production values"
echo "  3. Setup SSL certificate (optional)"
echo "  4. Configure backups"
echo ""
echo -e "${GREEN}🎉 Your application is now running at: http://$DOMAIN_OR_IP${NC}"
echo ""