import { useState } from "react";
import ConsoleHeader from "./ConsoleHeader";
import HeroSection from "./HeroSection";
import QueryWorkspace from "./QueryWorkspace";
import QueryInput from "./QueryInput";
import { QueryResult, ConnectionInfo } from "../types";



const API_BASE_URL = "http://localhost:8000";

interface ConsolePageProps {
  userName: string;
  databaseName: string;
  connectionInfo: ConnectionInfo;
}

export default function ConsolePage({
  userName,
  databaseName,
  connectionInfo,
}: ConsolePageProps) {
  const [developerMode, setDeveloperMode] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [pendingSqlQuery, setPendingSqlQuery] = useState<string | null>(null);
  const [pendingUserQuery, setPendingUserQuery] = useState<string | null>(null);

  const handleQuery = async (query: string) => {
    setIsProcessing(true);
    setError(null);

    if (!hasQueried) {
      setHasQueried(true);
    }

    try {
      const requestBody = {
        postgres_url: connectionInfo.connectionString,
        db_name: connectionInfo.dbName,
        user_query: query,
      };

      const response = await fetch(`${API_BASE_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data);
      
      // Show the SQL query in modal for approval
      setPendingUserQuery(query);
      setPendingSqlQuery(data.sql_query);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An error occurred while processing your query";
      setError(errorMessage);
      console.error("Query error:", err);
    } finally {
      setIsProcessing(false);
    }
  };


const executeApprovedQuery = async (sqlQuery: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/executer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "sql_query": sqlQuery,
      }),
    });

    if (!response.ok) {
      throw new Error(`Executor error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Executor result array:", data);
    return data;
  } catch (err) {
    console.error("Execution error:", err);
    return null;
  }
};

  const handleApproveQuery = async () => {
    if (!pendingSqlQuery || !pendingUserQuery) return;

    const resultData = await executeApprovedQuery(pendingSqlQuery);
    setResults(prev => [...prev, { user_query: pendingUserQuery, sql_query: pendingSqlQuery, data: resultData }]);
    setPendingSqlQuery(null);
    setPendingUserQuery(null);
  };


  const handleDiscardQuery = () => {
    setPendingSqlQuery(null);
    setPendingUserQuery(null);
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
          <QueryWorkspace results={results} error={error} />
        )}
      </main>

      {/* SQL Query Approval Modal */}
      {pendingSqlQuery && (
        <div className="bg-slate-100 border-t border-slate-300 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white border border-slate-300 rounded-md p-4 flex items-start gap-4">
              <pre className="flex-1 bg-slate-50 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                {pendingSqlQuery}
              </pre>
              <div className="flex gap-2">
                <button
                  onClick={handleApproveQuery}
                  className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  title="Approve"
                >
               
                </button>
                <button
                  onClick={handleDiscardQuery}
                  className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  title="Discard"
                >
               
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <QueryInput onSubmit={handleQuery} isProcessing={isProcessing} />
    </div>
  );
}
