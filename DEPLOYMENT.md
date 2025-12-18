# SignatureBrain Deployment Guide

## Overview

This document describes how to deploy the SignatureBrain application on an EC2 instance with:
- React frontend served by Nginx
- Python backend API on port 8000
- SSL/HTTPS configuration

## Quick Fix for Current Issues

If you're experiencing permission denied or 404 errors, run these commands on your EC2 instance:

```bash
# 1. Download deployment script
cd /home/ubuntu
git clone <this-repo-url> SignatureSystems
cd SignatureSystems

# 2. Make scripts executable
chmod +x deploy-nginx.sh troubleshoot.sh

# 3. Run deployment script
./deploy-nginx.sh

# 4. Check backend endpoints
curl http://localhost:8000/
```

## Architecture

```
Internet → Nginx (443/80) → React Frontend (/home/ubuntu/signaturebrain-frontend/build)
                          → Backend API (localhost:8000/api/)
```

## Prerequisites

1. **Frontend Built**: React app built at `/home/ubuntu/signaturebrain-frontend/build/`
2. **Backend Running**: Python backend listening on port 8000
3. **Nginx Installed**: `sudo apt install nginx`
4. **SSL Certificates**: Let's Encrypt certificates for signaturebrain.com

## File Structure

```
/home/ubuntu/
├── signaturebrain-frontend/
│   └── build/
│       ├── index.html
│       ├── static/
│       └── ...
├── signaturebrain_system_export/
│   └── ben_api.py
└── SignatureSystems/  (this repo)
    ├── nginx-signaturebrain.conf
    ├── deploy-nginx.sh
    ├── troubleshoot.sh
    └── DEPLOYMENT.md
```

## Deployment Steps

### 1. Fix Permissions

The most common issue is nginx not having permission to read frontend files:

```bash
# Fix ownership
sudo chown -R www-data:www-data /home/ubuntu/signaturebrain-frontend/build

# Fix permissions on files
sudo chmod -R 755 /home/ubuntu/signaturebrain-frontend/build

# Fix permissions on parent directories (critical!)
sudo chmod 755 /home/ubuntu
sudo chmod 755 /home/ubuntu/signaturebrain-frontend
```

### 2. Deploy Nginx Configuration

```bash
# Copy configuration
sudo cp nginx-signaturebrain.conf /etc/nginx/sites-available/signaturebrain

# Create symbolic link
sudo ln -s /etc/nginx/sites-available/signaturebrain /etc/nginx/sites-enabled/signaturebrain

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 3. Verify Backend

```bash
# Check if backend is running
ss -tlnp | grep :8000

# Test backend directly
curl http://localhost:8000/

# Test brain API endpoints
curl http://localhost:8000/brain/session/start1

# Check backend logs
journalctl -u your-backend-service -n 50
```

## Troubleshooting

### Run Diagnostics

```bash
./troubleshoot.sh
```

### Common Issues

#### 1. Permission Denied (403 Forbidden)

**Symptoms**:
- Nginx error log shows "Permission denied"
- HTTP 403 or 500 errors

**Solution**:
```bash
# Check permissions
ls -la /home/ubuntu/signaturebrain-frontend/build/

# Fix permissions
sudo chmod 755 /home/ubuntu
sudo chmod 755 /home/ubuntu/signaturebrain-frontend
sudo chown -R www-data:www-data /home/ubuntu/signaturebrain-frontend/build
sudo chmod -R 755 /home/ubuntu/signaturebrain-frontend/build
```

#### 2. Redirect Loop on /admin

**Symptoms**:
- Browser shows "Too many redirects"
- Nginx logs show redirect cycles

**Solution**: Check nginx config for `/admin` location:
```nginx
location /admin {
    try_files $uri $uri/ /index.html;  # NOT /admin/index.html
}
```

#### 3. API 404 Not Found

**Symptoms**:
- `/api/` endpoints return 404
- Backend is running but not responding

**Solution**:
```bash
# Check backend routes
curl -v http://localhost:8000/

# Check if backend expects /api prefix
curl -v http://localhost:8000/api/

