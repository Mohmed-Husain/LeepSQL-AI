import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { QueryResult } from '../types';
import SimpleChart from './SimpleChart';

interface QueryWorkspaceProps {
  result: QueryResult | null;
  error: string | null;
}

export default function QueryWorkspace({ result, error }: QueryWorkspaceProps) {
  const [isChartCollapsed, setIsChartCollapsed] = useState(false);
  const hasVisualization = result?.visualizationData !== undefined;

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

  return (
    <div className="flex h-full">
      <div className={`${hasVisualization && !isChartCollapsed ? 'w-1/2' : 'flex-1'} border-r border-slate-200 overflow-y-auto`}>
        <div className="p-6">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">
            Natural Language Output
          </h3>
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
              {result.naturalLanguageOutput}
            </p>
          </div>
        </div>
      </div>

      {hasVisualization && (
        <div className={`${isChartCollapsed ? 'w-12' : 'w-1/2'} bg-slate-50 relative transition-all duration-200`}>
          <button
            onClick={() => setIsChartCollapsed(!isChartCollapsed)}
            className="absolute left-2 top-4 z-10 p-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-900"
            aria-label={isChartCollapsed ? 'Expand chart' : 'Collapse chart'}
          >
            {isChartCollapsed ? (
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {!isChartCollapsed && (
            <div className="p-6 pl-16 h-full overflow-y-auto">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-6">
                Visual Analytics
              </h3>
              <SimpleChart data={result.visualizationData!} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
