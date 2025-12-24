import { useState } from 'react';
import { Save } from 'lucide-react';
import './CommonPages.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'voice' | 'appearance' | 'backup'>('general');

  return (
    <div className="common-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-subtitle">Configure system preferences</p>
        </div>
        <button className="btn-primary">
          <Save size={16} />
          Save Changes
        </button>
      </div>

      <div className="settings-layout">
        <div className="settings-sidebar">
          <button
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
          <button
            className={`settings-tab ${activeTab === 'voice' ? 'active' : ''}`}
            onClick={() => setActiveTab('voice')}
          >
            Voice
          </button>
          <button
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            Appearance
          </button>
          <button
            className={`settings-tab ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            Backups/Export
          </button>
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>
              <div className="setting-item">
                <label>Site Name</label>
                <input type="text" defaultValue="BIM Admin" />
              </div>
              <div className="setting-item">
                <label>Admin Email</label>
                <input type="email" defaultValue="admin@bim.com" />
              </div>
              <div className="setting-item">
                <label>Timezone</label>
                <select>
                  <option>UTC</option>
                  <option>America/New_York</option>
                  <option>America/Los_Angeles</option>
                  <option>Europe/London</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Security Settings</h3>
              <div className="setting-item">
                <label>Session Timeout (minutes)</label>
                <input type="number" defaultValue="60" />
              </div>
              <div className="setting-item">
                <label>Two-Factor Authentication</label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Enable 2FA for all users
                </label>
              </div>
              <div className="setting-item">
                <label>API Key Management</label>
                <button className="btn-secondary">Rotate API Keys</button>
              </div>
            </div>
          )}

          {activeTab === 'voice' && (
            <div className="settings-section">
              <h3>Voice Pipeline Settings</h3>
              <div className="setting-item">
                <label>Speech-to-Text Provider</label>
                <select>
                  <option>OpenAI Whisper</option>
                  <option>Google Cloud</option>
                  <option>Azure</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Text-to-Speech Provider</label>
                <select>
                  <option>ElevenLabs</option>
                  <option>OpenAI TTS</option>
                  <option>Google Cloud</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Wake Word Detection</label>
                <label className="checkbox-label">
                  <input type="checkbox" />
                  Enable wake word ("Hey Ben")
                </label>
              </div>
              <div className="setting-item">
                <label>Latency Mode</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input type="radio" name="latency" defaultChecked />
                    Quality (slower, better quality)
                  </label>
                  <label className="radio-label">
                    <input type="radio" name="latency" />
                    Speed (faster, lower quality)
                  </label>
                </div>
              </div>
              <div className="setting-item">
                <label>Audio Device Permissions</label>
                <div className="status-indicator">
                  <span className="status-dot status-success"></span>
                  Microphone access granted
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3>Appearance Settings</h3>
              <div className="setting-item">
                <label>Brand Name</label>
                <input type="text" value="BIM" readOnly />
                <p className="setting-note">Brand name is locked to BIM</p>
              </div>
              <div className="setting-item">
                <label>Primary Color</label>
                <div className="color-picker">
                  <div className="color-swatch" style={{ backgroundColor: '#0A1120' }}></div>
                  <input type="text" value="#0A1120" readOnly />
                </div>
              </div>
              <div className="setting-item">
                <label>Accent Color</label>
                <div className="color-picker">
                  <div className="color-swatch" style={{ backgroundColor: '#2A0B12' }}></div>
                  <input type="text" value="#2A0B12" readOnly />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="settings-section">
              <h3>Backups & Export</h3>
              <div className="setting-item">
                <label>Automatic Backups</label>
                <label className="checkbox-label">
                  <input type="checkbox" defaultChecked />
                  Enable daily backups
                </label>
              </div>
              <div className="setting-item">
                <label>Export Data</label>
                <button className="btn-secondary">Export All Data</button>
                <p className="setting-note">Download all system data as JSON</p>
              </div>
              <div className="setting-item">
                <label>Last Backup</label>
                <p>2 hours ago</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
