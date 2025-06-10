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
  type: 'remote' | 'local';
  command?: string; // npx command for local servers
  args?: string[]; // additional arguments
  port?: number; // port for local server
  status: 'connected' | 'disconnected' | 'connecting' | 'error' | 'starting' | 'stopping';
  tools: MCPTool[];
  serverProcess?: {
    pid: number;
    started: Date;
  };
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