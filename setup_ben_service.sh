#!/bin/bash
set -e

echo "=========================================="
echo "Ben Brain API Service Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Locate ben_api.py
echo -e "${YELLOW}[1/9] Locating ben_api.py...${NC}"
BEN_API_PATH=""

# Check common locations
if [ -f "/home/ubuntu/SignatureSystems/ben_api.py" ]; then
    BEN_API_PATH="/home/ubuntu/SignatureSystems"
elif [ -f "$HOME/SignatureSystems/ben_api.py" ]; then
    BEN_API_PATH="$HOME/SignatureSystems"
elif [ -f "./ben_api.py" ]; then
    BEN_API_PATH="$(pwd)"
else
    # Try to find it
    FOUND=$(find /home -name "ben_api.py" 2>/dev/null | head -1)
    if [ -n "$FOUND" ]; then
        BEN_API_PATH=$(dirname "$FOUND")
    fi
fi

if [ -z "$BEN_API_PATH" ]; then
    echo -e "${RED}ERROR: Could not find ben_api.py${NC}"
    echo "Please ensure ben_api.py is in /home/ubuntu/SignatureSystems or the current directory"
    exit 1
fi

echo -e "${GREEN}✓ Found ben_api.py at: $BEN_API_PATH${NC}"
cd "$BEN_API_PATH"

# Step 2: Check Python and create/verify virtual environment
echo ""
echo -e "${YELLOW}[2/9] Setting up Python virtual environment...${NC}"

VENV_PATH="/home/ubuntu/venv"
if [ ! -d "$VENV_PATH" ]; then
    echo "Creating new virtual environment at $VENV_PATH..."
    python3 -m venv "$VENV_PATH"
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment exists at $VENV_PATH${NC}"
fi

# Activate venv and install dependencies
source "$VENV_PATH/bin/activate"

echo ""
echo -e "${YELLOW}[3/9] Installing/upgrading dependencies...${NC}"
pip install --upgrade pip -q
pip install fastapi uvicorn -q
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Fix Python import paths (ensure system module is importable)
echo ""
echo -e "${YELLOW}[4/9] Verifying Python import paths...${NC}"

# Create __init__.py files if they don't exist
touch "$BEN_API_PATH/system/__init__.py"
touch "$BEN_API_PATH/system/registries/__init__.py"
touch "$BEN_API_PATH/system/maps/__init__.py"

# Test imports
if python -c "import sys; sys.path.insert(0, '$BEN_API_PATH'); from system import llm_clients" 2>/dev/null; then
    echo -e "${GREEN}✓ Python imports working correctly${NC}"
else
    echo -e "${RED}ERROR: Python import test failed${NC}"
    echo "Attempting to debug..."
    python -c "import sys; sys.path.insert(0, '$BEN_API_PATH'); from system import llm_clients"
    exit 1
fi

# Step 4: Stop conflicting services
echo ""
echo -e "${YELLOW}[5/9] Checking for conflicting services on port 8000...${NC}"

# Check if fastapi.service exists and is running
if systemctl list-units --full --all | grep -q "fastapi.service"; then
    echo "Found fastapi.service, stopping and disabling..."
    sudo systemctl stop fastapi.service 2>/dev/null || true
    sudo systemctl disable fastapi.service 2>/dev/null || true
    echo -e "${GREEN}✓ Stopped fastapi.service${NC}"
fi

# Kill any process using port 8000
if sudo lsof -ti:8000 >/dev/null 2>&1; then
    echo "Killing processes using port 8000..."
    sudo kill -9 $(sudo lsof -ti:8000) 2>/dev/null || true
    sleep 2
    echo -e "${GREEN}✓ Freed port 8000${NC}"
else
    echo -e "${GREEN}✓ Port 8000 is free${NC}"
fi

# Step 5: Configure and install ben.service
echo ""
echo -e "${YELLOW}[6/9] Configuring systemd service...${NC}"

# Create the service file with correct paths
SERVICE_FILE="/etc/systemd/system/ben.service"
sudo tee "$SERVICE_FILE" > /dev/null <<EOF
[Unit]
Description=Ben Brain API Service
After=network.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=$BEN_API_PATH
Environment="PATH=$VENV_PATH/bin:/usr/local/bin:/usr/bin:/bin"
Environment="PYTHONPATH=$BEN_API_PATH"
ExecStart=$VENV_PATH/bin/python -m uvicorn ben_api:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✓ Created $SERVICE_FILE${NC}"

# Step 6: Reload systemd and start service
echo ""
echo -e "${YELLOW}[7/9] Reloading systemd and starting ben.service...${NC}"
sudo systemctl daemon-reload
sudo systemctl enable ben.service
sudo systemctl restart ben.service

echo -e "${GREEN}✓ Service restarted${NC}"

# Wait for service to start
echo "Waiting for service to start (5 seconds)..."
sleep 5

# Step 7: Verify service status
echo ""
echo -e "${YELLOW}[8/9] Checking service status...${NC}"
if sudo systemctl is-active --quiet ben.service; then
    echo -e "${GREEN}✓ ben.service is running${NC}"
else
    echo -e "${RED}✗ ben.service is not running${NC}"
    echo ""
    echo "Last 120 lines of service logs:"
    echo "========================================"
    journalctl -u ben.service -n 120 --no-pager
    echo "========================================"
    exit 1
fi

# Step 8: Verify API endpoints
echo ""
echo -e "${YELLOW}[9/9] Verifying API endpoints...${NC}"
echo ""

# Give it a moment to fully start
sleep 2

echo "Testing /docs endpoint:"
echo "----------------------------------------"
if curl -s http://127.0.0.1:8000/docs | head -20; then
    echo -e "${GREEN}✓ /docs endpoint responding${NC}"
else
    echo -e "${RED}✗ /docs endpoint failed${NC}"
fi

echo ""
echo "Testing /openapi.json endpoint:"
echo "----------------------------------------"
if curl -s http://127.0.0.1:8000/openapi.json | head -20; then
    echo -e "${GREEN}✓ /openapi.json endpoint responding${NC}"
else
    echo -e "${RED}✗ /openapi.json endpoint failed${NC}"
fi

echo ""
echo "Testing /health endpoint:"
echo "----------------------------------------"
if curl -s http://127.0.0.1:8000/health; then
    echo ""
    echo -e "${GREEN}✓ /health endpoint responding${NC}"
else
    echo -e "${RED}✗ /health endpoint failed${NC}"
fi

echo ""
echo "Testing /ben/route?task_type=strategy endpoint:"
echo "----------------------------------------"
if curl -s "http://127.0.0.1:8000/ben/route?task_type=strategy"; then
    echo ""
    echo -e "${GREEN}✓ /ben/route endpoint responding${NC}"
else
    echo -e "${RED}✗ /ben/route endpoint failed${NC}"
fi

echo ""
echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Service Status:"
sudo systemctl status ben.service --no-pager -l | head -20
echo ""
echo "To view logs in real-time:"
echo "  journalctl -u ben.service -f"
echo ""
echo "To check service status:"
echo "  sudo systemctl status ben.service"
echo ""
echo "To restart service:"
echo "  sudo systemctl restart ben.service"
echo ""
echo "API Documentation:"
echo "  http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP'):8000/docs"
echo ""
