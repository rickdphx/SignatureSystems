# Deploy BEN Admin Panel - Professional Version

This guide deploys the enhanced BEN Admin Panel with proper backend API, secure configuration storage, and professional UI.

## Features

### Backend (server-enhanced.js)
- ✅ RESTful API for configuration management
- ✅ Secure configuration storage in `config.json`
- ✅ API key encryption and validation
- ✅ Connection testing endpoints
- ✅ Real-time WebSocket updates
- ✅ Multi-client support with broadcast
- ✅ Health monitoring

### Frontend (admin-ui-pro.html)
- ✅ Modern, responsive design
- ✅ Password visibility toggles
- ✅ Real-time connection status
- ✅ Live uptime and client count
- ✅ Configuration persistence
- ✅ API connection testing
- ✅ Beautiful terminal output
- ✅ Automatic reconnection with backoff

## Deployment Steps

### 1. On EC2 Server

```bash
# Navigate to the project directory (or create it)
cd ~ && mkdir -p ben-admin && cd ben-admin

# Upload the enhanced server file
# (You'll copy server-enhanced.js content here)
nano server.js
# Paste the content from server-enhanced.js
# Save with Ctrl+O, Exit with Ctrl+X

# Install dependencies (if not already installed)
npm init -y
npm install express ws cors

# Stop old server if running
pkill -f "node.*server.js"

# Start the enhanced server
node server.js &

# Or use PM2 for production
npm install -g pm2
pm2 start server.js --name ben-admin
pm2 save
pm2 startup
```

### 2. Deploy Admin UI

```bash
# Upload the professional admin UI
sudo nano /var/www/signaturebrain/admin-ui/index.html
# Paste the content from admin-ui-pro.html
# Save and exit

# Set proper permissions
sudo chown -R www-data:www-data /var/www/signaturebrain/admin-ui
sudo chmod -R 755 /var/www/signaturebrain/admin-ui
```

### 3. Verify Nginx Configuration

Ensure nginx has both locations configured:

```nginx
# Inside HTTPS server block (port 443)
location /admin {
    add_header Cache-Control "no-store, no-cache, must-revalidate";
    alias /var/www/signaturebrain/admin-ui;
    try_files $uri $uri/ /admin/index.html;
    index index.html;
}

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

location /api {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Test and reload:
```bash
sudo nginx -t && sudo nginx -s reload
```

### 4. Purge Cloudflare Cache

1. Go to Cloudflare Dashboard
2. Navigate to **Caching** → **Configuration**
3. Click **Purge Everything**
4. Confirm

### 5. Access the Admin Panel

Visit: **https://signaturebrain.com/admin/**

You should see:
- ✅ Modern, professional UI
- ✅ Connected status (green)
- ✅ Live uptime counter
- ✅ API configuration forms
- ✅ BEN integration settings
- ✅ Real-time terminal output

## Configuration

### API Keys
All API keys entered in the admin panel are:
1. Saved securely to `config.json` on the server
2. Only accessible with valid admin token
3. Never exposed in browser localStorage
4. Encrypted in transit via HTTPS

### BEN Integration
Configure your BEN service by:
1. Entering the BEN Service URL
2. Adding your BEN API token
3. Setting webhook URLs for callbacks
4. Providing JSON configuration (model settings, etc.)
5. Testing the connection

### Settings Persistence
- Server-side: Settings saved to `~/ben-admin/config.json`
- Survives server restarts
- Accessible via `/api/config` endpoint
- Requires authentication

## Security Notes

1. **Change the admin token**: Edit `ADMIN_TOKEN` in server.js
2. **Use environment variables**: Set `ADMIN_TOKEN` via environment
3. **HTTPS only**: Never use over HTTP in production
4. **Firewall**: Ensure port 3000 is not publicly accessible (nginx proxies it)

## Troubleshooting

### Can't connect
```bash
# Check if server is running
ps aux | grep node

# Check server logs
pm2 logs ben-admin

# Test health endpoint
curl http://localhost:3000/health
```

### Configuration not saving
```bash
# Check file permissions
ls -la ~/ben-admin/config.json

# Check server logs for errors
pm2 logs ben-admin --lines 50
```

### WebSocket disconnecting
```bash
# Check nginx WebSocket proxy
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# Restart server
pm2 restart ben-admin
```

## Architecture

```
User Browser (HTTPS)
    ↓
signaturebrain.com/admin/ (Nginx serves static HTML)
    ↓
├── WSS://signaturebrain.com/ws → WebSocket (port 3000)
│   └── Real-time terminal updates
│
└── HTTPS://signaturebrain.com/api/* → REST API (port 3000)
    ├── POST /api/config → Save configuration
    ├── GET /api/config → Load configuration
    └── POST /api/test-connection → Test API connectivity
```

## Next Steps

1. Customize the terminal output in `server-enhanced.js`
2. Add more API integrations as needed
3. Implement actual BEN service connections
4. Add authentication/authorization layers
5. Set up monitoring and alerting
