"""Configuration settings for momentum trading bot"""
import os
from dotenv import load_dotenv
from typing import List, Tuple

load_dotenv()

# Broker Selection
BROKER = os.getenv('BROKER', 'schwab').lower()  # 'alpaca' or 'schwab'

# Alpaca API
ALPACA_API_KEY = os.getenv('ALPACA_API_KEY')
ALPACA_SECRET_KEY = os.getenv('ALPACA_SECRET_KEY')
ALPACA_BASE_URL = os.getenv('ALPACA_BASE_URL', 'https://paper-api.alpaca.markets')

# Schwab API
SCHWAB_APP_KEY = os.getenv('SCHWAB_APP_KEY')
SCHWAB_APP_SECRET = os.getenv('SCHWAB_APP_SECRET')
SCHWAB_CALLBACK_URL = os.getenv('SCHWAB_CALLBACK_URL', 'https://localhost:8000/callback')
SCHWAB_ACCOUNT_HASH = os.getenv('SCHWAB_ACCOUNT_HASH')
SCHWAB_REFRESH_TOKEN = os.getenv('SCHWAB_REFRESH_TOKEN')  # Save after first auth

# Polygon
POLYGON_API_KEY = os.getenv('POLYGON_API_KEY')

# Benzinga
BENZINGA_API_KEY = os.getenv('BENZINGA_API_KEY')

# Database
POSTGRES_URL = os.getenv('POSTGRES_URL')
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')

# Scanner Config
SCAN_INTERVAL = int(os.getenv('SCAN_INTERVAL', 5))  # seconds
MIN_PRICE = float(os.getenv('MIN_PRICE', 1.0))
MAX_PRICE = float(os.getenv('MAX_PRICE', 20.0))
PRICE_EXPANSION_MAX = 40.0  # optional expansion

# Signal Thresholds
MIN_MOMENTUM_GAIN_PCT = 10.0  # minimum intraday gain
MIN_RVOL = float(os.getenv('MIN_RVOL', 5.0))  # relative volume
PREFERRED_MAX_FLOAT = 10_000_000
HIGH_PRIORITY_FLOAT = 5_000_000
ULTRA_LOW_FLOAT = 1_000_000

# Scoring Thresholds
MIN_SIGNAL_SCORE = int(os.getenv('MIN_SIGNAL_SCORE', 9))  # only trade 9+ setups
MAX_SIGNAL_SCORE = 10

# Signal Weights (must sum to 100)
SIGNAL_WEIGHTS = {
    'rvol_5x': 20,
    'low_float': 20,
    'news_catalyst': 15,
    'hod_break': 15,
    'tape_acceleration': 10,
    'vwap_reclaim': 10,
    'macd_bullish': 5,
    'rsi_strong': 5,
}

# Priority Trading Windows (EST)
PRIORITY_WINDOWS: List[Tuple[int, int]] = [
    (7, 11),   # 7:00 AM - 11:00 AM (premarket + open)
    (15, 18),  # 3:00 PM - 6:00 PM (close + afterhours)
]

# Position Sizing
MAX_POSITION_SIZE = int(os.getenv('MAX_POSITION_SIZE', 10000))
POSITION_SIZE_BY_SCORE = {
    9: 500,
    10: 2000,
}

# Risk Management
MAX_LOSS_PERCENT = float(os.getenv('MAX_LOSS_PERCENT', 2.0))
TRAILING_STOP_ATR_MULTIPLIER = float(os.getenv('TRAILING_STOP_ATR_MULTIPLIER', 2.0))
SELL_WALL_DISTANCE = 0.15  # sell 15 cents before detected wall

# Technical Indicators
RSI_PERIOD = 14
RSI_STRONG_THRESHOLD = 60
RSI_MOMENTUM_THRESHOLD = 70
MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9
ATR_PERIOD = 14

# Level 2 Detection
SELL_WALL_MIN_SIZE = 1000  # shares
TAPE_ACCELERATION_THRESHOLD = 1.5  # prints per second increase
HIDDEN_BID_REFRESH_COUNT = 3  # times bid refreshes without dropping

# News/Catalyst Keywords
BULLISH_CATALYSTS = [
    'FDA', 'approval', 'AI', 'acquisition', 'contract', 'earnings beat',
    'partnership', 'crypto', 'blockchain', 'defense', 'biotech',
    'breakthrough', 'patent', 'deal', 'upgrade', 'buyout'
]

BEARISH_CATALYSTS = [
    'lawsuit', 'investigation', 'recall', 'downgrade', 'bankruptcy',
    'fraud', 'miss', 'delay', 'failure', 'rejection'
]
