# BEN Control Center Backup

**Backup Date:** December 29, 2025
**Server:** 18.118.103.251 (signaturebrain.com)
**Application:** BEN Control Center - Brainwave Enterprise Network Administration

---

## Backup Location

**Archive:** `/home/user/SignatureSystems/backups/ben-control-center-backup.tar.gz`
**Size:** 27KB

---

## What's Included in This Backup

### 1. **Frontend Files**

#### Active Admin Interface (Currently Served)
- `/var/www/signaturebrain/public/admin/admin.html` (28KB - Professional BEN Control Center UI)
- `/var/www/signaturebrain/public/admin/admin.js` (11KB)
- `/var/www/signaturebrain/public/admin/login.html` (4.1KB)

#### Alternative Admin UI
- `/var/www/signaturebrain/admin-ui/index.html` (17KB)
- `/var/www/signaturebrain/admin-ui/login.html` (4.1KB)
- `/var/www/signaturebrain/admin-ui/admin.js` (11KB)
- `/var/www/signaturebrain/admin-ui/test.html`

### 2. **Backend Files**
- `/var/www/signaturebrain/server.js` - Main Express server with session management and auth
- `/var/www/signaturebrain/server/adminRoutes.js` - Admin API routes with Grok & Claude integration

### 3. **Configuration & Data**
- `/var/www/signaturebrain/config/ben-admin.config.json` - AI API keys and settings
- `/var/www/signaturebrain/logs/app.log` - Application logs
- `/var/www/signaturebrain/logs/server.log` - Server logs
- `/var/www/signaturebrain/package.json` - Node.js dependencies
- `/var/www/signaturebrain/package-lock.json` - Locked dependency versions

---

## Features of This BEN Control Center

### UI Features
- **Processing Modes:**
  - Normal - Standard AI processing
  - Deep Reasoning - Advanced Claude Analysis
  - Torah - Torah-aligned responses
  - Research - Comprehensive research mode
  - Haríts (Execute) - Direct action-oriented responses

- **Multi-model AI Processing:**
  - Grok API (X.AI) for normal/torah/execute modes
  - Claude API (Anthropic) for deep/research modes

### Backend Features
- Session-based authentication
- API key management with masking
- Configuration persistence (atomic writes)
- System logging
- Health check endpoint
- CORS support for cross-origin requests

### API Endpoints
- `GET/POST /admin/config` - Configuration management
- `POST /admin/test-connection` - Test BEN service connection
- `POST /admin/ben/console` - Process AI prompts
- `GET /admin/logs` - Retrieve system logs
- `GET /health` - Health check

---

## How to Restore This Backup

### Extract the backup:
```bash
cd /home/user/SignatureSystems/backups
tar -xzf ben-control-center-backup.tar.gz -C /tmp/ben-restore
```

### View contents:
```bash
tar -tzf ben-control-center-backup.tar.gz
```

### Restore to original location:
```bash
sudo tar -xzf ben-control-center-backup.tar.gz -C /var/www/signaturebrain/
```

---

## Server Control Commands

### Check if server is running:
```bash
ps aux | grep "node server.js" | grep -v grep
```

### Check port 3000:
```bash
lsof -i :3000
```

### Start the server:
```bash
cd /var/www/signaturebrain
nohup node server.js > /tmp/signaturebrain-server.log 2>&1 &
```

### Stop the server:
```bash
# Find process ID
ps aux | grep "node server.js" | grep -v grep

# Kill by process ID (replace XXXX with actual PID)
kill XXXX

# Or kill all node servers
pkill -f "node server.js"
```

### View server logs:
```bash
# Real-time log viewing
tail -f /tmp/signaturebrain-server.log

# Or view application logs
tail -f /var/www/signaturebrain/logs/app.log
```

---

## Server Configuration

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

**Environment Variables (Optional):**
- `BEN_ADMIN_USERNAME` - Custom admin username
- `BEN_ADMIN_PASSWORD` - Custom admin password
- `SESSION_SECRET` - Custom session secret
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: 0.0.0.0)

---

## Current Server Status

**Status:** Server is currently **NOT RUNNING**

To start serving the BEN Control Center at signaturebrain.com/admin/:
1. Start the server (see commands above)
2. Access: http://signaturebrain.com/admin/login
3. Login with credentials: admin / admin123
4. Configure AI API keys in the interface
5. Start using BEN Console

---

## Notes

- The backup includes both the active UI (public/admin/) and the alternative UI (admin-ui/)
- All sensitive API keys in config files are already masked or empty in the backup
- The server.js has been configured to mount admin routes at both `/admin/` and `/api/`
- Node.js dependencies need to be installed: `npm install` in /var/www/signaturebrain/

---

## Archive Details

```
Backup Archive: ben-control-center-backup.tar.gz
Compression: gzip
Total Files: 19
Total Size: 27KB (compressed)
```

---

**Created by:** Claude Code
**Session:** claude/fix-terminal-response-jqUon
**Purpose:** Safe backup before replacing with different Ben Console UI
