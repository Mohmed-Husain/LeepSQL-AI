import databaseIcon from "../assets/databaseIcon.png";

interface ConsoleHeaderProps {
  userName: string;
  databaseName: string;
  developerMode: boolean;
  onDeveloperModeToggle: (enabled: boolean) => void;
}

export default function ConsoleHeader({
  userName,
  databaseName,
  developerMode,
  onDeveloperModeToggle
}: ConsoleHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={databaseIcon} alt="Database" className="w-9 h-8" />
            <h1 className="text-xl font-semibold text-slate-900">LeapSQL</h1>
          </div>
          <div className="text-sm text-slate-600">
            {databaseName}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-slate-700">Developer Mode</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={developerMode}
                onChange={(e) => onDeveloperModeToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 rounded-full peer-checked:bg-blue-900 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>

          <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
            <span className="text-sm text-slate-700">{userName}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <span className="text-xs text-slate-600">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
