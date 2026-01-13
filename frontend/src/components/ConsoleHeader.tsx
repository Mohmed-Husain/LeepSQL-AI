import { ArrowLeft, LogOut } from "lucide-react";
import databaseIcon from "../assets/databaseIcon.png";
import ThemeToggle from "./ThemeToggle";

interface ConsoleHeaderProps {
  userName: string;
  databaseName: string;
  developerMode: boolean;
  onDeveloperModeToggle: (enabled: boolean) => void;
  onLogout: () => void;
  onBackToDbSelect: () => void;
}

export default function ConsoleHeader({
  userName,
  databaseName,
  developerMode,
  onDeveloperModeToggle,
  onLogout,
  onBackToDbSelect
}: ConsoleHeaderProps) {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={databaseIcon} alt="Database" className="w-9 h-8" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">LeapSQL</h1>
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {databaseName}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-slate-700 dark:text-slate-300">Developer Mode</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={developerMode}
                onChange={(e) => onDeveloperModeToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer-checked:bg-blue-900 dark:peer-checked:bg-blue-600 transition-colors"></div>
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>

          <ThemeToggle />

          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-700 pl-6">
            <span className="text-sm text-slate-700 dark:text-slate-300">{userName}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
              <span className="text-xs text-slate-600 dark:text-slate-400">Connected</span>
            </div>
          </div>

          {/* Back & Logout Buttons */}
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-6">
            <button
              onClick={onBackToDbSelect}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Change Database"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Change DB</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
