"""Price action pattern signal detection"""
from typing import Optional
import pandas as pd
import numpy as np
from datetime import datetime
from config.settings import *
from src.scanner.models import Signal, SignalType, MarketData

class PriceActionDetector:
    """Detects price action entry patterns"""

    @staticmethod
    def detect_hod_break(market_data: MarketData, previous_hod: float,
                        volume_spike: bool) -> Optional[Signal]:
        """
        HIGH OF DAY BREAK (HOD)
        One of the biggest triggers

        Entry: stock breaks HOD with surge volume and tape acceleration
        """
        if not market_data.hod or not previous_hod:
            return None

        # Must break previous HOD
        if market_data.price <= previous_hod:
            return None

        # Require volume spike
        if not volume_spike:
            return None

        # Calculate breakout strength
        breakout_pct = ((market_data.price - previous_hod) / previous_hod) * 100
        strength = min(10.0, 7.0 + (breakout_pct * 2))

        # Bonus for strong volume
        if market_data.relative_volume and market_data.relative_volume > 10:
            strength = min(10.0, strength + 1.5)

        return Signal(
            signal_type=SignalType.HOD_BREAK,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS['hod_break'],
            metadata={
                'previous_hod': previous_hod,
                'current_price': market_data.price,
                'breakout_pct': breakout_pct
            }
        )

    @staticmethod
    def detect_vwap_reclaim(market_data: MarketData, price_history: pd.DataFrame) -> Optional[Signal]:
        """
        VWAP TAP & GO
        Detect pullback into VWAP, hold, reclaim, continuation

        Entry: price reclaims VWAP with buyers stepping in
        """
        if not market_data.vwap:
            return None

        current_price = market_data.price

        # Must be reclaiming VWAP (price crossing above)
        if current_price < market_data.vwap:
            return None

        # Check if recently tapped VWAP (within last 5 candles)
        if len(price_history) < 5:
            return None

        recent_prices = price_history['close'].tail(5).values
        recent_lows = price_history['low'].tail(5).values

        # Check if touched VWAP recently
        vwap_touched = any(low <= market_data.vwap <= high
                          for low, high in zip(recent_lows, recent_prices))

        if not vwap_touched:
            return None

        # Check for buyer support (volume increase on reclaim)
        recent_volume = price_history['volume'].tail(5).values
        volume_increasing = recent_volume[-1] > np.mean(recent_volume[:-1])

        if not volume_increasing:
            return None

        # Calculate strength based on reclaim confidence
        distance_from_vwap_pct = ((current_price - market_data.vwap) / market_data.vwap) * 100

        if distance_from_vwap_pct > 2.0:  # Strong reclaim
            strength = 9.0
        elif distance_from_vwap_pct > 0.5:
            strength = 8.0
        else:
            strength = 7.0

        return Signal(
            signal_type=SignalType.VWAP_RECLAIM,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS['vwap_reclaim'],
            metadata={
                'vwap': market_data.vwap,
                'distance_pct': distance_from_vwap_pct
            }
        )

    @staticmethod
    def detect_bull_flag(price_history: pd.DataFrame) -> Optional[Signal]:
        """
        BULL FLAG BREAKOUT
        Identify: impulsive move → tight consolidation → breakout

        Pattern:
        1. Initial strong move up
        2. Tight consolidation (decreasing volume)
        3. Breakout candle
        """
        if len(price_history) < 20:
            return None

        prices = price_history['close'].values
        volumes = price_history['volume'].values
        highs = price_history['high'].values
        lows = price_history['low'].values

        # Check for initial impulse move (first 10 candles)
        impulse_gain = ((prices[9] - prices[0]) / prices[0]) * 100
        if impulse_gain < 5:  # Require at least 5% impulse
            return None

        # Check for consolidation (next 8 candles)
        consolidation_prices = prices[10:18]
        consolidation_range = (max(consolidation_prices) - min(consolidation_prices)) / min(consolidation_prices)

        if consolidation_range > 0.03:  # Too wide, not tight flag
            return None

        # Check volume decreasing during consolidation
        impulse_volume = np.mean(volumes[0:10])
        consolidation_volume = np.mean(volumes[10:18])

        if consolidation_volume > impulse_volume * 0.7:  # Volume should decrease
            return None

        # Check for breakout (last 2 candles)
        current_price = prices[-1]
        consolidation_high = max(consolidation_prices)

        if current_price <= consolidation_high:
            return None

        # Breakout with volume
        if volumes[-1] < impulse_volume * 0.8:
            return None

        breakout_pct = ((current_price - consolidation_high) / consolidation_high) * 100
        strength = min(10.0, 7.0 + breakout_pct * 1.5)

        return Signal(
            signal_type=SignalType.BULL_FLAG,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS.get('bull_flag', 10),
            metadata={
                'impulse_gain': impulse_gain,
                'consolidation_range': consolidation_range,
                'breakout_pct': breakout_pct
            }
        )

    @staticmethod
    def detect_micro_pullback(price_history: pd.DataFrame, timeframe: str = '10s') -> Optional[Signal]:
        """
        MICRO PULLBACK REVERSAL (10-second chart)
        Advanced edge - detect rapid squeeze and controlled pullback

        Pattern:
        - Rapid squeeze
        - Tiny controlled pullback
        - Higher low
        - Volume returns
        """
        if len(price_history) < 10:
            return None

        prices = price_history['close'].values
        volumes = price_history['volume'].values
        lows = price_history['low'].values

        # Check for recent uptrend
        if prices[-5] <= prices[-10]:
            return None

        # Check for pullback (last 3 candles)
        pullback_start = prices[-4]
        pullback_low = min(prices[-3:])
        current_price = prices[-1]

        # Must have pulled back
        if pullback_low >= pullback_start:
            return None

        # Pullback should be controlled (< 2%)
        pullback_pct = ((pullback_start - pullback_low) / pullback_start) * 100
        if pullback_pct > 2.0:
            return None

        # Check for higher low (compared to previous pullback)
        if len(lows) > 8:
            previous_low = min(lows[-8:-4])
            if pullback_low <= previous_low:
                return None

        # Check for volume returning
        if volumes[-1] <= np.mean(volumes[-3:-1]):
            return None

        # Check for reversal (current price recovering)
        if current_price <= pullback_low:
            return None

        strength = min(10.0, 8.0 + (1.0 if pullback_pct < 1.0 else 0.5))

        return Signal(
            signal_type=SignalType.MICRO_PULLBACK,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS.get('micro_pullback', 8),
            metadata={
                'pullback_pct': pullback_pct,
                'higher_low': True
            }
        )

    @staticmethod
    def detect_gap_fill_reversal(market_data: MarketData, premarket_high: float,
                                 previous_close: float) -> Optional[Signal]:
        """
        GAP FILL REVERSAL
        Detect premarket gapper that flushes toward fill, then reverses hard

        Very powerful on low floats
        """
        if not premarket_high or not previous_close:
            return None

        gap_pct = ((premarket_high - previous_close) / previous_close) * 100

        # Must have gapped up significantly
        if gap_pct < 5:
            return None

        current_price = market_data.price

        # Check if approaching gap fill
        fill_distance_pct = ((current_price - previous_close) / previous_close) * 100

        # Must have flushed close to fill (within 2% of previous close)
        if fill_distance_pct > 2.0:
            return None

        # Check for reversal (price moving back up with volume)
        if not market_data.relative_volume or market_data.relative_volume < 3:
            return None

        # Check if bouncing (current price > low of day)
        if not market_data.lod or current_price <= market_data.lod * 1.01:
            return None

        strength = min(10.0, 7.0 + (gap_pct / 10.0))

        return Signal(
            signal_type=SignalType.GAP_FILL_REVERSAL,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS.get('gap_reversal', 12),
            metadata={
                'gap_pct': gap_pct,
                'fill_distance_pct': fill_distance_pct,
                'premarket_high': premarket_high
            }
        )
