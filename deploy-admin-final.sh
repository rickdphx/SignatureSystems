#!/bin/bash
# Deploy BEN Admin UI - Final version without login

set -e

echo "Deploying BEN Admin UI (no login, direct access)..."

TOKEN="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"
BRANCH="claude/build-new-ui-SfvlK"
REPO="rickdphx/SignatureSystems"

# Create temp directory
TMP_DIR="/tmp/admin-deploy-$$"
mkdir -p "$TMP_DIR"
cd "$TMP_DIR"

echo "Downloading files from GitHub..."

# Download index.html
curl -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3.raw" \
  -L "https://api.github.com/repos/$REPO/contents/admin-ui/dist/index.html?ref=$BRANCH" \
  -o index.html

# Download CSS file (correct filename)
curl -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3.raw" \
  -L "https://api.github.com/repos/$REPO/contents/admin-ui/dist/assets/index-ZEVQuCWO.css?ref=$BRANCH" \
  -o index-ZEVQuCWO.css

# Download JS file (correct filename)
curl -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3.raw" \
  -L "https://api.github.com/repos/$REPO/contents/admin-ui/dist/assets/index-BLUhyogE.js?ref=$BRANCH" \
  -o index-BLUhyogE.js

echo "Files downloaded. Deploying to server..."

# Backup old files
sudo cp -r /var/www/signaturebrain/admin-ui /var/www/signaturebrain/admin-ui.backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Deploy new files
sudo mkdir -p /var/www/signaturebrain/admin-ui/assets
sudo cp index.html /var/www/signaturebrain/admin-ui/
sudo cp index-ZEVQuCWO.css /var/www/signaturebrain/admin-ui/assets/
sudo cp index-BLUhyogE.js /var/www/signaturebrain/admin-ui/assets/

# Set permissions
sudo chown -R www-data:www-data /var/www/signaturebrain/admin-ui
sudo chmod -R 755 /var/www/signaturebrain/admin-ui

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

# Clean up temp files
cd /
rm -rf "$TMP_DIR"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "The admin UI is now live at:"
echo "  http://signaturebrain.com/admin"
echo ""
echo "Features:"
echo "  ✓ NO LOGIN SCREEN - Direct access to admin console"
echo "  ✓ Full BEN Admin UI with all 7 modules"
echo "  ✓ Ben Console, Users, Roles, Integrations, Tools, Logs, Settings"
echo "  ✓ Connected to backend API (token stored in browser)"
echo ""
echo "IMPORTANT: Clear browser cache (Ctrl+Shift+R) to see the new UI!"
echo ""
