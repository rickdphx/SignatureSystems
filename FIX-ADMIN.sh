#!/bin/bash
# Simple fix: Deploy professional admin interface

echo "Deploying professional BEN Admin interface..."

# Check if git is available
if command -v git &> /dev/null; then
    echo "Using git to deploy..."
    cd /tmp
    rm -rf SignatureSystems 2>/dev/null
    git clone --depth 1 --branch claude/fix-terminal-response-jqUon https://github.com/rickdphx/SignatureSystems.git
    sudo cp SignatureSystems/admin-ui-professional.html /var/www/signaturebrain/admin-ui/index.html
    sudo chmod 644 /var/www/signaturebrain/admin-ui/index.html
    rm -rf SignatureSystems
    echo "✓ Deployed via git"
    ls -lh /var/www/signaturebrain/admin-ui/index.html
    exit 0
fi

# Fallback: Use python if available
if command -v python3 &> /dev/null; then
    echo "Using python3 to download..."
    python3 -c "
import urllib.request
url = 'https://raw.githubusercontent.com/rickdphx/SignatureSystems/claude/fix-terminal-response-jqUon/admin-ui-professional.html'
urllib.request.urlretrieve(url, '/tmp/admin.html')
"
    sudo cp /tmp/admin.html /var/www/signaturebrain/admin-ui/index.html
    sudo chmod 644 /var/www/signaturebrain/admin-ui/index.html
    echo "✓ Deployed via python"
    ls -lh /var/www/signaturebrain/admin-ui/index.html
    exit 0
fi

echo "Error: Neither git nor python3 found. Please install one of them."
exit 1
