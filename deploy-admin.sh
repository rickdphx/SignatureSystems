#!/bin/bash
# BEN Admin UI Deployment Script
# Run this on your server: bash deploy-admin.sh

set -e

echo "🚀 Deploying BEN Admin UI..."

# Create directory
sudo mkdir -p /var/www/signaturebrain/admin-ui/assets

# Deploy HTML
echo "📄 Deploying HTML..."
sudo tee /var/www/signaturebrain/admin-ui/index.html > /dev/null << 'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/admin/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>BEN Admin</title>
    <script type="module" crossorigin src="/admin/assets/index-BTkehRqw.js"></script>
    <link rel="stylesheet" crossorigin href="/admin/assets/index-ZEVQuCWO.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
EOF

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R www-data:www-data /var/www/signaturebrain/admin-ui
sudo chmod -R 755 /var/www/signaturebrain/admin-ui

# Reload Nginx
echo "🔄 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "Visit: http://signaturebrain.com/admin"
echo "Then: Hard refresh (Ctrl+Shift+R)"
echo ""
