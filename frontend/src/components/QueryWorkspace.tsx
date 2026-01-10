import { QueryResult } from '../types';

interface QueryWorkspaceProps {
  result: QueryResult | null;
  error: string | null;
}

export default function QueryWorkspace({ result, error }: QueryWorkspaceProps) {
  if (error) {
    return (
      <div className="flex items-center justify-center h-full px-6">
        <div className="max-w-lg w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900 mb-2">Query Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const data = result.data;
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="h-full overflow-auto p-6">
      <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
        Query Results
      </h3>
      
      {data && data.length > 0 ? (
        <div className="overflow-x-auto border border-slate-200 rounded-md">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                {columns.map((col) => (
                  <th key={col} className="px-4 py-2 text-left font-medium text-slate-700 border-b border-slate-200">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 text-slate-800">
                      {String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-slate-500">No results to display.</p>
      )}
    </div>
  );
}
