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

    // Store token and proceed - backend will validate on API calls
    setTimeout(() => {
      login(tokenInput.trim());
      setIsConnecting(false);
    }, 500);
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
