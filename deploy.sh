#!/bin/bash
set -e

# Configuration - Edit Below This
APP_NAME="sigap-undip-frontend"
APP_DIR="/var/www/$APP_NAME"
PORT=3000
BACKEND_API_URL="https://sigap-api-5hk6r.ondigitalocean.app/api"  # Backend API URL

# SSL Configuration
DOMAIN=""
USE_SSL=false

# Dont Edit Below This

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  SIGAP UNDIP - Server Deployment                           ║"
echo "║  Next.js Application                                       ║"
echo "╚════════════════════════════════════════════════════════════ ╝"
echo ""
echo "   Configuration:"
echo "   App Directory: $APP_DIR"
echo "   Port: $PORT"
echo "   Backend API: $BACKEND_API_URL"
echo ""

# Ask about SSL setup
echo "════════════════════════════════════════════════════════════"
echo "  Setup SSL/HTTPS?"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  PENTING: Untuk akses lokasi GPS, website HARUS HTTPS!"
echo ""
echo "Pilihan:"
echo "1. Ya, setup SSL dengan domain (RECOMMENDED)"
echo "2. Tidak, deploy tanpa SSL (lokasi GPS tidak akan berfungsi)"
echo ""
read -p "Pilih (1/2): " -n 1 -r SSL_CHOICE
echo ""
echo ""

if [[ $SSL_CHOICE == "1" ]]; then
    echo "════════════════════════════════════════════════════════════"
    echo "  Domain Configuration"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "Untuk SSL, Anda perlu domain. Opsi:"
    echo "• Domain berbayar (sigapundip.com) - ~100rb/tahun"
    echo "• Subdomain gratis:"
    echo "  - DuckDNS (sigapundip.duckdns.org) - GRATIS"
    echo "  - NoIP (sigapundip.ddns.net) - GRATIS"
    echo ""
    read -p "Apakah Anda sudah punya domain? (y/n): " -n 1 -r HAS_DOMAIN
    echo ""
    echo ""

    if [[ $HAS_DOMAIN =~ ^[Yy]$ ]]; then
        read -p "Masukkan domain Anda (contoh: sigapundip.com): " DOMAIN
        USE_SSL=true
        echo ""
        echo "✅ Domain: $DOMAIN"
        echo ""
        echo "⚠️  PASTIKAN domain sudah pointing ke IP server ini!"
        echo ""
        read -p "Domain sudah pointing? (y/n): " -n 1 -r DOMAIN_READY
        echo ""

        if [[ ! $DOMAIN_READY =~ ^[Yy]$ ]]; then
            echo ""
            echo "❌ Silakan pointing domain dulu ke IP server ini"
            echo ""
            echo "Cara pointing domain:"
            echo "1. Login ke provider domain Anda"
            echo "2. Buka DNS Management"
            echo "3. Tambahkan A Record:"
            echo "   Name: @ (atau kosong)"
            echo "   Value: [IP_SERVER_INI]"
            echo "   TTL: 3600"
            echo "4. Tunggu 5-30 menit untuk propagasi"
            echo ""
            exit 1
        fi
    else
        echo ""
        echo "Untuk mendapatkan domain gratis:"
        echo ""
        echo "1. DuckDNS (RECOMMENDED):"
        echo "   - Buka: https://www.duckdns.org"
        echo "   - Login dengan Google/GitHub"
        echo "   - Buat subdomain: sigapundip.duckdns.org"
        echo "   - Set IP ke IP server ini"
        echo ""
        echo "2. NoIP:"
        echo "   - Buka: https://www.noip.com"
        echo "   - Buat akun gratis"
        echo "   - Buat hostname: sigapundip.ddns.net"
        echo "   - Set IP ke IP server ini"
        echo ""
        read -p "Setelah dapat domain, tekan Enter untuk lanjut..."
        read -p "Masukkan domain yang sudah dibuat: " DOMAIN
        USE_SSL=true
        echo ""
        echo "✅ Domain: $DOMAIN"
    fi
