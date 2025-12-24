#!/bin/bash
# Complete deployment script with embedded base64 data

echo "Creating tarball from base64..."
cat > /tmp/admin.tar.gz.b64 << 'BASE64DATA'
