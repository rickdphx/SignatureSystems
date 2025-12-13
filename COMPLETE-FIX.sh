#!/bin/bash
# COMPLETE FIX for [object Object] issue
# Run this on your EC2 server

echo "=== Applying Complete Fix ==="

# Backup
sudo cp /var/www/ip-ui-admin/index.html /var/www/ip-ui-admin/index.html.backup-$(date +%Y%m%d-%H%M%S)

# Find the problematic line and replace it
# The issue: messageInput?.value is somehow an object
# Solution: Force string conversion with String()

sudo sed -i 's/const text = (messageInput?.value || "").trim();/const text = String(messageInput?.value || "").trim(); console.log("DEBUG: Sending text:", text, "Type:", typeof text);/g' /var/www/ip-ui-admin/index.html

# Add timestamp to force cache refresh
TIMESTAMP=$(date +%s)
sudo sed -i "1i <!-- Cache Buster: $TIMESTAMP -->" /var/www/ip-ui-admin/index.html

echo "✅ Fix applied!"
echo ""
echo "Now do this:"
echo "1. Go to your browser"
echo "2. Press Ctrl+Shift+Delete"
echo "3. Clear cache and cookies"
echo "4. OR just press Ctrl+Shift+R for hard refresh"
echo "5. Try sending a message"
echo "6. Open console (F12) and you should see: 'DEBUG: Sending text: your_message Type: string'"
echo ""
echo "If it still doesn't work, the problem is elsewhere. Check backend logs."
