# Nginx Configuration for signaturebrain.com

## Current Issue
The Node.js server is running on port 3000, but nginx (running on port 80) needs to be configured to proxy requests to it.

## Required Nginx Configuration

Add these location blocks to your nginx server configuration for `signaturebrain.com`:

```nginx
# Ben Console - Protected Admin Route at /bg/
location /bg/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Important: Pass through authentication headers
    proxy_set_header Authorization $http_authorization;
    proxy_pass_header Authorization;
}

# Ben Console - Public Route at /ben
location /ben {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

# Standalone and Download routes
location /standalone {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}

location /download {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
}
```

## Where to Add This Configuration

### Find your nginx config file:
```bash
# Usually located at one of these paths:
/etc/nginx/sites-available/signaturebrain.com
/etc/nginx/sites-available/default
/etc/nginx/nginx.conf
/etc/nginx/conf.d/signaturebrain.com.conf
```

### Edit the configuration:
```bash
# Open your nginx config file
sudo nano /etc/nginx/sites-available/signaturebrain.com

# Add the location blocks inside the existing server { } block
# Save and exit (Ctrl+X, Y, Enter)
```

### Test and reload nginx:
```bash
# Test configuration for syntax errors
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
# or
sudo service nginx reload
```

## Complete Server Block Example

If you don't have an existing config, here's a complete example:

```nginx
server {
    listen 80;
    server_name signaturebrain.com www.signaturebrain.com;

    # Ben Console routes
    location /bg/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Authorization $http_authorization;
        proxy_pass_header Authorization;
        proxy_cache_bypass $http_upgrade;
    }

    location /ben {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /standalone {
        proxy_pass http://localhost:3000;
    }

    location /download {
        proxy_pass http://localhost:3000;
    }

    # Your other location blocks for existing routes...
}
```

## Verification

After configuring nginx, test the routes:

```bash
# Test public route
curl http://signaturebrain.com/ben

# Test protected route (should ask for auth)
curl http://signaturebrain.com/bg/

# Test with credentials
curl -u Yahu86:2121 http://signaturebrain.com/bg/
```

## Node.js Server Startup

Make sure the Node.js server is running on port 3000:

```bash
cd /home/user/SignatureSystems

# Install dependencies if needed
npm install

# Start server (choose one method):

# Method 1: PM2 (recommended)
pm2 start server.js --name ben-console -e logs/error.log -o logs/out.log
pm2 save

# Method 2: systemd service
sudo systemctl start ben-console

# Method 3: Direct run (for testing)
PORT=3000 node server.js
```

## Troubleshooting

### Still getting 404?
1. Check nginx error log: `sudo tail -f /var/log/nginx/error.log`
2. Verify Node server is running: `curl http://localhost:3000/ben`
3. Check nginx config syntax: `sudo nginx -t`
4. Verify port 3000 is listening: `sudo lsof -i :3000`

### Authentication not working on /bg/?
1. Ensure basic auth headers are being proxied (see `proxy_set_header Authorization` above)
2. Test Node server directly: `curl -u Yahu86:2121 http://localhost:3000/bg/`
3. Check browser console for auth errors
