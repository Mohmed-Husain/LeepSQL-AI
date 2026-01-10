export default function HeroSection() {
  return (
    <div className="flex items-center justify-center h-full px-6">
      <div className="max-w-2xl text-center space-y-6">
        <h2 className="text-3xl font-semibold text-slate-900">
          Query Your Database in Plain English
        </h2>

        <p className="text-lg text-slate-600">
          LeapSQL translates your intent into safe, validated SQL — without exposing your database to risk.
        </p>

        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
            <span>Schema-aware query generation</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
            <span>Multi-layer validation before execution</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-700">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
            <span>Human-in-the-loop developer control</span>
          </div>
        </div>

        <div className="pt-8">
          <div className="inline-block bg-slate-100 border border-slate-200 rounded-lg px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Example:</p>
            <p className="text-sm text-slate-700">Show total sales by city for the last 30 days</p>
          </div>
        </div>
      </div>
    </div>
  );
}