fi

echo ""
read -p "Lanjutkan deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment dibatalkan"
    exit 1
fi

echo ""
echo "🔍 Checking current directory..."
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json tidak ditemukan!"
    echo "   Pastikan Anda menjalankan script ini dari directory project"
    echo "   atau git clone project ke server terlebih dahulu"
    exit 1
fi
echo "✅ Found package.json in $(pwd)"

echo ""
echo "================================================"
echo " Setting up server environment..."
echo "================================================"

# Get current user
CURRENT_USER=$(whoami)
echo "  Running as user: $CURRENT_USER"

# Install Node.js if not exists
if ! command -v node &> /dev/null; then
    echo "  Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "✅ Node.js already installed: $(node -v)"
fi

# Install PM2 if not exists
if ! command -v pm2 &> /dev/null; then
    echo "  Installing PM2..."
    npm install -g pm2
    pm2 startup systemd -u $CURRENT_USER --hp /home/$CURRENT_USER
else
    echo "✅ PM2 already installed"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building application..."
npm run build

echo "✅ Build completed"

# Install Nginx if not exists
if ! command -v nginx &> /dev/null; then
    echo "  Installing Nginx..."
    apt-get update
    apt-get install -y nginx
else
    echo "✅ Nginx already installed"
fi

# Install Certbot if SSL is needed
if [ "$USE_SSL" = true ]; then
    if ! command -v certbot &> /dev/null; then
        echo "  Installing Certbot for SSL..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    else
        echo "✅ Certbot already installed"
    fi
fi

# Setup firewall
echo "  Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow $PORT/tcp

# Create app directory if not exists
echo "  Creating application directory..."
mkdir -p $APP_DIR

# Copy files to app directory if not already there
if [ "$(pwd)" != "$APP_DIR" ]; then
    echo "  Copying files to $APP_DIR..."
    cp -r . $APP_DIR/
fi

# Go to app directory
cd $APP_DIR

# Create .env.production
echo "  Creating environment configuration..."
cat > .env.production << EOFENV
# Backend API Configuration
NEXT_PUBLIC_API_URL=$BACKEND_API_URL

# Application Environment

# Prompt for server credentials
echo "════════════════════════════════════════════════════════════"
echo "  Server Configuration"
echo "════════════════════════════════════════════════════════════"
echo ""
read -p "Masukkan username server VM: " SERVER_USER
echo ""
read -s -p "Masukkan password server VM: " SERVER_PASSWORD
echo ""
echo ""

echo "   Configuration:"
echo "   Server: $SERVER_USER@$SERVER_IP"
echo "   App Directory: $APP_DIR"
echo "   Port: $PORT"
echo "   Backend API: $BACKEND_API_URL"
echo ""

# Ask about SSL setup
echo "════════════════════════════════════════════════════════════"
echo "  Setup SSL/HTTPS?"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "⚠️  PENTING: Untuk akses lokasi GPS, website HARUS HTTPS!"
echo ""
echo "Pilihan:"
echo "1. Ya, setup SSL dengan domain (RECOMMENDED)"
echo "2. Tidak, deploy tanpa SSL (lokasi GPS tidak akan berfungsi)"
echo ""
read -p "Pilih (1/2): " -n 1 -r SSL_CHOICE
echo ""
echo ""

DOMAIN=""
USE_SSL=false

