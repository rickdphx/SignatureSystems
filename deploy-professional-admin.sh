#!/bin/bash

# Deploy Professional BEN Admin Interface
# Run this script from your Windows machine (Git Bash, WSL, or PowerShell with SSH)

echo "🚀 Deploying Professional BEN Admin Interface..."
echo ""

# SSH connection details
SSH_KEY="C:/Users/rickd/Downloads/chatnotion-key.pem"
SSH_HOST="ubuntu@18.118.103.251"
TARGET_FILE="/var/www/signaturebrain/admin-ui/index.html"

# Create backup of current file
echo "📦 Creating backup of current admin page..."
ssh -i "$SSH_KEY" $SSH_HOST "cp $TARGET_FILE ${TARGET_FILE}.backup-$(date +%Y%m%d-%H%M%S)"

# Deploy new professional admin interface
echo "📤 Deploying new professional admin interface..."
cat admin-ui-professional.html | ssh -i "$SSH_KEY" $SSH_HOST "cat > $TARGET_FILE"

# Verify deployment
echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Verifying deployment..."
ssh -i "$SSH_KEY" $SSH_HOST "ls -lh $TARGET_FILE && head -n 10 $TARGET_FILE"

echo ""
echo "✨ Professional BEN Admin Interface deployed successfully!"
echo "🌐 Visit: https://signaturebrain.com/admin/"
echo ""
