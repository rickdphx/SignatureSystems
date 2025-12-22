import React, { useState, useRef, useEffect } from 'react';

/**
 * BEN Chat Component with Auto-Focus
 *
 * Features:
 * - Auto-focuses input after sending message
 * - Supports Enter key to send
 * - Handles loading states
 * - Error handling
 * - Scrolls to bottom on new messages
 */
function BENChat({ apiUrl = 'http://127.0.0.1:8000/api/ben' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-focus input on component mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput(''); // Clear input immediately for better UX

    // Add user message to chat
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          context: null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add BEN's response to chat
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Error communicating with BEN:', error);

      // Add error message to chat
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'error',
        content: `Failed to get response from BEN: ${error.message}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);

      // ✨ AUTO-FOCUS: Refocus the input after sending message
      // Using setTimeout to ensure it happens after state updates
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  return (
    <div className="ben-chat-container">
      {/* Messages Area */}
      <div className="ben-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <h3>Welcome to BEN</h3>
            <p>Brain-like Emotional Network - Your AI Assistant</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message message-${msg.role}`}
          >
            <div className="message-content">
              {msg.content}
            </div>
            <div className="message-timestamp">
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message message-loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>BEN is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="ben-input-area">
        <input
          ref={inputRef}
          type="text"
          className="ben-input"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Message BEN..."
          disabled={isLoading}
          autoFocus
        />
        <button
          className="ben-send-button"
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default BENChat;


/* ============================================================================
 * STYLES (Optional - add to your CSS file)
 * ============================================================================

.ben-chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
  background: #1a1a1a;
  color: #fff;
}

.ben-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.welcome-message {
  text-align: center;
  margin-top: 50px;
  opacity: 0.7;
}

.message {
  padding: 12px 16px;
  border-radius: 12px;
  max-width: 80%;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-user {
  align-self: flex-end;
  background: #007bff;
  color: white;
}

.message-assistant {
  align-self: flex-start;
  background: #2d2d2d;
  border: 1px solid #444;
}

.message-error {
  align-self: center;
  background: #dc3545;
  color: white;
  max-width: 90%;
}

.message-loading {
  align-self: flex-start;
  background: #2d2d2d;
  border: 1px solid #444;
  display: flex;
  align-items: center;
  gap: 10px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #007bff;
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.message-timestamp {
  font-size: 0.75rem;
  opacity: 0.6;
  margin-top: 4px;
}

.ben-input-area {
  display: flex;
  gap: 10px;
  padding: 20px;
  background: #2d2d2d;
  border-top: 1px solid #444;
}

.ben-input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 24px;
  border: 1px solid #444;
  background: #1a1a1a;
  color: #fff;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.ben-input:focus {
  border-color: #007bff;
}

.ben-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ben-send-button {
  padding: 12px 24px;
  border-radius: 24px;
  border: none;
  background: #007bff;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.ben-send-button:hover:not(:disabled) {
  background: #0056b3;
}

.ben-send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

*/
