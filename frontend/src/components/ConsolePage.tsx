import { useState } from 'react';
import ConsoleHeader from './ConsoleHeader';
import HeroSection from './HeroSection';
import QueryWorkspace from './QueryWorkspace';
import QueryInput from './QueryInput';
import { QueryResult, ConnectionInfo } from '../types';

const API_BASE_URL = 'http://10.184.196.252:8000';

interface ConsolePageProps {
  userName: string;
  databaseName: string;
  connectionInfo: ConnectionInfo;
}

export default function ConsolePage({ userName, databaseName, connectionInfo }: ConsolePageProps) {
  const [developerMode, setDeveloperMode] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (query: string) => {
    setIsProcessing(true);
    setError(null);

    if (!hasQueried) {
      setHasQueried(true);
    }

    try {
      const requestBody = {
        "postgres_url": connectionInfo.connectionString,
        "db_name": connectionInfo.dbName,
        "user_query": query
      };

      const response = await fetch(`http://10.184.196.252:8000/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map API response to QueryResult format
      const result: QueryResult = {
        naturalLanguageOutput: data.naturalLanguageOutput || data.response || JSON.stringify(data),
        visualizationData: data.visualizationData
      };

      setCurrentResult(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while processing your query';
      setError(errorMessage);
      console.error('Query error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <ConsoleHeader
        userName={userName}
        databaseName={databaseName}
        developerMode={developerMode}
        onDeveloperModeToggle={setDeveloperMode}
      />

      <main className="flex-1 overflow-hidden">
        {!hasQueried ? (
          <HeroSection />
        ) : (
          <QueryWorkspace result={currentResult} error={error} />
        )}
      </main>

      <QueryInput onSubmit={handleQuery} isProcessing={isProcessing} />
    </div>
  );
}
