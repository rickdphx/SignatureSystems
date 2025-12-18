#!/bin/bash

# Script to deploy nginx configuration for SignatureBrain
# Run this on your EC2 instance as a user with sudo privileges

set -e  # Exit on error

echo "=========================================="
echo "SignatureBrain Nginx Deployment Script"
echo "=========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration variables
FRONTEND_DIR="/home/ubuntu/signaturebrain-frontend/build"
NGINX_CONFIG_NAME="signaturebrain"
NGINX_AVAILABLE="/etc/nginx/sites-available/$NGINX_CONFIG_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$NGINX_CONFIG_NAME"
BACKEND_PORT=8000

echo "Step 1: Checking prerequisites..."
# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}ERROR: Nginx is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Nginx is installed${NC}"

# Check if frontend build exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}ERROR: Frontend build directory not found at $FRONTEND_DIR${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend build directory exists${NC}"

# Check if backend is running
if ss -tlnp 2>/dev/null | grep -q ":$BACKEND_PORT" || netstat -tlnp 2>/dev/null | grep -q ":$BACKEND_PORT"; then
    echo -e "${GREEN}✓ Backend is running on port $BACKEND_PORT${NC}"
else
    echo -e "${YELLOW}WARNING: Backend may not be running on port $BACKEND_PORT${NC}"
fi

echo
echo "Step 2: Fixing permissions..."
# Fix permissions for nginx to read frontend files
sudo chown -R www-data:www-data "$FRONTEND_DIR"
sudo chmod -R 755 "$FRONTEND_DIR"
# Make sure parent directories are accessible
sudo chmod 755 /home/ubuntu
sudo chmod 755 /home/ubuntu/signaturebrain-frontend
echo -e "${GREEN}✓ Permissions fixed${NC}"

echo
echo "Step 3: Backing up existing nginx config (if exists)..."
if [ -f "$NGINX_AVAILABLE" ]; then
    sudo cp "$NGINX_AVAILABLE" "$NGINX_AVAILABLE.backup.$(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✓ Backup created${NC}"
else
    echo -e "${YELLOW}No existing config to backup${NC}"
fi

echo
echo "Step 4: Copying new nginx configuration..."
if [ -f "nginx-signaturebrain.conf" ]; then
    sudo cp nginx-signaturebrain.conf "$NGINX_AVAILABLE"
    echo -e "${GREEN}✓ Configuration copied${NC}"
else
    echo -e "${RED}ERROR: nginx-signaturebrain.conf not found in current directory${NC}"
    exit 1
fi

echo
echo "Step 5: Creating symbolic link..."
if [ -L "$NGINX_ENABLED" ]; then
    echo "Symbolic link already exists"
else
    sudo ln -s "$NGINX_AVAILABLE" "$NGINX_ENABLED"
    echo -e "${GREEN}✓ Symbolic link created${NC}"
fi

echo
echo "Step 6: Testing nginx configuration..."
if sudo nginx -t; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}ERROR: Nginx configuration has errors${NC}"
    exit 1
fi

echo
echo "Step 7: Restarting nginx..."
sudo systemctl restart nginx
if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx restarted successfully${NC}"
else
    echo -e "${RED}ERROR: Nginx failed to start${NC}"
    exit 1
fi

echo
echo "=========================================="
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo "=========================================="
echo
echo "Next steps:"
echo "1. Check backend API endpoints: curl http://localhost:8000/"
echo "2. Test your site: curl -I https://signaturebrain.com/"
echo "3. Check nginx logs: sudo tail -f /var/log/nginx/signaturebrain_error.log"
echo
