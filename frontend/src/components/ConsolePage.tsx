import { useState, useEffect } from "react";
import ConsoleHeader from "./ConsoleHeader";
import HeroSection from "./HeroSection";
import QueryWorkspace from "./QueryWorkspace";
import QueryInput from "./QueryInput";
import { QueryResult, ConnectionInfo } from "../types";
import { Check, X, AlertTriangle } from "lucide-react";



const API_BASE_URL = "http://10.95.226.252:8000";

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
  const [editedSqlQuery, setEditedSqlQuery] = useState<string>("");
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const [toastProgress, setToastProgress] = useState(100);

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
      
      // Call evaluator to check for problems
      const evalResponse = await fetch(`${API_BASE_URL}/api/evaluater`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_query: query,
          sql_query: data.sql_query,
          has_problem: false,
          problem_description: ""
        }),
      });
      
      if (evalResponse.ok) {
        const evalData = await evalResponse.json();
        console.log("Evaluator result:", evalData);
        
        if (evalData.has_problem) {
          // Show feedback toast with problem description
          setFeedbackToast({ message: evalData.problem_description, visible: true });
          setToastProgress(100);
        }
      }
      
      // Show the SQL query in modal for approval
      setPendingUserQuery(query);
      setPendingSqlQuery(data.sql_query);
      setEditedSqlQuery(data.sql_query);
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

    // Use edited query in developer mode, otherwise use original
    const queryToExecute = developerMode ? editedSqlQuery : pendingSqlQuery;
    
    const resultData = await executeApprovedQuery(queryToExecute);
    setResults(prev => [...prev, { user_query: pendingUserQuery, sql_query: queryToExecute, data: resultData }]);
    setPendingSqlQuery(null);
    setPendingUserQuery(null);
    setEditedSqlQuery("");
  };


  const handleDiscardQuery = () => {
    setPendingSqlQuery(null);
    setPendingUserQuery(null);
    setEditedSqlQuery("");
  };

  const closeFeedbackToast = () => {
    setFeedbackToast({ message: "", visible: false });
    setToastProgress(100);
  };

  // Auto-dismiss toast after 20 seconds with progress animation
  useEffect(() => {
    if (!feedbackToast.visible) return;

    const duration = 20000; // 20 seconds
    const interval = 50; // Update every 50ms
    const decrement = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setToastProgress((prev) => {
        if (prev <= 0) {
          clearInterval(progressTimer);
          setFeedbackToast({ message: "", visible: false });
          return 100;
        }
        return prev - decrement;
      });
    }, interval);

    return () => clearInterval(progressTimer);
  }, [feedbackToast.visible]);

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
              {developerMode ? (
                <textarea
                  value={editedSqlQuery}
                  onChange={(e) => setEditedSqlQuery(e.target.value)}
                  className="flex-1 bg-slate-50 p-3 rounded text-sm font-mono border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent resize-none min-h-[100px]"
                  placeholder="Edit SQL query..."
                />
              ) : (
                <pre className="flex-1 bg-slate-50 p-3 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                  {pendingSqlQuery}
                </pre>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleApproveQuery}
                  className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  title="Approve"
                >
                  <Check className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDiscardQuery}
                  className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  title="Discard"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {developerMode && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <span>⚠️</span> Caution: Editing queries may compromise database integrity. Use only if you understand SQL.
              </p>
            )}
          </div>
        </div>
      )}
      <QueryInput onSubmit={handleQuery} isProcessing={isProcessing} />

      {/* Feedback Toast Modal */}
      {feedbackToast.visible && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
          <div className="bg-amber-50 border border-amber-300 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 pr-12 relative">
              <button
                onClick={closeFeedbackToast}
                className="absolute top-3 right-3 p-1 hover:bg-amber-100 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4 text-amber-700" />
              </button>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800 mb-1">Query Evaluation Warning</h4>
                  <p className="text-sm text-amber-700">{feedbackToast.message}</p>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-amber-200">
              <div
                className="h-full bg-amber-500 transition-all duration-50 ease-linear"
                style={{ width: `${toastProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}