import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip, Mic, Square } from 'lucide-react';
import { Button } from '../ui/button';
import { useLocalization } from '../../hooks/use-localization';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  isStreaming = false,
  onStopStreaming,
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLocalization();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200; // Maximum height in pixels
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement voice recording functionality here
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={Paperclip}
            className="mb-2"
            disabled={disabled}
          >
            <span className="sr-only">Attach file</span>
          </Button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
              disabled={disabled}
              className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
              style={{ minHeight: '48px' }}
            />
            
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={isRecording ? Square : Mic}
                onClick={toggleRecording}
                className={`p-2 ${isRecording ? 'text-red-500' : ''}`}
                disabled={disabled}
              >
                <span className="sr-only">
                  {isRecording ? 'Stop recording' : 'Start recording'}
                </span>
              </Button>
            </div>
          </div>

          {isStreaming ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={Square}
              onClick={onStopStreaming}
              className="mb-2"
            >
              Stop
            </Button>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Send}
              disabled={disabled || !message.trim()}
              className="mb-2"
            >
              {t('common.send')}
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  );
};