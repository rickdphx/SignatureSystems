# BIM Admin UI - Deployment Guide

## Overview
This document provides step-by-step instructions for deploying the BIM Admin UI to signaturebrain.com/admin.

## What Was Built

### Complete Admin UI Features:
1. **Ben Console** (Dashboard) - Chat interface with voice controls
2. **Connections Hub** (/admin/integrations) - API connector management
3. **Tools Registry** (/admin/tools) - Ben's capability management
4. **Users Management** (/admin/users) - User accounts
5. **Roles & Permissions** (/admin/roles) - Access control
6. **Logs & Audit Trail** (/admin/logs) - System monitoring
7. **Settings** (/admin/settings) - System configuration with Voice tab

### Technical Stack:
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router 6 with SPA fallback
- **Icons**: Lucide React
- **Styling**: Custom CSS with BIM brand colors

### Brand Specifications:
- **Name**: BIM (never "Signature Brain")
- **Primary Color**: #0A1120 (Deep dark navy)
- **Accent Color**: #2A0B12 (Deep dark burgundy)

## Prerequisites

Before deployment, you need:
1. SSH access to signaturebrain.com server
2. Root or sudo privileges
3. Nginx web server installed

## Discovery Phase (REQUIRED FIRST)

### Step 1: SSH into the server
```bash
ssh user@signaturebrain.com
# OR
ssh user@SERVER_IP
```

### Step 2: Identify Nginx configuration
```bash
# Find the Nginx config for signaturebrain.com
sudo nginx -T | grep -A 20 "server_name signaturebrain.com"

# Find sites-enabled configs
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/sites-enabled/signaturebrain.com  # or similar

# Find sites-available configs
ls -la /etc/nginx/sites-available/
```

### Step 3: Identify current /admin setup
```bash
# Check if /admin is currently configured
sudo nginx -T | grep -B 5 -A 10 "/admin"

# Find web root directory
sudo nginx -T | grep "root"

# Common locations:
ls -la /var/www/signaturebrain.com/
ls -la /var/www/html/
ls -la /usr/share/nginx/html/
```

### Step 4: Check for existing admin folders
```bash
# Search for admin-related directories
sudo find /var/www -maxdepth 3 -type d -iname "*admin*" 2>/dev/null
sudo find /var/www -maxdepth 3 -type d -iname "ipui*" 2>/dev/null
sudo find /var/www -maxdepth 3 -type d -iname "signature*" 2>/dev/null

# List what's in the web root
sudo ls -la /var/www/signaturebrain.com/
```

### Step 5: Check if /admin is proxied to a Node/Express server
```bash
# Check for proxy_pass directives
sudo nginx -T | grep -i "proxy_pass"

# Check for running Node processes
pm2 list
sudo ss -ltnp | grep node
sudo systemctl list-units | grep -i node
```

## Deployment Steps (After Discovery)

### Step 1: Backup Current Setup
```bash
# Backup current Nginx config
sudo cp /etc/nginx/sites-enabled/signaturebrain.com /etc/nginx/sites-enabled/signaturebrain.com.backup.$(date +%Y%m%d)

# If there's an existing admin folder, back it up
sudo mv /var/www/signaturebrain.com/admin /var/www/signaturebrain.com/admin.backup.$(date +%Y%m%d)
# Or wherever the current admin is located
```

### Step 2: Upload the Built Admin UI

From your local machine (where you built the UI):
```bash
# Option A: Using SCP
cd /home/user/SignatureSystems/admin-ui
scp -r dist/ user@signaturebrain.com:/tmp/admin-ui-dist

# Option B: Using rsync (recommended)
rsync -avz --progress dist/ user@signaturebrain.com:/tmp/admin-ui-dist/
```

On the server:
```bash
# Create the admin-ui directory
sudo mkdir -p /var/www/signaturebrain.com/admin-ui

# Move the files
sudo mv /tmp/admin-ui-dist/* /var/www/signaturebrain.com/admin-ui/

# Set proper permissions
sudo chown -R www-data:www-data /var/www/signaturebrain.com/admin-ui
sudo chmod -R 755 /var/www/signaturebrain.com/admin-ui
```

### Step 3: Update Nginx Configuration

Edit the Nginx site configuration:
```bash
sudo nano /etc/nginx/sites-enabled/signaturebrain.com
```

