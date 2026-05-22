#!/bin/bash

# Deploy Signup System to Signature Chair Frontend
# Run this on ben-server

set -e

echo "🚀 Deploying Signup System..."

# Create backup of current server
echo "Creating backup..."
sudo cp /var/www/signature-chair-frontend/server.js /var/www/signature-chair-frontend/server.js.backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Ensure barbers.json exists with proper permissions
echo "Setting up database file..."
sudo mkdir -p /var/www/signature-chair-frontend
if [ ! -f /var/www/signature-chair-frontend/barbers.json ]; then
    echo '{"barbers":{}}' | sudo tee /var/www/signature-chair-frontend/barbers.json > /dev/null
fi
sudo chmod 644 /var/www/signature-chair-frontend/barbers.json

# Deploy the signup system
echo "Deploying signup-system.js..."
sudo cp signup-system.js /var/www/signature-chair-frontend/server.js

# Restart frontend
echo "Restarting frontend..."
pm2 restart frontend || pm2 start /var/www/signature-chair-frontend/server.js --name frontend

echo ""
echo "✅ Signup system deployed successfully!"
echo ""
echo "Test it at:"
echo "  - https://staging.thesignaturechair.com/signup"
echo "  - https://staging.thesignaturechair.com/login"
echo ""
echo "Check status: pm2 status"
echo "View logs: pm2 logs frontend"
