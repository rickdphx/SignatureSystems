# BEN Admin Panel Deployment - COMPLETE ✅

## Deployment Summary

All files have been successfully deployed to `/var/www/signaturebrain/` on the server.

## Files Deployed

### Server Files
- `/var/www/signaturebrain/server.js` - Main Express server with session authentication
- `/var/www/signaturebrain/server/adminRoutes.js` - Admin API routes for config, logs, and BEN console

### Frontend Files
- `/var/www/signaturebrain/public/admin/login.html` - Password login page
- `/var/www/signaturebrain/public/admin/admin.html` - Main admin UI with BEN Console
- `/var/www/signaturebrain/public/admin/admin.js` - Frontend JavaScript with HTTP polling

### Directories Created
- `/var/www/signaturebrain/config/` - Configuration storage (auto-creates ben-admin.config.json)
- `/var/www/signaturebrain/logs/` - Application logs (app.log, server.log)

## Server Status

✅ **Server is running on port 3000**

- Health Check: http://localhost:3000/health
- Admin Login: http://localhost:3000/admin/login

## Current Configuration

### Default Credentials (CHANGE THESE!)
- Username: `admin`
- Password: `admin123`

### Environment Variables (Set these for production)
```bash
export BEN_ADMIN_USERNAME="your-username"
export BEN_ADMIN_PASSWORD="your-secure-password"
export SESSION_SECRET="your-random-secret-key-min-32-chars"
```

## Features Implemented

### 1. Password-Protected Admin Panel ✅
- Session-based authentication
- Login/logout functionality
- Auto-redirect to login if not authenticated

### 2. AI Models Configuration ✅
- **Grok** (X.AI) - Primary model
- **Claude** (Anthropic) - Deep reasoning model
- Custom system instructions
- Password masking for API keys

### 3. BEN Console ✅
- Direct AI prompts with 5 modes:
  - **Normal**: Default Grok processing
  - **Deep Reasoning**: Uses Claude for thorough analysis
  - **Torah Mode**: Torah-aligned responses
  - **Research Mode**: Comprehensive research with Claude
  - **Haríts (Execute)**: Direct action mode
- Real-time response display
- Model/provider information

### 4. HTTP Polling (No WebSocket) ✅
- Logs update every 10 seconds
- No WebSocket connection issues
- Automatic polling in background

### 5. Configuration Management ✅
- Save/load configuration to/from JSON file
- Atomic file writes (prevents corruption)
- BEN integration settings
- API connection testing

## Next Steps

### 1. Set Environment Variables
SSH to your server and add to your shell profile:

```bash
# Add to ~/.bashrc or ~/.profile
export BEN_ADMIN_USERNAME="your-chosen-username"
export BEN_ADMIN_PASSWORD="your-secure-password"
export SESSION_SECRET="$(openssl rand -hex 32)"
```

Then restart the server:
```bash
pkill -f "node.*server.js"
cd /var/www/signaturebrain && nohup node server.js > logs/server.log 2>&1 &
```

### 2. Configure Nginx Reverse Proxy

Add to your nginx configuration:

```nginx
# Inside your HTTPS server block
location /admin {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Session cookie support
    proxy_set_header Cookie $http_cookie;
    proxy_cookie_path / /;
}

location /admin/ {
    proxy_pass http://127.0.0.1:3000/admin/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Session cookie support
    proxy_set_header Cookie $http_cookie;
    proxy_cookie_path / /;
}
```

Then reload nginx:
```bash
sudo nginx -t && sudo nginx -s reload
```

### 3. Add API Keys

1. Access: https://signaturebrain.com/admin/
2. Login with your credentials
3. Navigate to "AI Models Configuration"
4. Enter your API keys:
   - Grok API Key: Get from https://console.x.ai/
   - Claude API Key: Get from https://console.anthropic.com/
5. Click "Save Configuration"

### 4. Test BEN Console

1. Go to "BEN Console" section
2. Select a mode (Normal, Deep, Torah, Research, or Execute)
3. Enter a prompt
4. Click "Submit"
5. View the response in the console output

## API Endpoints

All endpoints require authentication (session cookie):

- `GET /admin/config` - Load configuration
- `POST /admin/config` - Save configuration
- `POST /admin/test-connection` - Test BEN service connection
- `GET /admin/logs` - Get last 200 log lines
- `POST /admin/ben/console` - Submit prompt to AI

## Security Notes

1. **Change default credentials immediately**
2. **Set SESSION_SECRET to a random value**
3. **Use HTTPS in production** (set `secure: true` in session cookie config)
4. **Keep API keys secure** (never commit to git)
5. **Firewall port 3000** (only nginx should access it)

## Troubleshooting

### Server not starting
```bash
# Check logs
tail -f /var/www/signaturebrain/logs/server.log

# Check if port is in use
sudo netstat -tlnp | grep 3000
```

### Can't login
```bash
# Check environment variables
echo $BEN_ADMIN_USERNAME
echo $BEN_ADMIN_PASSWORD

# Check session secret
echo $SESSION_SECRET
```

### Configuration not saving
```bash
# Check permissions
ls -la /var/www/signaturebrain/config/

# Check logs
tail -f /var/www/signaturebrain/logs/app.log
```

### API calls failing
1. Check API keys are entered correctly
2. Check network connectivity
3. Check logs for error details
4. Verify API key permissions/quotas

## Architecture

```
User Browser (HTTPS)
    ↓
HTTPS://signaturebrain.com/admin/ (Nginx reverse proxy)
    ↓
Node.js Server (localhost:3000)
    ├── Session Auth Middleware
    ├── /admin/login → Login page
    ├── /admin/ → Admin UI (protected)
    └── /admin/* → API routes (protected)
        ├── /admin/config → Configuration management
        ├── /admin/logs → Log retrieval
        └── /admin/ben/console → AI prompts
            ├── Grok (X.AI) for normal/torah/execute modes
            └── Claude (Anthropic) for deep/research modes
```

## Monitoring

### Check server status
```bash
ps aux | grep "node server.js"
curl http://localhost:3000/health
```

### View logs
```bash
tail -f /var/www/signaturebrain/logs/server.log
tail -f /var/www/signaturebrain/logs/app.log
```

## Notes

- WebSocket removed, using HTTP polling for logs
- All passwords masked in responses (shown as `********`)
- Config file updates are atomic (no corruption)
- Session expires after 24 hours of inactivity
- Ctrl+Enter in prompt textarea to submit quickly
- Logs auto-refresh every 10 seconds

---

**Deployment Date**: 2025-12-28
**Server**: signaturebrain.com
**Port**: 3000 (internal)
**Status**: ✅ Running
