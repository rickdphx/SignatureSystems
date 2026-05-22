"""
MOMENTUM SCANNER ENGINE
Event-driven momentum scanner with confluence scoring system
"""
import asyncio
from typing import List, Optional, Dict
from datetime import datetime, time
import pandas as pd
from config.settings import *
from src.scanner.models import (
    ScanResult, MarketData, Signal, SignalType,
    TechnicalIndicators, NewsEvent
)
from src.signals.primary_signals import PrimarySignalDetector
from src.signals.price_action_signals import PriceActionDetector
from src.signals.level2_signals import Level2Detector
from src.signals.technical_signals import TechnicalDetector

class MomentumScanner:
    """
    Real-time momentum scanner with weighted confluence system

    Scans continuously: premarket → afterhours
    Every 5 seconds
    Combines multiple signal types for high-confidence setups
    """

    def __init__(self):
        self.primary_detector = PrimarySignalDetector()
        self.price_action_detector = PriceActionDetector()
        self.level2_detector = Level2Detector()
        self.technical_detector = TechnicalDetector()

        # Tracking
        self.active_scans: Dict[str, ScanResult] = {}
        self.watchlist: List[str] = []
        self.previous_indicators: Dict[str, TechnicalIndicators] = {}
        self.previous_hod: Dict[str, float] = {}

    async def scan_symbol(self, symbol: str, market_data: MarketData,
                         price_history: pd.DataFrame,
                         float_shares: Optional[int] = None,
                         news_events: List[NewsEvent] = None,
                         order_book_history: List[Dict] = None,
                         recent_prints: List[Dict] = None) -> ScanResult:
        """
        Complete scan of a symbol with all signal detection

        Returns ScanResult with weighted confluence score
        """
        signals: List[Signal] = []

        # Calculate technical indicators
        indicators = self.technical_detector.calculate_indicators(price_history)
        previous_ind = self.previous_indicators.get(symbol)

        # ========== PRIMARY ENTRY SIGNALS ==========
        # These are the core triggers

        # 1. Momentum Spike (CORE)
        momentum_signal = self.primary_detector.detect_momentum_spike(market_data)
        if momentum_signal:
            signals.append(momentum_signal)

        # 2. RVOL Surge (MANDATORY)
        rvol_signal = self.primary_detector.detect_rvol_surge(market_data)
        if rvol_signal:
            signals.append(rvol_signal)

        # 3. Low Float (HIGH PRIORITY)
        if float_shares:
            float_signal = self.primary_detector.detect_low_float(float_shares)
            if float_signal:
                signals.append(float_signal)

        # 4. News/Catalyst (BONUS)
        if news_events:
            news_signal = self.primary_detector.detect_news_catalyst(news_events)
            if news_signal:
                signals.append(news_signal)

        # ========== PRICE ACTION SIGNALS ==========

        # 5. HOD Break
        prev_hod = self.previous_hod.get(symbol, market_data.hod or 0)
        volume_spike = market_data.relative_volume and market_data.relative_volume > 5
        hod_signal = self.price_action_detector.detect_hod_break(
            market_data, prev_hod, volume_spike
        )
        if hod_signal:
            signals.append(hod_signal)

        # 6. VWAP Reclaim
        vwap_signal = self.price_action_detector.detect_vwap_reclaim(
            market_data, price_history
        )
        if vwap_signal:
            signals.append(vwap_signal)

        # 7. Bull Flag Breakout
        bull_flag_signal = self.price_action_detector.detect_bull_flag(price_history)
        if bull_flag_signal:
            signals.append(bull_flag_signal)

        # 8. Micro Pullback Reversal
        micro_pb_signal = self.price_action_detector.detect_micro_pullback(price_history)
        if micro_pb_signal:
            signals.append(micro_pb_signal)

        # ========== LEVEL 2 / TAPE SIGNALS ==========
        # This is where the real edge is

        if recent_prints:
            # 9. Tape Acceleration
            tape_signal = self.level2_detector.detect_tape_acceleration(symbol, recent_prints)
            if tape_signal:
                signals.append(tape_signal)

        if order_book_history:
            # 10. Hidden Buyer Detection
            hidden_buyer_signal = self.level2_detector.detect_hidden_buyer(
                symbol, market_data, order_book_history
            )
            if hidden_buyer_signal:
                signals.append(hidden_buyer_signal)

            # 11. L2 Bullish Structure
            l2_bullish_signal = self.level2_detector.detect_l2_bullish_structure(
                market_data, order_book_history
            )
            if l2_bullish_signal:
                signals.append(l2_bullish_signal)

        # ========== TECHNICAL CONFIRMATIONS ==========

        # 12. MACD Cross Up
        macd_signal = self.technical_detector.detect_macd_cross_up(indicators, previous_ind)
        if macd_signal:
            signals.append(macd_signal)

        # 13. RSI Strength
        rsi_signal = self.technical_detector.detect_rsi_strength(indicators)
        if rsi_signal:
            signals.append(rsi_signal)

        # 14. ATR Expansion
        atr_signal = self.technical_detector.detect_atr_expansion(indicators)
        if atr_signal:
            signals.append(atr_signal)

        # ========== CREATE SCAN RESULT ==========

        scan_result = ScanResult(
            symbol=symbol,
            timestamp=datetime.now(),
            market_data=market_data,
            indicators=indicators,
            signals=signals,
            news=news_events or [],
            float_shares=float_shares
        )

        # Calculate weighted confluence score
        scan_result.calculate_score()

        # Update tracking
        self.previous_indicators[symbol] = indicators
        if market_data.hod:
            self.previous_hod[symbol] = market_data.hod

        self.active_scans[symbol] = scan_result

        return scan_result

    def filter_tradeable_setups(self, scan_results: List[ScanResult]) -> List[ScanResult]:
        """
        Filter for high-confidence setups only

        signal_strength >= MIN_SIGNAL_SCORE (default 9)
        Only trade elite setups, avoid mediocre chop
        """
        return [
            result for result in scan_results
            if result.is_tradeable(MIN_SIGNAL_SCORE)
        ]

    def rank_setups(self, scan_results: List[ScanResult]) -> List[ScanResult]:
        """
        Rank setups by confluence score (highest first)
        """
        return sorted(scan_results, key=lambda x: x.weighted_score, reverse=True)

    def is_priority_trading_window(self) -> bool:
        """
        Check if current time is in priority trading windows

        Priority windows (EST):
        - 7:00 AM – 11:00 AM (premarket + open)
        - 3:00 PM – 6:00 PM (close + afterhours)
        """
        now = datetime.now().time()
        current_hour = now.hour

        for start_hour, end_hour in PRIORITY_WINDOWS:
            if start_hour <= current_hour < end_hour:
                return True

        return False

    def check_exit_conditions(self, position, market_data: MarketData,
                             indicators: TechnicalIndicators,
                             previous_indicators: Optional[TechnicalIndicators]) -> Optional[str]:
        """
        Check all exit conditions for an active position

        Hard exits:
        - MACD cross down
        - Loss limit hit
        - Sell wall detected
        - Failed HOD break
        - VWAP loss
        - ATR trailing stop hit
        """
        # Check position's built-in exit logic
        position_exit = position.should_exit(market_data)
        if position_exit:
            return position_exit.value

        # MACD cross down
        if self.technical_detector.detect_macd_cross_down(indicators, previous_indicators):
            return 'macd_cross_down'

        # Sell wall detection
        sell_wall = self.level2_detector.detect_sell_wall(market_data)
        if sell_wall and market_data.price >= sell_wall['exit_price']:
            return 'sell_wall_detected'

        # VWAP loss (if entered on VWAP reclaim)
        if SignalType.VWAP_RECLAIM in position.entry_signals:
            if market_data.vwap and market_data.price < market_data.vwap * 0.995:
                return 'vwap_loss'

        # Failed HOD (if entered on HOD break)
        if SignalType.HOD_BREAK in position.entry_signals:
            if market_data.hod and market_data.price < market_data.hod * 0.98:
                return 'failed_hod_break'

        return None

    def get_scan_summary(self, scan_result: ScanResult) -> str:
        """
        Generate human-readable scan summary
        """
        summary_lines = [
            f"\n{'='*60}",
            f"SCAN: {scan_result.symbol}",
            f"Score: {scan_result.weighted_score:.1f}/10 ({scan_result.signal_count} signals)",
            f"Price: ${scan_result.market_data.price:.2f} ({scan_result.market_data.price_change_pct:+.1f}%)",
            f"RVOL: {scan_result.market_data.relative_volume:.1f}x" if scan_result.market_data.relative_volume else "",
            f"Float: {scan_result.float_shares:,}" if scan_result.float_shares else "",
            f"\nActive Signals:"
        ]

        for signal in scan_result.signals:
            if signal.active:
                summary_lines.append(
                    f"  [{signal.signal_type.value}] "
                    f"Strength: {signal.strength:.1f} | Weight: {signal.weight}"
                )

        if scan_result.news:
            summary_lines.append(f"\nNews ({len(scan_result.news)} events):")
            for news in scan_result.news[:3]:
                summary_lines.append(f"  {news.headline[:80]}")

        summary_lines.append(f"{'='*60}\n")

        return "\n".join(summary_lines)

    async def continuous_scan_loop(self, symbols: List[str]):
        """
        Main continuous scanning loop

        Scans every SCAN_INTERVAL seconds
        Runs during all market hours (premarket → afterhours)
        """
        print(f"Starting continuous momentum scanner...")
        print(f"Watchlist: {len(symbols)} symbols")
        print(f"Scan interval: {SCAN_INTERVAL} seconds")
        print(f"Min signal score: {MIN_SIGNAL_SCORE}")

        while True:
            try:
                scan_start = datetime.now()

                # Check if in priority window
                is_priority = self.is_priority_trading_window()
                window_status = "PRIORITY" if is_priority else "off-hours"

                print(f"\n[{scan_start.strftime('%H:%M:%S')}] Scanning {len(symbols)} symbols ({window_status})...")

                # Scan all symbols (would integrate real data feeds here)
                # This is where you'd call Alpaca/Polygon APIs

                # For now, placeholder for scan results
                tradeable_setups = []

                if tradeable_setups:
                    print(f"Found {len(tradeable_setups)} high-confidence setups:")
                    for setup in tradeable_setups:
                        print(self.get_scan_summary(setup))

                # Wait for next scan
                elapsed = (datetime.now() - scan_start).total_seconds()
                wait_time = max(0, SCAN_INTERVAL - elapsed)
                await asyncio.sleep(wait_time)

            except Exception as e:
                print(f"Error in scan loop: {e}")
                await asyncio.sleep(SCAN_INTERVAL)
