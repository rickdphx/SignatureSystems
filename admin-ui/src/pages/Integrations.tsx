import { useState, useEffect } from 'react';
import { Plus, Check, X, RefreshCw, Settings, Trash2 } from 'lucide-react';
import { getConnectors, createConnector, testConnector, type Connector } from '../api';
import './Integrations.css';

const Integrations = () => {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [newConnector, setNewConnector] = useState<Partial<Connector>>({
    name: '',
    type: 'REST',
    baseUrl: '',
    authMethod: 'API Key',
    enabled: false
  });

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    const data = await getConnectors();
    setConnectors(data);
  };

  const handleCreateConnector = async () => {
    if (!newConnector.name || !newConnector.baseUrl) return;

    const created = await createConnector(newConnector);
    setConnectors([...connectors, created]);
    setShowModal(false);
    setNewConnector({
      name: '',
      type: 'REST',
      baseUrl: '',
      authMethod: 'API Key',
      enabled: false
    });
  };

  const handleTestConnector = async (id: string) => {
    setTesting(id);
    const result = await testConnector(id);
    setConnectors(connectors.map(c =>
      c.id === id
        ? { ...c, status: result ? 'Connected' : 'Disconnected', lastTest: 'Just now' }
        : c
    ));
    setTesting(null);
  };

  const toggleConnector = (id: string) => {
    setConnectors(connectors.map(c =>
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  };

  return (
    <div className="integrations-page">
      <div className="page-header">
        <div>
          <h1>Connections Hub</h1>
          <p className="page-subtitle">Manage API integrations and connections</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Connector
        </button>
      </div>

      <div className="connectors-grid">
        {connectors.map((connector) => (
          <div key={connector.id} className="connector-card">
            <div className="connector-header">
              <div>
                <h3>{connector.name}</h3>
                <span className={`connector-status status-${connector.status.toLowerCase()}`}>
                  {connector.status === 'Connected' ? <Check size={14} /> : <X size={14} />}
                  {connector.status}
                </span>
              </div>
              <div className="connector-actions">
                <button
                  className="icon-btn"
                  onClick={() => handleTestConnector(connector.id)}
                  disabled={testing === connector.id}
                  title="Test Connection"
                >
                  <RefreshCw size={16} className={testing === connector.id ? 'spinning' : ''} />
                </button>
                <button className="icon-btn" title="Settings">
                  <Settings size={16} />
                </button>
                <button className="icon-btn" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="connector-details">
              <div className="detail-row">
                <span className="detail-label">Type</span>
                <span className="detail-value">{connector.type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Base URL</span>
                <span className="detail-value">{connector.baseUrl}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Auth Method</span>
                <span className="detail-value">{connector.authMethod}</span>
              </div>
              {connector.lastTest && (
                <div className="detail-row">
                  <span className="detail-label">Last Test</span>
                  <span className="detail-value">{connector.lastTest}</span>
                </div>
              )}
            </div>

            <div className="connector-footer">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={connector.enabled}
                  onChange={() => toggleConnector(connector.id)}
                />
                <span>Enabled</span>
              </label>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Connector</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Connector Name</label>
                <input
                  type="text"
                  value={newConnector.name}
                  onChange={(e) => setNewConnector({ ...newConnector, name: e.target.value })}
                  placeholder="e.g., OpenAI API"
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={newConnector.type}
                  onChange={(e) => setNewConnector({ ...newConnector, type: e.target.value as any })}
                >
                  <option value="REST">REST API</option>
                  <option value="WebSocket">WebSocket</option>
                  <option value="SDK">SDK</option>
                  <option value="OAuth">OAuth</option>
                  <option value="Webhook">Webhook</option>
                </select>
              </div>

              <div className="form-group">
                <label>Base URL / Endpoint</label>
                <input
                  type="text"
                  value={newConnector.baseUrl}
                  onChange={(e) => setNewConnector({ ...newConnector, baseUrl: e.target.value })}
                  placeholder="https://api.example.com/v1"
                />
              </div>

              <div className="form-group">
                <label>Authentication Method</label>
                <select
                  value={newConnector.authMethod}
                  onChange={(e) => setNewConnector({ ...newConnector, authMethod: e.target.value as any })}
                >
                  <option value="API Key">API Key</option>
                  <option value="Bearer Token">Bearer Token</option>
                  <option value="Basic">Basic Auth</option>
                  <option value="OAuth2">OAuth 2.0</option>
                </select>
              </div>

              <div className="form-group">
                <label>API Key / Token</label>
                <input
                  type="password"
                  placeholder="Enter your API key or token"
                />
              </div>

              <div className="form-group">
                <label>Headers (Optional)</label>
                <textarea
                  placeholder={'{\n  "Content-Type": "application/json"\n}'}
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateConnector}>
                Create Connector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
