# DNS Setup for staging.thesignaturechair.com

## Error: ERR_NAME_NOT_RESOLVED

This means the domain doesn't point to your EC2 server yet.

## Step 1: Get Your EC2 Public IP Address

**On your EC2 server, run:**
```bash
curl ifconfig.me
```

This will show your public IP address (e.g., 54.123.45.67)

## Step 2: Add DNS A Record

Go to your DNS provider (wherever thesignaturechair.com is registered - likely GoDaddy, Namecheap, Cloudflare, etc.)

**Add this DNS record:**
- **Type:** A
- **Name:** staging
- **Value:** [Your EC2 IP from step 1]
- **TTL:** 300 (5 minutes)

Example:
```
Type: A
Name: staging
Value: 54.123.45.67
TTL: 300
```

## Step 3: Wait for DNS Propagation

DNS changes take 5-15 minutes to propagate. You can check if it's working:

```bash
# Check DNS resolution (run this on your local machine)
nslookup staging.thesignaturechair.com

# Or use dig
dig staging.thesignaturechair.com +short
```

When it's working, you should see your EC2 IP address.

## Step 4: Verify Server is Running

**On your EC2 server:**
```bash
# Check PM2 processes
pm2 list

# Check if backend is responding
curl http://localhost:3001/api/health

# Check if frontend is responding
curl http://localhost:3000

# Check nginx status
sudo systemctl status nginx
```

## Step 5: Once DNS Resolves

After DNS propagates, set up nginx and SSL:

```bash
# Test nginx config
sudo nginx -t

# If nginx isn't configured yet, use the config file
sudo cp ~/temp-setup/nginx-config.txt /etc/nginx/sites-available/staging.thesignaturechair.com

# Enable the site
sudo ln -s /etc/nginx/sites-available/staging.thesignaturechair.com /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate (this will auto-configure nginx for HTTPS)
sudo certbot --nginx -d staging.thesignaturechair.com
```

## Step 6: Access Your Site

Once DNS resolves and SSL is configured:
- https://staging.thesignaturechair.com - Frontend
- https://staging.thesignaturechair.com/api/health - Backend health check

## Troubleshooting

**If DNS doesn't resolve after 15 minutes:**
1. Double-check the DNS record is correct
2. Make sure you're adding it to the right domain (thesignaturechair.com)
3. Some providers have a "proxy" toggle - turn it OFF for initial setup

**If you get 502 Bad Gateway:**
- Backend or frontend isn't running
- Check: `pm2 list` and `pm2 logs`

**If you get SSL errors:**
- DNS must resolve first before running certbot
- Make sure port 80 and 443 are open in EC2 security group

## Quick Diagnostic Commands

Run these on EC2 to check everything:
```bash
# Get server IP
curl ifconfig.me

# Check what's listening
sudo netstat -tlnp | grep -E ':(80|443|3000|3001)'

# Check PM2
pm2 list

# Check logs
pm2 logs --lines 20

# Check nginx
sudo nginx -t
curl -I http://localhost
```
