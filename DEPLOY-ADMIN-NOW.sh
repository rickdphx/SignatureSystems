#!/bin/bash
# Deploy the corrected admin interface with working API calls

echo "Deploying BEN Admin interface with corrected API..."

# Copy the corrected admin file to production
sudo cp /home/user/SignatureSystems/admin-ui-professional.html /var/www/signaturebrain/admin-ui/index.html
sudo chmod 644 /var/www/signaturebrain/admin-ui/index.html

echo "✓ Deployed admin interface"
echo ""
echo "Admin UI: http://signaturebrain.com/admin/"
echo "Login: admin / BEN@2024!Secure"
echo ""
ls -lh /var/www/signaturebrain/admin-ui/index.html
