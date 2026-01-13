import { useState } from 'react';
import AuthPage from './components/AuthPage';
import ConsolePage from './components/ConsolePage';
import { ConnectionInfo } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatHistoryProvider } from './contexts/ChatHistoryContext';
import { supabase } from './lib/supabase';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ userId: string; name: string } | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [connectionInfo, setConnectionInfo] = useState<ConnectionInfo | null>(null);

  const handleAuthenticated = (userData: { userId: string; name: string }, database: string, connInfo: ConnectionInfo) => {
    setUser(userData);
    setSelectedDatabase(database);
    setConnectionInfo(connInfo);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    // Reset all state
    setIsAuthenticated(false);
    setUser(null);
    setSelectedDatabase('');
    setConnectionInfo(null);
  };

  const handleBackToDbSelect = () => {
    // Keep user logged in but go back to database selection
    setIsAuthenticated(false);
    setSelectedDatabase('');
    setConnectionInfo(null);
  };

  return (
    <ThemeProvider>
      {!isAuthenticated ? (
        <AuthPage onAuthenticated={handleAuthenticated} />
      ) : (
        <ChatHistoryProvider userId={user!.userId}>
          <ConsolePage 
            userName={user!.name} 
            databaseName={selectedDatabase} 
            connectionInfo={connectionInfo!}
            onLogout={handleLogout}
            onBackToDbSelect={handleBackToDbSelect}
          />
        </ChatHistoryProvider>
      )}
    </ThemeProvider>
  );
}

export default App;
