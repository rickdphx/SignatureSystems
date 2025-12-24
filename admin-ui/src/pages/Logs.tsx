import { useState, useEffect } from 'react';
import { Download, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { getLogs, type LogEntry } from '../api';
import './CommonPages.css';

const Logs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'system' | 'connector' | 'tool' | 'auth'>('system');
  const [levelFilter, setLevelFilter] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const data = await getLogs();
    setLogs(data);
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const filteredLogs = logs.filter(log =>
    levelFilter === 'all' || log.level === levelFilter
  );

  return (
    <div className="common-page">
      <div className="page-header">
        <div>
          <h1>Logs & Audit Trail</h1>
          <p className="page-subtitle">System activity and monitoring</p>
        </div>
        <div className="header-actions">
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <button className="btn-secondary">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          System Logs
        </button>
        <button
          className={`tab ${activeTab === 'connector' ? 'active' : ''}`}
          onClick={() => setActiveTab('connector')}
        >
          Connector Logs
        </button>
        <button
          className={`tab ${activeTab === 'tool' ? 'active' : ''}`}
          onClick={() => setActiveTab('tool')}
        >
          Tool Execution
        </button>
        <button
          className={`tab ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          Auth/Audit
        </button>
      </div>

      <div className="logs-container">
        {filteredLogs.map((log) => (
          <div key={log.id} className={`log-entry log-${log.level}`}>
            <div className="log-header">
              <div className="log-level">
                {getLogIcon(log.level)}
                <span>{log.level.toUpperCase()}</span>
              </div>
              <span className="log-time">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="log-body">
              <span className="log-module">[{log.module}]</span>
              <span className="log-message">{log.message}</span>
            </div>
            {log.details && (
              <pre className="log-details">{JSON.stringify(log.details, null, 2)}</pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Logs;
