# 🚀 DEPLOY NOW - Quick Start Guide

## Get It Live in 10 Minutes

### 1. SSH to Your EC2 Server

```bash
ssh your-server
```

### 2. Install Prerequisites (One Time Only)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx
```

### 3. Set Up Directories

```bash
sudo mkdir -p /var/www/signature-chair-backend
sudo mkdir -p /var/www/signature-chair-frontend
sudo chown -R $USER:$USER /var/www/signature-chair-backend
sudo chown -R $USER:$USER /var/www/signature-chair-frontend
```

### 4. Clone the Code

```bash
cd /var/www/signature-chair-backend
git clone YOUR_REPO_URL .
git checkout claude/setup-signature-chair-booking-RX9Gg

cd /var/www/signature-chair-frontend
git clone YOUR_REPO_URL .
git checkout claude/setup-signature-chair-booking-RX9Gg
cd frontend
```

### 5. Configure Environment Variables

**Backend:**
```bash
cd /var/www/signature-chair-backend
cp .env.example .env.staging
nano .env.staging
```

Update:
- `SQUARE_ACCESS_TOKEN=your_real_token`
- `SQUARE_LOCATION_ID=your_real_location_id`
- `DATABASE_URL=postgresql://...` (use real password)

**Frontend:**
```bash
cd /var/www/signature-chair-frontend/frontend
cp .env.example .env.production
nano .env.production
```

Update:
- `NEXT_PUBLIC_API_URL=https://staging.thesignaturechair.com/api`
- `NEXT_PUBLIC_DEFAULT_BARBER_SLUG=your-actual-slug` (get this after step 7)

### 6. Set Up Database

```bash
sudo -u postgres psql
CREATE DATABASE signaturechair_booking_staging;
CREATE USER signaturechair WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE signaturechair_booking_staging TO signaturechair;
\q
```

### 7. Deploy Backend

```bash
cd /var/www/signature-chair-backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Sync barbers from Square
NODE_ENV=production node -e "
const { execSync } = require('child_process');
execSync('curl -X POST http://localhost:3001/api/barbers/sync-from-square', { stdio: 'inherit' });
"

# Get your barber slug
curl http://localhost:3001/api/barbers | jq '.barbers[0].slug'
# Copy this slug and update it in frontend .env.production

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the command it outputs
```

### 8. Deploy Frontend

```bash
cd /var/www/signature-chair-frontend/frontend
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### 9. Set Up Nginx

```bash
# Copy the nginx config from the deployment docs
sudo nano /etc/nginx/sites-available/staging.thesignaturechair.com
# Paste the config from the deployment guide

# Enable site
sudo ln -s /etc/nginx/sites-available/staging.thesignaturechair.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 10. Get SSL Certificate

```bash
sudo certbot --nginx -d staging.thesignaturechair.com
```

### 11. Test It!

```bash
# Check PM2 processes
pm2 list

# Check backend
curl https://staging.thesignaturechair.com/api/health

# Open in browser
https://staging.thesignaturechair.com
```

---

## Quick Redeploy (After Changes)

```bash
cd /var/www/signature-chair-backend
./deploy.sh

# Or just:
git pull && npm install && npm run build && pm2 restart all
```

---

## Troubleshooting

**PM2 processes not running:**
```bash
pm2 logs
pm2 restart all
```

**Nginx errors:**
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

**Database connection errors:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U signaturechair -d signaturechair_booking_staging -h localhost
```

**Can't sync barbers:**
- Check Square credentials in `.env.staging`
- Verify `SQUARE_LOCATION_ID` is correct
- Check backend logs: `pm2 logs signature-chair-backend`

---

## You're Live!

Once deployed:
1. Test booking flow end-to-end
2. Create a test appointment
3. Verify it appears in Square Dashboard
4. Share staging link with a friend to test
5. When ready, follow production cutover plan

**Staging URL:** https://staging.thesignaturechair.com

**Need help?** Check backend logs: `pm2 logs signature-chair-backend`
