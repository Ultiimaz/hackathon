import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MCPConnection, MCPTool, MCPMessage } from '../types/mcp';

interface MCPState {
  connections: MCPConnection[];
  
  // Actions
  addConnection: (connection: Omit<MCPConnection, 'id' | 'status' | 'tools'>) => void;
  removeConnection: (id: string) => void;
  updateConnectionStatus: (id: string, status: MCPConnection['status']) => void;
  updateConnectionTools: (id: string, tools: MCPTool[]) => void;
  toggleTool: (connectionId: string, toolId: string) => void;
  
  // MCP Protocol
  sendMessage: (connectionId: string, message: MCPMessage) => Promise<MCPMessage>;
  testConnection: (endpoint: string) => Promise<boolean>;
  connectToMCP: (connectionId: string) => Promise<void>;
  disconnectFromMCP: (connectionId: string) => void;
  
  // Utility
  getEnabledTools: () => MCPTool[];
  getConnectionById: (id: string) => MCPConnection | undefined;
}

export const useMCPStore = create<MCPState>()(
  persist(
    (set, get) => ({
      connections: [],

      addConnection: (connection) => {
        const newConnection: MCPConnection = {
          ...connection,
          id: crypto.randomUUID(),
          status: 'disconnected',
          tools: [],
        };
        
        set((state) => ({
          connections: [...state.connections, newConnection],
        }));
      },

      removeConnection: (id) => {
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
        }));
      },

      updateConnectionStatus: (id, status) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, status } : c
          ),
        }));
      },

      updateConnectionTools: (id, tools) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === id ? { ...c, tools } : c
          ),
        }));
      },

      toggleTool: (connectionId, toolId) => {
        set((state) => ({
          connections: state.connections.map((c) =>
            c.id === connectionId
              ? {
                  ...c,
                  tools: c.tools.map((t) =>
                    t.id === toolId ? { ...t, enabled: !t.enabled } : t
                  ),
                }
              : c
          ),
        }));
      },

      sendMessage: async (connectionId, message) => {
        const connection = get().getConnectionById(connectionId);
        if (!connection || connection.status !== 'connected') {
          throw new Error('Connection not available');
        }

        // Mock MCP protocol implementation
        // In a real implementation, this would use WebSocket or HTTP transport
        const response: MCPMessage = {
          jsonrpc: '2.0',
          id: message.id,
          result: { success: true },
        };

        return response;
      },

      testConnection: async (endpoint) => {
        try {
          // Mock connection test
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return Math.random() > 0.3; // 70% success rate for demo
        } catch {
          return false;
        }
      },

      connectToMCP: async (connectionId) => {
        const { updateConnectionStatus, updateConnectionTools } = get();
        
        updateConnectionStatus(connectionId, 'connecting');
        
        try {
          // Mock connection process
          await new Promise((resolve) => setTimeout(resolve, 2000));
          
          // Mock tools discovery
          const mockTools: MCPTool[] = [
            {
              id: 'file-reader',
              name: 'File Reader',
              description: 'Read and analyze files',
              inputSchema: {
                type: 'object',
                properties: {
                  path: { type: 'string', description: 'File path to read' },
                },
                required: ['path'],
              },
              enabled: true,
              connected: true,
            },
            {
              id: 'web-scraper',
              name: 'Web Scraper',
              description: 'Extract content from web pages',
              inputSchema: {
                type: 'object',
                properties: {
                  url: { type: 'string', description: 'URL to scrape' },
                  selector: { type: 'string', description: 'CSS selector (optional)' },
                },
                required: ['url'],
              },
              enabled: false,
              connected: true,
            },
          ];
          
          updateConnectionTools(connectionId, mockTools);
          updateConnectionStatus(connectionId, 'connected');
        } catch (error) {
          updateConnectionStatus(connectionId, 'error');
          throw error;
        }
      },

      disconnectFromMCP: (connectionId) => {
        const { updateConnectionStatus, updateConnectionTools } = get();
        updateConnectionStatus(connectionId, 'disconnected');
        updateConnectionTools(connectionId, []);
      },

      getEnabledTools: () => {
        const { connections } = get();
        return connections
          .flatMap((c) => c.tools)
          .filter((t) => t.enabled && t.connected);
      },

      getConnectionById: (id) => {
        const { connections } = get();
        return connections.find((c) => c.id === id);
      },
    }),
    {
      name: 'mcp-storage',
      partialize: (state) => ({
        connections: state.connections,
      }),
    }
  )
);