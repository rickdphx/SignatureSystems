#!/bin/bash
set -e

# ============================================================================
# The Signature Chair - Complete Deployment Script (No Git Required)
# ============================================================================
# This script deploys the entire booking system by copying files from the
# current repository to /var/www directories on the EC2 server.
# ============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SOURCE_DIR="/home/user/SignatureSystems"
BACKEND_DIR="/var/www/signature-chair-backend"
FRONTEND_DIR="/var/www/signature-chair-frontend"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Error handler
error_exit() {
    echo -e "${RED}✗ ERROR: $1${NC}" >&2
    exit 1
}

# Success message
success_msg() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Info message
info_msg() {
    echo -e "${BLUE}➜ $1${NC}"
}

# Warning message
warn_msg() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Header
echo ""
echo -e "${MAGENTA}============================================================================${NC}"
echo -e "${MAGENTA}    The Signature Chair - Complete Deployment (No Git Required)${NC}"
echo -e "${MAGENTA}============================================================================${NC}"
echo ""
echo -e "${CYAN}Source Directory:${NC} $SOURCE_DIR"
echo -e "${CYAN}Backend Target:${NC} $BACKEND_DIR"
echo -e "${CYAN}Frontend Target:${NC} $FRONTEND_DIR"
echo -e "${CYAN}Timestamp:${NC} $TIMESTAMP"
echo ""

