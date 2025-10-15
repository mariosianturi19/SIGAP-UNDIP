#!/bin/bash

###############################################################################
# Remote Deployment Script (Client)
#
# Script ini dijalankan dari laptop ini untuk trigger deployment
# ke laptop lain yang punya akses SSH ke VM
#
# Usage:
#   ./scripts/deploy-remote.sh
#
# Environment Variables:
#   DEPLOY_REMOTE_URL - URL deployment server (wajib)
#   DEPLOY_SECRET - Secret key untuk autentikasi (wajib)
#
# Example:
#   DEPLOY_REMOTE_URL=http://192.168.1.100:9000 \
#   DEPLOY_SECRET=your-secret-key \
#   ./scripts/deploy-remote.sh
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_URL="${DEPLOY_REMOTE_URL}"
SECRET="${DEPLOY_SECRET}"
APP_NAME="sigap-undip-frontend"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  SIGAP UNDIP - Remote Deployment                          ║"
echo "║  Deploy dari Laptop Ini ke Laptop Lain                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check requirements
if [ -z "$REMOTE_URL" ]; then
    echo -e "${RED}❌ ERROR: DEPLOY_REMOTE_URL tidak diset!${NC}"
    echo ""
    echo "Cara menggunakan:"
    echo "  1. Set environment variables:"
    echo "     export DEPLOY_REMOTE_URL=http://IP_LAPTOP_LAIN:9000"
    echo "     export DEPLOY_SECRET=your-secret-key"
    echo ""
    echo "  2. Atau jalankan dengan inline:"
    echo "     DEPLOY_REMOTE_URL=http://192.168.1.100:9000 \\"
    echo "     DEPLOY_SECRET=your-secret-key \\"
    echo "     ./scripts/deploy-remote.sh"
    echo ""
    exit 1
fi

if [ -z "$SECRET" ]; then
    echo -e "${RED}❌ ERROR: DEPLOY_SECRET tidak diset!${NC}"
    echo ""
    echo "Secret key harus sama dengan yang ada di deployment server!"
    echo ""
    echo "Cara menggunakan:"
    echo "  DEPLOY_REMOTE_URL=$REMOTE_URL \\"
    echo "  DEPLOY_SECRET=your-secret-key \\"
    echo "  ./scripts/deploy-remote.sh"
    echo ""
    exit 1
fi

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ ERROR: curl tidak terinstal!${NC}"
    echo "Install curl terlebih dahulu:"
    echo "  - Ubuntu/Debian: sudo apt-get install curl"
    echo "  - macOS: brew install curl"
    echo "  - Windows: gunakan Git Bash atau WSL"
    exit 1
fi

# Check if in project directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ ERROR: package.json tidak ditemukan!${NC}"
    echo "Pastikan Anda menjalankan script ini dari root directory project"
    exit 1
fi

echo "   Configuration:"
echo "   Remote Server: $REMOTE_URL"
echo "   Secret: ${SECRET:0:8}..."
echo ""

# Test connection to deployment server
echo "🔍 Testing connection to deployment server..."
if ! curl -s -f -m 5 "$REMOTE_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to deployment server!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Pastikan deployment server sudah berjalan di laptop lain:"
    echo "     cd path/to/sigap-undip-frontend"
    echo "     DEPLOY_SECRET=$SECRET node scripts/deploy-server.js"
    echo ""
    echo "  2. Pastikan firewall memperbolehkan koneksi ke port 9000"
    echo ""
    echo "  3. Pastikan URL benar: $REMOTE_URL"
    echo "     Format: http://IP_LAPTOP:PORT"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Connection OK${NC}"

# Show deployment server info
SERVER_INFO=$(curl -s "$REMOTE_URL/health")
echo "   Server Status: $(echo $SERVER_INFO | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
echo ""

# Confirm deployment
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  KONFIRMASI DEPLOYMENT${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Deployment akan:"
echo "  1. Membuat tarball dari kode lokal"
echo "  2. Mengirim ke deployment server: $REMOTE_URL"
echo "  3. Server akan deploy ke VM production"
echo ""
read -p "Lanjutkan deployment? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment dibatalkan${NC}"
    exit 1
fi

# Create tarball
echo ""
echo "📦 Creating deployment package..."
TEMP_TAR="/tmp/$APP_NAME-deploy-$(date +%s).tar.gz"

# Create tar archive excluding unnecessary files
tar --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='.env*' \
    --exclude='scripts/.deploy-temp' \
    --exclude='*.tar.gz' \
    -czf "$TEMP_TAR" \
    --transform="s,^\./,," \
    -C "$(pwd)" . 2>/dev/null

FILE_SIZE=$(du -h "$TEMP_TAR" | cut -f1)
echo -e "${GREEN}✅ Package created: $FILE_SIZE${NC}"

# Generate signature
echo ""
echo "🔒 Generating signature..."
SIGNATURE="sha256=$(openssl dgst -sha256 -hmac "$SECRET" -binary "$TEMP_TAR" | xxd -p | tr -d '\n')"
echo -e "${GREEN}✅ Signature generated${NC}"

# Upload to deployment server
echo ""
echo "📤 Uploading package to deployment server..."
echo "   This may take a few moments..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "X-Deploy-Signature: $SIGNATURE" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@$TEMP_TAR" \
    "$REMOTE_URL/deploy")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

# Cleanup local tarball
rm -f "$TEMP_TAR"

# Check response
if [ "$HTTP_CODE" = "202" ]; then
    echo -e "${GREEN}✅ Package uploaded successfully!${NC}"
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  Deployment Started!                                       ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Deployment sedang berjalan di server remote."
    echo ""
    echo -e "${BLUE}Response:${NC}"
    echo "$BODY" | grep -o '"message":"[^"]*"' | cut -d'"' -f4 || echo "$BODY"
    echo ""
    echo "💡 Tips:"
    echo "   - Deployment berjalan di background"
    echo "   - Cek log di laptop yang menjalankan deployment server"
    echo "   - Deployment biasanya memakan waktu 3-5 menit"
    echo ""
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo ""
    echo "HTTP Status: $HTTP_CODE"
    echo "Response: $BODY"
    echo ""
    exit 1
fi