if [[ $SSL_CHOICE == "1" ]]; then
    echo "════════════════════════════════════════════════════════════"
    echo "  Domain Configuration"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "Untuk SSL, Anda perlu domain. Opsi:"
    echo "• Domain berbayar (sigapundip.com) - ~100rb/tahun"
    echo "• Subdomain gratis:"
    echo "  - DuckDNS (sigapundip.duckdns.org) - GRATIS"
    echo "  - NoIP (sigapundip.ddns.net) - GRATIS"
    echo ""
    read -p "Apakah Anda sudah punya domain? (y/n): " -n 1 -r HAS_DOMAIN
    echo ""
    echo ""
    
    if [[ $HAS_DOMAIN =~ ^[Yy]$ ]]; then
        read -p "Masukkan domain Anda (contoh: sigapundip.com): " DOMAIN
        USE_SSL=true
        echo ""
        echo "✅ Domain: $DOMAIN"
        echo ""
        echo "⚠️  PASTIKAN domain sudah pointing ke IP: $SERVER_IP"
        echo ""
        read -p "Domain sudah pointing? (y/n): " -n 1 -r DOMAIN_READY
        echo ""
        
        if [[ ! $DOMAIN_READY =~ ^[Yy]$ ]]; then
            echo ""
            echo "❌ Silakan pointing domain dulu ke IP: $SERVER_IP"
            echo ""
            echo "Cara pointing domain:"
            echo "1. Login ke provider domain Anda"
            echo "2. Buka DNS Management"
            echo "3. Tambahkan A Record:"
            echo "   Name: @ (atau kosong)"
            echo "   Value: $SERVER_IP"
            echo "   TTL: 3600"
            echo "4. Tunggu 5-30 menit untuk propagasi"
            echo ""
            exit 1
        fi
    else
        echo ""
        echo "Untuk mendapatkan domain gratis:"
        echo ""
        echo "1. DuckDNS (RECOMMENDED):"
        echo "   - Buka: https://www.duckdns.org"
        echo "   - Login dengan Google/GitHub"
        echo "   - Buat subdomain: sigapundip.duckdns.org"
        echo "   - Set IP: $SERVER_IP"
        echo ""
        echo "2. NoIP:"
        echo "   - Buka: https://www.noip.com"
        echo "   - Buat akun gratis"
        echo "   - Buat hostname: sigapundip.ddns.net"
        echo "   - Set IP: $SERVER_IP"
        echo ""
        echo "Setelah dapat domain, jalankan script ini lagi."
        exit 1
    fi
fi

echo ""
read -p "Lanjutkan deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment dibatalkan"
    exit 1
fi

CURRENT_DIR=$(pwd)

echo ""
echo "🔍 Checking current directory..."
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json tidak ditemukan!"
    echo "   Pastikan Anda menjalankan script ini dari root directory project"
    exit 1
fi
echo "✅ Found package.json in $CURRENT_DIR"

run_remote() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$1"
}

echo ""
echo "Testing connection to server..."
if ! run_remote "echo 'Connected'"; then
    echo "❌ Cannot connect to server!"
    echo "   Please check:"
    echo "   1. Server IP: $SERVER_IP"
    echo "   2. Username: $SERVER_USER"
    echo "   3. SSH access (try: ssh $SERVER_USER@$SERVER_IP)"
    exit 1
fi
echo "✅ Connection OK"

echo ""
echo "📦 Preparing files for upload..."
TEMP_TAR="/tmp/$APP_NAME-$(date +%s).tar.gz"

# Create tar archive excluding unnecessary files
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='.env*' \
    --exclude='deploy' \
    --exclude='*.tar.gz' \
    -czf "$TEMP_TAR" -C "$CURRENT_DIR" .

echo "✅ Archive created"

echo ""
echo "📤 Uploading code to server..."
sshpass -p "$SERVER_PASSWORD" scp -o StrictHostKeyChecking=no "$TEMP_TAR" $SERVER_USER@$SERVER_IP:/tmp/$APP_NAME-upload.tar.gz

# Remove local temp file
rm -f "$TEMP_TAR"

echo "✅ Code uploaded"

echo ""
echo "Deploying on server..."
sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
set -e

echo ""
echo "================================================"
echo " Setting up server environment..."
echo "================================================"

# Install Node.js if not exists
if ! command -v node &> /dev/null; then
    echo "  Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "✅ Node.js already installed: \$(node -v)"
fi

