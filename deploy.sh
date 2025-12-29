#!/bin/bash
# Deploy Ben Console to production server

echo "🚀 Deploying Ben Console..."

# Configuration - UPDATE THESE
SERVER_IP="18.118.103.251"
SERVER_USER="ubuntu"  # or your SSH username
SSH_KEY="~/.ssh/your-key.pem"  # path to your SSH key
DEPLOY_PATH="/var/www/signaturebrain/admin-ui"

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf ben-console-deploy.tar.gz \
  server.js \
  package.json \
  public/ \
  index.html \
  DOWNLOAD_THIS.html

echo "📤 Uploading to server..."
scp -i $SSH_KEY ben-console-deploy.tar.gz $SERVER_USER@$SERVER_IP:/tmp/

echo "⚙️  Installing on server..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'ENDSSH'
  # Create deployment directory
  sudo mkdir -p /var/www/signaturebrain/admin-ui
  cd /var/www/signaturebrain/admin-ui

  # Extract files
  sudo tar -xzf /tmp/ben-console-deploy.tar.gz -C .
  sudo chown -R www-data:www-data .

  # Install dependencies
  sudo npm install --production

  # Stop old BEN Control Center (if running)
  sudo pkill -f "node.*admin" || true

  # Start new Ben Console with PM2 (or create systemd service)
  sudo npm install -g pm2
  sudo pm2 delete ben-console || true
  sudo pm2 start server.js --name ben-console
  sudo pm2 save
  sudo pm2 startup

  # Cleanup
  rm /tmp/ben-console-deploy.tar.gz

  echo "✅ Ben Console deployed successfully!"
  echo "📍 Access at: http://signaturebrain.com/admin/"
  echo "🔐 Username: Yahu86"
  echo "🔐 Password: 2121"
ENDSSH

echo "🎉 Deployment complete!"
rm ben-console-deploy.tar.gz
