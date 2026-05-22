"""Technical indicator confirmation signals"""
from typing import Optional
import pandas as pd
import ta
from datetime import datetime
from config.settings import *
from src.scanner.models import Signal, SignalType, TechnicalIndicators, MarketData

class TechnicalDetector:
    """Detects technical indicator confirmations"""

    @staticmethod
    def calculate_indicators(price_history: pd.DataFrame) -> TechnicalIndicators:
        """
        Calculate all technical indicators

        Returns TechnicalIndicators object with RSI, MACD, ATR, etc.
        """
        if len(price_history) < 50:
            return TechnicalIndicators()

        df = price_history.copy()

        # RSI
        rsi_indicator = ta.momentum.RSIIndicator(close=df['close'], window=RSI_PERIOD)
        rsi = rsi_indicator.rsi().iloc[-1]

        # MACD
        macd_indicator = ta.trend.MACD(
            close=df['close'],
            window_slow=MACD_SLOW,
            window_fast=MACD_FAST,
            window_sign=MACD_SIGNAL
        )
        macd = macd_indicator.macd().iloc[-1]
        macd_signal = macd_indicator.macd_signal().iloc[-1]
        macd_hist = macd_indicator.macd_diff().iloc[-1]

        # ATR
        atr_indicator = ta.volatility.AverageTrueRange(
            high=df['high'],
            low=df['low'],
            close=df['close'],
            window=ATR_PERIOD
        )
        atr = atr_indicator.average_true_range().iloc[-1]
        avg_atr = atr_indicator.average_true_range().rolling(window=14).mean().iloc[-1]

        # EMAs
        ema_20 = ta.trend.EMAIndicator(close=df['close'], window=20).ema_indicator().iloc[-1]
        ema_50 = ta.trend.EMAIndicator(close=df['close'], window=50).ema_indicator().iloc[-1]

        return TechnicalIndicators(
            rsi=rsi,
            macd=macd,
            macd_signal=macd_signal,
            macd_hist=macd_hist,
            atr=atr,
            avg_atr=avg_atr,
            ema_20=ema_20,
            ema_50=ema_50
        )

    @staticmethod
    def detect_macd_cross_up(indicators: TechnicalIndicators,
                            previous_indicators: Optional[TechnicalIndicators]) -> Optional[Signal]:
        """
        MACD MOMENTUM CONFIRMATION
        Entry bonus when MACD crosses up
        Exit when MACD crosses down
        """
        if not indicators.macd or not indicators.macd_signal:
            return None

        # Current MACD above signal
        if indicators.macd <= indicators.macd_signal:
            return None

        # Check if this is a fresh cross
        if previous_indicators and previous_indicators.macd and previous_indicators.macd_signal:
            was_below = previous_indicators.macd <= previous_indicators.macd_signal
            if not was_below:  # Not a fresh cross
                return None

        # Strength based on histogram magnitude
        if indicators.macd_hist:
            strength = min(10.0, 6.0 + abs(indicators.macd_hist) * 10)
        else:
            strength = 7.0

        return Signal(
            signal_type=SignalType.MACD_CROSS_UP,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS['macd_bullish'],
            metadata={
                'macd': indicators.macd,
                'signal': indicators.macd_signal,
                'histogram': indicators.macd_hist
            }
        )

    @staticmethod
    def detect_macd_cross_down(indicators: TechnicalIndicators,
                              previous_indicators: Optional[TechnicalIndicators]) -> bool:
        """
        MACD EXIT SIGNAL
        Returns True if MACD crossed down (exit condition)
        """
        if not indicators.macd or not indicators.macd_signal:
            return False

        # Current MACD below signal
        if indicators.macd >= indicators.macd_signal:
            return False

        # Check if this is a fresh cross
        if previous_indicators and previous_indicators.macd and previous_indicators.macd_signal:
            was_above = previous_indicators.macd >= previous_indicators.macd_signal
            return was_above

        return False

    @staticmethod
    def detect_rsi_strength(indicators: TechnicalIndicators) -> Optional[Signal]:
        """
        RSI STRENGTH
        Prefer RSI > 60
        Strong continuation: RSI > 70
        Avoid weak RSI during breakout
        """
        if not indicators.rsi:
            return None

        rsi = indicators.rsi

        # Must be above minimum threshold
        if rsi < RSI_STRONG_THRESHOLD:
            return None

        # Progressive strength
        if rsi >= RSI_MOMENTUM_THRESHOLD:  # > 70
            strength = 9.0
        elif rsi >= 65:
            strength = 8.0
        elif rsi >= RSI_STRONG_THRESHOLD:  # > 60
            strength = 7.0
        else:
            strength = 5.0

        return Signal(
            signal_type=SignalType.RSI_STRONG,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS['rsi_strong'],
            metadata={'rsi': rsi}
        )

    @staticmethod
    def detect_atr_expansion(indicators: TechnicalIndicators) -> Optional[Signal]:
        """
        ATR EXPANSION
        Detect volatility expansion - strong momentum stocks

        Use ATR for:
        - Trailing stops
        - Volatility sizing
        """
        if not indicators.atr or not indicators.avg_atr:
            return None

        # ATR must be expanding
        if indicators.atr <= indicators.avg_atr:
            return None

        expansion_ratio = indicators.atr / indicators.avg_atr

        # Strength based on expansion magnitude
        if expansion_ratio >= 2.0:
            strength = 9.0
        elif expansion_ratio >= 1.5:
            strength = 8.0
        else:
            strength = 7.0

        return Signal(
            signal_type=SignalType.ATR_EXPANSION,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS.get('atr_expansion', 5),
            metadata={
                'atr': indicators.atr,
                'avg_atr': indicators.avg_atr,
                'expansion_ratio': expansion_ratio
            }
        )

    @staticmethod
    def calculate_trailing_stop(entry_price: float, current_high: float,
                               atr: float) -> float:
        """
        Calculate ATR-based trailing stop

        Stop = highest_price - (ATR * multiplier)
        """
        return current_high - (atr * TRAILING_STOP_ATR_MULTIPLIER)

    @staticmethod
    def calculate_position_size(signal_score: float, account_size: float,
                               risk_per_trade: float, atr: float) -> int:
        """
        Calculate position size based on signal strength and volatility

        Higher score = larger size
        Scaled by ATR for volatility adjustment
        """
        base_size = POSITION_SIZE_BY_SCORE.get(int(signal_score), 500)

        # Adjust for volatility (higher ATR = smaller size)
        volatility_factor = 1.0 / (1.0 + atr)

        # Adjust for account size
        account_factor = min(account_size / 25000, 2.0)  # Max 2x for larger accounts

        adjusted_size = int(base_size * volatility_factor * account_factor)

        return min(adjusted_size, MAX_POSITION_SIZE)
