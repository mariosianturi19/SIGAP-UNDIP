#!/bin/bash

###############################################################################
# SIGAP UNDIP - One-Click Deployment Script
#
# Script ini download kode terbaru dari GitHub dan deploy ke VM
# Bisa dijalankan dari laptop manapun yang punya akses SSH ke VM
#
# Usage (One-Liner):
#   bash <(curl -s https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/deploy-oneclick.sh)
#
# Atau save dulu:
#   curl -O https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/deploy-oneclick.sh
#   chmod +x deploy-oneclick.sh
#   ./deploy-oneclick.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

clear

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  SIGAP UNDIP - One-Click Deployment                       ║${NC}"
echo -e "${CYAN}║  Deploy Latest Code from GitHub to VM                     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check requirements
echo -e "${BLUE}🔍 Checking requirements...${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git tidak terinstal!${NC}"
    echo "Install git terlebih dahulu:"
    echo "  - Ubuntu: sudo apt-get install git"
    echo "  - CentOS: sudo yum install git"
    echo "  - Mac: brew install git"
    exit 1
fi

if ! command -v ssh &> /dev/null; then
    echo -e "${RED}❌ SSH tidak terinstal!${NC}"
    exit 1
fi

if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}⚠️  sshpass tidak terinstal (optional tapi recommended)${NC}"
    echo "Install untuk auto-input password:"
    echo "  Ubuntu: sudo apt-get install sshpass"
    echo "  CentOS: sudo yum install sshpass"
    echo ""
    read -p "Lanjut tanpa sshpass? SSH key harus sudah di-setup. (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    USE_SSHPASS=false
else
    USE_SSHPASS=true
fi

echo -e "${GREEN}✅ Requirements OK${NC}"
echo ""

