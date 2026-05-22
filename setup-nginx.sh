#!/bin/bash

echo "Setting up Nginx for staging.thesignaturechair.com..."

# Copy config
sudo cp nginx-staging.conf /etc/nginx/sites-available/staging.thesignaturechair.com

# Enable site
sudo ln -sf /etc/nginx/sites-available/staging.thesignaturechair.com /etc/nginx/sites-enabled/staging.thesignaturechair.com

# Test config
echo "Testing Nginx config..."
sudo nginx -t

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Done! Test at http://staging.thesignaturechair.com"
echo ""
echo "Note: Make sure DNS points staging.thesignaturechair.com to this server's IP"
