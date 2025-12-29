const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Admin token validation
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-token-12345';

// Configuration file path
const CONFIG_FILE = path.join(__dirname, 'config.json');

// Store connected clients
const clients = new Map();

// Load configuration from file
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return {
    apis: {},
    benIntegration: {},
    settings: {}
  };
}

// Save configuration to file
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

// API Endpoints
app.post('/api/config', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const config = req.body;
  if (saveConfig(config)) {
    res.json({ success: true, message: 'Configuration saved' });

    // Broadcast config update to all connected clients
    broadcastToAll({
      type: 'config_updated',
      message: 'Configuration has been updated'
    });
  } else {
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

app.get('/api/config', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const config = loadConfig();
  // Don't send actual API keys to frontend, just indicate if they're set
  const safeConfig = {
    apis: {
      openai: { configured: !!config.apis?.openai },
      anthropic: { configured: !!config.apis?.anthropic },
      custom: config.apis?.custom || {}
    },
    benIntegration: config.benIntegration || {},
    settings: config.settings || {}
  };
  res.json(safeConfig);
});

app.post('/api/test-connection', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { service, url } = req.body;

  try {
    // Simple connectivity test
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 }).catch(() => null);
    res.json({
      success: !!response,
      status: response?.status || 'unreachable',
      message: response ? 'Connection successful' : 'Connection failed'
    });
  } catch (error) {
    res.json({
      success: false,
      message: error.message
    });
  }
});

// WebSocket handling
wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] New connection from ${clientIP}`);

  const url = new URL(req.url, 'http://localhost');
  const tokenFromUrl = url.searchParams.get('token');

  if (tokenFromUrl === ADMIN_TOKEN) {
    clients.set(ws, {
      authenticated: true,
      connectedAt: Date.now(),
      ip: clientIP
    });

    ws.send(JSON.stringify({
      type: 'auth_success',
      message: 'Authentication successful',
      serverTime: new Date().toISOString()
    }));

    console.log(`[${new Date().toISOString()}] Client authenticated`);
    startTerminalPush(ws);
  } else {
    ws.send(JSON.stringify({
      type: 'auth_failed',
      message: 'Invalid token'
    }));
    ws.close();
    return;
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(ws, data);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[${new Date().toISOString()}] Client disconnected`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function handleClientMessage(ws, data) {
  switch (data.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    case 'get_stats':
      ws.send(JSON.stringify({
        type: 'stats',
        data: {
          connectedClients: clients.size,
          uptime: process.uptime(),
          memory: process.memoryUsage()
        }
      }));
      break;
  }
}

function startTerminalPush(ws) {
  const interval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN && clients.has(ws)) {
      const clientInfo = clients.get(ws);
      ws.send(JSON.stringify({
        type: 'terminal',
        timestamp: new Date().toISOString(),
        data: {
          output: `System active - ${new Date().toLocaleTimeString()}`,
          uptime: Math.floor((Date.now() - clientInfo.connectedAt) / 1000),
          clients: clients.size
        }
      }));
    } else {
      clearInterval(interval);
    }
  }, 1000);

  ws.on('close', () => clearInterval(interval));
}

function broadcastToAll(message) {
  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    clients: clients.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║           BEN Admin Server Running                   ║
╚═══════════════════════════════════════════════════════╝

🌐 Server: ${HOST}:${PORT}
🔐 Admin Token: ${ADMIN_TOKEN}
📁 Config File: ${CONFIG_FILE}

WebSocket: ws://localhost:${PORT}
Health: http://localhost:${PORT}/health
API: http://localhost:${PORT}/api/*
  `);
});