# Update nginx config if needed
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;  # or just http://127.0.0.1:8000/
}
```

#### 4. Backend Not Running

**Symptoms**:
- 502 Bad Gateway errors
- Nothing listening on port 8000

**Solution**:
```bash
# Check backend process
ps aux | grep python

# Start backend (adjust command as needed)
cd /home/ubuntu/signaturebrain_system_export
python ben_api.py &

# Or with uvicorn
uvicorn ben_api:app --host 127.0.0.1 --port 8000 &
```

#### 5. Blank Admin Page

**Symptoms**:
- Admin page loads but is blank/white screen
- Browser console shows errors about failed API calls to `/brain/` endpoints

**Solution**: Ensure nginx config includes `/brain/` location block:
```nginx
location /brain/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

After updating nginx config:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Swagger UI OpenAPI Version Issues

**Symptoms**:
- Swagger UI not loading properly
- Error messages about OpenAPI specification version
- `/docs` endpoint returns errors

**Common Causes**:
1. OpenAPI version mismatch (expecting 2.0 vs 3.0+)
2. FastAPI configuration issues

**Solution**: Update FastAPI backend configuration in `ben_api.py`:

```python
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

app = FastAPI(
    title="SignatureBrain API",
    description="Brain signature verification API",
    version="1.0.0",
    openapi_url="/api/openapi.json",  # Custom OpenAPI URL
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc"  # ReDoc
)

# Optional: Customize OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="SignatureBrain API",
        version="1.0.0",
        description="Brain signature verification and analysis API",
        routes=app.routes,
    )
    openapi_schema["openapi"] = "3.0.2"  # Explicitly set OpenAPI version
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
```

**Test Swagger UI**:
```bash
# Access Swagger UI
curl http://localhost:8000/docs

# Check OpenAPI spec
curl http://localhost:8000/openapi.json
```

If using nginx proxy, ensure `/docs` is proxied correctly:
```nginx
location /docs {
    proxy_pass http://127.0.0.1:8000/docs;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

location /openapi.json {
    proxy_pass http://127.0.0.1:8000/openapi.json;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

### Check Logs

```bash
# Nginx error log
sudo tail -f /var/log/nginx/signaturebrain_error.log

# Nginx access log
sudo tail -f /var/log/nginx/signaturebrain_access.log

# System log
sudo journalctl -xe
```

## Testing

### Test Local Connectivity

```bash
# Test backend directly
curl -I http://localhost:8000/

# Test nginx to backend proxy
curl -I http://localhost/api/

# Test HTTPS (if SSL configured)
curl -I https://signaturebrain.com/
```

### Test from Browser

1. **Frontend**: https://signaturebrain.com/
2. **Admin**: https://signaturebrain.com/admin/
3. **API**: https://signaturebrain.com/api/ (should proxy to backend)

## Maintenance

### Restart Services

```bash
# Restart nginx
sudo systemctl restart nginx

# Restart backend (if using systemd service)
sudo systemctl restart signaturebrain-backend

# Check status
sudo systemctl status nginx
sudo systemctl status signaturebrain-backend
```

### Update Frontend

```bash
# Build new frontend
cd /home/ubuntu/signaturebrain-frontend
npm run build

# Reload nginx (no restart needed for static files)
sudo systemctl reload nginx
```

### Update Backend

```bash
# Pull latest code
cd /home/ubuntu/signaturebrain_system_export
git pull

# Restart backend service
sudo systemctl restart signaturebrain-backend
```

## Security Notes

1. **Keep SSL certificates updated**: Let's Encrypt certificates expire every 90 days
2. **Restrict backend**: Backend should only listen on 127.0.0.1, not 0.0.0.0
3. **Update regularly**: Keep nginx, Python, and dependencies updated
4. **Monitor logs**: Regular log review for security issues

## Support

If issues persist after following this guide:

1. Run `./troubleshoot.sh` and review output
2. Check nginx error logs: `sudo tail -100 /var/log/nginx/signaturebrain_error.log`
3. Verify backend is responding: `curl -v http://localhost:8000/`
4. Check file permissions: `namei -l /home/ubuntu/signaturebrain-frontend/build/index.html`
