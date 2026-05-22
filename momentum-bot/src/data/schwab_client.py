"""Schwab API client for market data and trade execution"""
import requests
import asyncio
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import pandas as pd
import base64
from config.settings import *
from src.scanner.models import MarketData, NewsEvent

class SchwabAuthClient:
    """Handle Schwab OAuth authentication"""

    def __init__(self, app_key: str, app_secret: str, callback_url: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.callback_url = callback_url
        self.base_url = "https://api.schwabapi.com/v1"
        self.token_url = "https://api.schwabapi.com/v1/oauth/token"

        self.access_token = None
        self.refresh_token = None
        self.token_expiry = None

    def get_authorization_url(self) -> str:
        """Get URL for user to authorize app"""
        auth_url = f"https://api.schwabapi.com/v1/oauth/authorize"
        params = {
            'client_id': self.app_key,
            'redirect_uri': self.callback_url,
            'response_type': 'code'
        }
        url_params = '&'.join([f"{k}={v}" for k, v in params.items()])
        return f"{auth_url}?{url_params}"

    def authenticate(self, auth_code: str):
        """Exchange authorization code for tokens"""
        auth_string = f"{self.app_key}:{self.app_secret}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')

        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        data = {
            'grant_type': 'authorization_code',
            'code': auth_code,
            'redirect_uri': self.callback_url
        }

        response = requests.post(self.token_url, headers=headers, data=data)

        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data['access_token']
            self.refresh_token = token_data['refresh_token']
            self.token_expiry = datetime.now() + timedelta(seconds=token_data['expires_in'])
            return True
        else:
            raise Exception(f"Authentication failed: {response.text}")

    def refresh_access_token(self):
        """Refresh access token using refresh token"""
        if not self.refresh_token:
            raise Exception("No refresh token available")

        auth_string = f"{self.app_key}:{self.app_secret}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')

        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        data = {
            'grant_type': 'refresh_token',
            'refresh_token': self.refresh_token
        }

        response = requests.post(self.token_url, headers=headers, data=data)

        if response.status_code == 200:
            token_data = response.json()
            self.access_token = token_data['access_token']
            self.token_expiry = datetime.now() + timedelta(seconds=token_data['expires_in'])
            return True
        else:
            raise Exception(f"Token refresh failed: {response.text}")

    def ensure_valid_token(self):
        """Ensure access token is valid, refresh if needed"""
        if not self.access_token or datetime.now() >= self.token_expiry:
            self.refresh_access_token()


class SchwabDataClient:
    """Real-time market data from Schwab API"""

    def __init__(self, auth_client: SchwabAuthClient):
        self.auth = auth_client
        self.base_url = "https://api.schwabapi.com/marketdata/v1"

    def _get_headers(self) -> Dict:
        """Get headers with valid access token"""
        self.auth.ensure_valid_token()
        return {
            'Authorization': f'Bearer {self.auth.access_token}',
            'Content-Type': 'application/json'
        }

    async def get_quote(self, symbol: str) -> Dict:
        """Get real-time quote for a symbol"""
        url = f"{self.base_url}/quotes/{symbol}"
        headers = self._get_headers()

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to get quote: {response.text}")

    async def get_market_snapshot(self, symbol: str) -> MarketData:
        """
        Get current market data snapshot for a symbol

        Returns MarketData with current price, volume, RVOL, etc.
        """
        quote_data = await self.get_quote(symbol)
        quote = quote_data.get(symbol, {}).get('quote', {})

        if not quote:
            raise ValueError(f"No data available for {symbol}")

        # Extract data
        current_price = quote.get('lastPrice', 0)
        bid = quote.get('bidPrice', 0)
        ask = quote.get('askPrice', 0)
        bid_size = quote.get('bidSize', 0)
        ask_size = quote.get('askSize', 0)

        # Volume data
        current_volume = quote.get('totalVolume', 0)

        # Price data
        day_open = quote.get('openPrice', 0)
        day_high = quote.get('highPrice', 0)
        day_low = quote.get('lowPrice', 0)
        prev_close = quote.get('closePrice', 0)

        # Calculate metrics
        price_change_pct = ((current_price - day_open) / day_open) * 100 if day_open > 0 else 0

        # Get historical volume for RVOL
        avg_volume = await self._get_average_volume(symbol)
        relative_volume = current_volume / avg_volume if avg_volume > 0 else 1.0

        # Calculate VWAP (simplified - would need bars for true VWAP)
        vwap = (day_high + day_low + current_price) / 3

        return MarketData(
            symbol=symbol,
            timestamp=datetime.now(),
            price=current_price,
            volume=current_volume,
            open=day_open,
            high=day_high,
            low=day_low,
            close=current_price,
            vwap=vwap,
            avg_volume=avg_volume,
            relative_volume=relative_volume,
            bid=bid,
            ask=ask,
            bid_size=int(bid_size),
            ask_size=int(ask_size),
            price_change_pct=price_change_pct,
            hod=day_high,
            lod=day_low
        )

    async def _get_average_volume(self, symbol: str, days: int = 20) -> int:
        """Calculate average daily volume over N days"""
        end = datetime.now()
        start = end - timedelta(days=days)

        # Get price history
        url = f"{self.base_url}/pricehistory"
        headers = self._get_headers()

        params = {
            'symbol': symbol,
            'periodType': 'day',
            'period': days,
            'frequencyType': 'daily',
            'frequency': 1
        }

        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 200:
            data = response.json()
            candles = data.get('candles', [])

            if candles:
                volumes = [c.get('volume', 0) for c in candles]
                return int(sum(volumes) / len(volumes))

        return 0

    async def get_price_history(self, symbol: str, period_days: int = 1,
                                interval_minutes: int = 1) -> pd.DataFrame:
        """
        Get historical price bars

        Returns DataFrame with OHLCV data
        """
        url = f"{self.base_url}/pricehistory"
        headers = self._get_headers()

        params = {
            'symbol': symbol,
            'periodType': 'day',
            'period': period_days,
            'frequencyType': 'minute',
            'frequency': interval_minutes
        }

        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 200:
            data = response.json()
            candles = data.get('candles', [])

            if not candles:
                return pd.DataFrame()

            # Convert to DataFrame
            df = pd.DataFrame(candles)
            df['datetime'] = pd.to_datetime(df['datetime'], unit='ms')
            df = df.rename(columns={
                'datetime': 'timestamp'
            })

            return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]
        else:
            raise Exception(f"Failed to get price history: {response.text}")

    async def get_movers(self, index: str = "$DJI", direction: str = "up") -> List[str]:
        """
        Get market movers (top gainers/losers)

        index: $DJI, $COMPX, $SPX
        direction: up, down
        """
        url = f"{self.base_url}/movers/{index}"
        headers = self._get_headers()

        params = {
            'direction': direction,
            'change': 'percent'
        }

        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 200:
            data = response.json()
            return [mover['symbol'] for mover in data.get('screeners', [])]

        return []


