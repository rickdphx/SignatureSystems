# Schwab API Setup Guide

The momentum bot now supports Charles Schwab accounts! Follow these steps to connect your Schwab account.

## Step 1: Register for Schwab Developer API

1. Go to https://developer.schwab.com
2. Sign in with your Schwab account credentials
3. Click "My Apps" → "Create New App"
4. Fill in app details:
   - **App Name**: Momentum Trading Bot
   - **Callback URL**: `https://localhost:8000/callback`
   - **Description**: Automated momentum scanner
5. Click "Create App"
6. Save your **App Key** and **Secret Key**

## Step 2: Configure .env File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Schwab credentials:

```bash
# Broker Selection
BROKER=schwab

# Schwab API
SCHWAB_APP_KEY=your_app_key_here
SCHWAB_APP_SECRET=your_secret_key_here
SCHWAB_CALLBACK_URL=https://localhost:8000/callback
SCHWAB_ACCOUNT_HASH=
SCHWAB_REFRESH_TOKEN=
```

## Step 3: Get OAuth Tokens

Run the setup script:

```bash
python3 setup_schwab.py
```

This will:
1. Open your browser to Schwab authorization page
2. Ask you to log in and authorize the app
3. Redirect to callback URL with authorization code
4. Exchange code for access/refresh tokens
5. Display your **refresh token** (save this!)

**Copy the refresh token** and add it to `.env`:

```bash
SCHWAB_REFRESH_TOKEN=your_refresh_token_here
```

## Step 4: Get Account Hash

Your account hash is your Schwab account number:

1. Log into Schwab
2. Go to Accounts → Account Details
3. Copy your account number (usually 8 digits)
4. Add to `.env`:

```bash
SCHWAB_ACCOUNT_HASH=12345678
```

## Step 5: Install Dependencies

```bash
pip3 install -r requirements.txt
```

## Step 6: Run the Bot

```bash
python3 src/bot.py
```

## Important Notes

### Token Expiration
- **Access tokens** expire after 30 minutes
- **Refresh tokens** expire after 7 days
- The bot automatically refreshes access tokens
- If refresh token expires, re-run `setup_schwab.py`

### Account Requirements
- Must have approved Schwab brokerage account
- API access enabled (automatically granted for individual accounts)
- Sufficient buying power for trading

### API Limits
- Schwab allows 120 requests/minute
- Market data: real-time quotes included
- No additional fees for API access

### Paper Trading
Schwab doesn't offer paper trading via API. To test:
1. Use very small position sizes
2. Set MAX_POSITION_SIZE=100 in `.env`
3. Monitor carefully before scaling up

## Troubleshooting

### "Invalid Credentials" Error
- Check your App Key and Secret are correct
- Make sure you copied them exactly from developer portal
- No extra spaces or quotes

### "Token Expired" Error
- Run `setup_schwab.py` again to get new refresh token
- Refresh tokens expire after 7 days of inactivity

### "Account Not Found" Error
- Verify your account hash is correct
- Check it's your account number (8 digits)
- Make sure account is funded and approved

### "Rate Limit Exceeded"
- Bot is making too many requests
- Increase SCAN_INTERVAL in .env (default 5 seconds)
- Reduce watchlist size

## Switching Between Alpaca and Schwab

You can switch brokers anytime by changing `BROKER` in `.env`:

```bash
# Use Schwab
BROKER=schwab

# Use Alpaca
BROKER=alpaca
```

Both sets of credentials can remain in `.env` - only the active broker is used.

## Security Best Practices

1. **Never commit .env file** to git (already in .gitignore)
2. **Rotate tokens regularly** (every 7 days)
3. **Use strong app secret** when creating Schwab app
4. **Monitor account activity** daily
5. **Set position size limits** to manage risk

## Support

Having issues? Check:
- Schwab API Status: https://developer.schwab.com/status
- Bot logs: Check console output for errors
- Account permissions: Verify trading is enabled

For Schwab API issues, contact: developer-support@schwab.com
