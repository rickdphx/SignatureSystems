#!/bin/bash
# QUICK ONE-LINE FIX
# Run this on your EC2 server

echo "=== QUICK FIX for [object Object] issue ==="

# Backup
echo "Creating backup..."
sudo cp /var/www/ip-ui-admin/index.html /var/www/ip-ui-admin/index.html.backup-$(date +%Y%m%d-%H%M%S)

# Fix: Force String() conversion
echo "Applying fix..."
sudo sed -i 's/const text = (messageInput?.value || "").trim();/const text = String(document.getElementById("messageInput")?.value || "").trim();/g' /var/www/ip-ui-admin/index.html

# Add cache buster
TIMESTAMP=$(date +%s)
sudo sed -i "s/<!-- Version: [0-9]* -->/<!-- Version: $TIMESTAMP -->/g" /var/www/ip-ui-admin/index.html

# If no version comment exists, add one
if ! grep -q "<!-- Version:" /var/www/ip-ui-admin/index.html; then
    sudo sed -i "1i <!-- Version: $TIMESTAMP -->" /var/www/ip-ui-admin/index.html
fi

echo "✅ Fix applied!"
echo ""
echo "Next steps:"
echo "1. Reload the page in browser (Ctrl+Shift+R to force refresh)"
echo "2. Open browser console (F12)"
echo "3. Try sending a message"
echo "4. Check the console - you should see 'Sending message: your text Type: string'"
echo ""
echo "If it still shows [object Object], run the diagnostic:"
echo "   sed -n '674,710p' /var/www/ip-ui-admin/index.html"