class SchwabTradingClient:
    """Trade execution via Schwab API"""

    def __init__(self, auth_client: SchwabAuthClient, account_hash: str):
        self.auth = auth_client
        self.account_hash = account_hash
        self.base_url = "https://api.schwabapi.com/trader/v1"

    def _get_headers(self) -> Dict:
        """Get headers with valid access token"""
        self.auth.ensure_valid_token()
        return {
            'Authorization': f'Bearer {self.auth.access_token}',
            'Content-Type': 'application/json'
        }

    def get_account(self) -> Dict:
        """Get account information"""
        url = f"{self.base_url}/accounts/{self.account_hash}"
        headers = self._get_headers()

        response = requests.get(url, headers=headers)

        if response.status_code == 200:
            data = response.json()
            account = data.get('securitiesAccount', {})
            balances = account.get('currentBalances', {})

            return {
                'buying_power': float(balances.get('buyingPower', 0)),
                'cash': float(balances.get('cashBalance', 0)),
                'portfolio_value': float(balances.get('liquidationValue', 0)),
                'equity': float(balances.get('equity', 0))
            }
        else:
            raise Exception(f"Failed to get account: {response.text}")

    def submit_market_order(self, symbol: str, qty: int, side: str) -> str:
        """
        Submit market order

        Returns order ID
        """
        url = f"{self.base_url}/accounts/{self.account_hash}/orders"
        headers = self._get_headers()

        instruction = "BUY" if side.lower() == 'long' else "SELL"

        order_data = {
            "orderType": "MARKET",
            "session": "NORMAL",
            "duration": "DAY",
            "orderStrategyType": "SINGLE",
            "orderLegCollection": [
                {
                    "instruction": instruction,
                    "quantity": qty,
                    "instrument": {
                        "symbol": symbol,
                        "assetType": "EQUITY"
                    }
                }
            ]
        }

        response = requests.post(url, headers=headers, json=order_data)

        if response.status_code == 201:
            # Order ID is in Location header
            location = response.headers.get('Location', '')
            order_id = location.split('/')[-1] if location else 'unknown'
            return order_id
        else:
            raise Exception(f"Order failed: {response.text}")

    def submit_limit_order(self, symbol: str, qty: int, side: str, limit_price: float) -> str:
        """
        Submit limit order

        Returns order ID
        """
        url = f"{self.base_url}/accounts/{self.account_hash}/orders"
        headers = self._get_headers()

        instruction = "BUY" if side.lower() == 'long' else "SELL"

        order_data = {
            "orderType": "LIMIT",
            "session": "NORMAL",
            "price": f"{limit_price:.2f}",
            "duration": "DAY",
            "orderStrategyType": "SINGLE",
            "orderLegCollection": [
                {
                    "instruction": instruction,
                    "quantity": qty,
                    "instrument": {
                        "symbol": symbol,
                        "assetType": "EQUITY"
                    }
                }
            ]
        }

        response = requests.post(url, headers=headers, json=order_data)

        if response.status_code == 201:
            location = response.headers.get('Location', '')
            order_id = location.split('/')[-1] if location else 'unknown'
            return order_id
        else:
            raise Exception(f"Order failed: {response.text}")

    def cancel_order(self, order_id: str):
        """Cancel an open order"""
        url = f"{self.base_url}/accounts/{self.account_hash}/orders/{order_id}"
        headers = self._get_headers()

        response = requests.delete(url, headers=headers)

        if response.status_code != 200:
            raise Exception(f"Cancel failed: {response.text}")

    def get_positions(self) -> List[Dict]:
        """Get all open positions"""
        url = f"{self.base_url}/accounts/{self.account_hash}"
        headers = self._get_headers()

        params = {'fields': 'positions'}

        response = requests.get(url, headers=headers, params=params)

        if response.status_code == 200:
            data = response.json()
            positions = data.get('securitiesAccount', {}).get('positions', [])

            return [
                {
                    'symbol': pos['instrument']['symbol'],
                    'qty': int(pos['longQuantity']),
                    'side': 'long' if pos['longQuantity'] > 0 else 'short',
                    'avg_entry_price': float(pos['averagePrice']),
                    'current_price': float(pos['marketValue']) / float(pos['longQuantity']) if pos['longQuantity'] > 0 else 0,
                    'unrealized_pl': float(pos.get('currentDayProfitLoss', 0)),
                    'unrealized_plpc': float(pos.get('currentDayProfitLossPercentage', 0))
                }
                for pos in positions
            ]

        return []

    def close_position(self, symbol: str):
        """Close entire position in a symbol"""
        # Get current position
        positions = self.get_positions()
        position = next((p for p in positions if p['symbol'] == symbol), None)

        if not position:
            raise Exception(f"No position found for {symbol}")

        # Submit market order to close
        qty = position['qty']
        side = 'sell' if position['side'] == 'long' else 'buy'

        return self.submit_market_order(symbol, qty, side)
