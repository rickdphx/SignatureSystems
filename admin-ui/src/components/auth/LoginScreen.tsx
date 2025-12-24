import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './LoginScreen.css';

const LoginScreen = () => {
  const [tokenInput, setTokenInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleConnect = async () => {
    if (!tokenInput.trim()) {
      setError('Please enter a token');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Verify token with backend
      const response = await fetch('/admin/api/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenInput.trim() })
      });

      if (response.ok) {
        login(tokenInput.trim());
      } else {
        setError('Invalid token');
      }
    } catch (err) {
      setError('Connection failed. Please check your token and try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  return (
    <div className="login-screen">
      <div className="login-container">
        <div className="login-header">
          <h1>BEN ADMIN</h1>
          <p className="login-subtitle">Dynamic live push every 1s</p>
        </div>

        <div className="login-form">
          <label htmlFor="token">Admin Token</label>
          <input
            id="token"
            type="password"
            placeholder="paste token here once"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isConnecting}
            autoFocus
          />

          {error && <div className="login-error">{error}</div>}

          <button
            className="connect-btn"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>

          <div className="connection-status">
            {isConnecting ? 'connecting...' : 'disconnected'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
