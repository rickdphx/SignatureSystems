# PowerShell Deployment Script for Professional BEN Admin Interface
# Run this from PowerShell on your Windows machine

Write-Host "🚀 Deploying Professional BEN Admin Interface..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$sshKey = "C:\Users\rickd\Downloads\chatnotion-key.pem"
$sshHost = "ubuntu@18.118.103.251"
$localFile = "admin-ui-professional.html"
$remoteFile = "/var/www/signaturebrain/admin-ui/index.html"

# Step 1: Backup current file
Write-Host "📦 Creating backup..." -ForegroundColor Yellow
$backupCmd = "cp $remoteFile ${remoteFile}.backup-`$(date +%Y%m%d-%H%M%S)"
ssh -i $sshKey $sshHost $backupCmd

# Step 2: Deploy new file
Write-Host "📤 Deploying new professional interface..." -ForegroundColor Yellow
Get-Content $localFile | ssh -i $sshKey $sshHost "cat > $remoteFile"

# Step 3: Verify
Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🔍 Verifying..." -ForegroundColor Yellow
ssh -i $sshKey $sshHost "ls -lh $remoteFile; echo ''; head -n 6 $remoteFile"

Write-Host ""
Write-Host "✨ Success! Visit https://signaturebrain.com/admin/" -ForegroundColor Green
