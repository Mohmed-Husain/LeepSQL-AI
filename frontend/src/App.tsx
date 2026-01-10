import { useState } from 'react';
import AuthPage from './components/AuthPage';
import ConsolePage from './components/ConsolePage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ userId: string; name: string } | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');

  const handleAuthenticated = (userData: { userId: string; name: string }, database: string) => {
    setUser(userData);
    setSelectedDatabase(database);
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return <ConsolePage userName={user!.name} databaseName={selectedDatabase} />;
}

export default App;
