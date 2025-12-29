#!/bin/bash

# Deploy Script for Signature Chair Frontend with Nando Blends

echo "🚀 Deploying Signature Chair Frontend..."

# Stop current frontend
echo "Stopping current frontend..."
pm2 stop frontend || true

# Copy files to deployment directory
echo "Copying files..."
cp server.js /var/www/signature-chair-frontend/
cp nandoblends.html /var/www/signature-chair-frontend/

# Restart frontend
echo "Restarting frontend..."
pm2 restart frontend || pm2 start /var/www/signature-chair-frontend/server.js --name frontend

echo "✅ Deployment complete!"
echo ""
echo "Available routes:"
echo "  - https://staging.thesignaturechair.com/ (home)"
echo "  - https://staging.thesignaturechair.com/nandoblends (Nando Blends contact)"
echo "  - https://staging.thesignaturechair.com/rick (barber profile)"
echo "  - https://staging.thesignaturechair.com/rick/book (booking)"
echo ""
echo "Check status: pm2 status"
echo "View logs: pm2 logs frontend"
