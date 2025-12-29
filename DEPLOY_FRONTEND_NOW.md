# Deploy Frontend - Single Command

The frontend has been built locally as a standalone Next.js application (4.3MB) that includes all dependencies. **No npm install required on the server.**

## Deploy on EC2 (run these commands):

```bash
# Download and run the deployment script
cd ~
wget https://raw.githubusercontent.com/rickdphx/SignatureSystems/claude/setup-signature-chair-booking-RX9Gg/deploy-frontend-standalone.sh
chmod +x deploy-frontend-standalone.sh
./deploy-frontend-standalone.sh
```

That's it! The script will:
1. Stop the existing frontend process
2. Download the pre-built standalone frontend (4.3MB)
3. Extract it to /var/www/signature-chair-frontend
4. Configure environment variables
5. Start it with PM2 on port 3000

## What This Fixes

- **No npm install needed** - the build includes minimal dependencies
- **No build step needed** - already compiled
- **No hanging** - no package manager runs on the server
- **Fast deployment** - just download and run

## Verify It's Working

```bash
# Check PM2 status
pm2 list

# Check frontend is responding
curl http://localhost:3000

# Check logs
pm2 logs signature-chair-frontend --lines 20
```

## Access the Site

Once deployed:
- https://staging.thesignaturechair.com

The frontend will connect to the stub backend already running on port 3001.