# Configuration Input
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  KONFIGURASI DEPLOYMENT${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""

# GitHub Repository
echo -e "${CYAN}📦 GitHub Repository Configuration${NC}"
read -p "GitHub Username: " GITHUB_USER
read -p "Repository Name (default: Sigap_Undip): " GITHUB_REPO
GITHUB_REPO=${GITHUB_REPO:-Sigap_Undip}
read -p "Branch (default: main): " GITHUB_BRANCH
GITHUB_BRANCH=${GITHUB_BRANCH:-main}

REPO_URL="https://github.com/$GITHUB_USER/$GITHUB_REPO.git"

echo ""
echo -e "${GREEN}✅ Repository: $REPO_URL${NC}"
echo -e "${GREEN}✅ Branch: $GITHUB_BRANCH${NC}"
echo ""

# VM Configuration
echo -e "${CYAN}🖥️  VM Server Configuration${NC}"
read -p "VM IP Address: " SERVER_IP
read -p "SSH Username (default: root): " SERVER_USER
SERVER_USER=${SERVER_USER:-root}
read -p "SSH Port (default: 22): " SSH_PORT
SSH_PORT=${SSH_PORT:-22}

if [ "$USE_SSHPASS" = true ]; then
    read -sp "SSH Password: " SERVER_PASSWORD
    echo ""
    SSH_CMD="sshpass -p '$SERVER_PASSWORD' ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SERVER_USER@$SERVER_IP"
    SCP_CMD="sshpass -p '$SERVER_PASSWORD' scp -o StrictHostKeyChecking=no -P $SSH_PORT"
else
    echo -e "${YELLOW}⚠️  Pastikan SSH key sudah di-setup!${NC}"
    SSH_CMD="ssh -o StrictHostKeyChecking=no -p $SSH_PORT $SERVER_USER@$SERVER_IP"
    SCP_CMD="scp -o StrictHostKeyChecking=no -P $SSH_PORT"
fi

echo ""
echo -e "${GREEN}✅ Server: $SERVER_USER@$SERVER_IP:$SSH_PORT${NC}"
echo ""

# Application Configuration
echo -e "${CYAN}⚙️  Application Configuration${NC}"
read -p "App Name (default: sigap-undip-frontend): " APP_NAME
APP_NAME=${APP_NAME:-sigap-undip-frontend}
read -p "App Port (default: 3000): " PORT
PORT=${PORT:-3000}
read -p "Backend API URL: " BACKEND_API_URL

if [ -z "$BACKEND_API_URL" ]; then
    BACKEND_API_URL="https://sigap-api-5hk6r.ondigitalocean.app/api"
fi

APP_DIR="/var/www/$APP_NAME"

echo ""
echo -e "${GREEN}✅ App: $APP_NAME${NC}"
echo -e "${GREEN}✅ Port: $PORT${NC}"
echo -e "${GREEN}✅ Backend: $BACKEND_API_URL${NC}"
echo ""

# SSL Configuration
echo -e "${CYAN}🔒 SSL/HTTPS Configuration${NC}"
echo ""
echo "⚠️  PENTING: Untuk akses GPS/lokasi, website HARUS HTTPS!"
echo ""
read -p "Setup SSL dengan domain? (y/n): " -n 1 -r USE_SSL_INPUT
echo ""

DOMAIN=""
USE_SSL=false

if [[ $USE_SSL_INPUT =~ ^[Yy]$ ]]; then
    read -p "Domain name (contoh: sigapundip.com): " DOMAIN
    if [ -z "$DOMAIN" ]; then
        echo -e "${RED}❌ Domain diperlukan untuk SSL!${NC}"
        USE_SSL=false
    else
        USE_SSL=true
        echo ""
        echo -e "${YELLOW}⚠️  PASTIKAN domain sudah pointing ke: $SERVER_IP${NC}"
        read -p "Domain sudah pointing? (y/n): " -n 1 -r DOMAIN_READY
        echo ""
        if [[ ! $DOMAIN_READY =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Silakan pointing domain dulu!${NC}"
            echo "Cara pointing:"
            echo "  1. Login ke DNS provider"
            echo "  2. Tambah A Record:"
            echo "     Host: @ atau www"
            echo "     Value: $SERVER_IP"
            echo "  3. Tunggu 5-30 menit"
            exit 1
        fi
    fi
fi

echo ""

# Summary
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  SUMMARY${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  GitHub:"
echo "    Repository: $GITHUB_USER/$GITHUB_REPO"
echo "    Branch: $GITHUB_BRANCH"
echo ""
echo "  VM Server:"
echo "    IP: $SERVER_IP"
echo "    User: $SERVER_USER"
echo "    Port: $SSH_PORT"
echo ""
echo "  Application:"
echo "    Name: $APP_NAME"
echo "    Directory: $APP_DIR"
echo "    Port: $PORT"
echo "    Backend API: $BACKEND_API_URL"
echo ""
if [ "$USE_SSL" = true ]; then
    echo "  SSL:"
    echo "    Domain: $DOMAIN"
    echo "    Auto-renewal: Enabled"
else
    echo "  SSL: Disabled (HTTP only)"
    echo "  ⚠️  GPS/Lokasi tidak akan berfungsi!"
fi
echo ""

read -p "Lanjutkan deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment dibatalkan${NC}"
    exit 1
fi

# Test SSH Connection
echo ""
echo -e "${BLUE}🔌 Testing SSH connection...${NC}"
if ! eval "$SSH_CMD 'echo Connected'" &>/dev/null; then
    echo -e "${RED}❌ Cannot connect to VM!${NC}"
    echo "Periksa:"
    echo "  - IP Address: $SERVER_IP"
    echo "  - Username: $SERVER_USER"
    echo "  - Password atau SSH key"
    echo "  - Port: $SSH_PORT"
    echo "  - Firewall settings"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection OK${NC}"

# Clone repository locally
echo ""
echo -e "${BLUE}📥 Cloning repository from GitHub...${NC}"
TEMP_DIR="/tmp/$APP_NAME-deploy-$(date +%s)"
mkdir -p "$TEMP_DIR"

if ! git clone --branch "$GITHUB_BRANCH" "$REPO_URL" "$TEMP_DIR"; then
    echo -e "${RED}❌ Failed to clone repository!${NC}"
    echo "Periksa:"
    echo "  - Repository exists: $REPO_URL"
    echo "  - Branch exists: $GITHUB_BRANCH"
    echo "  - Repository is public (or credentials provided)"
    rm -rf "$TEMP_DIR"
    exit 1
fi

echo -e "${GREEN}✅ Repository cloned${NC}"

# Remove git directory
rm -rf "$TEMP_DIR/.git"

# Create tarball
echo ""
echo -e "${BLUE}📦 Creating deployment package...${NC}"
TARBALL="/tmp/$APP_NAME-$(date +%s).tar.gz"

tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='.env*' \
    --exclude='deploy' \
    --exclude='*.tar.gz' \
    -czf "$TARBALL" -C "$TEMP_DIR" .

FILE_SIZE=$(du -h "$TARBALL" | cut -f1)
echo -e "${GREEN}✅ Package created: $FILE_SIZE${NC}"

# Upload to server
echo ""
echo -e "${BLUE}📤 Uploading to VM...${NC}"
eval "$SCP_CMD '$TARBALL' $SERVER_USER@$SERVER_IP:/tmp/$APP_NAME-upload.tar.gz"

# Cleanup local files
rm -rf "$TEMP_DIR"
rm -f "$TARBALL"

echo -e "${GREEN}✅ Uploaded${NC}"

# Deploy on server
echo ""
echo -e "${BLUE}🚀 Deploying on VM...${NC}"
echo ""

eval "$SSH_CMD" << ENDSSH
set -e

echo "════════════════════════════════════════════════════════════"
echo " Setting up server environment..."
echo "════════════════════════════════════════════════════════════"

# Install Node.js if not exists
if ! command -v node &> /dev/null; then
    echo "  Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "✅ Node.js: \$(node -v)"
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "  Installing PM2..."
    npm install -g pm2
    pm2 startup systemd -u $SERVER_USER --hp /root
else
    echo "✅ PM2 installed"
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "  Installing Nginx..."
    apt-get update
    apt-get install -y nginx
else
    echo "✅ Nginx installed"
fi

# Install Certbot if SSL needed
if [ "$USE_SSL" = true ]; then
    if ! command -v certbot &> /dev/null; then
        echo "  Installing Certbot..."
        apt-get install -y certbot python3-certbot-nginx
    fi
fi

# Configure firewall
echo "  Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow $PORT/tcp

# Create app directory
mkdir -p $APP_DIR

# Extract files
echo "  Extracting files..."
tar -xzf /tmp/$APP_NAME-upload.tar.gz -C $APP_DIR/
rm -f /tmp/$APP_NAME-upload.tar.gz

cd $APP_DIR

# Create .env.production
cat > .env.production << 'EOFENV'
NEXT_PUBLIC_API_URL=$BACKEND_API_URL
NODE_ENV=production
PORT=$PORT
NEXT_PUBLIC_ENABLE_AUTO_REFRESH=true
NEXT_PUBLIC_REFRESH_INTERVAL=30000
NEXT_PUBLIC_ENABLE_LOGS=false
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seputipy.appspot.com
NEXT_PUBLIC_TOKEN_EXPIRY_WARNING=300
NEXT_PUBLIC_MAX_FILE_SIZE=10
NEXT_PUBLIC_LOCATION_TIMEOUT=10000
NEXT_PUBLIC_LOCATION_MAX_AGE=300000
NEXT_PUBLIC_LOCATION_MIN_ACCURACY=1000
EOFENV

# Clean and install
echo "  Installing dependencies..."
rm -rf node_modules .next
npm install --production=false

# Build
echo "  Building application..."
npm run build

# PM2 config
cat > ecosystem.config.js << 'EOFPM2'
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    }
  }]
}
EOFPM2

