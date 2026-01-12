import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  createDatabaseAdapter, 
  DatabaseAdapter, 
  ChatSession, 
  ChatMessage,
  closeDatabaseConnection 
} from '../services/database';

interface ChatHistoryContextType {
  // Sessions
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  isLoading: boolean;
  error: string | null;
  
  // Session operations
  createNewSession: (databaseName: string, title?: string) => Promise<ChatSession>;
  selectSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Message operations
  currentMessages: ChatMessage[];
  addMessage: (userQuery: string, sqlQuery: string, result: Record<string, any>[] | null) => Promise<void>;
  
  // Database operations
  refreshSessions: () => Promise<void>;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const [adapter, setAdapter] = useState<DatabaseAdapter | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize database adapter
  useEffect(() => {
    const initDB = async () => {
      try {
        setIsLoading(true);
        const dbAdapter = await createDatabaseAdapter({ type: 'sqlite' });
        setAdapter(dbAdapter);
        
        // Load existing sessions
        const existingSessions = await dbAdapter.getSessions();
        setSessions(existingSessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
        console.error('Database initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initDB();

    return () => {
      closeDatabaseConnection();
    };
  }, []);

  const refreshSessions = useCallback(async () => {
    if (!adapter) return;
    try {
      const existingSessions = await adapter.getSessions();
      setSessions(existingSessions);
    } catch (err) {
      console.error('Failed to refresh sessions:', err);
    }
  }, [adapter]);

  const createNewSession = useCallback(async (databaseName: string, title?: string): Promise<ChatSession> => {
    if (!adapter) throw new Error('Database not initialized');
    
    try {
      const session = await adapter.createSession(databaseName, title);
      setSessions(prev => [session, ...prev]);
      setCurrentSession(session);
      setCurrentMessages([]);
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create session';
      setError(message);
      throw err;
    }
  }, [adapter]);

  const selectSession = useCallback(async (sessionId: string) => {
    if (!adapter) return;
    
    try {
      setIsLoading(true);
      const session = await adapter.getSession(sessionId);
      if (session) {
        setCurrentSession(session);
        const messages = await adapter.getMessages(sessionId);
        setCurrentMessages(messages);
      }
    } catch (err) {
      console.error('Failed to select session:', err);
      setError(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      setIsLoading(false);
    }
  }, [adapter]);

  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    if (!adapter) return;
    
    try {
      await adapter.updateSessionTitle(sessionId, newTitle);
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title: newTitle, updatedAt: new Date() } : s
      ));
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null);
      }
    } catch (err) {
      console.error('Failed to rename session:', err);
      throw err;
    }
  }, [adapter, currentSession]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!adapter) return;
    
    try {
      await adapter.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setCurrentMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      throw err;
    }
  }, [adapter, currentSession]);

  const addMessage = useCallback(async (
    userQuery: string, 
    sqlQuery: string, 
    result: Record<string, any>[] | null
  ) => {
    if (!adapter || !currentSession) return;
    
    try {
      const message = await adapter.addMessage(currentSession.id, userQuery, sqlQuery, result);
      setCurrentMessages(prev => [...prev, message]);
      
      // Update session title if it's the first message (auto-title based on first query)
      if (currentMessages.length === 0) {
        const autoTitle = userQuery.length > 40 ? userQuery.substring(0, 40) + '...' : userQuery;
        await renameSession(currentSession.id, autoTitle);
      }
    } catch (err) {
      console.error('Failed to add message:', err);
      throw err;
    }
  }, [adapter, currentSession, currentMessages.length, renameSession]);

  return (
    <ChatHistoryContext.Provider value={{
      sessions,
      currentSession,
      isLoading,
      error,
      createNewSession,
      selectSession,
      renameSession,
      deleteSession,
      currentMessages,
      addMessage,
      refreshSessions,
    }}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

export function useChatHistory() {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
}
