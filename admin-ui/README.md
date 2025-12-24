# BIM Admin UI

> **Dynamic Admin Control Center for SignatureBrain.com**

A fully dynamic, modern React admin interface for managing the BIM (Ben Intelligent Manager) system. This replaces any static HTML admin pages with a real, component-based, API-driven admin UI.

## 🎯 Features

### ✅ Fully Built & Ready to Deploy

1. **Ben Console** (Dashboard - `/admin`)
   - Real-time chat interface with Ben AI
   - Voice controls (microphone, audio level indicator)
   - Model selection (GPT-4, Claude, etc.)
   - Temperature and parameter controls
   - Torah filter toggle
   - Message streaming support
   - Chat export functionality
   - Voice settings panel (STT/TTS provider, speed, pitch)
   - **Key Feature**: Enter to send, Shift+Enter for new line

2. **Connections Hub** (`/admin/integrations`)
   - API connector management
   - Support for REST, WebSocket, SDK, OAuth, Webhook
   - Test connection functionality
   - Enable/disable connectors
   - Add connector modal with full configuration
   - Auth method support (API Key, Bearer Token, Basic, OAuth2)

3. **Tools Registry** (`/admin/tools`)
   - Manage Ben's capabilities
   - Tool input/output schema display
   - Test tool execution with JSON input
   - Connector binding
   - Enable/disable tools

4. **Users Management** (`/admin/users`)
   - User list with roles and status
   - Last login tracking
   - Invite user functionality (UI ready)
   - Edit/remove actions

5. **Roles & Permissions** (`/admin/roles`)
   - Permission matrix for all modules
   - Console, Integrations, Tools, Logs, Settings, Users, Roles
   - Visual permission indicators
   - Create/edit roles

6. **Logs & Audit Trail** (`/admin/logs`)
   - System, Connector, Tool Execution, Auth logs
   - Filterable by level (info, warning, error)
   - Timestamp and module tracking
   - Expandable log details (JSON)
   - Export functionality

7. **Settings** (`/admin/settings`)
   - General (site name, email, timezone)
   - Security (session timeout, 2FA, API keys)
   - **Voice** (STT/TTS provider, wake word, latency mode, device permissions)
   - Appearance (locked BIM branding)
   - Backups/Export

## 🎨 Brand Specifications

- **Name**: BIM (never "Signature Brain")
- **Primary Color**: `#0A1120` (Deep dark navy)
- **Accent Color**: `#2A0B12` (Deep dark burgundy)

## 🛠 Tech Stack

- React 18 + TypeScript
- Vite 7
- React Router 6
- Lucide React (icons)

## 🚀 Development

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

See DEPLOYMENT.md for deployment instructions.
