# Ben Console Deployment Instructions

## Overview
The Ben Console is a Node.js application that serves the BEN Control Center UI at signaturebrain.com.

## Prerequisites
- Node.js (v14+)
- npm
- nginx (for reverse proxy)
- PM2 (recommended for process management)

## File Structure
```
SignatureSystems/
├── server.js              # Express server
├── package.json           # Dependencies
├── public/
│   └── ben.html          # Main Ben Console UI
├── index.html            # Alternative entry point
└── DOWNLOAD_THIS.html    # Standalone version
```

## Routes
- `/bg/` - Protected Ben Console (requires auth: Yahu86/2121)
- `/bg/login.html` - Redirects to /bg/
- `/ben` - Public Ben Console (no auth required)
- `/standalone` - Standalone version
- `/download` - Download Ben Console HTML file

## Deployment Steps

### 1. Install Dependencies
```bash
cd /home/user/SignatureSystems
npm install
```

### 2. Start Node.js Server

#### Option A: Using PM2 (Recommended for Production)
```bash
# Install PM2 globally if not already installed
npm install -g pm2

# Start the server
pm2 start server.js --name ben-console -- --port 3000

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### Option B: Using systemd
Create `/etc/systemd/system/ben-console.service`:
```ini
[Unit]
Description=Ben Console Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/home/user/SignatureSystems
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable ben-console
sudo systemctl start ben-console
```

#### Option C: Direct Run (Development Only)
```bash
PORT=3000 node server.js &
```

### 3. Configure Nginx Reverse Proxy

Add the configuration from `nginx-config.conf` to your nginx site configuration:

```bash
# Option 1: Add to existing site config
sudo nano /etc/nginx/sites-available/signaturebrain.com

# Option 2: Create new config and link it
sudo cp nginx-config.conf /etc/nginx/sites-available/ben-console
sudo ln -s /etc/nginx/sites-available/ben-console /etc/nginx/sites-enabled/
```

Test and reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Verify Deployment

Test locally:
```bash
# Test Node server directly
curl http://localhost:3000/ben

# Test through nginx
curl http://localhost/ben
curl -u Yahu86:2121 http://localhost/bg/
```

Test externally:
- Public route: http://signaturebrain.com/ben
- Protected route: http://signaturebrain.com/bg/ (requires login)

## Authentication
The `/bg/` route is protected with basic authentication:
- **Username**: Yahu86
- **Password**: 2121

## Troubleshooting

### Node Server Not Starting
```bash
# Check if port 3000 is already in use
lsof -i :3000

# Check server logs
pm2 logs ben-console
# or
journalctl -u ben-console -f
```

### Nginx 404 Errors
```bash
# Verify nginx configuration
sudo nginx -t

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify Node server is running
curl http://localhost:3000/ben
```

### Authentication Not Working
- Verify credentials in server.js match Yahu86:2121
- Check browser is sending basic auth headers
- Clear browser cache and cookies

## Stopping the Server

### PM2
```bash
pm2 stop ben-console
pm2 delete ben-console
```

### systemd
```bash
sudo systemctl stop ben-console
sudo systemctl disable ben-console
```

### Direct Process
```bash
pkill -f "node server.js"
```

## Updates and Maintenance

To update the application:
```bash
cd /home/user/SignatureSystems
git pull origin main
npm install
pm2 restart ben-console
```
