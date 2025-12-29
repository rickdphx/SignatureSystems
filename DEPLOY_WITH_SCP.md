# Deploy Frontend Using SCP

Since GitHub raw URLs don't work for large files in private repos, we'll transfer the pre-built frontend directly from your local machine to EC2.

## Step 1: Download the Build (on your Windows machine)

Download this file to your Downloads folder:
https://github.com/rickdphx/SignatureSystems/releases/download/v1.0-staging/frontend-standalone.tar.gz

(If that link doesn't work because the asset didn't upload, I'll create an alternative)

## Step 2: Transfer to EC2 (from PowerShell on Windows)

```powershell
# Navigate to your Downloads folder
cd ~\Downloads

# Transfer the file to EC2 (use the path to your .pem file)
scp -i C:\path\to\ec2-key.pem frontend-standalone.tar.gz ubuntu@18.118.103.251:/tmp/
```

## Step 3: Deploy on EC2

SSH into your EC2 server and run:

```bash
# Stop old frontend
pm2 delete signature-chair-frontend 2>/dev/null || true

# Clean frontend directory
sudo rm -rf /var/www/signature-chair-frontend/*
cd /var/www/signature-chair-frontend

# Extract the build
tar -xzf /tmp/frontend-standalone.tar.gz
mv .next/standalone/* .
rm -rf .next/standalone

# Create environment file
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_URL=https://staging.thesignaturechair.com/api
NEXT_PUBLIC_DEFAULT_BARBER_SLUG=signature
NEXT_PUBLIC_DOMAIN=thesignaturechair.com
EOF

# Start with PM2
PORT=3000 pm2 start server.js --name "signature-chair-frontend"
pm2 save

# Check status
pm2 list
```

## Alternative: If SCP doesn't work

I can create a simple Python HTTP server on my end, or we can use a temporary file sharing service.

Let me know if you need help with the SCP command or if you'd prefer a different transfer method.
