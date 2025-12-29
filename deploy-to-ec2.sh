#!/bin/bash
# Deploy Ben Console to AWS EC2

EC2_IP="YOUR_EC2_IP_HERE"
EC2_USER="ubuntu"
EC2_KEY="~/.ssh/your-key.pem"

echo "📦 Creating deployment package..."
tar -czf ben-console.tar.gz \
  server.js \
  package.json \
  public/ \
  DOWNLOAD_THIS.html \
  index.html

echo "🚀 Copying to EC2..."
scp -i $EC2_KEY ben-console.tar.gz $EC2_USER@$EC2_IP:~/

echo "⚙️  Installing on EC2..."
ssh -i $EC2_KEY $EC2_USER@$EC2_IP << 'EOF'
  tar -xzf ben-console.tar.gz
  cd ~/

  # Install Node.js if not present
  if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi

  # Install dependencies
  npm install

  # Stop existing process
  sudo pkill -f "node server.js" || true

  # Start server
  sudo nohup node server.js > /dev/null 2>&1 &

  echo "✅ Ben Console deployed and running on port 80"
EOF

echo "🌐 Update Cloudflare DNS:"
echo "   signaturebrain.com A record → $EC2_IP"
echo "   Keep DNS-only mode (gray cloud)"
