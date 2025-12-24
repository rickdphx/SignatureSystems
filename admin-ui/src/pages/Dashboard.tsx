import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import { Send, Mic, MicOff, Volume2, Trash2, Download } from 'lucide-react';
import { sendChatMessage, getChatHistory, type ChatMessage } from '../api';
import './Dashboard.css';

const Dashboard = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [model, setModel] = useState('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [torahFilter, setTorahFilter] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    const history = await getChatHistory();
    setMessages(history);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(input);
      setMessages(prev => [...prev, response]);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic will be implemented here
  };

  const clearChat = () => {
    setMessages([]);
  };

  const exportChat = () => {
    const chatData = JSON.stringify(messages, null, 2);
    const blob = new Blob([chatData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Ben Console</h1>
        <p className="dashboard-subtitle">AI Assistant Control Center</p>
      </div>

      <div className="ben-console">
        <div className="console-controls">
          <div className="control-group">
            <label>Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5">GPT-3.5 Turbo</option>
              <option value="claude-3">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
            </select>
          </div>

          <div className="control-group">
            <label>Temperature: {temperature}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
            />
          </div>

          <div className="control-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={torahFilter}
                onChange={(e) => setTorahFilter(e.target.checked)}
              />
              Torah Filter
            </label>
          </div>

          <div className="control-actions">
            <button className="icon-btn" onClick={clearChat} title="Clear Chat">
              <Trash2 size={18} />
            </button>
            <button className="icon-btn" onClick={exportChat} title="Export Chat">
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="chat-container">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message message-${msg.role}`}>
                <div className="message-header">
                  <strong>{msg.role === 'user' ? 'You' : 'Ben'}</strong>
                  <span className="message-time">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message message-assistant">
                <div className="message-header">
                  <strong>Ben</strong>
                </div>
                <div className="message-content typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <div className="voice-controls">
              <button
                className={`voice-btn ${isRecording ? 'recording' : ''}`}
                onClick={toggleRecording}
                title={isRecording ? 'Stop Recording' : 'Start Recording'}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              {isRecording && (
                <div className="audio-level">
                  <div className="level-bar"></div>
                </div>
              )}
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              rows={3}
              disabled={isLoading}
            />

            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              <Send size={20} />
            </button>
          </div>
        </div>

        <div className="voice-settings">
          <h3>Voice Settings</h3>
          <div className="voice-options">
            <div className="voice-option">
              <label>Voice Provider</label>
              <select>
                <option value="elevenlabs">ElevenLabs</option>
                <option value="openai">OpenAI TTS</option>
                <option value="google">Google Cloud</option>
              </select>
            </div>
            <div className="voice-option">
              <label>Speed</label>
              <input type="range" min="0.5" max="2" step="0.1" defaultValue="1" />
            </div>
            <div className="voice-option">
              <label>Pitch</label>
              <input type="range" min="0.5" max="2" step="0.1" defaultValue="1" />
            </div>
            <button className="voice-test-btn">
              <Volume2 size={16} /> Test Voice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
