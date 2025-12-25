const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Admin token validation
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token-12345';

// Store connected clients
const clients = new Map();

wss.on('connection', (ws, req) => {
  console.log('New connection attempt');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Handle token authentication
      if (data.type === 'auth' && data.token) {
        if (data.token === ADMIN_TOKEN) {
          clients.set(ws, { authenticated: true, connectedAt: Date.now() });
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Authentication successful'
          }));
          console.log('Client authenticated');

          // Start sending terminal responses
          startTerminalPush(ws);
        } else {
          ws.send(JSON.stringify({
            type: 'auth_failed',
            message: 'Invalid token'
          }));
          ws.close();
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected');
  });
});

function startTerminalPush(ws) {
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN && clients.has(ws)) {
      const terminalResponse = {
        type: 'terminal',
        timestamp: new Date().toISOString(),
        data: {
          command: 'status',
          output: `System active - ${new Date().toLocaleTimeString()}`,
          uptime: Math.floor((Date.now() - clients.get(ws).connectedAt) / 1000)
        }
      };

      ws.send(JSON.stringify(terminalResponse));
    } else {
      clearInterval(interval);
    }
  }, 1000);

  ws.on('close', () => {
    clearInterval(interval);
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: clients.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin token: ${ADMIN_TOKEN}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
});
