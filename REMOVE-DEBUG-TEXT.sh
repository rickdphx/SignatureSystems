#!/bin/bash
# Remove debug text from frontend

echo "Removing debug text from frontend..."

# Find and remove "Backend expects" debug lines
sudo sed -i '/Backend expects/d' /var/www/ip-ui-admin/index.html

# Remove any console.log lines that output to the page
sudo sed -i '/console\.log.*Backend expects/d' /var/www/ip-ui-admin/index.html

echo "✅ Debug text removed!"
echo "Hard refresh the browser (Ctrl+Shift+R) to see changes"
