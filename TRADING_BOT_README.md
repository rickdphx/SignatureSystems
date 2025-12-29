# Trading Bot UI with Schwab Integration

This document describes the trading bot functionality added to the SignatureSystems application.

## Features

### Backend API
- **Schwab API Integration**: Full OAuth2 integration with Schwab's trading API
- **Portfolio Management**: Track multiple portfolios with comprehensive metrics
- **Position Tracking**: Real-time position monitoring with P&L calculations
- **Order Management**: Place market and limit orders through Schwab
- **Trade History**: Complete trade logging with realized P&L
- **Market Data**: Real-time and cached market data for positions

### Frontend UI
- **Trading Dashboard**: Comprehensive dashboard with key metrics
- **Performance Metrics**:
  - Total P&L (Profit & Loss)
  - Profit Factor (Gross Profits / Gross Losses)
  - Win Rate
  - Sharpe Ratio
  - Maximum Drawdown
  - Total Trades (Wins/Losses)
  - Account Value
  - Buying Power
  - Cash Balance

- **Position Management**: View all open positions with unrealized P&L
- **Trade History**: Recent trades with realized P&L
- **Account Setup**: Step-by-step wizard for connecting Schwab accounts

## Database Schema

### New Models Added

#### BrokerAccount
- Account details (number, type, broker)
- OAuth tokens (encrypted)
- Account balances (value, cash, buying power)
- Paper vs Live trading flag

#### Portfolio
- Portfolio metrics (P&L, profit factor, win rate, Sharpe ratio, max drawdown)
- Trade statistics (total, winning, losing)
- Links to broker account

#### Position
- Current holdings (symbol, quantity, prices)
- Unrealized P&L
- Long/Short side

#### Trade
- Executed trades
- Realized P&L
- Commission and fees
- Strategy attribution

#### Order
- Order details (type, side, quantity, prices)
- Order status (pending, filled, cancelled, etc.)
- Broker order ID for tracking

#### Signal
- Trading signals/alerts
- Signal strength and confidence
- Strategy attribution

#### MarketData
- Cached market quotes
- Price data (bid, ask, last, OHLC)
- Fundamental data (P/E, dividend yield, etc.)

## API Endpoints

### Account Management
- `GET /api/trading/accounts` - List all broker accounts
- `POST /api/trading/accounts` - Create new broker account
- `POST /api/trading/accounts/:accountNumber/sync` - Sync account data from broker
- `POST /api/trading/accounts/:accountNumber/tokens` - Set OAuth tokens

### Portfolio Management
- `GET /api/trading/portfolios` - List all portfolios
- `POST /api/trading/portfolios` - Create new portfolio
- `GET /api/trading/portfolios/:portfolioId` - Get portfolio details with metrics
- `POST /api/trading/portfolios/:portfolioId/sync` - Sync positions and orders

### Positions & Trades
- `GET /api/trading/positions?portfolioId=xxx` - Get positions for portfolio
- `GET /api/trading/trades?portfolioId=xxx` - Get trade history
- `GET /api/trading/orders?accountNumber=xxx` - Get orders

### Order Placement
- `POST /api/trading/orders/market` - Place market order
- `POST /api/trading/orders/limit` - Place limit order
- `DELETE /api/trading/orders/:orderId` - Cancel order

### Market Data
- `GET /api/trading/market-data/:symbol` - Get market data for symbol
- `POST /api/trading/market-data/refresh` - Refresh multiple symbols

### Authentication
- `GET /api/trading/auth/url` - Get Schwab OAuth URL
- `POST /api/trading/auth/callback` - Handle OAuth callback

## Setup Instructions

### 1. Schwab API Setup

