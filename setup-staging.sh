#!/bin/bash
set -e

echo "=========================================="
echo "The Signature Chair - Complete Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/rickdphx/SignatureSystems.git"
BRANCH="claude/setup-signature-chair-booking-RX9Gg"
BACKEND_DIR="/var/www/signature-chair-backend"
FRONTEND_DIR="/var/www/signature-chair-frontend"

echo -e "${BLUE}Step 1: Creating directories...${NC}"
sudo mkdir -p $BACKEND_DIR
sudo mkdir -p $FRONTEND_DIR
sudo chown -R $USER:$USER $BACKEND_DIR
sudo chown -R $USER:$USER $FRONTEND_DIR
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

echo -e "${BLUE}Step 2: Cloning backend code...${NC}"
cd $BACKEND_DIR
if [ -d ".git" ]; then
    echo "Repository already exists, pulling latest..."
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    git clone $REPO_URL .
    git checkout $BRANCH
fi
echo -e "${GREEN}✓ Backend code cloned${NC}"
echo ""

echo -e "${BLUE}Step 3: Setting up backend environment...${NC}"
if [ ! -f ".env.staging" ]; then
    cat > .env.staging << 'EOF'
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL="postgresql://signaturechair:CHANGE_THIS_PASSWORD@localhost:5432/signaturechair_booking_staging"

# Square API (STAGING/SANDBOX)
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=CHANGE_THIS_TOKEN
SQUARE_LOCATION_ID=CHANGE_THIS_LOCATION_ID

# CORS
CORS_ORIGIN=https://staging.thesignaturechair.com

# Logging
LOG_LEVEL=info
EOF
    echo -e "${YELLOW}⚠ Created .env.staging - YOU MUST UPDATE Square credentials!${NC}"
else
    echo ".env.staging already exists"
fi
echo ""

echo -e "${BLUE}Step 4: Installing backend dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 5: Setting up database...${NC}"
npx prisma generate
npx prisma migrate deploy
echo -e "${GREEN}✓ Database setup complete${NC}"
echo ""

echo -e "${BLUE}Step 6: Building backend...${NC}"
npm run build
echo -e "${GREEN}✓ Backend built${NC}"
echo ""

echo -e "${BLUE}Step 7: Cloning frontend code...${NC}"
cd $FRONTEND_DIR
if [ -d ".git" ]; then
    echo "Repository already exists, pulling latest..."
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    git clone $REPO_URL .
    git checkout $BRANCH
fi
cd frontend
echo -e "${GREEN}✓ Frontend code cloned${NC}"
echo ""

echo -e "${BLUE}Step 8: Setting up frontend environment...${NC}"
if [ ! -f ".env.production" ]; then
    cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://staging.thesignaturechair.com/api
NEXT_PUBLIC_DEFAULT_BARBER_SLUG=your-slug-here
EOF
    echo -e "${YELLOW}⚠ Created .env.production - YOU MUST UPDATE barber slug!${NC}"
else
    echo ".env.production already exists"
fi
echo ""

echo -e "${BLUE}Step 9: Installing frontend dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

echo -e "${BLUE}Step 10: Building frontend...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

echo -e "${BLUE}Step 11: Starting PM2 processes...${NC}"
cd $BACKEND_DIR
pm2 delete signature-chair-backend 2>/dev/null || true
pm2 start ecosystem.config.js
echo -e "${GREEN}✓ Backend started${NC}"

cd $FRONTEND_DIR/frontend
pm2 delete signature-chair-frontend 2>/dev/null || true
pm2 start ecosystem.config.js
echo -e "${GREEN}✓ Frontend started${NC}"

pm2 save
echo ""

echo -e "${BLUE}Step 12: PM2 Status${NC}"
pm2 list
echo ""

echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}IMPORTANT: Next Steps${NC}"
echo ""
echo "1. Update Square credentials in:"
echo "   $BACKEND_DIR/.env.staging"
echo ""
echo "2. Get your barber slug:"
echo "   cd $BACKEND_DIR"
echo "   curl http://localhost:3001/api/public/barbers | jq '.barbers[0].slug'"
echo ""
echo "3. Update barber slug in:"
echo "   $FRONTEND_DIR/frontend/.env.production"
echo ""
echo "4. Rebuild and restart:"
echo "   cd $BACKEND_DIR && npm run build && pm2 restart signature-chair-backend"
echo "   cd $FRONTEND_DIR/frontend && npm run build && pm2 restart signature-chair-frontend"
echo ""
echo "5. Configure nginx and SSL (see DEPLOY_NOW.md)"
echo ""
echo -e "${BLUE}Check logs:${NC}"
echo "  pm2 logs signature-chair-backend"
echo "  pm2 logs signature-chair-frontend"
echo ""
