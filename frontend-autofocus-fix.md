# Frontend Auto-Focus Fix

## Problem
After sending a message to BEN, the input field doesn't automatically refocus, requiring the user to manually click back into the input field.

## Solution
Add auto-focus functionality after message submission using React refs.

---

## Implementation

### Option 1: Using React useRef Hook (Modern React)

```jsx
import { useRef, useEffect } from 'react';

function MessageInput() {
  // Create a ref for the input element
  const inputRef = useRef(null);

  const handleSendMessage = async (message) => {
    try {
      // Send message to BEN API
      const response = await fetch('/api/ben', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      // Handle response...

      // Auto-focus the input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Message BEN..."
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          handleSendMessage(e.target.value);
          e.target.value = '';
        }
      }}
    />
  );
}
```

### Option 2: Using setTimeout for Delayed Focus

Sometimes you need a slight delay for focus to work properly:

```jsx
const handleSendMessage = async (message) => {
  try {
    const response = await fetch('/api/ben', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    // Handle response...

    // Focus with slight delay to ensure DOM is ready
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);

  } catch (error) {
    console.error('Error sending message:', error);
  }
};
```

### Option 3: Focus in .then() Chain

```jsx
fetch('/api/ben', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userInput })
})
  .then(response => response.json())
  .then(data => {
    // Process response
    console.log(data.reply);

    // Clear and refocus input
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

---

## Complete Example Component

```jsx
import React, { useState, useRef } from 'react';

function BENChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput(''); // Clear input immediately

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/ben', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      // Add BEN's response to chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Failed to get response from BEN'
      }]);
    } finally {
      setIsLoading(false);

      // Auto-focus input after everything is done
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ben-chat">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="message loading">BEN is thinking...</div>}
      </div>

      <div className="input-area">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Message BEN..."
          disabled={isLoading}
          autoFocus // Initial focus on mount
        />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

export default BENChat;
```

---

## Key Points

1. **Use `useRef`**: Create a ref for the input element
2. **Attach ref**: Add `ref={inputRef}` to the input element
3. **Focus after send**: Call `inputRef.current.focus()` after the API response
4. **Use in finally**: Put focus in the `finally` block to ensure it runs even if there's an error
5. **Add autoFocus**: Include `autoFocus` prop on the input for initial page load focus

---

## Testing

After implementing, test:
- ✅ Send a message and verify input refocuses automatically
- ✅ Press Enter to send and verify focus returns
- ✅ Click Send button and verify focus returns
- ✅ Try on different browsers (Chrome, Firefox, Safari)
- ✅ Test on mobile devices (touch might behave differently)

---

## Troubleshooting

**If focus doesn't work:**
1. Add `setTimeout(() => inputRef.current?.focus(), 100)` for a small delay
2. Check if another element is stealing focus after your code runs
3. Ensure the input isn't disabled during the operation
4. Check browser console for any errors

**If focus works but keyboard doesn't appear on mobile:**
- Mobile browsers often block programmatic focus unless it's in direct response to user action
- Consider keeping the focus throughout the interaction instead of removing and re-adding