# Install sshpass for password authentication
if ! command -v sshpass &> /dev/null; then
    echo "  Installing sshpass..."
    apt-get update
    apt-get install -y sshpass
else
    echo "✅ sshpass already installed"
fi

# Install PM2 if not exists
if ! command -v pm2 &> /dev/null; then
    echo "  Installing PM2..."
    npm install -g pm2
    pm2 startup systemd -u $SERVER_USER --hp /root
else
    echo "✅ PM2 already installed"
fi

# Install Nginx if not exists
if ! command -v nginx &> /dev/null; then
    echo "  Installing Nginx..."
    apt-get update
    apt-get install -y nginx
else
    echo "✅ Nginx already installed"
fi

# Install Certbot if SSL is needed
if [ "$USE_SSL" = true ]; then
    if ! command -v certbot &> /dev/null; then
        echo "  Installing Certbot for SSL..."
        apt-get update
        apt-get install -y certbot python3-certbot-nginx
    else
        echo "✅ Certbot already installed"
    fi
fi

# Setup firewall
echo "  Configuring firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow $PORT/tcp

# Create app directory
echo "  Creating application directory..."
mkdir -p $APP_DIR

# Extract uploaded files
echo "  Extracting files..."
tar -xzf /tmp/$APP_NAME-upload.tar.gz -C $APP_DIR/
rm -f /tmp/$APP_NAME-upload.tar.gz

# Go to app directory
cd $APP_DIR

# Create .env.production
echo "  Creating environment configuration..."
cat > .env.production << 'EOFENV'
# Backend API Configuration
NEXT_PUBLIC_API_URL=$BACKEND_API_URL

# Application Environment
NODE_ENV=production
PORT=$PORT

# Feature Flags
NEXT_PUBLIC_ENABLE_AUTO_REFRESH=true
NEXT_PUBLIC_REFRESH_INTERVAL=30000

# Disable logs in production
NEXT_PUBLIC_ENABLE_LOGS=false

# Firebase Storage
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seputipy.appspot.com

# Security Configuration
NEXT_PUBLIC_TOKEN_EXPIRY_WARNING=300
NEXT_PUBLIC_MAX_FILE_SIZE=20

# Geolocation Configuration
NEXT_PUBLIC_LOCATION_TIMEOUT=10000
NEXT_PUBLIC_LOCATION_MAX_AGE=300000
NEXT_PUBLIC_LOCATION_MIN_ACCURACY=1000
EOFENV

# Clean old dependencies and build
echo "  Cleaning old build..."
rm -rf node_modules .next

# Install dependencies
echo "  Installing dependencies..."
npm install --production=false

# Build application
echo "  Building Next.js application..."
npm run build

# Create PM2 ecosystem file
echo "  Creating PM2 configuration..."
cat > ecosystem.config.js << EOFPM2
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

# Stop existing PM2 process if exists
pm2 delete $APP_NAME 2>/dev/null || true

# Start with PM2
echo "  Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save

# Configure Nginx based on SSL choice
if [ "$USE_SSL" = true ]; then
    echo ""
    echo "================================================"
    echo " Setting up SSL Certificate..."
    echo "================================================"

    # Stop Nginx temporarily
    echo "  Stopping Nginx..."
    systemctl stop nginx

    # Obtain SSL certificate
    echo "  Obtaining SSL certificate for $DOMAIN..."
    certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --force-renewal

    # Configure Nginx with SSL
    echo "  Configuring Nginx with HTTPS..."
EOFENV

# Clean old dependencies and build
echo "  Cleaning old build..."
rm -rf node_modules .next

# Install dependencies
echo "  Installing dependencies..."
npm install --production=false

# Build application
echo "  Building Next.js application..."
npm run build

# Create PM2 ecosystem file
echo "  Creating PM2 configuration..."
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

# Stop existing PM2 process if exists
pm2 delete $APP_NAME 2>/dev/null || true

# Start with PM2
echo "  Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save

