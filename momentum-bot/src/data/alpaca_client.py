"""Alpaca API client for market data and trade execution"""
import asyncio
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import pandas as pd
from alpaca.trading.client import TradingClient
from alpaca.data.historical import StockHistoricalDataClient, CryptoHistoricalDataClient
from alpaca.data.live import StockDataStream, CryptoDataStream
from alpaca.trading.requests import MarketOrderRequest, LimitOrderRequest
from alpaca.trading.enums import OrderSide, TimeInForce
from alpaca.data.requests import StockBarsRequest, StockTradesRequest, StockQuotesRequest
from alpaca.data.timeframe import TimeFrame
from config.settings import *
from src.scanner.models import MarketData, NewsEvent

class AlpacaDataClient:
    """Real-time market data from Alpaca"""

    def __init__(self):
        self.trading_client = TradingClient(ALPACA_API_KEY, ALPACA_SECRET_KEY)
        self.stock_data_client = StockHistoricalDataClient(ALPACA_API_KEY, ALPACA_SECRET_KEY)
        self.crypto_data_client = CryptoHistoricalDataClient(ALPACA_API_KEY, ALPACA_SECRET_KEY)

        # WebSocket streams
        self.stock_stream = StockDataStream(ALPACA_API_KEY, ALPACA_SECRET_KEY)
        self.crypto_stream = CryptoDataStream(ALPACA_API_KEY, ALPACA_SECRET_KEY)

        # Callbacks
        self.bar_handlers = {}
        self.trade_handlers = {}
        self.quote_handlers = {}

    async def get_market_snapshot(self, symbol: str) -> MarketData:
        """
        Get current market data snapshot for a symbol

        Returns MarketData with current price, volume, RVOL, etc.
        """
        # Get latest quote
        quote_request = StockQuotesRequest(
            symbol_or_symbols=symbol,
            limit=1
        )
        quotes = self.stock_data_client.get_stock_quotes(quote_request)
        latest_quote = quotes[symbol][0] if symbol in quotes and quotes[symbol] else None

        # Get latest bars (1-minute)
        bars_request = StockBarsRequest(
            symbol_or_symbols=symbol,
            timeframe=TimeFrame.Minute,
            limit=100
        )
        bars = self.stock_data_client.get_stock_bars(bars_request)
        df = bars.df

        if df.empty or latest_quote is None:
            raise ValueError(f"No data available for {symbol}")

        # Latest bar data
        latest_bar = df.iloc[-1]
        current_price = latest_bar['close']
        current_volume = latest_bar['volume']

        # Calculate metrics
        day_open = df.iloc[0]['open']
        day_high = df['high'].max()
        day_low = df['low'].min()
        price_change_pct = ((current_price - day_open) / day_open) * 100

        # Average volume (last 20 days for comparison)
        avg_volume = self._get_average_volume(symbol)
        relative_volume = current_volume / avg_volume if avg_volume > 0 else 1.0

        # VWAP calculation
        df['vwap'] = (df['close'] * df['volume']).cumsum() / df['volume'].cumsum()
        vwap = df['vwap'].iloc[-1]

        return MarketData(
            symbol=symbol,
            timestamp=datetime.now(),
            price=current_price,
            volume=int(df['volume'].sum()),  # Total day volume
            open=day_open,
            high=day_high,
            low=day_low,
            close=current_price,
            vwap=vwap,
            avg_volume=avg_volume,
            relative_volume=relative_volume,
            bid=latest_quote.bid_price,
            ask=latest_quote.ask_price,
            bid_size=int(latest_quote.bid_size),
            ask_size=int(latest_quote.ask_size),
            price_change_pct=price_change_pct,
            hod=day_high,
            lod=day_low
        )

    def _get_average_volume(self, symbol: str, days: int = 20) -> int:
        """Calculate average daily volume over N days"""
        end = datetime.now()
        start = end - timedelta(days=days)

        bars_request = StockBarsRequest(
            symbol_or_symbols=symbol,
            timeframe=TimeFrame.Day,
            start=start,
            end=end
        )

        bars = self.stock_data_client.get_stock_bars(bars_request)
        df = bars.df

        if df.empty:
            return 0

        return int(df['volume'].mean())

    async def get_price_history(self, symbol: str, timeframe: TimeFrame = TimeFrame.Minute,
                                limit: int = 100) -> pd.DataFrame:
        """
        Get historical price bars

        Returns DataFrame with OHLCV data
        """
        bars_request = StockBarsRequest(
            symbol_or_symbols=symbol,
            timeframe=timeframe,
            limit=limit
        )

        bars = self.stock_data_client.get_stock_bars(bars_request)
        df = bars.df

        if symbol in df.index.get_level_values(0):
            return df.loc[symbol].reset_index()

        return pd.DataFrame()

    async def get_recent_trades(self, symbol: str, limit: int = 100) -> List[Dict]:
        """
        Get recent trade prints for tape reading

        Returns list of trade dictionaries with price, size, timestamp
        """
        trades_request = StockTradesRequest(
            symbol_or_symbols=symbol,
            limit=limit
        )

        trades = self.stock_data_client.get_stock_trades(trades_request)

        if symbol not in trades:
            return []

        return [
            {
                'price': trade.price,
                'size': trade.size,
                'timestamp': trade.timestamp,
                'exchange': trade.exchange
            }
            for trade in trades[symbol]
        ]

    async def subscribe_bars(self, symbols: List[str], callback):
        """Subscribe to real-time bar updates"""
        async def bar_handler(bar):
            await callback(bar)

        self.stock_stream.subscribe_bars(bar_handler, *symbols)

    async def subscribe_trades(self, symbols: List[str], callback):
        """Subscribe to real-time trade prints"""
        async def trade_handler(trade):
            await callback(trade)

        self.stock_stream.subscribe_trades(trade_handler, *symbols)

    async def subscribe_quotes(self, symbols: List[str], callback):
        """Subscribe to real-time quote updates (Level 1)"""
        async def quote_handler(quote):
            await callback(quote)

        self.stock_stream.subscribe_quotes(quote_handler, *symbols)

    async def start_stream(self):
        """Start WebSocket data stream"""
        await self.stock_stream.run()