# ============================================================================
# STEP 1: Pre-flight Checks
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 1: Pre-flight Checks${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

info_msg "Checking if source directory exists..."
if [ ! -d "$SOURCE_DIR" ]; then
    error_exit "Source directory not found: $SOURCE_DIR"
fi
success_msg "Source directory found"

info_msg "Checking if frontend source exists..."
if [ ! -d "$SOURCE_DIR/frontend" ]; then
    error_exit "Frontend directory not found: $SOURCE_DIR/frontend"
fi
success_msg "Frontend source found"

info_msg "Checking required commands..."
command -v node >/dev/null 2>&1 || error_exit "Node.js is not installed"
command -v npm >/dev/null 2>&1 || error_exit "npm is not installed"
command -v pm2 >/dev/null 2>&1 || error_exit "PM2 is not installed (run: npm install -g pm2)"
success_msg "All required commands available"

echo ""

# ============================================================================
# STEP 2: Create Target Directories
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 2: Create Target Directories${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

info_msg "Creating backend directory: $BACKEND_DIR"
sudo mkdir -p "$BACKEND_DIR" || error_exit "Failed to create backend directory"
sudo chown -R $USER:$USER "$BACKEND_DIR" || error_exit "Failed to set backend directory permissions"
success_msg "Backend directory created"

info_msg "Creating frontend directory: $FRONTEND_DIR"
sudo mkdir -p "$FRONTEND_DIR/frontend" || error_exit "Failed to create frontend directory"
sudo chown -R $USER:$USER "$FRONTEND_DIR" || error_exit "Failed to set frontend directory permissions"
success_msg "Frontend directory created"

echo ""

# ============================================================================
# STEP 3: Backup Existing Deployments (if any)
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 3: Backup Existing Deployments${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Backup backend .env files if they exist
if [ -f "$BACKEND_DIR/.env.staging" ]; then
    info_msg "Backing up existing backend .env.staging"
    cp "$BACKEND_DIR/.env.staging" "$BACKEND_DIR/.env.staging.backup.$TIMESTAMP"
    success_msg "Backend .env.staging backed up"
fi

if [ -f "$BACKEND_DIR/.env.production" ]; then
    info_msg "Backing up existing backend .env.production"
    cp "$BACKEND_DIR/.env.production" "$BACKEND_DIR/.env.production.backup.$TIMESTAMP"
    success_msg "Backend .env.production backed up"
fi

# Backup frontend .env files if they exist
if [ -f "$FRONTEND_DIR/frontend/.env.production" ]; then
    info_msg "Backing up existing frontend .env.production"
    cp "$FRONTEND_DIR/frontend/.env.production" "$FRONTEND_DIR/frontend/.env.production.backup.$TIMESTAMP"
    success_msg "Frontend .env.production backed up"
fi

echo ""

# ============================================================================
# STEP 4: Copy Backend Files
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 4: Copy Backend Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

info_msg "Copying backend files from $SOURCE_DIR to $BACKEND_DIR"

# Copy all backend files except frontend, node_modules, and .git
rsync -av \
    --exclude 'frontend' \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '.env.staging' \
    --exclude '.env.production' \
    --exclude 'dist' \
    --exclude 'logs/*.log' \
    --exclude '.DS_Store' \
    "$SOURCE_DIR/" "$BACKEND_DIR/" || error_exit "Failed to copy backend files"

success_msg "Backend files copied successfully"

# Count files
BACKEND_FILE_COUNT=$(find "$BACKEND_DIR" -type f | wc -l)
info_msg "Total backend files: $BACKEND_FILE_COUNT"

echo ""

# ============================================================================
# STEP 5: Copy Frontend Files
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 5: Copy Frontend Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

info_msg "Copying frontend files from $SOURCE_DIR/frontend to $FRONTEND_DIR/frontend"

# Copy all frontend files except node_modules and .git
rsync -av \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env' \
    --exclude '.env.production' \
    --exclude '.next' \
    --exclude '.DS_Store' \
    "$SOURCE_DIR/frontend/" "$FRONTEND_DIR/frontend/" || error_exit "Failed to copy frontend files"

success_msg "Frontend files copied successfully"

# Count files
FRONTEND_FILE_COUNT=$(find "$FRONTEND_DIR/frontend" -type f | wc -l)
info_msg "Total frontend files: $FRONTEND_FILE_COUNT"

echo ""

# ============================================================================
# STEP 6: Create Backend Environment Files
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 6: Create Backend Environment Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create .env.staging if it doesn't exist
if [ ! -f "$BACKEND_DIR/.env.staging" ]; then
    info_msg "Creating backend .env.staging file"
    cat > "$BACKEND_DIR/.env.staging" << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=3001

# Database Configuration
DATABASE_URL="postgresql://signaturechair:CHANGE_DB_PASSWORD@localhost:5432/signaturechair_booking_staging"

# Square API Configuration (STAGING/SANDBOX)
SQUARE_ENVIRONMENT=sandbox
SQUARE_ACCESS_TOKEN=CHANGE_THIS_SQUARE_ACCESS_TOKEN
SQUARE_LOCATION_ID=CHANGE_THIS_SQUARE_LOCATION_ID

# Application Settings
DOMAIN=staging.thesignaturechair.com
ALLOWED_ORIGINS=https://staging.thesignaturechair.com,http://localhost:3001

# Default Barber
DEFAULT_BARBER_SLUG=your-barber-slug

# Logging
LOG_LEVEL=info
LOG_DIR=/var/www/signature-chair-backend/logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    success_msg "Created .env.staging (UPDATE REQUIRED)"
else
    warn_msg ".env.staging already exists - keeping existing file"
fi

# Create .env.production if it doesn't exist
if [ ! -f "$BACKEND_DIR/.env.production" ]; then
    info_msg "Creating backend .env.production file"
    cat > "$BACKEND_DIR/.env.production" << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DATABASE_URL="postgresql://signaturechair:CHANGE_DB_PASSWORD@localhost:5432/signaturechair_booking"

# Square API Configuration (PRODUCTION)
SQUARE_ENVIRONMENT=production
SQUARE_ACCESS_TOKEN=CHANGE_THIS_SQUARE_ACCESS_TOKEN
SQUARE_LOCATION_ID=CHANGE_THIS_SQUARE_LOCATION_ID

# Application Settings
DOMAIN=thesignaturechair.com
ALLOWED_ORIGINS=https://thesignaturechair.com,https://www.thesignaturechair.com

# Default Barber
DEFAULT_BARBER_SLUG=your-barber-slug

# Logging
LOG_LEVEL=info
LOG_DIR=/var/www/signature-chair-backend/logs

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    success_msg "Created .env.production (UPDATE REQUIRED)"
else
    warn_msg ".env.production already exists - keeping existing file"
fi

echo ""

# ============================================================================
# STEP 7: Create Frontend Environment Files
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 7: Create Frontend Environment Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create frontend .env.production if it doesn't exist
if [ ! -f "$FRONTEND_DIR/frontend/.env.production" ]; then
    info_msg "Creating frontend .env.production file"
    cat > "$FRONTEND_DIR/frontend/.env.production" << 'EOF'
# Backend API Configuration
NEXT_PUBLIC_API_URL=https://staging.thesignaturechair.com/api

# Default Barber (for single-barber mode)
# Update this after syncing barbers from Square
NEXT_PUBLIC_DEFAULT_BARBER_SLUG=your-barber-slug

# Domain
NEXT_PUBLIC_DOMAIN=staging.thesignaturechair.com

# Square Location ID (for availability calls)
NEXT_PUBLIC_LOCATION_ID=CHANGE_THIS_SQUARE_LOCATION_ID
EOF
    success_msg "Created frontend .env.production (UPDATE REQUIRED)"
else
    warn_msg "Frontend .env.production already exists - keeping existing file"
fi

echo ""

# ============================================================================
# STEP 8: Create PM2 Ecosystem Files
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 8: Create PM2 Ecosystem Files${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Create backend ecosystem.config.js
info_msg "Creating backend PM2 ecosystem file"
cat > "$BACKEND_DIR/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'signature-chair-backend',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
EOF
success_msg "Backend PM2 ecosystem file created"

# Create frontend ecosystem.config.js
info_msg "Creating frontend PM2 ecosystem file"
cat > "$FRONTEND_DIR/frontend/ecosystem.config.js" << 'EOF'
module.exports = {
  apps: [{
    name: 'signature-chair-frontend',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3001',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
EOF
success_msg "Frontend PM2 ecosystem file created"

echo ""

# ============================================================================
# STEP 9: Install Backend Dependencies
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 9: Install Backend Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$BACKEND_DIR" || error_exit "Failed to change to backend directory"
info_msg "Running npm install in backend..."
npm install --production=false || error_exit "Backend npm install failed"
success_msg "Backend dependencies installed"

echo ""

# ============================================================================
# STEP 10: Setup Backend Database (Prisma)
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 10: Setup Backend Database (Prisma)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$BACKEND_DIR" || error_exit "Failed to change to backend directory"

info_msg "Running prisma generate..."
npx prisma generate || error_exit "Prisma generate failed"
success_msg "Prisma client generated"

# Note: We'll skip migrate deploy here since the database might not be set up yet
warn_msg "Skipping database migration (run 'npx prisma migrate deploy' after DB setup)"

echo ""

# ============================================================================
# STEP 11: Build Backend
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 11: Build Backend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$BACKEND_DIR" || error_exit "Failed to change to backend directory"
info_msg "Building backend TypeScript..."
npm run build || error_exit "Backend build failed"
success_msg "Backend built successfully"

# Verify dist directory was created
if [ ! -d "$BACKEND_DIR/dist" ]; then
    error_exit "Backend build did not create dist directory"
fi
info_msg "Backend dist directory verified"

echo ""

# ============================================================================
# STEP 12: Install Frontend Dependencies
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 12: Install Frontend Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$FRONTEND_DIR/frontend" || error_exit "Failed to change to frontend directory"
info_msg "Running npm install in frontend..."
npm install || error_exit "Frontend npm install failed"
success_msg "Frontend dependencies installed"

echo ""

# ============================================================================
# STEP 13: Build Frontend
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 13: Build Frontend${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

cd "$FRONTEND_DIR/frontend" || error_exit "Failed to change to frontend directory"
info_msg "Building Next.js frontend..."
npm run build || error_exit "Frontend build failed"
success_msg "Frontend built successfully"

# Verify .next directory was created
if [ ! -d "$FRONTEND_DIR/frontend/.next" ]; then
    error_exit "Frontend build did not create .next directory"
fi
info_msg "Frontend .next directory verified"

echo ""

# ============================================================================
# STEP 14: Create Log Directories
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 14: Create Log Directories${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

info_msg "Creating backend logs directory..."
mkdir -p "$BACKEND_DIR/logs"
success_msg "Backend logs directory created"

info_msg "Creating frontend logs directory..."
mkdir -p "$FRONTEND_DIR/frontend/logs"
success_msg "Frontend logs directory created"

echo ""

# ============================================================================
# STEP 15: Start PM2 Processes
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 15: Start PM2 Processes${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Stop existing processes if they exist
info_msg "Stopping existing PM2 processes (if any)..."
pm2 delete signature-chair-backend 2>/dev/null || true
pm2 delete signature-chair-frontend 2>/dev/null || true
success_msg "Existing processes stopped"

# Start backend
info_msg "Starting backend with PM2..."
cd "$BACKEND_DIR" || error_exit "Failed to change to backend directory"
pm2 start ecosystem.config.js --env production || error_exit "Failed to start backend with PM2"
success_msg "Backend started with PM2"

# Start frontend
info_msg "Starting frontend with PM2..."
cd "$FRONTEND_DIR/frontend" || error_exit "Failed to change to frontend directory"
pm2 start ecosystem.config.js || error_exit "Failed to start frontend with PM2"
success_msg "Frontend started with PM2"

# Save PM2 process list
info_msg "Saving PM2 process list..."
pm2 save || error_exit "Failed to save PM2 process list"
success_msg "PM2 process list saved"

echo ""

# ============================================================================
# STEP 16: Final Status
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}STEP 16: Final Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
pm2 list
echo ""

# ============================================================================
# Deployment Complete - Show Next Steps
# ============================================================================
echo ""
echo -e "${MAGENTA}============================================================================${NC}"
echo -e "${GREEN}                    DEPLOYMENT COMPLETE! 🎉${NC}"
echo -e "${MAGENTA}============================================================================${NC}"
echo ""
echo -e "${CYAN}Files Deployed:${NC}"
echo -e "  Backend:  $BACKEND_FILE_COUNT files → $BACKEND_DIR"
echo -e "  Frontend: $FRONTEND_FILE_COUNT files → $FRONTEND_DIR/frontend"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}IMPORTANT: Required Configuration Steps${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}1. Setup PostgreSQL Database${NC}"
echo "   Create user and database for the application:"
echo "   $ sudo -u postgres psql"
echo "   postgres=# CREATE USER signaturechair WITH PASSWORD 'your_secure_password';"
echo "   postgres=# CREATE DATABASE signaturechair_booking_staging OWNER signaturechair;"
echo "   postgres=# \\q"
echo ""
echo -e "${CYAN}2. Update Backend Environment Variables${NC}"
echo "   Edit: $BACKEND_DIR/.env.staging"
echo "   Required changes:"
echo "   - DATABASE_URL (update password)"
echo "   - SQUARE_ACCESS_TOKEN (your Square API token)"
echo "   - SQUARE_LOCATION_ID (your Square location ID)"
echo ""
echo -e "${CYAN}3. Run Database Migrations${NC}"
echo "   $ cd $BACKEND_DIR"
echo "   $ npx prisma migrate deploy"
echo "   $ pm2 restart signature-chair-backend"
echo ""
echo -e "${CYAN}4. Sync Barbers from Square${NC}"
echo "   $ curl http://localhost:3001/api/admin/sync/barbers"
echo "   $ curl http://localhost:3001/api/public/barbers | jq '.barbers[0].slug'"
echo ""
echo -e "${CYAN}5. Update Frontend Environment Variables${NC}"
echo "   Edit: $FRONTEND_DIR/frontend/.env.production"
echo "   Required changes:"
echo "   - NEXT_PUBLIC_DEFAULT_BARBER_SLUG (from step 4)"
echo "   - NEXT_PUBLIC_LOCATION_ID (your Square location ID)"
echo "   - NEXT_PUBLIC_API_URL (update domain if needed)"
echo ""
echo -e "${CYAN}6. Rebuild and Restart After Config Changes${NC}"
echo "   $ cd $FRONTEND_DIR/frontend"
echo "   $ npm run build"
echo "   $ pm2 restart signature-chair-frontend"
echo ""
echo -e "${CYAN}7. Configure Nginx Reverse Proxy${NC}"
echo "   See: $BACKEND_DIR/nginx-config.txt"
echo "   Setup SSL with Let's Encrypt (certbot)"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Useful Commands${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}View logs:${NC}"
echo "  pm2 logs signature-chair-backend"
echo "  pm2 logs signature-chair-frontend"
echo ""
echo -e "${CYAN}Monitor processes:${NC}"
echo "  pm2 monit"
echo ""
echo -e "${CYAN}Restart services:${NC}"
echo "  pm2 restart signature-chair-backend"
echo "  pm2 restart signature-chair-frontend"
echo "  pm2 restart all"
echo ""
echo -e "${CYAN}Stop services:${NC}"
echo "  pm2 stop signature-chair-backend"
echo "  pm2 stop signature-chair-frontend"
echo ""
echo -e "${CYAN}Test API endpoints:${NC}"
echo "  curl http://localhost:3001/health"
echo "  curl http://localhost:3001/api/public/barbers"
echo ""
echo -e "${CYAN}Test frontend:${NC}"
echo "  curl http://localhost:3001"
echo ""
echo -e "${MAGENTA}============================================================================${NC}"
echo ""
