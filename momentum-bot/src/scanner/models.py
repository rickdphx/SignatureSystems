"""Data models for scanner signals and trades"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, List
from enum import Enum

class SignalType(Enum):
    """Types of trading signals"""
    MOMENTUM_SPIKE = "momentum_spike"
    RVOL_SURGE = "rvol_surge"
    LOW_FLOAT = "low_float"
    NEWS_CATALYST = "news_catalyst"
    HOD_BREAK = "hod_break"
    VWAP_RECLAIM = "vwap_reclaim"
    BULL_FLAG = "bull_flag"
    MICRO_PULLBACK = "micro_pullback"
    GAP_FILL_REVERSAL = "gap_fill_reversal"
    TAPE_ACCELERATION = "tape_acceleration"
    HIDDEN_BUYER = "hidden_buyer"
    L2_BULLISH = "l2_bullish"
    MACD_CROSS_UP = "macd_cross_up"
    RSI_STRONG = "rsi_strong"
    ATR_EXPANSION = "atr_expansion"
    HOD_RECLAIM = "hod_reclaim"
    VOLUME_REACCEL = "volume_reaccel"

class ExitReason(Enum):
    """Reasons for exiting a position"""
    PROFIT_TARGET = "profit_target"
    TRAILING_STOP = "trailing_stop"
    MACD_CROSS_DOWN = "macd_cross_down"
    LOSS_LIMIT = "loss_limit"
    SELL_WALL = "sell_wall"
    FAILED_HOD = "failed_hod"
    VWAP_LOSS = "vwap_loss"
    ATR_STOP = "atr_stop"
    TIME_STOP = "time_stop"

@dataclass
class MarketData:
    """Real-time market data snapshot"""
    symbol: str
    timestamp: datetime
    price: float
    volume: int
    open: float
    high: float
    low: float
    close: float
    vwap: Optional[float] = None
    avg_volume: Optional[int] = None
    relative_volume: Optional[float] = None

    # Level 2 data
    bid: Optional[float] = None
    ask: Optional[float] = None
    bid_size: Optional[int] = None
    ask_size: Optional[int] = None

    # Derived metrics
    price_change_pct: float = 0.0
    hod: Optional[float] = None
    lod: Optional[float] = None

@dataclass
class TechnicalIndicators:
    """Technical indicator values"""
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None
    atr: Optional[float] = None
    avg_atr: Optional[float] = None
    ema_20: Optional[float] = None
    ema_50: Optional[float] = None

@dataclass
class NewsEvent:
    """News/catalyst event"""
    headline: str
    timestamp: datetime
    sentiment: str  # bullish, neutral, bearish
    strength: float  # 0-10
    source: str

@dataclass
class Signal:
    """Individual trading signal"""
    signal_type: SignalType
    timestamp: datetime
    strength: float  # 0-10
    weight: int  # from config
    active: bool = True
    metadata: Dict = field(default_factory=dict)

@dataclass
class ScanResult:
    """Complete scan result for a symbol"""
    symbol: str
    timestamp: datetime
    market_data: MarketData
    indicators: TechnicalIndicators
    signals: List[Signal]
    news: List[NewsEvent]

    # Scoring
    total_score: float = 0.0
    weighted_score: float = 0.0
    signal_count: int = 0

    # Metadata
    float_shares: Optional[int] = None
    sector: Optional[str] = None

    def calculate_score(self) -> float:
        """Calculate weighted confluence score"""
        if not self.signals:
            return 0.0

        total_weighted = sum(s.strength * s.weight for s in self.signals if s.active)
        max_possible = sum(s.weight for s in self.signals if s.active)

        if max_possible == 0:
            return 0.0

        # Normalize to 0-10 scale
        self.weighted_score = (total_weighted / max_possible) * 10
        self.signal_count = len([s for s in self.signals if s.active])

        return self.weighted_score

    def is_tradeable(self, min_score: float = 9.0) -> bool:
        """Check if setup meets minimum score threshold"""
        score = self.calculate_score()
        return score >= min_score

@dataclass
class Position:
    """Active trading position"""
    symbol: str
    entry_price: float
    entry_time: datetime
    shares: int
    side: str  # long/short

    # Risk management
    stop_loss: float
    profit_target: float
    trailing_stop: Optional[float] = None

    # Performance tracking
    current_price: float = 0.0
    highest_price: float = 0.0
    unrealized_pnl: float = 0.0

    # Entry signals
    entry_signals: List[SignalType] = field(default_factory=list)
    entry_score: float = 0.0

    def update_price(self, price: float, atr: float = None):
        """Update position with current price"""
        self.current_price = price

        # Update highest price for trailing stop
        if price > self.highest_price:
            self.highest_price = price

        # Calculate unrealized P&L
        if self.side == 'long':
            self.unrealized_pnl = (price - self.entry_price) * self.shares

            # Update trailing stop if using ATR
            if atr and self.highest_price > self.entry_price:
                self.trailing_stop = self.highest_price - (atr * 2)

    def should_exit(self, market_data: MarketData, reason: str = None) -> Optional[ExitReason]:
        """Check if position should be exited"""
        if not self.current_price:
            return None

        # Check hard stops
        if self.side == 'long':
            if self.current_price <= self.stop_loss:
                return ExitReason.LOSS_LIMIT

            if self.trailing_stop and self.current_price <= self.trailing_stop:
                return ExitReason.TRAILING_STOP

            if self.current_price >= self.profit_target:
                return ExitReason.PROFIT_TARGET

        return None
