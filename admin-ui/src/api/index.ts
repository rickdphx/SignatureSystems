// API Service Layer for BEN Admin
// Real backend API integration

const API_BASE = '/admin/api';

// Helper to get auth token
const getToken = () => {
  return localStorage.getItem('ben_admin_token') || '';
};

// Helper to make authenticated requests
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

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
  try {
    return await apiRequest<Connector[]>('/connectors');
  } catch (error) {
    console.error('Failed to fetch connectors:', error);
    return [];
  }
};

export const createConnector = async (connector: Partial<Connector>): Promise<Connector> => {
  return await apiRequest<Connector>('/connectors', {
    method: 'POST',
    body: JSON.stringify(connector),
  });
};

export const testConnector = async (id: string): Promise<boolean> => {
  try {
    const result = await apiRequest<{ success: boolean }>(`/connectors/${id}/test`, { method: 'POST' });
    return result.success;
  } catch {
    return false;
  }
};

// Tools API
export const getTools = async (): Promise<Tool[]> => {
  try {
    return await apiRequest<Tool[]>('/tools');
  } catch (error) {
    console.error('Failed to fetch tools:', error);
    return [];
  }
};

export const createTool = async (tool: Partial<Tool>): Promise<Tool> => {
  return await apiRequest<Tool>('/tools', {
    method: 'POST',
    body: JSON.stringify(tool),
  });
};

export const runTool = async (id: string, input: any): Promise<any> => {
  return await apiRequest<any>(`/tools/${id}/run`, {
    method: 'POST',
    body: JSON.stringify({ input }),
  });
};

// Users API
export const getUsers = async (): Promise<User[]> => {
  try {
    return await apiRequest<User[]>('/users');
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  }
};

// Roles API
export const getRoles = async (): Promise<Role[]> => {
  try {
    return await apiRequest<Role[]>('/roles');
  } catch (error) {
    console.error('Failed to fetch roles:', error);
    return [];
  }
};

// Logs API
export const getLogs = async (filters?: {
  level?: string;
  module?: string;
  startTime?: string;
  endTime?: string;
}): Promise<LogEntry[]> => {
  try {
    const params = new URLSearchParams(filters as any).toString();
    return await apiRequest<LogEntry[]>(`/logs${params ? `?${params}` : ''}`);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    return [];
  }
};

// Chat API
export const sendChatMessage = async (message: string): Promise<ChatMessage> => {
  return await apiRequest<ChatMessage>('/chat/send', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};

export const getChatHistory = async (): Promise<ChatMessage[]> => {
  try {
    return await apiRequest<ChatMessage[]>('/chat/history');
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    return [];
  }
};