# Configure Nginx based on SSL choice
if [ "$USE_SSL" = true ]; then
    echo ""
    echo "================================================"
    echo " Setting up SSL Certificate..."
    echo "================================================"

    # Stop Nginx temporarily
    echo "  Stopping Nginx..."
    systemctl stop nginx

    # Obtain SSL certificate
    echo "  Obtaining SSL certificate for $DOMAIN..."
    certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --force-renewal

    # Configure Nginx with SSL
    echo "  Configuring Nginx with HTTPS..."
    cat > /etc/nginx/sites-available/$APP_NAME << EOFNGINX
# HTTP - Redirect to HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL Certificate
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
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

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static files
    location /_next/static {
        proxy_pass http://localhost:$PORT;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Handle Next.js image optimization
    location /_next/image {
        proxy_pass http://localhost:$PORT;
        proxy_set_header Host \$host;
    }

    client_max_body_size 20M;
}
EOFNGINX

    # Setup auto-renewal
    echo "  Setting up SSL auto-renewal..."
    systemctl enable certbot.timer
    systemctl start certbot.timer

else
    # Configure Nginx without SSL (HTTP only)
    echo "  Configuring Nginx (HTTP only - no SSL)..."
    SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    cat > /etc/nginx/sites-available/$APP_NAME << EOFNGINX
server {
    listen 80;
    server_name $SERVER_IP;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

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

        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache static files
    location /_next/static {
        proxy_pass http://localhost:$PORT;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # Handle Next.js image optimization
    location /_next/image {
        proxy_pass http://localhost:$PORT;
        proxy_set_header Host \$host;
    }

    client_max_body_size 20M;
}
EOFNGINX
fi

# Enable site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

# Remove default if exists
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl start nginx
systemctl enable nginx

echo ""
echo "================================================"
echo "  Deployment Completed Successfully!"
echo "================================================"

# Get server IP for display
SERVER_IP=\$(curl -s ifconfig.me)

if [ "$USE_SSL" = true ]; then
    echo "✅ Website deployed at: https://$DOMAIN"
    echo "🔒 SSL Certificate: Active"
else
    echo "✅ Website deployed at: http://\$SERVER_IP"
    echo "⚠️  SSL Certificate: Not configured (GPS location may not work)"
fi

echo ""
echo "📊 Application Status:"
echo "   PM2 Process: \$APP_NAME"
echo "   Port: $PORT"
echo "   Directory: $APP_DIR"
echo ""
echo "🔧 Useful Commands:"
echo "   Check status: pm2 status"
echo "   View logs: pm2 logs $APP_NAME"
echo "   Restart app: pm2 restart $APP_NAME"
echo "   Reload Nginx: systemctl reload nginx"
echo ""
echo "🎉 Deployment selesai! SIGAP UNDIP siap digunakan."

if [ "$USE_SSL" = true ]; then
    echo "  🔒 Aplikasi bisa diakses di:"
    echo "   https://$DOMAIN"
    echo ""
    echo "  ✅ SSL Certificate active"
    echo "  ✅ Geolocation akan berfungsi"
    echo "  ✅ Auto-renewal enabled"
else
    echo "  Aplikasi bisa diakses di:"
    echo "   http://$SERVER_IP"
    echo ""
    echo "  ⚠️  WARNING: Geolocation tidak akan berfungsi tanpa HTTPS!"
    echo "  Untuk enable geolocation, dapatkan domain dan jalankan:"
    echo "   ./deploy.sh (pilih setup SSL)"
fi

echo ""
echo "  Untuk cek status:"
echo "   ssh $SERVER_USER@$SERVER_IP 'pm2 status'"
echo ""
echo "  Untuk lihat logs:"
echo "   ssh $SERVER_USER@$SERVER_IP 'pm2 logs $APP_NAME'"
echo ""
echo "  Untuk restart:"
echo "   ssh $SERVER_USER@$SERVER_IP 'pm2 restart $APP_NAME'"
echo ""