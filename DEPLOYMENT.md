# Deployment Instructions

## Quick Fix for HTTPS Issue

The HTTPS configuration needs to be updated on the server hosting signaturebrain.com. Follow these steps:

### 1. Backup Current Nginx Configuration
```bash
sudo cp /etc/nginx/sites-enabled/signaturebrain /etc/nginx/sites-enabled/signaturebrain.backup
```

### 2. Update HTTPS Server Block

Edit the nginx configuration file:
```bash
sudo nano /etc/nginx/sites-enabled/signaturebrain
```

Find the server block that contains `listen 443 ssl` and add these two location blocks:

```nginx
# Add this inside the server { } block for port 443

    # Serve the admin UI from static files
    location /admin {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
        alias /var/www/signaturebrain/admin-ui;
        try_files $uri $uri/ /admin/index.html;
        index index.html;
    }

    # WebSocket proxy for terminal responses
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
```

### 3. Test Nginx Configuration
```bash
sudo nginx -t
```

### 4. Reload Nginx
If the test passes:
```bash
sudo nginx -s reload
```

### 5. Verify the Fix

1. Visit https://signaturebrain.com/admin/ - should load the admin page (not "Cannot GET /admin/")
2. The WebSocket should connect via WSS (secure WebSocket over HTTPS)
3. Terminal responses should appear every 1 second

## Complete Nginx Configuration Reference

See `nginx-signaturebrain.conf` for a complete example configuration file.

## WebSocket Server

The WebSocket server must be running on port 3000:
```bash
cd ~/websocket-server  # or wherever server.js is located
node server.js
```

Or use a process manager like pm2:
```bash
pm2 start server.js --name terminal-response
pm2 save
```

## Authentication

The admin page at signaturebrain.com/admin/ connects to the WebSocket server using:
- **WebSocket URL**: `wss://signaturebrain.com/ws` (secure WebSocket via HTTPS)
- **Admin Token**: Set via `ADMIN_TOKEN` environment variable (default: `admin-token-12345`)

## Troubleshooting

### Issue: "Cannot GET /admin/" on HTTPS
- **Cause**: HTTPS server block missing /admin/ location
- **Fix**: Add the /admin location block to port 443 server configuration

### Issue: WebSocket fails to connect over HTTPS
- **Cause**: Mixed content error (HTTPS page trying to connect to WS://)
- **Fix**: Use WSS:// URL via nginx proxy at /ws

### Issue: "Authentication failed"
- **Cause**: Wrong token or token parameter missing
- **Fix**: Ensure token is passed correctly via URL query parameter or WebSocket message

## Architecture

```
User Browser (HTTPS)
    ↓
signaturebrain.com/admin/ (Nginx serves static files)
    ↓
WSS://signaturebrain.com/ws (Nginx proxies to localhost:3000)
    ↓
WebSocket Server on port 3000
    ↓
Sends terminal responses every 1 second
```
