#!/bin/bash

# Script to troubleshoot SignatureBrain deployment issues
# Run this on your EC2 instance

echo "=========================================="
echo "SignatureBrain Troubleshooting Report"
echo "=========================================="
echo

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "1. NGINX STATUS"
echo "----------------------------------------"
if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓ Nginx is running${NC}"
else
    echo -e "${RED}✗ Nginx is NOT running${NC}"
fi
echo

echo "2. BACKEND STATUS (Port 8000)"
echo "----------------------------------------"
if ss -tlnp 2>/dev/null | grep -q ":8000" || netstat -tlnp 2>/dev/null | grep -q ":8000"; then
    echo -e "${GREEN}✓ Backend is listening on port 8000${NC}"
    ss -tlnp 2>/dev/null | grep ":8000" || netstat -tlnp 2>/dev/null | grep ":8000" || true
else
    echo -e "${RED}✗ Nothing listening on port 8000${NC}"
fi
echo

echo "3. FRONTEND BUILD DIRECTORY"
echo "----------------------------------------"
if [ -d "/home/ubuntu/signaturebrain-frontend/build" ]; then
    echo -e "${GREEN}✓ Frontend build directory exists${NC}"
    ls -lah /home/ubuntu/signaturebrain-frontend/build/ | head -10
else
    echo -e "${RED}✗ Frontend build directory NOT found${NC}"
fi
echo

echo "4. DIRECTORY PERMISSIONS"
echo "----------------------------------------"
echo "Checking permissions chain..."
ls -ld /home/ubuntu
ls -ld /home/ubuntu/signaturebrain-frontend 2>/dev/null || echo "Directory not found"
ls -ld /home/ubuntu/signaturebrain-frontend/build 2>/dev/null || echo "Directory not found"
echo

echo "5. NGINX CONFIGURATION"
echo "----------------------------------------"
if [ -f "/etc/nginx/sites-available/signaturebrain" ]; then
    echo -e "${GREEN}✓ Config file exists${NC}"
    echo "Testing configuration..."
    sudo nginx -t
else
    echo -e "${RED}✗ Config file NOT found${NC}"
fi
echo

echo "6. NGINX LOGS (Last 20 lines)"
echo "----------------------------------------"
echo "=== ERROR LOG ==="
sudo tail -20 /var/log/nginx/signaturebrain_error.log 2>/dev/null || sudo tail -20 /var/log/nginx/error.log
echo
echo "=== ACCESS LOG ==="
sudo tail -10 /var/log/nginx/signaturebrain_access.log 2>/dev/null || sudo tail -10 /var/log/nginx/access.log
echo

echo "7. SSL CERTIFICATES"
echo "----------------------------------------"
if [ -f "/etc/letsencrypt/live/signaturebrain.com/fullchain.pem" ]; then
    echo -e "${GREEN}✓ SSL certificate found${NC}"
    sudo openssl x509 -in /etc/letsencrypt/live/signaturebrain.com/fullchain.pem -noout -dates 2>/dev/null || echo "Cannot read certificate"
else
    echo -e "${YELLOW}⚠ SSL certificate not found at expected location${NC}"
fi
echo

echo "8. TESTING BACKEND ENDPOINTS"
echo "----------------------------------------"
echo "Testing backend root..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8000/ 2>/dev/null || echo "Cannot connect to backend"
echo "Testing /api/ endpoint..."
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8000/api/ 2>/dev/null || echo "Cannot connect to backend"
echo

echo "9. BACKEND PROCESS INFORMATION"
echo "----------------------------------------"
ps aux | grep -E "(python|uvicorn|gunicorn)" | grep -v grep || echo "No Python web server processes found"
echo

echo "=========================================="
echo "Troubleshooting report complete"
echo "=========================================="