1. Go to [Schwab Developer Portal](https://developer.schwab.com/)
2. Create a new application
3. Note your Client ID and Client Secret
4. Set redirect URI to `https://127.0.0.1` (or your preferred URI)

### 2. Environment Variables

Add to your `.env` file:

```bash
# Schwab Trading API Configuration
SCHWAB_CLIENT_ID=your_schwab_client_id_here
SCHWAB_CLIENT_SECRET=your_schwab_client_secret_here
SCHWAB_REDIRECT_URI=https://127.0.0.1
SCHWAB_ENVIRONMENT=paper
```

### 3. Database Migration

Run the Prisma migration to create trading tables:

```bash
# Generate Prisma client
npm run prisma:generate

# Create and apply migration
npx prisma migrate dev --name add_trading_models

# Or for production
npm run prisma:deploy
```

### 4. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd frontend && npm install
```

### 5. Start the Application

```bash
# Backend
npm run dev

# Frontend (in separate terminal)
cd frontend && npm run dev
```

### 6. Setup Trading Account

1. Navigate to `http://localhost:3001/trading/setup`
2. Enter your Schwab account number
3. Select account type (MARGIN, CASH, IRA)
4. Choose Paper Trading (recommended for testing)
5. Click "Connect Schwab Account"
6. Authorize on Schwab's OAuth page
7. Copy the authorization code
8. Paste it in the setup wizard
9. Create your portfolio
10. Done! View your dashboard at `http://localhost:3001/trading`

## Usage

### Viewing Dashboard

Navigate to `/trading` to see:
- Account overview
- Performance metrics
- Current positions
- Recent trades

### Syncing Data

Click "Sync Account" to fetch latest data from Schwab:
- Account balances
- Open positions
- Order status
- Market prices

### Placing Orders

Use the API to place orders:

```javascript
// Market order
const response = await fetch('/api/trading/orders/market', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountNumber: 'YOUR_ACCOUNT',
    portfolioId: 'PORTFOLIO_ID',
    symbol: 'AAPL',
    quantity: 10,
    side: 'BUY',
  }),
});

// Limit order
const response = await fetch('/api/trading/orders/limit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountNumber: 'YOUR_ACCOUNT',
    portfolioId: 'PORTFOLIO_ID',
    symbol: 'AAPL',
    quantity: 10,
    price: 150.00,
    side: 'BUY',
  }),
});
```

## Key Metrics Explained

### Profit Factor
- **Formula**: Gross Profits / Gross Losses
- **Meaning**:
  - > 1.0 = Profitable strategy
  - < 1.0 = Losing strategy
  - 2.0 = You make $2 for every $1 you lose

### Win Rate
- **Formula**: (Winning Trades / Total Trades) × 100
- **Meaning**: Percentage of trades that are profitable

### Sharpe Ratio
- **Formula**: (Portfolio Return - Risk-Free Rate) / Standard Deviation
- **Meaning**: Risk-adjusted return
  - > 1.0 = Good
  - > 2.0 = Very good
  - > 3.0 = Excellent

### Maximum Drawdown
- **Formula**: ((Peak Value - Trough Value) / Peak Value) × 100
- **Meaning**: Largest peak-to-trough decline
  - Lower is better
  - Indicates worst-case loss scenario

## Architecture

### Backend Services

**Schwab Client** (`src/clients/schwab.ts`)
- OAuth2 authentication
- Token refresh handling
- Account data retrieval
- Order placement
- Market data fetching

**Trading Service** (`src/services/trading.service.ts`)
- Sync broker accounts
- Sync positions and orders
- Place orders
- Update market data
- Calculate portfolio metrics

**Trading Routes** (`src/routes/trading.routes.ts`)
- REST API endpoints
- Request validation
- Error handling

### Frontend Components

**Trading Dashboard** (`frontend/src/app/trading/page.tsx`)
- Portfolio overview
- Performance metrics display
- Position table
- Trade history

**Setup Wizard** (`frontend/src/app/trading/setup/page.tsx`)
- 4-step setup process
- OAuth flow handling
- Account and portfolio creation

## Security Considerations

1. **OAuth Tokens**: Store access/refresh tokens encrypted in production
2. **Paper Trading**: Default to paper trading for safety
3. **Rate Limiting**: API rate limits are enforced
4. **Validation**: All inputs are validated on backend
5. **CORS**: Restricted to allowed origins only

## Testing

### Paper Trading
- Use Schwab's paper trading environment
- No real money at risk
- Test strategies safely

### Manual Testing
1. Create paper trading account
2. Place small test orders
3. Verify positions sync correctly
4. Check P&L calculations
5. Test order cancellation

## Troubleshooting

### OAuth Issues
- Ensure redirect URI matches exactly
- Check client ID and secret are correct
- Verify Schwab app is approved

### Sync Issues
- Check network connectivity
- Verify tokens haven't expired
- Check Schwab API status

### Missing Data
- Run manual sync
- Check account permissions
- Verify account number is correct

## Future Enhancements

- Real-time WebSocket market data
- Advanced charting (TradingView, Lightweight Charts)
- Strategy backtesting
- Automated trading signals
- Risk management rules
- Multi-account support
- Mobile responsive design
- Push notifications for trades

## Files Created

### Backend
- `prisma/schema.prisma` - Updated with trading models
- `src/clients/schwab.ts` - Schwab API client
- `src/services/trading.service.ts` - Trading business logic
- `src/routes/trading.routes.ts` - Trading API routes
- `src/app.ts` - Updated to include trading routes
- `package.json` - Added axios dependency
- `.env.example` - Added Schwab configuration

### Frontend
- `frontend/src/app/trading/page.tsx` - Trading dashboard
- `frontend/src/app/trading/setup/page.tsx` - Account setup wizard

## Support

For issues or questions:
1. Check this documentation
2. Review Schwab API docs: https://developer.schwab.com/
3. Check application logs in `logs/` directory
4. Review Prisma documentation for database issues

---

**Created**: December 29, 2025
**Version**: 1.0.0
**Author**: Claude Code
