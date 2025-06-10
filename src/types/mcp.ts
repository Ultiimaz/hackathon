export interface MCPTool {
  id: string;
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
  enabled: boolean;
  connected: boolean;
}

export interface MCPConnection {
  id: string;
  name: string;
  endpoint: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  tools: MCPTool[];
}

export interface MCPMessage {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}