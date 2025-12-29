# Signature Chair Frontend Deployment

This package includes the luxury frontend with the new Nando Blends contact page.

## What's Included

- `server.js` - Updated Node.js server with all routes including /nandoblends
- `nandoblends.html` - Luxury contact form page with burgundy/navy/gold theme
- `deploy.sh` - Automated deployment script

## Routes Available

1. **/** - Homepage with luxury design
2. **/nandoblends** - Nando Blends professional contact page
3. **/:barber** - Dynamic barber profile pages (e.g., /rick)
4. **/:barber/book** - Booking flow with dynamic pricing

## Features

### Nando Blends Contact Page
- Luxury burgundy (#6B1C23), navy (#0A1929), and gold (#D4AF37) color scheme
- Glassmorphism design with backdrop blur
- Smooth animations and transitions
- Professional contact form
- Success message after submission
- Fully responsive

### Dynamic Pricing
- **Sunday Special**: $45 base price
- **Early Morning** (before 10 AM): $55 (surcharge)
- **Evening** (after 5 PM): $55 (surcharge)
- **Regular Hours**: $50
- **Saturday**: No availability

## Deployment Instructions

### On your EC2 server:

1. Upload these files to the server:
```bash
scp -i ~/.ssh/staging-key.pem server.js ubuntu@staging.thesignaturechair.com:/tmp/
scp -i ~/.ssh/staging-key.pem nandoblends.html ubuntu@staging.thesignaturechair.com:/tmp/
scp -i ~/.ssh/staging-key.pem deploy.sh ubuntu@staging.thesignaturechair.com:/tmp/
```

2. SSH into the server:
```bash
ssh -i ~/.ssh/staging-key.pem ubuntu@staging.thesignaturechair.com
```

3. Run the deployment script:
```bash
cd /tmp
chmod +x deploy.sh
sudo ./deploy.sh
```

### OR Manual Deployment:

```bash
# SSH into server
ssh -i ~/.ssh/staging-key.pem ubuntu@staging.thesignaturechair.com

# Stop frontend
pm2 stop frontend

# Copy files
sudo cp /tmp/server.js /var/www/signature-chair-frontend/
sudo cp /tmp/nandoblends.html /var/www/signature-chair-frontend/

# Restart
pm2 restart frontend

# Check status
pm2 status
pm2 logs frontend --lines 50
```

## Testing

After deployment, test these URLs:

- https://staging.thesignaturechair.com/
- https://staging.thesignaturechair.com/nandoblends
- https://staging.thesignaturechair.com/rick
- https://staging.thesignaturechair.com/rick/book

## Color Scheme

- **Burgundy**: #6B1C23 (primary brand color)
- **Navy**: #0A1929 (dark background)
- **Gold**: #D4AF37 (accent/highlights)

## Next Steps

1. ✅ Deploy Nando Blends contact page
2. Square API integration for real pricing
3. Email service for booking confirmations
4. AI dynamic pricing optimization
5. Admin settings panel