# Restart PM2
pm2 delete $APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Configure Nginx
if [ "$USE_SSL" = true ]; then
    echo "  Setting up SSL..."
    systemctl stop nginx
    certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --force-renewal

    cat > /etc/nginx/sites-available/$APP_NAME << 'EOFNGINX'
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header Permissions-Policy "geolocation=(self)" always;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    client_max_body_size 10M;
}
EOFNGINX

    systemctl enable certbot.timer
    systemctl start certbot.timer
else
    cat > /etc/nginx/sites-available/$APP_NAME << 'EOFNGINX'
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    client_max_body_size 10M;
}
EOFNGINX
fi

ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl start nginx
systemctl enable nginx

echo ""
echo "════════════════════════════════════════════════════════════"
echo " Deployment Complete!"
echo "════════════════════════════════════════════════════════════"
pm2 status

ENDSSH

# Final message
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     DEPLOYMENT SELESAI!                                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$USE_SSL" = true ]; then
    echo -e "${GREEN}  🔒 Aplikasi bisa diakses di:${NC}"
    echo -e "${CYAN}     https://$DOMAIN${NC}"
    echo ""
    echo -e "${GREEN}  ✅ SSL Active${NC}"
    echo -e "${GREEN}  ✅ Geolocation akan berfungsi${NC}"
else
    echo -e "${YELLOW}  Aplikasi bisa diakses di:${NC}"
    echo -e "${CYAN}     http://$SERVER_IP${NC}"
    echo ""
    echo -e "${YELLOW}  ⚠️  HTTP only - GPS tidak akan berfungsi${NC}"
fi

echo ""
echo "  Useful Commands:"
echo "    Check status:  ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
echo "    View logs:     ssh $SERVER_USER@$SERVER_IP 'pm2 logs $APP_NAME'"
echo "    Restart:       ssh $SERVER_USER@$SERVER_IP 'pm2 restart $APP_NAME'"
echo ""
