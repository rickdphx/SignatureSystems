#!/bin/bash

# Quick deploy - creates everything from scratch

set -e

echo "🚀 Setting up signup system..."

# Create directory
sudo mkdir -p /var/www/signature-chair-frontend

# Create barbers database
echo '{"barbers":{}}' | sudo tee /var/www/signature-chair-frontend/barbers.json > /dev/null

# Copy server file
sudo cp signup-system.js /var/www/signature-chair-frontend/server.js

# Stop any existing frontend
pm2 delete frontend 2>/dev/null || true

# Start fresh
pm2 start /var/www/signature-chair-frontend/server.js --name frontend

echo ""
echo "✅ Done! Visit https://staging.thesignaturechair.com/signup"
