"""Primary entry signal detection"""
from typing import Optional, List
import pandas as pd
import numpy as np
from datetime import datetime
from config.settings import *
from src.scanner.models import Signal, SignalType, MarketData, NewsEvent

class PrimarySignalDetector:
    """Detects primary entry signals for momentum trading"""

    @staticmethod
    def detect_momentum_spike(market_data: MarketData) -> Optional[Signal]:
        """
        MOMENTUM SPIKE TRIGGER (CORE)
        Detect explosive price movement with acceleration

        Trigger: +10% minimum gain with increasing volume and expanding candles
        """
        if market_data.price_change_pct < MIN_MOMENTUM_GAIN_PCT:
            return None

        if not market_data.relative_volume or market_data.relative_volume < MIN_RVOL:
            return None

        if not market_data.avg_volume or market_data.volume <= market_data.avg_volume:
            return None

        # Calculate strength based on gain magnitude
        strength = min(10.0, (market_data.price_change_pct / 10.0) * 8)

        # Bonus for acceleration (price moving faster)
        if market_data.price_change_pct > 20:
            strength = min(10.0, strength + 1.5)

        return Signal(
            signal_type=SignalType.MOMENTUM_SPIKE,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS.get('rvol_5x', 20),  # High weight
            metadata={
                'gain_pct': market_data.price_change_pct,
                'rvol': market_data.relative_volume,
                'volume': market_data.volume
            }
        )

    @staticmethod
    def detect_rvol_surge(market_data: MarketData) -> Optional[Signal]:
        """
        RELATIVE VOLUME SURGE (MANDATORY)
        Core requirement - heavily weighted

        5x minimum, higher priority for 8x, 10x, 20x+
        """
        if not market_data.relative_volume:
            return None

        rvol = market_data.relative_volume

        if rvol < MIN_RVOL:
            return None

        # Progressive strength based on RVOL magnitude
        if rvol >= 20:
            strength = 10.0
        elif rvol >= 10:
            strength = 9.0
        elif rvol >= 8:
            strength = 8.0
        elif rvol >= 5:
            strength = 7.0
        else:
            strength = 5.0

        return Signal(
            signal_type=SignalType.RVOL_SURGE,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS['rvol_5x'],
            metadata={'rvol': rvol}
        )

    @staticmethod
    def detect_low_float(float_shares: Optional[int]) -> Optional[Signal]:
        """
        FLOAT DETECTION
        Prioritize low-float runners - they move violently

        Preferred: <= 10M shares
        Higher scoring: under 5M, 2M, 1M
        """
        if not float_shares:
            return None

        if float_shares > PREFERRED_MAX_FLOAT:
            return None

        # Progressive scoring
        if float_shares <= ULTRA_LOW_FLOAT:
            strength = 10.0
        elif float_shares <= 2_000_000:
            strength = 9.0
        elif float_shares <= HIGH_PRIORITY_FLOAT:
            strength = 8.0
        elif float_shares <= PREFERRED_MAX_FLOAT:
            strength = 7.0
        else:
            strength = 5.0

        return Signal(
            signal_type=SignalType.LOW_FLOAT,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS['low_float'],
            metadata={'float': float_shares}
        )

    @staticmethod
    def detect_news_catalyst(news_events: List[NewsEvent]) -> Optional[Signal]:
        """
        NEWS/CATALYST DETECTION (BONUS)
        News is NOT required, but massively boosts score if present

        Scan headline sentiment and classify bullish/neutral/bearish
        """
        if not news_events:
            return None

        # Analyze recent news (last hour)
        recent_news = [n for n in news_events if
                      (datetime.now() - n.timestamp).total_seconds() < 3600]

        if not recent_news:
            return None

        # Calculate aggregate sentiment
        bullish_count = sum(1 for n in recent_news if n.sentiment == 'bullish')
        bearish_count = sum(1 for n in recent_news if n.sentiment == 'bearish')

        if bullish_count == 0:
            return None

        # Strength based on sentiment ratio and catalyst strength
        avg_strength = np.mean([n.strength for n in recent_news if n.sentiment == 'bullish'])
        sentiment_ratio = bullish_count / max(1, bullish_count + bearish_count)

        strength = min(10.0, avg_strength * sentiment_ratio)

        # Bonus for multiple bullish catalysts
        if bullish_count >= 3:
            strength = min(10.0, strength + 1.5)

        return Signal(
            signal_type=SignalType.NEWS_CATALYST,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS['news_catalyst'],
            metadata={
                'bullish_count': bullish_count,
                'bearish_count': bearish_count,
                'headlines': [n.headline for n in recent_news[:3]]
            }
        )

    @staticmethod
    def classify_news_sentiment(headline: str) -> tuple[str, float]:
        """
        Classify news headline as bullish/neutral/bearish
        Returns (sentiment, strength)
        """
        headline_lower = headline.lower()

        # Check for bullish catalysts
        bullish_matches = sum(1 for keyword in BULLISH_CATALYSTS
                            if keyword.lower() in headline_lower)

        # Check for bearish catalysts
        bearish_matches = sum(1 for keyword in BEARISH_CATALYSTS
                            if keyword.lower() in headline_lower)

        if bullish_matches > bearish_matches:
            strength = min(10.0, bullish_matches * 3.5)
            return ('bullish', strength)
        elif bearish_matches > bullish_matches:
            strength = min(10.0, bearish_matches * 3.5)
            return ('bearish', strength)
        else:
            return ('neutral', 5.0)
