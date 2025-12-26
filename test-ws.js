const WebSocket = require('ws');

console.log('Connecting to ws://localhost:3000...');
const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('✅ Connected!');
  console.log('Sending auth message...');
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'admin-token-12345'
  }));
});

ws.on('message', (data) => {
  console.log('📨 Received:', data.toString());
  const msg = JSON.parse(data.toString());
  if (msg.type === 'terminal') {
    console.log('✅ Terminal update working!');
    process.exit(0);
  }
});

ws.on('error', (error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('Connection closed');
});

setTimeout(() => {
  console.log('Test complete');
  process.exit(0);
}, 5000);
