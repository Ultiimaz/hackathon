import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Wifi, 
  WifiOff, 
  Wrench, 
  ToggleLeft, 
  ToggleRight,
  Trash2,
  TestTube,
  Loader,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Modal } from '../ui/modal';
import { useMCPStore } from '../../stores/mcp-store';
import { useLocalization } from '../../hooks/use-localization';
import { MCPConnection } from '../../types/mcp';
import toast from 'react-hot-toast';

export const MCPTools: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newConnectionName, setNewConnectionName] = useState('');
  const [newConnectionEndpoint, setNewConnectionEndpoint] = useState('');
  const [newConnectionType, setNewConnectionType] = useState<'remote' | 'local'>('remote');
  const [newConnectionCommand, setNewConnectionCommand] = useState('');
  const [newConnectionArgs, setNewConnectionArgs] = useState('');
  const [newConnectionPort, setNewConnectionPort] = useState('3000');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
  const {
    connections,
    addConnection,
    removeConnection,
    toggleTool,
    testConnection,
    connectToMCP,
    disconnectFromMCP,
    startLocalServer,
    stopLocalServer,
  } = useMCPStore();
  
  const { t } = useLocalization();

  const handleAddConnection = async () => {
    const name = newConnectionName.trim();
    const endpoint = newConnectionEndpoint.trim();
    const command = newConnectionCommand.trim();

    if (!name || (newConnectionType === 'remote' && !endpoint) || (newConnectionType === 'local' && !command)) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      const connectionData: Omit<MCPConnection, 'id' | 'status' | 'tools'> = {
        name,
        endpoint: newConnectionType === 'remote' ? endpoint : `http://localhost:${newConnectionPort}`,
        type: newConnectionType,
      };

      if (newConnectionType === 'local') {
        connectionData.command = command;
        connectionData.args = newConnectionArgs.trim() ? newConnectionArgs.trim().split(' ') : [];
        connectionData.port = parseInt(newConnectionPort);
      }

      addConnection(connectionData);
      
      // Reset form
      setNewConnectionName('');
      setNewConnectionEndpoint('');
      setNewConnectionCommand('');
      setNewConnectionArgs('');
      setNewConnectionPort('3000');
      setNewConnectionType('remote');
      setIsAddModalOpen(false);
      toast.success('Connection added successfully');
    } catch (error) {
      toast.error('Failed to add connection');
    }
  };

  const handleTestConnection = async () => {
    if (!newConnectionEndpoint.trim()) return;
    
    setIsTestingConnection(true);
    try {
      const isValid = await testConnection(newConnectionEndpoint.trim());
      toast[isValid ? 'success' : 'error'](
        isValid ? 'Connection test successful' : 'Connection test failed'
      );
    } catch (error) {
      toast.error('Connection test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleConnect = async (connectionId: string) => {
    try {
      await connectToMCP(connectionId);
      toast.success('Connected successfully');
    } catch (error) {
      toast.error('Failed to connect');
    }
  };

  const handleDisconnect = (connectionId: string) => {
    disconnectFromMCP(connectionId);
    toast.success('Disconnected');
  };

  const handleStartLocalServer = async (connectionId: string) => {
    try {
      await startLocalServer(connectionId);
      toast.success('Local server started successfully');
    } catch (error) {
      toast.error('Failed to start local server');
    }
  };

  const handleStopLocalServer = async (connectionId: string) => {
    try {
      await stopLocalServer(connectionId);
      toast.success('Local server stopped');
    } catch (error) {
      toast.error('Failed to stop local server');
    }
  };

  const getStatusIcon = (status: MCPConnection['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="text-green-500" size={16} />;
      case 'connecting':
      case 'starting':
        return <Loader className="text-yellow-500 animate-spin" size={16} />;
      case 'stopping':
        return <Loader className="text-orange-500 animate-spin" size={16} />;
      case 'error':
        return <WifiOff className="text-red-500" size={16} />;
      default:
        return <WifiOff className="text-gray-400" size={16} />;
    }
  };

  const getStatusText = (status: MCPConnection['status']) => {
    switch (status) {
      case 'connected':
        return t('tools.connected');
      case 'connecting':
        return t('tools.connecting');
      case 'starting':
        return 'Starting server...';
      case 'stopping':
        return 'Stopping server...';
      case 'error':
        return t('tools.error');
      default:
        return t('tools.disconnected');
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Wrench size={20} />
            {t('tools.title')}
          </h2>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="outline"
            size="sm"
            icon={Plus}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {connections.map((connection) => (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(connection.status)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {connection.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {getStatusText(connection.status)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  {connection.type === 'local' ? (
                    // Local server controls
                    <>
                      {connection.status === 'disconnected' && (
                        <Button
                          onClick={() => handleStartLocalServer(connection.id)}
                          variant="outline"
                          size="sm"
                        >
                          Start
                        </Button>
                      )}
                      {connection.status === 'connected' && (
                        <Button
                          onClick={() => handleStopLocalServer(connection.id)}
                          variant="outline"
                          size="sm"
                        >
                          Stop
                        </Button>
                      )}
                    </>
                  ) : (
                    // Remote server controls
                    <>
                      {connection.status === 'disconnected' && (
                        <Button
                          onClick={() => handleConnect(connection.id)}
                          variant="outline"
                          size="sm"
                        >
                          Connect
                        </Button>
                      )}
                      {connection.status === 'connected' && (
                        <Button
                          onClick={() => handleDisconnect(connection.id)}
                          variant="outline"
                          size="sm"
                        >
                          Disconnect
                        </Button>
                      )}
                    </>
                  )}
                  <Button
                    onClick={() => removeConnection(connection.id)}
                    variant="ghost"
                    size="sm"
                    icon={Trash2}
                    className="text-red-500 hover:text-red-700"
                  >
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              </div>

              {connection.tools.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Available Tools:
                  </div>
                  {connection.tools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {tool.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {tool.description}
                        </div>
                      </div>
                      <Button
                        onClick={() => toggleTool(connection.id, tool.id)}
                        variant="ghost"
                        size="sm"
                        icon={tool.enabled ? ToggleRight : ToggleLeft}
                        className={`p-1 ${
                          tool.enabled ? 'text-green-500' : 'text-gray-400'
                        }`}
                      >
                        <span className="sr-only">
                          {tool.enabled ? t('tools.disableTool') : t('tools.enableTool')}
                        </span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {connection.status === 'connected' && connection.tools.length === 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                  {t('tools.noTools')}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {connections.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Wrench size={32} className="mx-auto mb-3 opacity-50" />
            <div className="text-sm">{t('tools.noTools')}</div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              variant="outline"
              size="sm"
              icon={Plus}
              className="mt-3"
            >
              {t('tools.addConnection')}
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('tools.addConnection')}
      >
        <div className="space-y-4">
          <Input
            label={t('tools.connectionName')}
            value={newConnectionName}
            onChange={(e) => setNewConnectionName(e.target.value)}
            placeholder="My MCP Server"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Server Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="remote"
                  checked={newConnectionType === 'remote'}
                  onChange={(e) => setNewConnectionType(e.target.value as 'remote' | 'local')}
                  className="mr-2"
                />
                Remote Server
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="local"
                  checked={newConnectionType === 'local'}
                  onChange={(e) => setNewConnectionType(e.target.value as 'remote' | 'local')}
                  className="mr-2"
                />
                Local Server
              </label>
            </div>
          </div>

          {newConnectionType === 'remote' ? (
            <div>
              <Input
                label={t('tools.endpoint')}
                value={newConnectionEndpoint}
                onChange={(e) => setNewConnectionEndpoint(e.target.value)}
                placeholder="ws://localhost:8080/mcp"
              />
              <Button
                onClick={handleTestConnection}
                variant="outline"
                size="sm"
                icon={TestTube}
                loading={isTestingConnection}
                disabled={!newConnectionEndpoint.trim()}
                className="mt-2"
              >
                {t('tools.testConnection')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                label="NPX Command"
                value={newConnectionCommand}
                onChange={(e) => setNewConnectionCommand(e.target.value)}
                placeholder="@modelcontextprotocol/server-filesystem"
              />
              <Input
                label="Additional Arguments (optional)"
                value={newConnectionArgs}
                onChange={(e) => setNewConnectionArgs(e.target.value)}
                placeholder="--verbose --path /home/user"
              />
              <Input
                label="Port"
                type="number"
                value={newConnectionPort}
                onChange={(e) => setNewConnectionPort(e.target.value)}
                placeholder="3000"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Example commands:</strong></p>
                <p>• <code>@modelcontextprotocol/server-filesystem</code></p>
                <p>• <code>@modelcontextprotocol/server-brave-search</code></p>
                <p>• <code>mcp-server-git</code></p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              onClick={() => setIsAddModalOpen(false)}
              variant="outline"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAddConnection}
              variant="primary"
              disabled={
                !newConnectionName.trim() || 
                (newConnectionType === 'remote' && !newConnectionEndpoint.trim()) ||
                (newConnectionType === 'local' && !newConnectionCommand.trim())
              }
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};