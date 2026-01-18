import { createContext, useContext, useState, ReactNode } from 'react';

export interface ChatSession {
  id: string;
  sellerId: string;
  sellerName: string;
  productId?: string;
  productName?: string;
  isMinimized: boolean;
  unreadCount: number;
  type: 'seller' | 'support';
}

interface FloatingChatContextType {
  sessions: ChatSession[];
  openChat: (session: Omit<ChatSession, 'id' | 'isMinimized' | 'unreadCount'>) => void;
  closeChat: (id: string) => void;
  minimizeChat: (id: string) => void;
  expandChat: (id: string) => void;
  updateUnreadCount: (id: string, count: number) => void;
}

const FloatingChatContext = createContext<FloatingChatContextType | null>(null);

export const useFloatingChat = () => {
  const context = useContext(FloatingChatContext);
  if (!context) {
    throw new Error('useFloatingChat must be used within FloatingChatProvider');
  }
  return context;
};

export const FloatingChatProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const openChat = (session: Omit<ChatSession, 'id' | 'isMinimized' | 'unreadCount'>) => {
    // Check if chat already exists
    const existingSession = sessions.find(
      s => s.sellerId === session.sellerId && s.productId === session.productId
    );

    if (existingSession) {
      // Expand existing chat
      setSessions(prev => 
        prev.map(s => 
          s.id === existingSession.id ? { ...s, isMinimized: false } : s
        )
      );
      return;
    }

    // Create new chat session
    const newSession: ChatSession = {
      ...session,
      id: `chat-${Date.now()}`,
      isMinimized: false,
      unreadCount: 0
    };

    setSessions(prev => [...prev, newSession]);
  };

  const closeChat = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  const minimizeChat = (id: string) => {
    setSessions(prev => 
      prev.map(s => 
        s.id === id ? { ...s, isMinimized: true } : s
      )
    );
  };

  const expandChat = (id: string) => {
    setSessions(prev => 
      prev.map(s => 
        s.id === id ? { ...s, isMinimized: false } : s
      )
    );
  };

  const updateUnreadCount = (id: string, count: number) => {
    setSessions(prev => 
      prev.map(s => 
        s.id === id ? { ...s, unreadCount: count } : s
      )
    );
  };

  return (
    <FloatingChatContext.Provider 
      value={{ 
        sessions, 
        openChat, 
        closeChat, 
        minimizeChat, 
        expandChat, 
        updateUnreadCount 
      }}
    >
      {children}
    </FloatingChatContext.Provider>
  );
};
