import { QueryResult } from '../types';
import { User, Database } from 'lucide-react';

interface QueryWorkspaceProps {
  results: QueryResult[];
  error: string | null;
}

export default function QueryWorkspace({ results, error }: QueryWorkspaceProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="max-w-lg w-full bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900 dark:text-red-200 mb-2">Query Error</h3>
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="h-full overflow-auto p-6 space-y-4">
      {results.map((result, index) => {
        const data = result.data;
        const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

        return (
          <div key={index} className="space-y-3">
            {/* User Query */}
            <div className="flex gap-3 justify-end">
              <div className="bg-blue-900 dark:bg-blue-700 text-white px-4 py-2 rounded-lg max-w-2xl">
                <p className="text-sm">{result.user_query}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-900 dark:text-blue-300" />
              </div>
            </div>

            {/* SQL Query & Results */}
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg inline-block">
                  <code className="text-sm text-slate-700 dark:text-slate-300">{result.sql_query}</code>
                </div>
                {data && data.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 dark:bg-slate-800">
                        <tr>
                          {columns.map((col) => (
                            <th key={col} className="px-4 py-2 text-left font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, idx) => (
                          <tr key={idx} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                            {columns.map((col) => (
                              <td key={col} className="px-4 py-2 text-slate-800 dark:text-slate-200">
                                {String(row[col] ?? '')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-sm">No results.</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
