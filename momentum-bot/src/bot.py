"""
MOMENTUM TRADING BOT
Main orchestrator - combines scanner, signals, and execution
"""
import asyncio
from typing import List, Dict
from datetime import datetime
import pandas as pd
from config.settings import *
from src.scanner.momentum_scanner import MomentumScanner
from src.scanner.models import Position, SignalType, ExitReason
from src.signals.technical_signals import TechnicalDetector

# Broker imports
if BROKER == 'alpaca':
    from src.data.alpaca_client import AlpacaDataClient, AlpacaTradingClient
elif BROKER == 'schwab':
    from src.data.schwab_client import SchwabAuthClient, SchwabDataClient, SchwabTradingClient
else:
    raise ValueError(f"Unknown broker: {BROKER}. Use 'alpaca' or 'schwab'")

class MomentumTradingBot:
    """
    Event-driven momentum trading bot

    Continuously scans for explosive momentum setups
    Executes on high-confidence confluence signals (9+)
    Dynamic position sizing based on signal strength
    """

    def __init__(self):
        self.scanner = MomentumScanner()
        self.technical_detector = TechnicalDetector()

        # Initialize broker clients
        if BROKER == 'alpaca':
            self.data_client = AlpacaDataClient()
            self.trading_client = AlpacaTradingClient()
        elif BROKER == 'schwab':
            # Initialize Schwab auth
            self.schwab_auth = SchwabAuthClient(
                app_key=SCHWAB_APP_KEY,
                app_secret=SCHWAB_APP_SECRET,
                callback_url=SCHWAB_CALLBACK_URL
            )
            # Set saved refresh token
            self.schwab_auth.refresh_token = SCHWAB_REFRESH_TOKEN
            # Get fresh access token
            self.schwab_auth.refresh_access_token()

            self.data_client = SchwabDataClient(self.schwab_auth)
            self.trading_client = SchwabTradingClient(self.schwab_auth, SCHWAB_ACCOUNT_HASH)

        # Active positions
        self.positions: Dict[str, Position] = {}

        # Performance tracking
        self.trades_today = 0
        self.winning_trades = 0
        self.losing_trades = 0
        self.total_pnl = 0.0

    async def run(self, watchlist: List[str]):
        """
        Main bot loop

        1. Scan watchlist continuously
        2. Detect high-confidence setups
        3. Execute trades
        4. Manage positions
        """
        print("="*60)
        print("MOMENTUM TRADING BOT STARTED")
        print("="*60)
        print(f"Watchlist: {len(watchlist)} symbols")
        print(f"Min signal score: {MIN_SIGNAL_SCORE}")
        print(f"Scan interval: {SCAN_INTERVAL}s")
        print(f"Priority windows: {PRIORITY_WINDOWS}")
        print("="*60)

        # Get account info
        account = self.trading_client.get_account()
        print(f"\nAccount Status:")
        print(f"Buying Power: ${account['buying_power']:,.2f}")
        print(f"Cash: ${account['cash']:,.2f}")
        print(f"Portfolio Value: ${account['portfolio_value']:,.2f}")
        print("="*60)

        while True:
            try:
                scan_start = datetime.now()

                # Check if in priority window
                in_priority_window = self.scanner.is_priority_trading_window()
                window_status = "🔥 PRIORITY WINDOW" if in_priority_window else "⏸ Off-Hours"

                print(f"\n[{scan_start.strftime('%H:%M:%S')}] {window_status} - Scanning...")

                # Scan all symbols in watchlist
                scan_results = []
                for symbol in watchlist:
                    try:
                        # Get market data
                        market_data = await self.data_client.get_market_snapshot(symbol)

                        # Filter by price range
                        if not (MIN_PRICE <= market_data.price <= MAX_PRICE):
                            continue

                        # Get price history
                        price_history = await self.data_client.get_price_history(symbol)

                        # Get recent trades (for tape reading)
                        recent_trades = await self.data_client.get_recent_trades(symbol)

                        # Perform scan
                        scan_result = await self.scanner.scan_symbol(
                            symbol=symbol,
                            market_data=market_data,
                            price_history=price_history,
                            recent_prints=recent_trades
                        )

                        scan_results.append(scan_result)

                    except Exception as e:
                        print(f"Error scanning {symbol}: {e}")
                        continue

                # Filter for tradeable setups
                tradeable_setups = self.scanner.filter_tradeable_setups(scan_results)

                if tradeable_setups:
                    # Rank by score
                    ranked_setups = self.scanner.rank_setups(tradeable_setups)

                    print(f"\n🎯 Found {len(tradeable_setups)} high-confidence setups:")

                    for setup in ranked_setups:
                        print(self.scanner.get_scan_summary(setup))

                        # Execute trade if not already in position
                        if setup.symbol not in self.positions:
                            await self.enter_position(setup)

                # Manage existing positions
                await self.manage_positions()

                # Performance summary
                if self.trades_today > 0:
                    win_rate = (self.winning_trades / self.trades_today) * 100
                    print(f"\n📊 Today: {self.trades_today} trades | "
                          f"Win Rate: {win_rate:.1f}% | PnL: ${self.total_pnl:+,.2f}")

                # Wait for next scan
                elapsed = (datetime.now() - scan_start).total_seconds()
                wait_time = max(0, SCAN_INTERVAL - elapsed)
                await asyncio.sleep(wait_time)

            except Exception as e:
                print(f"Error in main loop: {e}")
                await asyncio.sleep(SCAN_INTERVAL)

    async def enter_position(self, scan_result):
        """
        Enter a new position based on scan result

        Dynamic position sizing based on signal strength
        """
        symbol = scan_result.symbol
        score = scan_result.weighted_score

        # Get account info
        account = self.trading_client.get_account()
        account_size = float(account['buying_power'])

        # Calculate position size based on score and volatility
        atr = scan_result.indicators.atr or 1.0
        position_size = self.technical_detector.calculate_position_size(
            signal_score=score,
            account_size=account_size,
            risk_per_trade=MAX_LOSS_PERCENT,
            atr=atr
        )

        # Entry price
        entry_price = scan_result.market_data.price

        # Calculate stop loss and profit target
        stop_loss = entry_price * (1 - (MAX_LOSS_PERCENT / 100))
        profit_target = entry_price * (1 + (MAX_LOSS_PERCENT * 2 / 100))  # 2:1 R/R

        print(f"\n🚀 ENTERING POSITION: {symbol}")
        print(f"   Score: {score:.1f}/10")
        print(f"   Entry: ${entry_price:.2f}")
        print(f"   Size: {position_size} shares")
        print(f"   Stop: ${stop_loss:.2f}")
        print(f"   Target: ${profit_target:.2f}")

        # Submit order
        try:
            order_id = self.trading_client.submit_market_order(
                symbol=symbol,
                qty=position_size,
                side='long'
            )

            # Create position tracking
            position = Position(
                symbol=symbol,
                entry_price=entry_price,
                entry_time=datetime.now(),
                shares=position_size,
                side='long',
                stop_loss=stop_loss,
                profit_target=profit_target,
                entry_signals=[s.signal_type for s in scan_result.signals if s.active],
                entry_score=score,
                highest_price=entry_price
            )

            self.positions[symbol] = position
            self.trades_today += 1

            print(f"   ✅ Order submitted: {order_id}")

        except Exception as e:
            print(f"   ❌ Order failed: {e}")

    async def manage_positions(self):
        """
        Manage all active positions

        - Update prices
        - Check exit conditions
        - Update trailing stops
        - Exit when necessary
        """
        if not self.positions:
            return

        for symbol, position in list(self.positions.items()):
            try:
                # Get current market data
                market_data = await self.data_client.get_market_snapshot(symbol)
                price_history = await self.data_client.get_price_history(symbol)

                # Calculate indicators
                indicators = self.technical_detector.calculate_indicators(price_history)
                previous_ind = self.scanner.previous_indicators.get(symbol)

                # Update position
                position.update_price(market_data.price, indicators.atr)

                # Check exit conditions
                exit_reason = self.scanner.check_exit_conditions(
                    position, market_data, indicators, previous_ind
                )

                if exit_reason:
                    await self.exit_position(symbol, exit_reason)

            except Exception as e:
                print(f"Error managing position {symbol}: {e}")

    async def exit_position(self, symbol: str, reason: str):
        """
        Exit a position

        Submit market order to close and update stats
        """
        if symbol not in self.positions:
            return

        position = self.positions[symbol]
        pnl = position.unrealized_pnl
        pnl_pct = (pnl / (position.entry_price * position.shares)) * 100

        print(f"\n🔻 EXITING POSITION: {symbol}")
        print(f"   Reason: {reason}")
        print(f"   Entry: ${position.entry_price:.2f}")
        print(f"   Exit: ${position.current_price:.2f}")
        print(f"   PnL: ${pnl:+,.2f} ({pnl_pct:+.1f}%)")

        try:
            # Close position
            self.trading_client.close_position(symbol)

            # Update stats
            if pnl > 0:
                self.winning_trades += 1
            else:
                self.losing_trades += 1

            self.total_pnl += pnl

            # Remove from tracking
            del self.positions[symbol]

            print(f"   ✅ Position closed")

        except Exception as e:
            print(f"   ❌ Exit failed: {e}")

    async def emergency_close_all(self):
        """Emergency close all positions"""
        print("\n⚠️ EMERGENCY: Closing all positions...")

        for symbol in list(self.positions.keys()):
            await self.exit_position(symbol, "emergency_stop")

async def main():
    """Main entry point"""

    # Build watchlist (you can customize this)
    # For now, example watchlist of popular momentum stocks
    watchlist = [
        'AAPL', 'TSLA', 'NVDA', 'AMD', 'PLTR', 'SOFI', 'RIVN',
        'LCID', 'NIO', 'TLRY', 'SNDL', 'AMC', 'GME', 'BBBY',
        'HOOD', 'COIN', 'MARA', 'RIOT', 'BTBT'
    ]

    # Initialize and run bot
    bot = MomentumTradingBot()

    try:
        await bot.run(watchlist)
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down bot...")
        await bot.emergency_close_all()
        print("Bot stopped.")

if __name__ == "__main__":
    asyncio.run(main())
