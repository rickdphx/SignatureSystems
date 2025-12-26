#!/bin/bash
set -e

echo "===================================="
echo "Signature Chair - Quick Deploy"
echo "===================================="
echo ""

# Download the code from GitHub (no git required)
echo "Downloading code from GitHub..."
cd /tmp
rm -rf SignatureSystems-claude-setup-signature-chair-booking-RX9Gg
wget -q https://github.com/rickdphx/SignatureSystems/archive/refs/heads/claude/setup-signature-chair-booking-RX9Gg.zip
unzip -q claude/setup-signature-chair-booking-RX9Gg.zip
cd SignatureSystems-claude-setup-signature-chair-booking-RX9Gg

echo "✓ Code downloaded"
echo ""

# Create directories
echo "Creating directories..."
sudo mkdir -p /var/www/signature-chair-backend
sudo mkdir -p /var/www/signature-chair-frontend
sudo chown -R ubuntu:ubuntu /var/www/signature-chair-backend
sudo chown -R ubuntu:ubuntu /var/www/signature-chair-frontend
echo "✓ Directories created"
echo ""

# Copy backend files
echo "Copying backend files..."
cp -r * /var/www/signature-chair-backend/
echo "✓ Backend copied"
echo ""

# Copy frontend files
echo "Copying frontend files..."
cp -r frontend/* /var/www/signature-chair-frontend/
echo "✓ Frontend copied"
echo ""

# Backend environment
echo "Setting up backend environment..."
cd /var/www/signature-chair-backend
cat > .env.staging << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://signaturechair:CHANGEME@localhost:5432/signaturechair_booking_staging"
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=CHANGEME
SQUARE_LOCATION_ID=CHANGEME
CORS_ORIGIN=https://staging.thesignaturechair.com
LOG_LEVEL=info
EOF
echo "✓ Backend env created"
echo ""

# Frontend environment
echo "Setting up frontend environment..."
cd /var/www/signature-chair-frontend
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://staging.thesignaturechair.com/api
NEXT_PUBLIC_DEFAULT_BARBER_SLUG=CHANGEME
EOF
echo "✓ Frontend env created"
echo ""

# Install backend
echo "Installing backend (this takes a few minutes)..."
cd /var/www/signature-chair-backend
npm install --production
echo "✓ Backend installed"
echo ""

# Prisma setup
echo "Setting up database..."
npx prisma generate
echo "✓ Prisma ready"
echo ""

# Build backend
echo "Building backend..."
npm run build
echo "✓ Backend built"
echo ""

# Install frontend
echo "Installing frontend (this takes a few minutes)..."
cd /var/www/signature-chair-frontend
npm install --production
echo "✓ Frontend installed"
echo ""

# Build frontend
echo "Building frontend..."
npm run build
echo "✓ Frontend built"
echo ""

# Start with PM2
echo "Starting processes..."
cd /var/www/signature-chair-backend
pm2 delete signature-chair-backend 2>/dev/null || true
pm2 start npm --name "signature-chair-backend" -- start

cd /var/www/signature-chair-frontend
pm2 delete signature-chair-frontend 2>/dev/null || true
pm2 start npm --name "signature-chair-frontend" -- start

pm2 save
echo "✓ Processes started"
echo ""

echo "===================================="
echo "Status:"
pm2 list
echo ""
echo "NEXT STEPS:"
echo "1. Update Square credentials:"
echo "   nano /var/www/signature-chair-backend/.env.staging"
echo ""
echo "2. Restart backend:"
echo "   pm2 restart signature-chair-backend"
echo ""
echo "3. Visit: https://staging.thesignaturechair.com"
echo "===================================="
