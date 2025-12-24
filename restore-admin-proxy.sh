#!/bin/bash
# Restore the proxy configuration for /admin to bring back the working backend admin UI

echo "Restoring admin proxy configuration..."

# Create backup first
sudo cp /etc/nginx/sites-enabled/signaturebrain /etc/nginx/sites-enabled/signaturebrain.backup.static-$(date +%Y%m%d-%H%M%S)

# Find the most recent proxy backup
PROXY_BACKUP=$(ls -t /etc/nginx/sites-enabled/signaturebrain.backup.* 2>/dev/null | head -1)

if [ -n "$PROXY_BACKUP" ]; then
    echo "Found backup: $PROXY_BACKUP"
    echo "Restoring proxy configuration from backup..."
    sudo cp "$PROXY_BACKUP" /etc/nginx/sites-enabled/signaturebrain
else
    echo "No backup found. Creating proxy configuration manually..."

    # Remove the static file location block and add proxy instead
    sudo sed -i '/location \/admin {/,/^    }/c\
    location /admin/ {\
        proxy_pass http://127.0.0.1:3000/admin/;\
        proxy_http_version 1.1;\
        proxy_set_header Upgrade $http_upgrade;\
        proxy_set_header Connection '"'upgrade'"';\
        proxy_set_header Host $host;\
        proxy_cache_bypass $http_upgrade;\
        proxy_set_header X-Real-IP $remote_addr;\
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
        proxy_set_header X-Forwarded-Proto $scheme;\
    }' /etc/nginx/sites-enabled/signaturebrain
fi

# Test configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Configuration valid. Reloading nginx..."
    sudo systemctl reload nginx
    echo "Done! The backend admin UI should now be accessible at https://signaturebrain.com/admin"
else
    echo "Configuration test failed. Restoring from backup..."
    sudo cp "/etc/nginx/sites-enabled/signaturebrain.backup.static-$(date +%Y%m%d-%H%M%S)" /etc/nginx/sites-enabled/signaturebrain
    echo "Restoration failed. Please check nginx configuration manually."
    exit 1
fi
