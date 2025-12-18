# SignatureSystems

Enterprise signature verification and management system with React frontend and Python backend.

## Quick Start

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## Repository Contents

- `nginx-signaturebrain.conf` - Nginx configuration for production deployment
- `deploy-nginx.sh` - Automated deployment script
- `troubleshoot.sh` - Diagnostic script for troubleshooting
- `DEPLOYMENT.md` - Complete deployment and troubleshooting guide

## Emergency Fix Commands

If experiencing issues on EC2 instance:

```bash
# Fix permissions
sudo chmod 755 /home/ubuntu /home/ubuntu/signaturebrain-frontend
sudo chown -R www-data:www-data /home/ubuntu/signaturebrain-frontend/build
sudo chmod -R 755 /home/ubuntu/signaturebrain-frontend/build

# Deploy configuration
sudo cp nginx-signaturebrain.conf /etc/nginx/sites-available/signaturebrain
sudo nginx -t && sudo systemctl restart nginx
```
