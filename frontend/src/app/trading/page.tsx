'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Portfolio {
  id: string;
  name: string;
  description?: string;
  initialCapital: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  profitFactor?: number;
  winRate?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  brokerAccount: BrokerAccount;
  positions: Position[];
  trades: Trade[];
}

interface BrokerAccount {
  id: string;
  accountNumber: string;
  accountType: string;
  brokerName: string;
  isPaperTrading: boolean;
  accountValue: number;
  cashBalance: number;
  buyingPower: number;
}

interface Position {
  id: string;
  symbol: string;
  assetType: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  side: string;
}

interface Trade {
  id: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  realizedPnL?: number;
  executedAt: string;
}

export default function TradingDashboard() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/trading/portfolios`);

      if (!response.ok) {
        throw new Error('Failed to fetch portfolios');
      }

      const data = await response.json();
      setPortfolios(data);

      if (data.length > 0 && !selectedPortfolio) {
        fetchPortfolioDetails(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolios');
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioDetails = async (portfolioId: string) => {
    try {
      const response = await fetch(`${API_URL}/trading/portfolios/${portfolioId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio details');
      }

      const data = await response.json();
      setSelectedPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio details');
    }
  };

  const syncPortfolio = async () => {
    if (!selectedPortfolio) return;

    try {
      setSyncing(true);
      const response = await fetch(
        `${API_URL}/trading/portfolios/${selectedPortfolio.id}/sync`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to sync portfolio');
      }

      const data = await response.json();
      setSelectedPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync portfolio');
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading trading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-4">No Portfolios Found</h1>
          <p className="text-gray-400 mb-6">Create your first portfolio to start trading</p>
          <Link
            href="/trading/setup"
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Setup Trading Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Trading Dashboard</h1>
              {selectedPortfolio && (
                <p className="text-gray-400">
                  {selectedPortfolio.brokerAccount.brokerName} •{' '}
                  {selectedPortfolio.brokerAccount.accountNumber} •{' '}
                  {selectedPortfolio.brokerAccount.isPaperTrading ? 'Paper Trading' : 'Live'}
                </p>
              )}
            </div>
            <button
              onClick={syncPortfolio}
              disabled={syncing}
              className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 text-gray-900 font-bold py-2 px-6 rounded-lg transition-colors"
            >
              {syncing ? 'Syncing...' : 'Sync Account'}
            </button>
          </div>
        </div>
      </div>

      {selectedPortfolio && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Account Value */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Account Value</div>
              <div className="text-3xl font-bold text-white">
                {formatCurrency(selectedPortfolio.currentValue)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Cash: {formatCurrency(selectedPortfolio.brokerAccount.cashBalance)}
              </div>
            </div>

            {/* Total PnL */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Total P&L</div>
              <div
                className={`text-3xl font-bold ${
                  selectedPortfolio.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {formatCurrency(selectedPortfolio.totalPnL)}
              </div>
              <div
                className={`text-sm mt-2 ${
                  selectedPortfolio.totalPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {formatPercent(selectedPortfolio.totalPnLPercent)}
              </div>
            </div>

            {/* Profit Factor */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Profit Factor</div>
              <div className="text-3xl font-bold text-white">
                {selectedPortfolio.profitFactor?.toFixed(2) || 'N/A'}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {selectedPortfolio.profitFactor && selectedPortfolio.profitFactor > 1
                  ? 'Profitable'
                  : selectedPortfolio.profitFactor
                  ? 'Losing'
                  : 'No trades'}
              </div>
            </div>

            {/* Win Rate */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Win Rate</div>
              <div className="text-3xl font-bold text-white">
                {selectedPortfolio.winRate?.toFixed(1) || '0'}%
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {selectedPortfolio.winningTrades}W / {selectedPortfolio.losingTrades}L
              </div>
            </div>

            {/* Buying Power */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Buying Power</div>
              <div className="text-3xl font-bold text-white">
                {formatCurrency(selectedPortfolio.brokerAccount.buyingPower)}
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Max Drawdown</div>
              <div className="text-3xl font-bold text-red-500">
                {selectedPortfolio.maxDrawdown?.toFixed(2) || '0'}%
              </div>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Sharpe Ratio</div>
              <div className="text-3xl font-bold text-white">
                {selectedPortfolio.sharpeRatio?.toFixed(2) || 'N/A'}
              </div>
            </div>

            {/* Total Trades */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Total Trades</div>
              <div className="text-3xl font-bold text-white">
                {selectedPortfolio.totalTrades}
              </div>
            </div>
          </div>

          {/* Positions */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg mb-8">
            <div className="border-b border-gray-800 p-6">
              <h2 className="text-2xl font-bold">Current Positions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">Symbol</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Quantity</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Avg Price</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Current Price</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Market Value</th>
                    <th className="text-right p-4 text-gray-400 font-medium">P&L</th>
                    <th className="text-right p-4 text-gray-400 font-medium">P&L %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {selectedPortfolio.positions.length > 0 ? (
                    selectedPortfolio.positions.map((position) => (
                      <tr key={position.id} className="hover:bg-gray-800">
                        <td className="p-4">
                          <div className="font-bold">{position.symbol}</div>
                          <div className="text-sm text-gray-500">{position.assetType}</div>
                        </td>
                        <td className="p-4 text-right">{position.quantity}</td>
                        <td className="p-4 text-right">{formatCurrency(position.averagePrice)}</td>
                        <td className="p-4 text-right">{formatCurrency(position.currentPrice)}</td>
                        <td className="p-4 text-right">{formatCurrency(position.marketValue)}</td>
                        <td
                          className={`p-4 text-right font-bold ${
                            position.unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {formatCurrency(position.unrealizedPnL)}
                        </td>
                        <td
                          className={`p-4 text-right font-bold ${
                            position.unrealizedPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {formatPercent(position.unrealizedPnLPercent)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No open positions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg">
            <div className="border-b border-gray-800 p-6">
              <h2 className="text-2xl font-bold">Recent Trades</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="text-left p-4 text-gray-400 font-medium">Date</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Symbol</th>
                    <th className="text-left p-4 text-gray-400 font-medium">Side</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Quantity</th>
                    <th className="text-right p-4 text-gray-400 font-medium">Price</th>
                    <th className="text-right p-4 text-gray-400 font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {selectedPortfolio.trades.length > 0 ? (
                    selectedPortfolio.trades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-gray-800">
                        <td className="p-4 text-sm text-gray-400">
                          {formatDate(trade.executedAt)}
                        </td>
                        <td className="p-4 font-bold">{trade.symbol}</td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              trade.side === 'BUY'
                                ? 'bg-green-900 text-green-300'
                                : 'bg-red-900 text-red-300'
                            }`}
                          >
                            {trade.side}
                          </span>
                        </td>
                        <td className="p-4 text-right">{trade.quantity}</td>
                        <td className="p-4 text-right">{formatCurrency(trade.price)}</td>
                        <td
                          className={`p-4 text-right font-bold ${
                            trade.realizedPnL && trade.realizedPnL >= 0
                              ? 'text-green-500'
                              : trade.realizedPnL
                              ? 'text-red-500'
                              : 'text-gray-500'
                          }`}
                        >
                          {trade.realizedPnL ? formatCurrency(trade.realizedPnL) : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No trades yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
