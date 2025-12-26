# SignatureSystems

WebSocket server for terminal response system with dynamic push updates.

## Server Status
✅ **Server is running on 0.0.0.0:3000**

## Connection Details
- **Admin Token**: `admin-token-12345`
- **WebSocket Endpoints**:
  - `ws://localhost:3000` (local only)
  - `ws://127.0.0.1:3000` (local only)
  - `ws://21.0.0.150:3000` (network accessible)

## Test Client
Access the built-in test client at: **http://21.0.0.150:3000/**

The test client provides a web interface to:
- Configure the WebSocket URL
- Enter your admin token
- View live terminal responses
- Monitor connection status

## Usage

### Option 1: Built-in Test Client
1. Open http://21.0.0.150:3000/ in your browser
2. The WebSocket URL and admin token are pre-filled
3. Click "Connect"
4. Watch terminal responses appear every 1 second

### Option 2: External Client (signaturebrain.com/admin/)
1. Configure the WebSocket URL to `ws://21.0.0.150:3000`
2. Paste the admin token: `admin-token-12345`
3. Click "Connect"

## Commands
```bash
npm start          # Start the server
npm install        # Install dependencies
```

## Authentication Protocol
After connecting, send:
```json
{
  "type": "auth",
  "token": "admin-token-12345"
}
```

Server responds with:
```json
{
  "type": "auth_success",
  "message": "Authentication successful"
}
```

Then receive terminal updates every 1s:
```json
{
  "type": "terminal",
  "timestamp": "2025-12-26T02:00:00.000Z",
  "data": {
    "command": "status",
    "output": "System active - 2:00:00 AM",
    "uptime": 123
  }
}
```
