import { useState } from 'react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  isProcessing: boolean;
}

export default function QueryInput({ onSubmit, isProcessing }: QueryInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = () => {
    if (query.trim() && !isProcessing) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white border-t border-slate-200 px-6 py-4">
      <div className="max-w-4xl mx-auto flex gap-3">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          placeholder="Ask LeapSQL about your data…"
          rows={2}
          className="flex-1 px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent resize-none disabled:bg-slate-50 disabled:text-slate-500"
        />
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || isProcessing}
          className="px-6 py-3 bg-blue-900 text-white rounded-md font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? 'Processing...' : 'Run Query'}
        </button>
      </div>
    </div>
  );
}
