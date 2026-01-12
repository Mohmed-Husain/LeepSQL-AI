import { useState } from 'react';
import AuthPage from './components/AuthPage';
import ConsolePage from './components/ConsolePage';
import { ConnectionInfo } from './types';
import { ThemeProvider } from './contexts/ThemeContext';
import { ChatHistoryProvider } from './contexts/ChatHistoryContext';

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

  return (
    <ThemeProvider>
      <ChatHistoryProvider>
        {!isAuthenticated ? (
          <AuthPage onAuthenticated={handleAuthenticated} />
        ) : (
          <ConsolePage userName={user!.name} databaseName={selectedDatabase} connectionInfo={connectionInfo!} />
        )}
      </ChatHistoryProvider>
    </ThemeProvider>
  );
}

export default App;
