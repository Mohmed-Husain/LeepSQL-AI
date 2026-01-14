export default function HeroSection() {
  return (
    <div className="flex items-center justify-center h-full px-6">
      <div className="max-w-2xl text-center space-y-6">
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
          Query Your Database in Plain English
        </h2>

        <p className="text-lg text-slate-600 dark:text-slate-400">
          LeapSQL translates your intent into safe, validated SQL — without exposing your database to risk.
        </p>

        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
            <span>Schema-aware query generation</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
            <span>Multi-layer validation before execution</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full"></div>
            <span>Human-in-the-loop developer control</span>
          </div>
        </div>

        <div className="pt-8">
<<<<<<< HEAD
          <div className="inline-block bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Example:</p>
            <p className="text-sm text-slate-700">Which city gives us the most revenue?</p>
=======
          <div className="inline-block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Example:</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">Show total sales by city for the last 30 days</p>
>>>>>>> 9dfb28acfc1b6bb5c42cce7b35dfa8d459e7f7e6
          </div>
        </div>
      </div>
    </div>
  );
}
