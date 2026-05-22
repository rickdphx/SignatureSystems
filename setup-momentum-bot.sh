#!/bin/bash

echo "Setting up Momentum Trading Bot..."

cd ~/SignatureSystems

# Pull latest code
echo "Pulling latest code..."
git pull origin claude/setup-signature-chair-booking-RX9Gg

# Navigate to bot directory
cd momentum-bot

# Create .env file
echo "Creating .env file..."
cp .env.example .env

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your API keys:"
echo "   nano .env"
echo ""
echo "2. Install Python dependencies:"
echo "   pip3 install -r requirements.txt"
echo ""
echo "3. Run the bot:"
echo "   python3 src/bot.py"
echo ""
