import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader, Send } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { useChatStore } from '../../stores/chat-store';
import { useMCPStore } from '../../stores/mcp-store';
import { ClaudeAPIService } from '../../services/claude-api';
import { useLocalization } from '../../hooks/use-localization';
import toast from 'react-hot-toast';

export const ChatInterface: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t } = useLocalization();
  
  const {
    getCurrentConversation,
    addMessage,
    updateMessage,
    createConversation,
    currentConversationId,
    apiKey,
    model,
    temperature,
    maxTokens,
    isStreaming,
    setIsStreaming,
  } = useChatStore();
  
  const { getEnabledTools } = useMCPStore();
  
  const currentConversation = getCurrentConversation();
  
  // Get API key from store or environment variable
  const effectiveApiKey = apiKey || import.meta.env.VITE_CLAUDE_API_KEY || '';
  const claudeAPI = new ClaudeAPIService(effectiveApiKey);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  useEffect(() => {
    // Create initial conversation if none exists
    if (!currentConversationId) {
      createConversation();
    }
  }, [currentConversationId, createConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message: string) => {
    if (!apiKey) {
      toast.error('Please set your Claude API key in settings');
      return;
    }

    if (!currentConversationId) {
      const newConversationId = createConversation();
      if (!newConversationId) return;
    }

    const conversationId = currentConversationId!;
    
    // Add user message
    addMessage(conversationId, {
      role: 'user',
      content: message,
    });

    // Prepare messages for API
    const conversation = getCurrentConversation();
    if (!conversation) return;

    const apiMessages = conversation.messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add the new message to API messages
    apiMessages.push({ role: 'user', content: message });

    setIsStreaming(true);
    
    // Add assistant message placeholder
    const assistantMessageId = crypto.randomUUID();
    addMessage(conversationId, {
      role: 'assistant',
      content: '',
      streaming: true,
    });

    try {
      let fullResponse = '';
      
      await claudeAPI.sendMessage(
        apiMessages,
        { model, temperature, maxTokens },
        (chunk: string) => {
          fullResponse += chunk;
          // Update the assistant message with streaming content
          const updatedConversation = getCurrentConversation();
          if (updatedConversation) {
            const lastMessage = updatedConversation.messages[updatedConversation.messages.length - 1];
            if (lastMessage.role === 'assistant') {
              updateMessage(conversationId, lastMessage.id, {
                content: fullResponse,
                streaming: true,
              });
            }
          }
        }
      );

      // Finalize the assistant message
      const finalConversation = getCurrentConversation();
      if (finalConversation) {
        const lastMessage = finalConversation.messages[finalConversation.messages.length - 1];
        if (lastMessage.role === 'assistant') {
          updateMessage(conversationId, lastMessage.id, {
            content: fullResponse,
            streaming: false,
          });
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
      
      // Remove the assistant message placeholder on error
      const errorConversation = getCurrentConversation();
      if (errorConversation) {
        const lastMessage = errorConversation.messages[errorConversation.messages.length - 1];
        if (lastMessage.role === 'assistant' && lastMessage.content === '') {
          // Remove the empty assistant message
          const updatedMessages = errorConversation.messages.slice(0, -1);
          // Update conversation without the failed message
          // Note: This is a simplified approach - in a real app you'd want a more robust error handling
        }
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleStopStreaming = () => {
    setIsStreaming(false);
    // In a real implementation, you'd abort the API request here
  };

  if (!apiKey) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 max-w-md"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('chat.errorConnecting')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please add your Claude API key in the settings to start chatting.
          </p>
        </motion.div>
      </div>
    );
  }

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8"
        >
          <Loader size={32} className="text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {t('common.loading')}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="popLayout">
            {currentConversation.messages.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  {t('chat.emptyState')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {t('chat.emptyStateDescription')}
                </p>
                
                {/* Quick Start Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 max-w-2xl mx-auto">
                  {[
                    'Help me write a Python function',
                    'Explain quantum computing',
                    'Review my code for bugs',
                    'Create a creative story',
                  ].map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage(suggestion)}
                      disabled={isStreaming}
                      className="p-4 text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-200"
                    >
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {suggestion}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              currentConversation.messages.map((message) => (
                <motion.div
                  key={message.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <ChatMessage message={message} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isStreaming}
        isStreaming={isStreaming}
        onStopStreaming={handleStopStreaming}
      />
    </div>
  );
};