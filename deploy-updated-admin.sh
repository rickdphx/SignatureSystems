#!/bin/bash
# Deploy updated BEN Admin UI with backend integration

set -e

echo "Deploying updated BEN Admin UI..."

TOKEN="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"
BRANCH="claude/build-new-ui-SfvlK"
REPO="rickdphx/SignatureSystems"

# Create temp directory
TMP_DIR="/tmp/admin-deploy-$$"
mkdir -p "$TMP_DIR"
cd "$TMP_DIR"

echo "Downloading updated files from GitHub..."

# Download index.html
curl -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3.raw" \
  -L "https://api.github.com/repos/$REPO/contents/admin-ui/dist/index.html?ref=$BRANCH" \
  -o index.html

# Download CSS file
curl -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3.raw" \
  -L "https://api.github.com/repos/$REPO/contents/admin-ui/dist/assets/index-BdM2JF02.css?ref=$BRANCH" \
  -o index-BdM2JF02.css

# Download JS file
curl -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github.v3.raw" \
  -L "https://api.github.com/repos/$REPO/contents/admin-ui/dist/assets/index-D4Q1bZmh.js?ref=$BRANCH" \
  -o index-D4Q1bZmh.js

echo "Files downloaded. Deploying to server..."

# Backup old files
sudo cp -r /var/www/signaturebrain/admin-ui /var/www/signaturebrain/admin-ui.backup-$(date +%Y%m%d-%H%M%S)

# Deploy new files
sudo cp index.html /var/www/signaturebrain/admin-ui/
sudo mkdir -p /var/www/signaturebrain/admin-ui/assets
sudo cp index-BdM2JF02.css /var/www/signaturebrain/admin-ui/assets/
sudo cp index-D4Q1bZmh.js /var/www/signaturebrain/admin-ui/assets/

# Set permissions
sudo chown -R www-data:www-data /var/www/signaturebrain/admin-ui
sudo chmod -R 755 /var/www/signaturebrain/admin-ui

# Clean up temp files
cd /
rm -rf "$TMP_DIR"

echo "✅ Deployment complete!"
echo ""
echo "The updated admin UI is now live at:"
echo "  - http://signaturebrain.com/admin"
echo ""
echo "Features:"
echo "  ✓ Token authentication (use: 7423cd9fe41413db4fa7b177a23bdd7babe00e167e119f)"
echo "  ✓ Connected to real backend API"
echo "  ✓ Full admin console with all modules"
echo "  ✓ Ben Console, Users, Roles, Integrations, Tools, Logs, Settings"
echo ""
echo "Clear your browser cache (Ctrl+Shift+R) to see the new UI."
