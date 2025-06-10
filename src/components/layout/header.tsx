import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Moon, 
  Sun, 
  Zap, 
  MessageSquare,
  Wrench,
} from 'lucide-react';
import { Button } from '../ui/button';
import { SettingsPanel } from '../settings/settings-panel';
import { useChatStore } from '../../stores/chat-store';
import { useMCPStore } from '../../stores/mcp-store';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { conversations, apiKey, setApiKey } = useChatStore();
  const { connections } = useMCPStore();

  // Check for environment variable on component mount
  React.useEffect(() => {
    if (!apiKey) {
      const envApiKey = import.meta.env.VITE_CLAUDE_API_KEY;
      if (envApiKey) {
        setApiKey(envApiKey);
      }
    }
  }, [apiKey, setApiKey]);

  const connectedTools = connections.filter(c => c.status === 'connected').length;
  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Claude API Chat
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  AI Assistant with MCP Tools
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} />
                <span>{totalMessages} messages</span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench size={16} />
                <span>{connectedTools} tools connected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-500' : 'bg-red-500'}`} />
                <span>{apiKey ? 'API Connected' : 'No API Key'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={onToggleDarkMode}
                variant="ghost"
                size="sm"
                icon={isDarkMode ? Sun : Moon}
              >
                <span className="sr-only">Toggle theme</span>
              </Button>
              
              <Button
                onClick={() => setIsSettingsOpen(true)}
                variant="outline"
                size="sm"
                icon={Settings}
              >
                Settings
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};