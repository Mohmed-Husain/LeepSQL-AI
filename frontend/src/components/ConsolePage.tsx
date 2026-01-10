import { useState } from 'react';
import ConsoleHeader from './ConsoleHeader';
import HeroSection from './HeroSection';
import QueryWorkspace from './QueryWorkspace';
import QueryInput from './QueryInput';
import { QueryResult } from '../types';

interface ConsolePageProps {
  userName: string;
  databaseName: string;
}

export default function ConsolePage({ userName, databaseName }: ConsolePageProps) {
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

    setTimeout(() => {
      const mockResult: QueryResult = {
        naturalLanguageOutput: `Based on your query "${query}", the analysis shows:\n\nThere were 1,248 orders placed in the last 30 days. Delhi contributed the highest revenue with $45,230, followed by Mumbai with $38,920 and Bangalore with $34,560.\n\nThe data indicates a 15% increase in order volume compared to the previous 30-day period, with consistent growth across all major metropolitan areas.`,
        visualizationData: {
          type: 'bar',
          labels: ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'],
          datasets: [
            {
              label: 'Revenue by City (USD)',
              data: [45230, 38920, 34560, 28340, 24890]
            }
          ]
        }
      };

      setCurrentResult(mockResult);
      setIsProcessing(false);
    }, 1500);
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