Add or replace the /admin location block with:
```nginx
location /admin {
    alias /var/www/signaturebrain.com/admin-ui/dist;
    try_files $uri $uri/ /admin/index.html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache HTML
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }
}
```

### Step 4: Test and Reload Nginx
```bash
# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

### Step 5: Verify Deployment

Test the following URLs:
```bash
# Test from server
curl -I https://signaturebrain.com/admin
curl -I https://signaturebrain.com/admin/
curl -I https://signaturebrain.com/admin/users
curl -I https://signaturebrain.com/admin/settings

# Expected: All should return 200 OK and serve HTML
```

Test from browser:
- https://signaturebrain.com/admin
- https://signaturebrain.com/admin/users
- https://signaturebrain.com/admin/integrations
- https://signaturebrain.com/admin/tools

### Step 6: Cleanup Old Static Admin Files

Only after confirming the new admin works:
```bash
# List what was in the old admin folders
sudo ls -la /var/www/signaturebrain.com/admin.backup.*/
sudo ls -la /var/www/signaturebrain.com/ipui-admin/ 2>/dev/null
sudo ls -la /var/www/signaturebrain.com/ipui-basic/ 2>/dev/null

# Remove old backups (after 1 week of successful operation)
sudo rm -rf /var/www/signaturebrain.com/admin.backup.*
sudo rm -rf /var/www/signaturebrain.com/ipui-admin
sudo rm -rf /var/www/signaturebrain.com/ipui-basic
```

## Troubleshooting

### Issue: 404 Not Found on /admin
**Solution**: Check Nginx location block and file paths
```bash
sudo nginx -T | grep -A 10 "location /admin"
sudo ls -la /var/www/signaturebrain.com/admin-ui/dist/index.html
```

### Issue: 404 on sub-routes like /admin/users
**Solution**: Ensure `try_files` directive includes fallback to index.html
```bash
# The try_files line should be:
try_files $uri $uri/ /admin/index.html;
```

### Issue: Assets (CSS/JS) not loading
**Solution**: Check base path and file permissions
```bash
# Check vite.config.ts has base: '/admin/'
# Check file permissions
sudo chmod -R 755 /var/www/signaturebrain.com/admin-ui
```

### Issue: Blank page or white screen
**Solution**: Check browser console for errors
```bash
# Check if files are being served correctly
curl https://signaturebrain.com/admin/assets/index-DA6uG5k9.js
```

## Verification Checklist

- [ ] Discovery phase completed - know exact Nginx config location
- [ ] Discovery phase completed - know exact web root location
- [ ] Discovery phase completed - know current /admin setup
- [ ] Backup created of current Nginx config
- [ ] Backup created of old admin folder (if exists)
- [ ] Built admin UI uploaded to server
- [ ] Nginx configuration updated
- [ ] Nginx test passed (`sudo nginx -t`)
- [ ] Nginx reloaded successfully
- [ ] https://signaturebrain.com/admin loads and shows BIM branding
- [ ] All routes work (users, roles, integrations, tools, logs, settings)
- [ ] No 404 errors on page refresh
- [ ] Browser console shows no errors
- [ ] Static assets (CSS/JS) loading correctly

## Rollback Procedure

If something goes wrong:
```bash
# Restore old Nginx config
sudo cp /etc/nginx/sites-enabled/signaturebrain.com.backup.YYYYMMDD /etc/nginx/sites-enabled/signaturebrain.com

# Restore old admin folder
sudo rm -rf /var/www/signaturebrain.com/admin-ui
sudo mv /var/www/signaturebrain.com/admin.backup.YYYYMMDD /var/www/signaturebrain.com/admin

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## Next Steps After Deployment

1. **Connect Real APIs**: Replace mock API calls in `src/api/index.ts` with real backend endpoints
2. **Add Authentication**: Implement real login/session management
3. **Connect Ben AI**: Wire up actual AI model endpoints for chat
4. **Enable Voice**: Integrate real STT/TTS providers
5. **Database Integration**: Connect to real database for users, roles, logs, etc.

## Files Changed

This deployment creates/modifies:

**Server:**
- `/etc/nginx/sites-enabled/signaturebrain.com` - Updated Nginx config
- `/var/www/signaturebrain.com/admin-ui/dist/` - New admin UI files

**Local:**
- `/home/user/SignatureSystems/admin-ui/` - Complete React application
- All component files, API layer, routing, and styling

## Contact

For issues or questions about this deployment, refer to the project repository or contact the development team.
