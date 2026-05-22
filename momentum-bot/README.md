# Momentum Trading Bot

Real-time momentum scanner with weighted confluence scoring system. Built for explosive momentum plays on stocks and crypto using Alpaca.

## Features

### Signal Detection
- **Primary Signals**: Momentum spike, RVOL surge, low float, news catalysts
- **Price Action**: HOD breaks, VWAP reclaims, bull flags, micro pullbacks
- **Level 2 / Tape**: Tape acceleration, hidden buyers, sell walls, order flow
- **Technical**: MACD, RSI, ATR confirmations

### Scoring System
Weighted confluence system (0-10 scale):
- RVOL 5x+: 20 points
- Low Float: 20 points
- News Catalyst: 15 points
- HOD Break: 15 points
- Tape Acceleration: 10 points
- VWAP Reclaim: 10 points
- MACD/RSI: 5 points each

**Only trades setups with score >= 9**

### Risk Management
- Dynamic position sizing based on signal strength
- ATR-based trailing stops
- Multiple exit conditions (MACD cross, sell walls, failed patterns)
- 2% max loss per trade

### Trading Windows
Priority hours (EST):
- 7:00 AM - 11:00 AM (premarket + open)
- 3:00 PM - 6:00 PM (close + afterhours)

## Setup

### 1. Install Dependencies

```bash
cd momentum-bot
pip install -r requirements.txt
```

### 2. Configure API Keys

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```
ALPACA_API_KEY=your_key_here
ALPACA_SECRET_KEY=your_secret_here
POLYGON_API_KEY=your_polygon_key
```

### 3. Run the Bot

```bash
python src/bot.py
```

## Configuration

Edit `config/settings.py` to customize:

- Price range ($1-$20 default)
- Min RVOL (5x default)
- Signal weights
- Position sizing
- Risk parameters

## Project Structure

```
momentum-bot/
├── src/
│   ├── scanner/
│   │   ├── momentum_scanner.py  # Main scanner engine
│   │   └── models.py             # Data models
│   ├── signals/
│   │   ├── primary_signals.py    # Core entry signals
│   │   ├── price_action_signals.py
│   │   ├── level2_signals.py     # Tape/order flow
│   │   └── technical_signals.py
│   ├── data/
│   │   └── alpaca_client.py      # Alpaca integration
│   └── bot.py                    # Main orchestrator
├── config/
│   └── settings.py               # Configuration
└── requirements.txt
```

## Signal Types

### Primary Entry Signals

**Momentum Spike (CORE)**
- +10% minimum intraday gain
- Increasing volume
- Accelerating price action

**RVOL Surge (MANDATORY)**
- 5x minimum relative volume
- Higher priority: 8x, 10x, 20x+

**Low Float**
- Preferred: <= 10M shares
- Ultra priority: <= 1M shares

**News Catalyst (BONUS)**
- FDA, AI, acquisition, earnings beat, etc.
- Massively boosts score if present

### Price Action Signals

**HOD Break**
- Stock breaks high of day
- Volume surge required
- One of the biggest triggers

**VWAP Reclaim**
- Pullback into VWAP
- Hold and reclaim
- Buyers stepping in

**Bull Flag**
- Impulsive move + tight consolidation
- Breakout with volume

**Micro Pullback (10s chart)**
- Advanced edge
- Controlled pullback
- Higher low + volume return

### Level 2 / Tape Signals

**Tape Acceleration**
- Increasing prints per second
- Aggressive bid hitting
- Stacked green prints

**Hidden Buyer**
- Large buyer absorbing sells
- Bid never drops
- Repeated refreshes

**Sell Wall Detection**
- Exit 15 cents before large ask
- Adaptive based on momentum strength

**L2 Bullish Structure**
- Bids stepping up
- Asks getting lifted
- Spread tightening

## Exit Conditions

Hard exits:
- MACD cross down
- Loss limit hit (-2%)
- Sell wall detected
- Failed HOD break
- VWAP loss
- ATR trailing stop hit

## Performance Tracking

Bot tracks:
- Trades per day
- Win rate
- Total P&L
- Best/worst trades

## Safety Features

- Paper trading by default
- Emergency close all positions
- Max position size limits
- Price range filters
- Only trade priority windows

## Notes

This is an **event-driven momentum engine**, not a simple indicator bot. The edge comes from:

- Multi-signal confluence scoring
- Real-time tape/L2 analysis
- Dynamic re-entries
- Adaptive exits
- Fast pattern recognition

Only trades elite setups (9+ score) to avoid mediocre chop.
