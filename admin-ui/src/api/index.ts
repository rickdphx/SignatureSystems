// API Service Layer for BIM Admin
// All API calls are mocked for now but structured for easy replacement with real endpoints

export interface Connector {
  id: string;
  name: string;
  type: 'REST' | 'WebSocket' | 'SDK' | 'OAuth' | 'Webhook';
  baseUrl: string;
  authMethod: 'API Key' | 'Bearer Token' | 'Basic' | 'OAuth2';
  status: 'Connected' | 'Disconnected';
  enabled: boolean;
  lastTest?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  connectorId: string;
  connectorName: string;
  enabled: boolean;
  inputSchema: string;
  outputSchema: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive';
  lastLogin?: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: {
    console: boolean;
    integrations: boolean;
    tools: boolean;
    logs: boolean;
    settings: boolean;
    users: boolean;
    roles: boolean;
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  module: string;
  message: string;
  details?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Connectors API
export const getConnectors = async (): Promise<Connector[]> => {
  await delay(300);
  return [
    {
      id: '1',
      name: 'OpenAI GPT-4',
      type: 'REST',
      baseUrl: 'https://api.openai.com/v1',
      authMethod: 'Bearer Token',
      status: 'Connected',
      enabled: true,
      lastTest: '2 minutes ago'
    },
    {
      id: '2',
      name: 'Claude API',
      type: 'REST',
      baseUrl: 'https://api.anthropic.com/v1',
      authMethod: 'API Key',
      status: 'Connected',
      enabled: true,
      lastTest: '5 minutes ago'
    },
    {
      id: '3',
      name: 'ElevenLabs Voice',
      type: 'REST',
      baseUrl: 'https://api.elevenlabs.io/v1',
      authMethod: 'API Key',
      status: 'Connected',
      enabled: true,
      lastTest: '1 hour ago'
    },
    {
      id: '4',
      name: 'Custom Webhook',
      type: 'Webhook',
      baseUrl: 'https://example.com/webhook',
      authMethod: 'API Key',
      status: 'Disconnected',
      enabled: false
    }
  ];
};

export const createConnector = async (connector: Partial<Connector>): Promise<Connector> => {
  await delay(500);
  return {
    id: Math.random().toString(36).substr(2, 9),
    status: 'Disconnected',
    enabled: false,
    ...connector
  } as Connector;
};

export const testConnector = async (_id: string): Promise<boolean> => {
  await delay(1000);
  return Math.random() > 0.2;
};

// Tools API
export const getTools = async (): Promise<Tool[]> => {
  await delay(300);
  return [
    {
      id: '1',
      name: 'Web Search',
      description: 'Search the web for information',
      connectorId: '1',
      connectorName: 'OpenAI GPT-4',
      enabled: true,
      inputSchema: '{"query": "string"}',
      outputSchema: '{"results": "array"}'
    },
    {
      id: '2',
      name: 'Text-to-Speech',
      description: 'Convert text to speech',
      connectorId: '3',
      connectorName: 'ElevenLabs Voice',
      enabled: true,
      inputSchema: '{"text": "string", "voice": "string"}',
      outputSchema: '{"audioUrl": "string"}'
    },
    {
      id: '3',
      name: 'Code Execution',
      description: 'Execute code in a sandbox',
      connectorId: '2',
      connectorName: 'Claude API',
      enabled: false,
      inputSchema: '{"code": "string", "language": "string"}',
      outputSchema: '{"output": "string", "error": "string"}'
    }
  ];
};

export const createTool = async (tool: Partial<Tool>): Promise<Tool> => {
  await delay(500);
  return {
    id: Math.random().toString(36).substr(2, 9),
    enabled: false,
    ...tool
  } as Tool;
};

export const runTool = async (_id: string, _input: any): Promise<any> => {
  await delay(1500);
  return {
    success: true,
    output: 'Mock tool execution result',
    timestamp: new Date().toISOString()
  };
};

// Users API
export const getUsers = async (): Promise<User[]> => {
  await delay(300);
  return [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@bim.com',
      role: 'Administrator',
      status: 'Active',
      lastLogin: '2 hours ago'
    },
    {
      id: '2',
      name: 'Ben',
      email: 'ben@bim.com',
      role: 'System',
      status: 'Active',
      lastLogin: 'Now'
    },
    {
      id: '3',
      name: 'Developer User',
      email: 'dev@bim.com',
      role: 'Developer',
      status: 'Active',
      lastLogin: '1 day ago'
    }
  ];
};

// Roles API
export const getRoles = async (): Promise<Role[]> => {
  await delay(300);
  return [
    {
      id: '1',
      name: 'Administrator',
      permissions: {
        console: true,
        integrations: true,
        tools: true,
        logs: true,
        settings: true,
        users: true,
        roles: true
      }
    },
    {
      id: '2',
      name: 'Developer',
      permissions: {
        console: true,
        integrations: true,
        tools: true,
        logs: true,
        settings: false,
        users: false,
        roles: false
      }
    },
    {
      id: '3',
      name: 'Viewer',
      permissions: {
        console: true,
        integrations: false,
        tools: false,
        logs: true,
        settings: false,
        users: false,
        roles: false
      }
    }
  ];
};

// Logs API
export const getLogs = async (_filters?: {
  level?: string;
  module?: string;
  startTime?: string;
  endTime?: string;
}): Promise<LogEntry[]> => {
  await delay(400);
  return [
    {
      id: '1',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: 'info',
      module: 'Console',
      message: 'User initiated chat session'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: 'info',
      module: 'Connectors',
      message: 'OpenAI GPT-4 connector tested successfully'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      level: 'warning',
      module: 'Tools',
      message: 'Code Execution tool disabled due to security policy'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      level: 'error',
      module: 'Connectors',
      message: 'Custom Webhook connector failed health check',
      details: { error: 'Connection timeout' }
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      level: 'info',
      module: 'Auth',
      message: 'User admin@bim.com logged in'
    }
  ];
};

// Chat API
export const sendChatMessage = async (message: string): Promise<ChatMessage> => {
  await delay(1000);
  return {
    id: Math.random().toString(36).substr(2, 9),
    role: 'assistant',
    content: `This is a mock response to: "${message}". The actual Ben AI will be integrated here with streaming support.`,
    timestamp: new Date().toISOString()
  };
};

export const getChatHistory = async (): Promise<ChatMessage[]> => {
  await delay(300);
  return [
    {
      id: '1',
      role: 'user',
      content: 'Hello Ben, how are you?',
      timestamp: new Date(Date.now() - 600000).toISOString()
    },
    {
      id: '2',
      role: 'assistant',
      content: 'Hello! I\'m functioning well. How can I assist you today?',
      timestamp: new Date(Date.now() - 590000).toISOString()
    }
  ];
};

// Helper function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
