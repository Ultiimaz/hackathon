import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Clock } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center py-2"
      >
        <div className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-full text-sm">
          {message.content}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-6`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
            : 'bg-gradient-to-r from-teal-500 to-green-500 text-white'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-md'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm'
          }`}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.streaming && message.role === 'assistant' && (
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-flex items-center gap-1 text-sm opacity-70 mb-2"
              >
                <Clock size={12} />
                <span>Thinking...</span>
              </motion.div>
            )}
            {message.content}
          </div>
          
          {message.tools && message.tools.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-600">
              <div className="text-sm opacity-80 mb-2">Tools used:</div>
              {message.tools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-white/10 dark:bg-gray-700/50 rounded-lg p-2 mb-2 text-sm"
                >
                  <div className="font-medium">{tool.name}</div>
                  <div className="opacity-70 text-xs mt-1">
                    {JSON.stringify(tool.arguments, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </motion.div>
  );
};