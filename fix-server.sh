#!/bin/bash

echo "Fixing server issue..."

# Kill ALL node processes on port 3000
echo "Killing all processes on port 3000..."
sudo lsof -ti:3000 | xargs -r sudo kill -9

# Delete all PM2 processes
echo "Cleaning PM2..."
pm2 delete all

# Wait a moment
sleep 2

# Start fresh
echo "Starting signup system..."
pm2 start /var/www/signature-chair-frontend/server.js --name frontend

# Start ben-backend if needed
if [ -f /var/www/signature-chair-backend/src/index.js ]; then
    pm2 start /var/www/signature-chair-backend/src/index.js --name ben-backend
fi

echo ""
echo "Testing..."
sleep 2
curl -s localhost:3000 | head -20

echo ""
pm2 status
