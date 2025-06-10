import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatMessage, Conversation } from '../types/chat';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isStreaming: boolean;
  
  // Actions
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number) => void;
  setIsStreaming: (streaming: boolean) => void;
  
  // Conversation actions
  createConversation: () => string;
  setCurrentConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  
  // Message actions
  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  clearMessages: (conversationId: string) => void;
  
  // Utility
  getCurrentConversation: () => Conversation | null;
  exportConversations: () => string;
  importConversations: (data: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      apiKey: '',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.7,
      maxTokens: 4000,
      isStreaming: false,

      setApiKey: (key) => {
        set({ apiKey: key });
        // Also update the environment variable reference
        if (typeof window !== 'undefined') {
          localStorage.setItem('claude-api-key', key);
        }
      },
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),

      createConversation: () => {
        const id = crypto.randomUUID();
        const newConversation: Conversation = {
          id,
          title: 'New Conversation',
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }));
        
        return id;
      },

      setCurrentConversation: (id) => set({ currentConversationId: id }),

      deleteConversation: (id) => {
        set((state) => {
          const conversations = state.conversations.filter((c) => c.id !== id);
          const currentConversationId = state.currentConversationId === id 
            ? conversations[0]?.id || null 
            : state.currentConversationId;
          
          return { conversations, currentConversationId };
        });
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date() } : c
          ),
        }));
      },

      addMessage: (conversationId, message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        };

        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, newMessage],
                  updatedAt: new Date(),
                  title: c.messages.length === 0 ? message.content.slice(0, 50) + '...' : c.title,
                }
              : c
          ),
        }));
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                  updatedAt: new Date(),
                }
              : c
          ),
        }));
      },

      clearMessages: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [], updatedAt: new Date() }
              : c
          ),
        }));
      },

      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get();
        return conversations.find((c) => c.id === currentConversationId) || null;
      },

      exportConversations: () => {
        const { conversations } = get();
        return JSON.stringify(conversations, null, 2);
      },

      importConversations: (data) => {
        try {
          const imported = JSON.parse(data) as Conversation[];
          set((state) => ({
            conversations: [...imported, ...state.conversations],
          }));
        } catch (error) {
          console.error('Failed to import conversations:', error);
        }
      },
    }),
    {
      name: 'claude-chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
        apiKey: state.apiKey,
        model: state.model,
        temperature: state.temperature,
        maxTokens: state.maxTokens,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.conversations) {
          // Convert string dates back to Date objects
          state.conversations = state.conversations.map((conversation: any) => ({
            ...conversation,
            createdAt: new Date(conversation.createdAt),
            updatedAt: new Date(conversation.updatedAt),
            messages: conversation.messages.map((message: any) => ({
              ...message,
              timestamp: new Date(message.timestamp),
            })),
          }));
        }
        
      },
    }
  )
);