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
  const clientIP = req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] New connection from ${clientIP}`);

  ws.on('message', (message) => {
    try {
      console.log(`[${new Date().toISOString()}] Received message:`, message.toString());
      const data = JSON.parse(message);

      // Handle token authentication
      if (data.type === 'auth' && data.token) {
        if (data.token === ADMIN_TOKEN) {
          clients.set(ws, { authenticated: true, connectedAt: Date.now() });
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Authentication successful'
          }));
          console.log(`[${new Date().toISOString()}] Client authenticated successfully`);

          // Start sending terminal responses
          startTerminalPush(ws);
        } else {
          console.log(`[${new Date().toISOString()}] Authentication failed - invalid token`);
          ws.send(JSON.stringify({
            type: 'auth_failed',
            message: 'Invalid token'
          }));
          ws.close();
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error processing message:`, error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[${new Date().toISOString()}] Client disconnected`);
  });

  ws.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] WebSocket error:`, error);
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

// Serve test client
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/test-client.html');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: clients.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Admin token: ${ADMIN_TOKEN}`);
  console.log(`\nWebSocket endpoints:`);
  console.log(`  - ws://localhost:${PORT}`);
  console.log(`  - ws://127.0.0.1:${PORT}`);

  // Try to get the actual IP
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  - ws://${iface.address}:${PORT}`);
      }
    });
  });

  console.log(`\nHealth check: http://localhost:${PORT}/health`);
});
