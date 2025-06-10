import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Trash2, Edit3 } from 'lucide-react';
import { Button } from '../ui/button';
import { useChatStore } from '../../stores/chat-store';
import { useLocalization } from '../../hooks/use-localization';

export const ConversationList: React.FC = () => {
  const {
    conversations,
    currentConversationId,
    createConversation,
    setCurrentConversation,
    deleteConversation,
  } = useChatStore();
  const { t } = useLocalization();

  const handleNewConversation = () => {
    createConversation();
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(id);
    }
  };

  return (
    <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          onClick={handleNewConversation}
          variant="primary"
          size="sm"
          icon={Plus}
          className="w-full"
        >
          {t('chat.newChat')}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <motion.div
              key={conversation.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02 }}
              className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                currentConversationId === conversation.id
                  ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700'
                  : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-transparent'
              }`}
              onClick={() => setCurrentConversation(conversation.id)}
            >
              <div className="flex items-start gap-3">
                <MessageSquare
                  size={16}
                  className={`mt-0.5 flex-shrink-0 ${
                    currentConversationId === conversation.id
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-gray-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {conversation.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {conversation.messages.length} messages
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {conversation.updatedAt.toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Edit3}
                  className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Implement edit functionality
                  }}
                >
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  className="p-1 h-6 w-6 text-red-400 hover:text-red-600"
                  onClick={(e) => handleDeleteConversation(conversation.id, e)}
                >
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {conversations.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
            <div className="text-sm">{t('chat.emptyState')}</div>
            <div className="text-xs mt-1 opacity-75">
              {t('chat.emptyStateDescription')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};