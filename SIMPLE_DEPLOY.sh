#!/bin/bash
# Simple BEN Admin Deployment Script
# Run this on signaturebrain.com server as ubuntu user

set -e

echo "=== BEN Admin Deployment ==="
echo ""

# Check if we're on the right server
if [ ! -d "/var/www/signaturebrain" ]; then
    echo "❌ Error: /var/www/signaturebrain not found"
    echo "This script must be run on the signaturebrain.com server"
    exit 1
fi

# Step 1: Clone repository
echo "[1/6] Cloning repository..."
cd /tmp
if [ -d "SignatureSystems" ]; then
    rm -rf SignatureSystems
fi

echo ""
echo "The repository is private. You'll need to authenticate."
echo "When prompted, use your GitHub username and Personal Access Token"
echo "(NOT your password - use a PAT from github.com/settings/tokens)"
echo ""
read -p "Press Enter to continue..."

git clone https://github.com/rickdphx/SignatureSystems.git
cd SignatureSystems
git checkout claude/build-new-ui-SfvlK

# Step 2: Install Node.js if needed
echo ""
echo "[2/6] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✓ Node.js $(node --version) found"
fi

# Step 3: Build the admin UI
echo ""
echo "[3/6] Building admin UI..."
cd admin-ui
npm install
npm run build

# Step 4: Deploy files
echo ""
echo "[4/6] Deploying files..."
sudo mkdir -p /var/www/signaturebrain/admin-ui
sudo cp -r dist/* /var/www/signaturebrain/admin-ui/

# Step 5: Set permissions
echo ""
echo "[5/6] Setting permissions..."
sudo chown -R www-data:www-data /var/www/signaturebrain/admin-ui
sudo chmod -R 755 /var/www/signaturebrain/admin-ui

# Step 6: Verify
echo ""
echo "[6/6] Verifying deployment..."
echo ""
echo "📊 Deployed files:"
ls -lh /var/www/signaturebrain/admin-ui/
echo ""
echo "📊 Asset files:"
ls -lh /var/www/signaturebrain/admin-ui/assets/

echo ""
echo "✅ Files deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Update Nginx configuration (see NGINX_CONFIG.txt)"
echo "2. Test config: sudo nginx -t"
echo "3. Reload Nginx: sudo systemctl reload nginx"
echo "4. Visit: https://signaturebrain.com/admin"
echo ""

# Cleanup
cd /
rm -rf /tmp/SignatureSystems
