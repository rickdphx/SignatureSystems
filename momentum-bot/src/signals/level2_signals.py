"""Level 2 and tape reading signal detection"""
from typing import Optional, List, Dict
import numpy as np
from datetime import datetime, timedelta
from collections import deque
from config.settings import *
from src.scanner.models import Signal, SignalType, MarketData

class Level2Detector:
    """Detects Level 2 order book and tape signals - the real edge"""

    def __init__(self):
        # Track tape prints over time
        self.tape_history: Dict[str, deque] = {}
        # Track bid refreshes
        self.bid_refresh_tracker: Dict[str, List] = {}

    def detect_tape_acceleration(self, symbol: str, recent_prints: List[Dict]) -> Optional[Signal]:
        """
        TAPE SPEED INCREASE
        Monitor rapid prints, aggressive buyers, stacked green prints

        Conditions:
        - prints_per_second increasing
        - aggressive_bid_hitting == True
        """
        if not recent_prints or len(recent_prints) < 10:
            return None

        # Initialize tape history for symbol
        if symbol not in self.tape_history:
            self.tape_history[symbol] = deque(maxlen=100)

        # Add recent prints to history
        for print_data in recent_prints:
            self.tape_history[symbol].append(print_data)

        # Calculate prints per second (last 10 seconds vs previous 10 seconds)
        now = datetime.now()
        last_10s_prints = [p for p in self.tape_history[symbol]
                          if (now - p['timestamp']).total_seconds() <= 10]
        prev_10s_prints = [p for p in self.tape_history[symbol]
                          if 10 < (now - p['timestamp']).total_seconds() <= 20]

        if not prev_10s_prints:
            return None

        current_rate = len(last_10s_prints) / 10
        previous_rate = len(prev_10s_prints) / 10

        # Check for acceleration
        if current_rate <= previous_rate * TAPE_ACCELERATION_THRESHOLD:
            return None

        # Check for aggressive buying (green prints outnumber red)
        green_prints = sum(1 for p in last_10s_prints
                          if p.get('price', 0) >= p.get('ask', 0))
        red_prints = sum(1 for p in last_10s_prints
                        if p.get('price', 0) <= p.get('bid', 0))

        aggressive_buying = green_prints > red_prints * 1.5

        if not aggressive_buying:
            return None

        # Calculate strength based on acceleration magnitude
        acceleration_factor = current_rate / previous_rate
        strength = min(10.0, 6.0 + (acceleration_factor * 2))

        # Bonus for very aggressive buying
        if green_prints > red_prints * 2:
            strength = min(10.0, strength + 1.5)

        return Signal(
            signal_type=SignalType.TAPE_ACCELERATION,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS['tape_acceleration'],
            metadata={
                'prints_per_sec': current_rate,
                'acceleration': acceleration_factor,
                'green_prints': green_prints,
                'red_prints': red_prints
            }
        )

    def detect_hidden_buyer(self, symbol: str, market_data: MarketData,
                           order_book_history: List[Dict]) -> Optional[Signal]:
        """
        HIDDEN BUYER DETECTION
        Detect large buyer absorbing sells without bid dropping

        Example:
        - 20k shares sold
        - Bid never drops
        - Bid refreshes repeatedly

        Signal: hidden_bid_detected == True
        """
        if not order_book_history or len(order_book_history) < 5:
            return None

        current_bid = market_data.bid
        if not current_bid:
            return None

        # Track bid refresh count
        if symbol not in self.bid_refresh_tracker:
            self.bid_refresh_tracker[symbol] = []

        # Check last 5 order book snapshots
        bid_prices = [ob.get('bid') for ob in order_book_history[-5:]]
        bid_sizes = [ob.get('bid_size', 0) for ob in order_book_history[-5:]]

        # Bid should stay at same level
        if len(set(bid_prices)) > 1:  # Bid moved
            return None

        # Calculate total selling pressure (asks getting hit)
        total_sells = sum([ob.get('sell_volume', 0) for ob in order_book_history[-5:]])

        # Require significant selling pressure
        if total_sells < 5000:  # Less than 5k shares sold
            return None

        # Check if bid size refreshes (indicates hidden buyer)
        refresh_count = sum(1 for i in range(1, len(bid_sizes))
                          if bid_sizes[i] > bid_sizes[i-1] * 0.8)

        if refresh_count < HIDDEN_BID_REFRESH_COUNT:
            return None

        # Strong hidden buyer signal
        strength = min(10.0, 7.0 + (refresh_count / 2))

        return Signal(
            signal_type=SignalType.HIDDEN_BUYER,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS.get('hidden_buyer', 12),
            metadata={
                'bid_refreshes': refresh_count,
                'sell_volume_absorbed': total_sells,
                'bid_level': current_bid
            }
        )

    @staticmethod
    def detect_sell_wall(market_data: MarketData) -> Optional[Dict]:
        """
        SELL WALL DETECTION
        Detect large ask size that could block momentum

        Use for EXITS: sell 15 cents before wall
        Adaptive: tighter on weak stocks, looser on strong momentum

        Returns wall info if detected (not a Signal, used for exit logic)
        """
        if not market_data.ask_size or not market_data.ask:
            return None

        # Detect significant sell wall
        if market_data.ask_size < SELL_WALL_MIN_SIZE:
            return None

        # Calculate distance to wall
        distance_to_wall = market_data.ask - market_data.price

        # Return wall info for exit logic
        return {
            'detected': True,
            'ask_price': market_data.ask,
            'ask_size': market_data.ask_size,
            'distance': distance_to_wall,
            'exit_price': market_data.ask - SELL_WALL_DISTANCE,
            'timestamp': datetime.now()
        }

    @staticmethod
    def detect_l2_bullish_structure(market_data: MarketData,
                                   order_book_history: List[Dict]) -> Optional[Signal]:
        """
        LEVEL 2 STACK ALIGNMENT
        Detect bullish order book structure

        Bullish alignment:
        - Bids stepping upward
        - Asks getting lifted
        - Spread tightening

        Signal: l2_bullish_structure == True
        """
        if not order_book_history or len(order_book_history) < 5:
            return None

        recent_books = order_book_history[-5:]

        # Extract bid/ask data
        bids = [ob.get('bid', 0) for ob in recent_books]
        asks = [ob.get('ask', 0) for ob in recent_books]
        spreads = [ob.get('spread', 0) for ob in recent_books]

        # Check if bids stepping up
        bids_rising = all(bids[i] >= bids[i-1] for i in range(1, len(bids)))

        if not bids_rising:
            return None

        # Check if asks being lifted (price going up)
        asks_lifting = sum(1 for i in range(1, len(asks)) if asks[i] > asks[i-1])

        if asks_lifting < 3:  # Need at least 3 lifts
            return None

        # Check if spread tightening (good for entry)
        spread_tightening = spreads[-1] < np.mean(spreads[:-1])

        strength = 7.0

        if spread_tightening:
            strength += 1.5

        if asks_lifting == len(asks) - 1:  # All asks lifting
            strength += 1.0

        strength = min(10.0, strength)

        return Signal(
            signal_type=SignalType.L2_BULLISH,
            timestamp=datetime.now(),
            strength=strength,
            weight=SIGNAL_WEIGHTS.get('l2_bullish', 10),
            metadata={
                'bids_rising': bids_rising,
                'asks_lifting_count': asks_lifting,
                'spread_tightening': spread_tightening
            }
        )

    def reset_symbol_tracking(self, symbol: str):
        """Clear tracking data for a symbol"""
        if symbol in self.tape_history:
            self.tape_history[symbol].clear()
        if symbol in self.bid_refresh_tracker:
            self.bid_refresh_tracker[symbol].clear()
