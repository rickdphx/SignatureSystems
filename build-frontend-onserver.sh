#!/bin/bash
set -e

echo "====================================="
echo "Build Frontend on Server"
echo "====================================="
echo ""

# Navigate to frontend source
cd /var/www/signature-chair-backend/frontend

echo "Installing only critical production dependencies (this may take a few minutes)..."
# Try npm ci which is faster and more reliable than npm install
npm ci --production --legacy-peer-deps --no-audit --no-fund --prefer-offline 2>/dev/null || \
# If ci fails, try install with specific flags to avoid hanging
timeout 300 npm install --production --legacy-peer-deps --no-audit --no-fund --prefer-offline --no-optional || \
# If that fails, install only what we absolutely need
npm install next@14.1.0 react@18.2.0 react-dom@18.2.0 --legacy-peer-deps --no-save

echo "✓ Dependencies installed"
echo ""

# Install only dev dependencies needed for build
echo "Installing build dependencies..."
npm install --no-save typescript@5.3.3 @types/react@18.2.46 @types/node@20.10.6

echo "Building frontend..."
npm run build

echo "✓ Frontend built"
echo ""

# Stop existing frontend
echo "Stopping old frontend..."
pm2 delete signature-chair-frontend 2>/dev/null || true

# Copy standalone build
echo "Deploying standalone build..."
cd /var/www/signature-chair-frontend
rm -rf * .*  2>/dev/null || true
cp -r /var/www/signature-chair-backend/frontend/.next/standalone/* .
cp -r /var/www/signature-chair-backend/frontend/.next/static .next/

# Create environment file
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://staging.thesignaturechair.com/api
NEXT_PUBLIC_DEFAULT_BARBER_SLUG=signature
NEXT_PUBLIC_DOMAIN=thesignaturechair.com
EOF

echo "✓ Deployed"
echo ""

# Start with PM2
echo "Starting frontend..."
PORT=3000 pm2 start server.js --name "signature-chair-frontend"
pm2 save

echo ""
echo "====================================="
pm2 list
echo ""
echo "Frontend running at https://staging.thesignaturechair.com"
echo "====================================="
