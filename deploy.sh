#!/bin/bash
set -e

echo "=================================="
echo "The Signature Chair - Deployment"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on EC2 or local
if [ -f "/.dockerenv" ] || [ -d "/var/www" ]; then
    ENV="production"
    echo -e "${GREEN}Detected: Production/EC2 environment${NC}"
else
    ENV="development"
    echo -e "${YELLOW}Detected: Local development environment${NC}"
fi

echo ""
echo "What would you like to deploy?"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both (Full deployment)"
echo "4) Exit"
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        echo "=== Deploying Backend ==="
        cd /var/www/signature-chair-backend 2>/dev/null || cd backend

        echo "→ Pulling latest code..."
        git pull

        echo "→ Installing dependencies..."
        npm install

        echo "→ Generating Prisma client..."
        npx prisma generate

        echo "→ Running migrations..."
        npx prisma migrate deploy

        echo "→ Building TypeScript..."
        npm run build

        if [ "$ENV" = "production" ]; then
            echo "→ Restarting with PM2..."
            pm2 restart signature-chair-backend || pm2 start ecosystem.config.js
            pm2 save
        else
            echo "→ Build complete. Run 'npm run dev' to start."
        fi

        echo -e "${GREEN}✓ Backend deployed successfully${NC}"
        ;;

    2)
        echo ""
        echo "=== Deploying Frontend ==="
        cd /var/www/signature-chair-frontend 2>/dev/null || cd frontend

        echo "→ Pulling latest code..."
        git pull

        echo "→ Installing dependencies..."
        npm install

        echo "→ Building Next.js..."
        npm run build

        if [ "$ENV" = "production" ]; then
            echo "→ Restarting with PM2..."
            pm2 restart signature-chair-frontend || pm2 start ecosystem.config.js
            pm2 save
        else
            echo "→ Build complete. Run 'npm start' to start."
        fi

        echo -e "${GREEN}✓ Frontend deployed successfully${NC}"
        ;;

    3)
        echo ""
        echo "=== Full Deployment (Backend + Frontend) ==="

        # Backend
        echo ""
        echo "→ Deploying Backend..."
        cd /var/www/signature-chair-backend 2>/dev/null || cd backend
        git pull
        npm install
        npx prisma generate
        npx prisma migrate deploy
        npm run build

        if [ "$ENV" = "production" ]; then
            pm2 restart signature-chair-backend || pm2 start ecosystem.config.js
        fi
        echo -e "${GREEN}✓ Backend deployed${NC}"

        # Frontend
        echo ""
        echo "→ Deploying Frontend..."
        cd /var/www/signature-chair-frontend 2>/dev/null || cd ../frontend
        git pull
        npm install
        npm run build

        if [ "$ENV" = "production" ]; then
            pm2 restart signature-chair-frontend || pm2 start ecosystem.config.js
            pm2 save
        fi
        echo -e "${GREEN}✓ Frontend deployed${NC}"

        if [ "$ENV" = "production" ]; then
            echo ""
            echo "=== Deployment Summary ==="
            pm2 list
        fi

        echo ""
        echo -e "${GREEN}✓✓ Full deployment complete!${NC}"
        ;;

    4)
        echo "Exiting..."
        exit 0
        ;;

    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo "=================================="
echo "Deployment Complete!"
echo "=================================="