class AlpacaTradingClient:
    """Trade execution via Alpaca"""

    def __init__(self):
        self.client = TradingClient(ALPACA_API_KEY, ALPACA_SECRET_KEY, paper=True)

    def get_account(self) -> Dict:
        """Get account information"""
        account = self.client.get_account()
        return {
            'buying_power': float(account.buying_power),
            'cash': float(account.cash),
            'portfolio_value': float(account.portfolio_value),
            'equity': float(account.equity)
        }

    def submit_market_order(self, symbol: str, qty: int, side: str) -> str:
        """
        Submit market order

        Returns order ID
        """
        order_side = OrderSide.BUY if side.lower() == 'long' else OrderSide.SELL

        order_data = MarketOrderRequest(
            symbol=symbol,
            qty=qty,
            side=order_side,
            time_in_force=TimeInForce.DAY
        )

        order = self.client.submit_order(order_data)
        return order.id

    def submit_limit_order(self, symbol: str, qty: int, side: str, limit_price: float) -> str:
        """
        Submit limit order

        Returns order ID
        """
        order_side = OrderSide.BUY if side.lower() == 'long' else OrderSide.SELL

        order_data = LimitOrderRequest(
            symbol=symbol,
            qty=qty,
            side=order_side,
            time_in_force=TimeInForce.DAY,
            limit_price=limit_price
        )

        order = self.client.submit_order(order_data)
        return order.id

    def cancel_order(self, order_id: str):
        """Cancel an open order"""
        self.client.cancel_order_by_id(order_id)

    def close_position(self, symbol: str):
        """Close entire position in a symbol"""
        self.client.close_position(symbol)

    def get_positions(self) -> List[Dict]:
        """Get all open positions"""
        positions = self.client.get_all_positions()

        return [
            {
                'symbol': pos.symbol,
                'qty': int(pos.qty),
                'side': pos.side,
                'avg_entry_price': float(pos.avg_entry_price),
                'current_price': float(pos.current_price),
                'unrealized_pl': float(pos.unrealized_pl),
                'unrealized_plpc': float(pos.unrealized_plpc)
            }
            for pos in positions
        ]

    def get_position(self, symbol: str) -> Optional[Dict]:
        """Get position for specific symbol"""
        try:
            pos = self.client.get_open_position(symbol)
            return {
                'symbol': pos.symbol,
                'qty': int(pos.qty),
                'side': pos.side,
                'avg_entry_price': float(pos.avg_entry_price),
                'current_price': float(pos.current_price),
                'unrealized_pl': float(pos.unrealized_pl),
                'unrealized_plpc': float(pos.unrealized_plpc)
            }
        except:
            return None
