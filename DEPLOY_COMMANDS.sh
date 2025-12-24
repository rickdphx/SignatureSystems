#!/bin/bash
# BEN Admin Deployment Script
# Run this on the signaturebrain.com server

set -e  # Exit on error

echo "=== BEN Admin Deployment Starting ==="

# Step 1: Backup current Nginx config
echo -e "\n[1/8] Backing up Nginx config..."
sudo cp /etc/nginx/sites-enabled/signaturebrain /etc/nginx/sites-enabled/signaturebrain.backup.$(date +%Y%m%d-%H%M%S)

# Step 2: Create admin-ui directory
echo -e "\n[2/8] Creating admin-ui directory..."
sudo mkdir -p /var/www/signaturebrain/admin-ui
cd /tmp

# Step 3: Clone the repository (to get the built files)
echo -e "\n[3/8] Getting files from GitHub..."
if [ -d "/tmp/SignatureSystems" ]; then
    sudo rm -rf /tmp/SignatureSystems
fi
git clone https://github.com/rickdphx/SignatureSystems.git
cd SignatureSystems
git checkout claude/build-new-ui-SfvlK

# Step 4: Install dependencies and build (to ensure we have latest)
echo -e "\n[4/8] Building admin UI..."
cd admin-ui
npm install --production
npm run build

# Step 5: Copy built files to web directory
echo -e "\n[5/8] Copying files to web directory..."
sudo cp -r dist/* /var/www/signaturebrain/admin-ui/

# Step 6: Set permissions
echo -e "\n[6/8] Setting permissions..."
sudo chown -R www-data:www-data /var/www/signaturebrain/admin-ui
sudo chmod -R 755 /var/www/signaturebrain/admin-ui

# Step 7: Update Nginx configuration
echo -e "\n[7/8] Updating Nginx config..."
# We'll need to manually edit this - showing the required changes

echo "
Please update /etc/nginx/sites-enabled/signaturebrain:

FIND this block (around line 454):
    location /admin/ {
        proxy_pass http://127.0.0.1:3000/admin/;
        ...
    }

REPLACE with:
    location /admin {
        alias /var/www/signaturebrain/admin-ui;
        try_files \$uri \$uri/ /admin/index.html;
        index index.html;

        # Security headers
        add_header X-Frame-Options \"SAMEORIGIN\" always;
        add_header X-Content-Type-Options \"nosniff\" always;
        add_header X-XSS-Protection \"1; mode=block\" always;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }

        # Don't cache HTML
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control \"no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0\";
        }
    }

    # Remove the 'location = /admin' redirect block if it exists
"

read -p "Press Enter after you've updated the Nginx config..."

# Step 8: Test and reload Nginx
echo -e "\n[8/8] Testing Nginx config..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx config test passed! Reloading..."
    sudo systemctl reload nginx
    echo -e "\n✅ DEPLOYMENT COMPLETE!"
    echo "Visit: https://signaturebrain.com/admin"
else
    echo "❌ Nginx config test failed! Rolling back..."
    sudo cp /etc/nginx/sites-enabled/signaturebrain.backup.* /etc/nginx/sites-enabled/signaturebrain
    exit 1
fi

# Cleanup
cd /
sudo rm -rf /tmp/SignatureSystems

echo -e "\n=== Deployment Summary ==="
echo "✅ Files deployed to: /var/www/signaturebrain/admin-ui"
echo "✅ Nginx config updated"
echo "✅ Admin UI live at: https://signaturebrain.com/admin"
echo ""
echo "Old PM2 process 'ben-admin' is still running."
echo "If everything works, you can stop it with: pm2 stop ben-admin"
