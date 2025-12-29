'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TradingSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [accountData, setAccountData] = useState({
    accountNumber: '',
    accountType: 'MARGIN' as 'MARGIN' | 'CASH' | 'IRA',
    brokerName: 'SCHWAB',
    isPaperTrading: true,
  });

  const [portfolioData, setPortfolioData] = useState({
    name: '',
    description: '',
    initialCapital: 100000,
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

  const createAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/trading/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const connectSchwab = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get authorization URL
      const response = await fetch(`${API_URL}/trading/auth/url`);
      const data = await response.json();

      // Open Schwab OAuth in new window
      window.open(data.url, '_blank');

      // Proceed to next step
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get authorization URL');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthCallback = async (authCode: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/trading/auth/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: authCode,
          accountNumber: accountData.accountNumber,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with Schwab');
      }

      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const createPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the account we just created
      const accountsResponse = await fetch(`${API_URL}/trading/accounts`);
      const accounts = await accountsResponse.json();
      const account = accounts.find(
        (acc: any) => acc.accountNumber === accountData.accountNumber
      );

      if (!account) {
        throw new Error('Account not found');
      }

      // Create portfolio
      const response = await fetch(`${API_URL}/trading/portfolios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...portfolioData,
          brokerAccountId: account.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portfolio');
      }

      // Redirect to dashboard
      router.push('/trading');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Trading Account Setup</h1>

        {/* Progress Steps */}
        <div className="flex justify-between mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  s <= step ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? 'bg-yellow-500' : 'bg-gray-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Account Details */}
        {step === 1 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Step 1: Account Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Account Number</label>
                <input
                  type="text"
                  value={accountData.accountNumber}
                  onChange={(e) =>
                    setAccountData({ ...accountData, accountNumber: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Your Schwab account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Account Type</label>
                <select
                  value={accountData.accountType}
                  onChange={(e) =>
                    setAccountData({
                      ...accountData,
                      accountType: e.target.value as 'MARGIN' | 'CASH' | 'IRA',
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="MARGIN">Margin</option>
                  <option value="CASH">Cash</option>
                  <option value="IRA">IRA</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="paperTrading"
                  checked={accountData.isPaperTrading}
                  onChange={(e) =>
                    setAccountData({ ...accountData, isPaperTrading: e.target.checked })
                  }
                  className="w-4 h-4 text-yellow-500 bg-gray-800 border-gray-700 rounded"
                />
                <label htmlFor="paperTrading" className="ml-2 text-sm">
                  Paper Trading Account (Recommended for testing)
                </label>
              </div>
            </div>

            <button
              onClick={createAccount}
              disabled={loading || !accountData.accountNumber}
              className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Creating Account...' : 'Continue'}
            </button>
          </div>
        )}

        {/* Step 2: Connect Schwab */}
        {step === 2 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Step 2: Connect to Schwab</h2>

            <p className="text-gray-400 mb-6">
              Click the button below to authorize this application to access your Schwab account.
              You'll be redirected to Schwab's secure login page.
            </p>

            <button
              onClick={connectSchwab}
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Connecting...' : 'Connect Schwab Account'}
            </button>
          </div>
        )}

        {/* Step 3: OAuth Callback */}
        {step === 3 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Step 3: Complete Authorization</h2>

            <p className="text-gray-400 mb-6">
              After authorizing with Schwab, you'll receive an authorization code. Paste it below:
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Authorization Code</label>
                <input
                  type="text"
                  id="authCode"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Paste authorization code here"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const authCode = (document.getElementById('authCode') as HTMLInputElement)
                  .value;
                if (authCode) {
                  handleOAuthCallback(authCode);
                }
              }}
              disabled={loading}
              className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              onClick={() => setStep(4)}
              className="w-full mt-3 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm"
            >
              Skip for now (Manual setup later)
            </button>
          </div>
        )}

        {/* Step 4: Create Portfolio */}
        {step === 4 && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Step 4: Create Portfolio</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Portfolio Name</label>
                <input
                  type="text"
                  value={portfolioData.name}
                  onChange={(e) =>
                    setPortfolioData({ ...portfolioData, name: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="My Trading Portfolio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (Optional)</label>
                <textarea
                  value={portfolioData.description}
                  onChange={(e) =>
                    setPortfolioData({ ...portfolioData, description: e.target.value })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="Strategy description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Initial Capital</label>
                <input
                  type="number"
                  value={portfolioData.initialCapital}
                  onChange={(e) =>
                    setPortfolioData({
                      ...portfolioData,
                      initialCapital: parseFloat(e.target.value),
                    })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  min="0"
                  step="1000"
                />
                <p className="text-sm text-gray-500 mt-1">
                  For paper trading, this is your starting virtual capital
                </p>
              </div>
            </div>

            <button
              onClick={createPortfolio}
              disabled={loading || !portfolioData.name}
              className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-700 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {loading ? 'Creating Portfolio...' : 'Complete Setup'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
