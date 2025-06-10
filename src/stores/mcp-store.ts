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
  
  // Local Server Management
  startLocalServer: (connectionId: string) => Promise<void>;
  stopLocalServer: (connectionId: string) => Promise<void>;
  
  // NPX Command Execution
  executeCommand: (tool: string, input: any) => Promise<any>;
  
  // Utility
  getEnabledTools: () => MCPTool[];
  getConnectionById: (id: string) => MCPConnection | undefined;
  getToolsForServer: (command: string) => MCPTool[];
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
          type: connection.type || 'remote',
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
          method: 'response',
          result: { success: true },
        };

        return response;
      },

      testConnection: async () => {
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

      startLocalServer: async (connectionId) => {
        const connection = get().getConnectionById(connectionId);
        if (!connection || connection.type !== 'local' || !connection.command) {
          throw new Error('Invalid local server configuration');
        }

        const { updateConnectionStatus } = get();
        updateConnectionStatus(connectionId, 'starting');

        try {
          // Execute npx command
          const args = ['npx', connection.command, ...(connection.args || [])];
          
          console.log(`🔧 [MCP Server] Starting local MCP server...`);
          console.log(`   📦 Package: ${connection.command}`);
          console.log(`   🚀 Command: ${args.join(' ')}`);
          console.log(`   📂 Working Directory: ${process.cwd ? process.cwd() : '/Users/Sven/development/prive/hackathon'}`);
          console.log(`   🔌 Port: ${connection.port || 3000}`);
          if (connection.args && connection.args.length > 0) {
            console.log(`   ⚙️  Arguments: ${connection.args.join(' ')}`);
          }
          console.log(`   ⏰ Start Time: ${new Date().toISOString()}`);
          
          // Simulate server startup - in a real implementation this would spawn the actual process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Mock process info - in a real implementation this would be the actual PID
          const mockProcess = {
            pid: Math.floor(Math.random() * 10000) + 1000,
            started: new Date(),
          };

          console.log(`   🎯 Process ID: ${mockProcess.pid}`);
          console.log(`   ✅ MCP Server started successfully`);
          console.log(`   🌐 Endpoint: http://localhost:${connection.port || 3000}`);

          // Update connection with process info
          set((state) => ({
            connections: state.connections.map((c) =>
              c.id === connectionId 
                ? { ...c, serverProcess: mockProcess, status: 'connected' as const }
                : c
            ),
          }));

          // Load tools based on the MCP server type
          const tools = get().getToolsForServer(connection.command);
          console.log(`   🛠️  Loaded ${tools.length} tools: ${tools.map(t => t.name).join(', ')}`);
          get().updateConnectionTools(connectionId, tools);

        } catch (error) {
          console.log(`   ❌ Failed to start MCP server: ${error instanceof Error ? error.message : 'Unknown error'}`);
          updateConnectionStatus(connectionId, 'error');
          throw error;
        }
      },

      stopLocalServer: async (connectionId) => {
        const connection = get().getConnectionById(connectionId);
        if (!connection || connection.type !== 'local') {
          throw new Error('Invalid local server connection');
        }

        const { updateConnectionStatus, updateConnectionTools } = get();
        updateConnectionStatus(connectionId, 'stopping');

        try {
          // In a real implementation, this would kill the process
          console.log(`Stopping local MCP server with PID: ${connection.serverProcess?.pid}`);
          
          // Simulate server shutdown time
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Clear process info and tools
          set((state) => ({
            connections: state.connections.map((c) =>
              c.id === connectionId 
                ? { ...c, serverProcess: undefined, status: 'disconnected' as const }
                : c
            ),
          }));

          updateConnectionTools(connectionId, []);

        } catch (error) {
          updateConnectionStatus(connectionId, 'error');
          throw error;
        }
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

      executeCommand: async (tool: string, input: any) => {
        try {
          // This simulates executing an MCP tool command
          // In a real implementation, this would communicate with the actual MCP server
          console.log(`🚀 [MCP] Executing tool: ${tool}`, input);
          
          // Add a realistic delay to simulate tool execution
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
          
          // Simulate different tool behaviors with more realistic responses
          switch (tool) {
            case 'local-file-ops':
              const workingDir = process.cwd ? process.cwd() : '/Users/Sven/development/prive/hackathon';
              const fullPath = input.path?.startsWith('/') ? input.path : `${workingDir}/${input.path}`;
              
              if (input.operation === 'write') {
                console.log(`📝 [MCP File Operation] WRITE`);
                console.log(`   📂 Working Directory: ${workingDir}`);
                console.log(`   📄 File Path: ${input.path}`);
                console.log(`   🔗 Full Path: ${fullPath}`);
                console.log(`   📊 Content Length: ${input.content?.length || 0} bytes`);
                console.log(`   ⏰ Timestamp: ${new Date().toISOString()}`);
                console.log(`   ✅ File operation completed successfully`);
                
                return { 
                  success: true, 
                  message: `File '${input.path}' written successfully`,
                  fullPath: fullPath,
                  workingDirectory: workingDir,
                  bytesWritten: input.content?.length || 0,
                  timestamp: new Date().toISOString(),
                  operation: 'write'
                };
              } else if (input.operation === 'read') {
                console.log(`📖 [MCP File Operation] READ`);
                console.log(`   📂 Working Directory: ${workingDir}`);
                console.log(`   📄 File Path: ${input.path}`);
                console.log(`   🔗 Full Path: ${fullPath}`);
                console.log(`   📊 Simulated Size: 150 bytes`);
                console.log(`   ⏰ Timestamp: ${new Date().toISOString()}`);
                console.log(`   ✅ File read completed successfully`);
                
                return { 
                  success: true, 
                  content: `This is the content of file: ${input.path}\nLast modified: ${new Date().toISOString()}`,
                  fullPath: fullPath,
                  workingDirectory: workingDir,
                  size: 150,
                  encoding: 'utf-8',
                  operation: 'read'
                };
              } else if (input.operation === 'list') {
                const listPath = input.path || './';
                const fullListPath = listPath.startsWith('/') ? listPath : `${workingDir}/${listPath}`;
                
                console.log(`📁 [MCP File Operation] LIST`);
                console.log(`   📂 Working Directory: ${workingDir}`);
                console.log(`   📁 List Path: ${listPath}`);
                console.log(`   🔗 Full List Path: ${fullListPath}`);
                console.log(`   📊 Found 3 simulated files`);
                console.log(`   ⏰ Timestamp: ${new Date().toISOString()}`);
                console.log(`   ✅ Directory listing completed successfully`);
                
                return { 
                  success: true, 
                  files: [
                    { name: 'file1.txt', size: 1024, modified: new Date().toISOString() },
                    { name: 'file2.txt', size: 2048, modified: new Date().toISOString() },
                    { name: 'config.json', size: 512, modified: new Date().toISOString() }
                  ],
                  path: listPath,
                  fullPath: fullListPath,
                  workingDirectory: workingDir,
                  operation: 'list'
                };
              }
              break;
            case 'brave-search':
              return {
                success: true,
                query: input.query,
                results: [
                  {
                    title: `Search result for "${input.query}"`,
                    url: 'https://example.com/result1',
                    snippet: 'This is a sample search result snippet that would contain relevant information.'
                  },
                  {
                    title: `Another result for "${input.query}"`,
                    url: 'https://example.com/result2',
                    snippet: 'This is another sample search result with different content.'
                  }
                ],
                count: input.count || 10
              };
            case 'git-operations':
              return {
                success: true,
                command: input.command,
                output: `Executed git ${input.command}\nOn branch main\nYour branch is up to date with 'origin/main'.`,
                repository: input.repository || process.cwd()
              };
            case 'local-shell':
              return { 
                success: true, 
                command: input.command,
                output: `Command '${input.command}' executed successfully\nExecution completed at ${new Date().toISOString()}`,
                exitCode: 0,
                workdir: input.workdir || process.cwd()
              };
            default:
              return { 
                success: true, 
                tool: tool,
                result: 'Generic MCP tool executed successfully',
                input: input,
                timestamp: new Date().toISOString()
              };
          }
          
          return { success: false, error: 'Unknown operation for tool' };
        } catch (error) {
          console.error('Command execution failed:', error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            tool: tool,
            input: input,
            timestamp: new Date().toISOString()
          };
        }
      },

      getToolsForServer: (command: string) => {
        // Define tools based on common MCP server packages
        const toolsMap: Record<string, MCPTool[]> = {
          '@modelcontextprotocol/server-filesystem': [
            {
              id: 'local-file-ops',
              name: 'Local File Operations',
              description: 'Read, write, and manage local files',
              inputSchema: {
                type: 'object',
                properties: {
                  operation: { type: 'string', enum: ['read', 'write', 'list'] },
                  path: { type: 'string', description: 'File or directory path' },
                  content: { type: 'string', description: 'Content to write (for write operations)' },
                },
                required: ['operation', 'path'],
              },
              enabled: true,
              connected: true,
            },
          ],
          '@modelcontextprotocol/server-brave-search': [
            {
              id: 'brave-search',
              name: 'Brave Search',
              description: 'Search the web using Brave Search API',
              inputSchema: {
                type: 'object',
                properties: {
                  query: { type: 'string', description: 'Search query' },
                  count: { type: 'number', description: 'Number of results (optional)' },
                },
                required: ['query'],
              },
              enabled: true,
              connected: true,
            },
          ],
          'mcp-server-git': [
            {
              id: 'git-operations',
              name: 'Git Operations',
              description: 'Execute git commands and manage repositories',
              inputSchema: {
                type: 'object',
                properties: {
                  command: { type: 'string', description: 'Git command to execute' },
                  repository: { type: 'string', description: 'Repository path (optional)' },
                },
                required: ['command'],
              },
              enabled: true,
              connected: true,
            },
          ],
        };

        // Return tools for the specific server, or default tools if not found
        return toolsMap[command] || [
          {
            id: 'generic-mcp-tool',
            name: 'Generic MCP Tool',
            description: 'Generic MCP server functionality',
            inputSchema: {
              type: 'object',
              properties: {
                input: { type: 'string', description: 'Tool input' },
              },
              required: ['input'],
            },
            enabled: true,
            connected: true,
          },
        ];
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