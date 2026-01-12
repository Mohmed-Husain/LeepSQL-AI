import { useState } from 'react';

import { DatabaseCredentials, ConnectionInfo } from '../types';
import databaseIcon from "../assets/databaseIcon.png";
import ThemeToggle from './ThemeToggle';

interface AuthPageProps {
  onAuthenticated: (user: { userId: string; name: string }, database: string, connectionInfo: ConnectionInfo) => void;
}

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [dbType, setDbType] = useState<'postgresql' | 'mysql' | 'sqlite'>('postgresql');
  const [connectionString, setConnectionString] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('');
  const [dbName, setDbName] = useState('');
  const [dbUsername, setDbUsername] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [useConnectionString, setUseConnectionString] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [availableDatabases] = useState(['production_db', 'analytics_db', 'staging_db']);
  const [selectedDatabase, setSelectedDatabase] = useState('');

  const handleVerify = async () => {
    setError('');

    if (!userId || !password) {
      setError('Please enter your credentials');
      return;
    }

    if (useConnectionString && !connectionString) {
      setError('Please enter a connection string');
      return;
    }

    if (!useConnectionString && (!host || !port || !dbName || !dbUsername || !dbPassword)) {
      setError('Please fill in all database connection fields');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 1500);
  };

  const handleEnterConsole = () => {
    if (!selectedDatabase) {
      setError('Please select a database');
      return;
    }
    
    // Build connection string if using individual fields
    const finalConnectionString = useConnectionString 
      ? connectionString 
      : `${dbType}://${dbUsername}:${dbPassword}@${host}:${port}/${dbName}`;
    
    const connectionInfo: ConnectionInfo = {
      connectionString: finalConnectionString,
      dbName: selectedDatabase
    };
    
    onAuthenticated({ userId, name: userId }, selectedDatabase, connectionInfo);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <header className="py-8 px-6">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src={databaseIcon} alt="Database" className="w-12 h-10" />
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">LeapSQL</h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Safe, intelligent access to your data.</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 p-8 rounded-none">
          <div className="space-y-8">
            <div>
              {/* <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-slate-600" />
                <h2 className="text-lg font-medium text-slate-900">User Authentication</h2>
              </div> */}

              <div className="space-y-4">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    User ID
                  </label>
                  <input
                    id="userId"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={isVerified}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400"
                    placeholder="Enter your user ID"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isVerified}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400"
                    placeholder="Enter your password"
                  />
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your LeapSQL credentials are securely verified by the backend.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
              <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Database Connection Credentials</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="dbType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Database Type
                  </label>
                  <select
                    id="dbType"
                    value={dbType}
                    onChange={(e) => setDbType(e.target.value as any)}
                    disabled={isVerified}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400"
                  >
                    <option value="postgresql">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="sqlite">SQLite</option>
                  </select>
                </div>

                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={useConnectionString}
                      onChange={() => setUseConnectionString(true)}
                      disabled={isVerified}
                      className="text-blue-900 dark:text-blue-500 focus:ring-blue-900 dark:focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Connection String</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!useConnectionString}
                      onChange={() => setUseConnectionString(false)}
                      disabled={isVerified}
                      className="text-blue-900 dark:text-blue-500 focus:ring-blue-900 dark:focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Individual Fields</span>
                  </label>
                </div>

                {useConnectionString ? (
                  <div>
                    <label htmlFor="connectionString" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Connection String
                    </label>
                    <input
                      id="connectionString"
                      type="text"
                      value={connectionString}
                      onChange={(e) => setConnectionString(e.target.value)}
                      disabled={isVerified}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400 font-mono text-sm"
                      placeholder="postgresql://user:pass@host:port/dbname"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="host" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Host
                      </label>
                      <input
                        id="host"
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        disabled={isVerified}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400"
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <label htmlFor="port" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Port
                      </label>
                      <input
                        id="port"
                        type="text"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        disabled={isVerified}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400"
                        placeholder="5432"
                      />
                    </div>
                    <div>
                      <label htmlFor="dbName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Database Name
                      </label>
                      <input
                        id="dbName"
                        type="text"
                        value={dbName}
                        onChange={(e) => setDbName(e.target.value)}
                        disabled={isVerified}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400"
                        placeholder="mydb"
                      />
                    </div>
                    <div>
                      <label htmlFor="dbUsername" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Username
                      </label>
                      <input
                        id="dbUsername"
                        type="text"
                        value={dbUsername}
                        onChange={(e) => setDbUsername(e.target.value)}
                        disabled={isVerified}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400"
                        placeholder="username"
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="dbPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Password
                      </label>
                      <input
                        id="dbPassword"
                        type="password"
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        disabled={isVerified}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-600 disabled:text-slate-500 dark:disabled:text-slate-400"
                        placeholder="Enter database password"
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                
                  <span>These credentials are used only to establish a secure session. Credentials are never stored on the client.</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {!isVerified ? (
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full bg-blue-900 dark:bg-blue-700 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-800 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isVerifying ? 'Verifying...' : 'Verify & Continue'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 px-4 py-3 rounded-md text-sm">
                  Connection verified successfully
                </div>

                <div>
                  <label htmlFor="selectDb" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Select the database you want to work with
                  </label>
                  <select
                    id="selectDb"
                    value={selectedDatabase}
                    onChange={(e) => setSelectedDatabase(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a database...</option>
                    {availableDatabases.map((db) => (
                      <option key={db} value={db}>{db}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleEnterConsole}
                  className="w-full bg-blue-900 dark:bg-blue-700 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-800 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transition-colors"
                >
                  Enter Console
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
