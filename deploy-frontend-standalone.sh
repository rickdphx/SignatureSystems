#!/bin/bash
set -e

echo "====================================="
echo "Frontend Standalone Deployment"
echo "====================================="
echo ""

# Stop existing frontend if running
echo "Stopping existing frontend..."
pm2 delete signature-chair-frontend 2>/dev/null || true
echo "✓ Stopped"
echo ""

# Download the standalone build
echo "Downloading standalone frontend build..."
cd /tmp
rm -rf frontend-standalone.tar.gz
wget -q https://github.com/rickdphx/SignatureSystems/raw/claude/setup-signature-chair-booking-RX9Gg/frontend-standalone.tar.gz
echo "✓ Downloaded"
echo ""

# Clean and prepare directory
echo "Preparing frontend directory..."
sudo rm -rf /var/www/signature-chair-frontend/*
cd /var/www/signature-chair-frontend
echo "✓ Cleaned"
echo ""

# Extract the build
echo "Extracting build..."
tar -xzf /tmp/frontend-standalone.tar.gz
mv .next/standalone/* .
rm -rf .next/standalone
echo "✓ Extracted"
echo ""

# Create environment file
echo "Creating environment file..."
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://staging.thesignaturechair.com/api
NEXT_PUBLIC_DEFAULT_BARBER_SLUG=signature
NEXT_PUBLIC_DOMAIN=thesignaturechair.com
EOF
echo "✓ Environment configured"
echo ""

# Start with PM2
echo "Starting frontend..."
PORT=3000 pm2 start server.js --name "signature-chair-frontend"
pm2 save
echo "✓ Frontend started"
echo ""

echo "====================================="
echo "Status:"
pm2 list
echo ""
echo "Frontend is running on port 3000"
echo "Access via: https://staging.thesignaturechair.com"
echo "====================================="
