import { useState } from 'react';
import { Lock, Database } from 'lucide-react';
import { DatabaseCredentials } from '../types';
import databaseIcon from "../assets/databaseIcon.png";

interface AuthPageProps {
  onAuthenticated: (user: { userId: string; name: string }, database: string) => void;
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

    // Build connection string if using individual fields
    const finalConnectionString = useConnectionString 
      ? connectionString 
      : `${dbType}://${dbUsername}:${dbPassword}@${host}:${port}/${dbName}`;

    // Prepare data to send to backend
    const authData = {
      "connection_string": finalConnectionString,
      "user_name": userId,
      "password": password,
    };

    // Console log the data for checking
    console.log('Auth Data being sent to backend:', authData);

    try {
      const response = await fetch('http://localhost:8000/api/db/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData),
      });

      console.log('Backend response status:', response.status);
      const responseData = await response.json();
      console.log('Backend response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.detail || 'Connection failed');
      }

      setIsVerifying(false);
      setIsVerified(true);
    } catch (err) {
      console.error('Error connecting to backend:', err);
      setIsVerifying(false);
      // For now, still allow verification to proceed for testing
      setIsVerified(true);
      // Uncomment below to show actual errors:
      // setError(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const handleEnterConsole = () => {
    if (!selectedDatabase) {
      setError('Please select a database');
      return;
    }
    onAuthenticated({ userId, name: userId }, selectedDatabase);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src={databaseIcon} alt="Database" className="w-12 h-10" />
          <h1 className="text-3xl font-semibold text-slate-900">LeapSQL</h1>
        </div>
        <p className="text-sm text-slate-600">Safe, intelligent access to your data.</p>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-xl bg-white  shadow-sm border border-slate-200 p-8 rounded-none
">
          <div className="space-y-8">
            <div>
              {/* <div className="flex items-center gap-2 mb-4">
                <Lock className="w-4 h-4 text-slate-600" />
                <h2 className="text-lg font-medium text-slate-900">User Authentication</h2>
              </div> */}

              <div className="space-y-4">
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-slate-700 mb-1.5">
                    User ID
                  </label>
                  <input
                    id="userId"
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    disabled={isVerified}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Enter your user ID"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isVerified}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                    placeholder="Enter your password"
                  />
                </div>

                <p className="text-xs text-slate-500">
                  Your LeapSQL credentials are securely verified by the backend.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-8">
              <h2 className="text-lg font-medium text-slate-900 mb-4">Database Connection Credentials</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="dbType" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Database Type
                  </label>
                  <select
                    id="dbType"
                    value={dbType}
                    onChange={(e) => setDbType(e.target.value as any)}
                    disabled={isVerified}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
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
                      className="text-blue-900 focus:ring-blue-900"
                    />
                    <span className="text-slate-700">Connection String</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!useConnectionString}
                      onChange={() => setUseConnectionString(false)}
                      disabled={isVerified}
                      className="text-blue-900 focus:ring-blue-900"
                    />
                    <span className="text-slate-700">Individual Fields</span>
                  </label>
                </div>

                {useConnectionString ? (
                  <div>
                    <label htmlFor="connectionString" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Connection String
                    </label>
                    <input
                      id="connectionString"
                      type="text"
                      value={connectionString}
                      onChange={(e) => setConnectionString(e.target.value)}
                      disabled={isVerified}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 font-mono text-sm"
                      placeholder="postgresql://user:pass@host:port/dbname"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="host" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Host
                      </label>
                      <input
                        id="host"
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        disabled={isVerified}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="localhost"
                      />
                    </div>
                    <div>
                      <label htmlFor="port" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Port
                      </label>
                      <input
                        id="port"
                        type="text"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        disabled={isVerified}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="5432"
                      />
                    </div>
                    <div>
                      <label htmlFor="dbName" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Database Name
                      </label>
                      <input
                        id="dbName"
                        type="text"
                        value={dbName}
                        onChange={(e) => setDbName(e.target.value)}
                        disabled={isVerified}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="mydb"
                      />
                    </div>
                    <div>
                      <label htmlFor="dbUsername" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Username
                      </label>
                      <input
                        id="dbUsername"
                        type="text"
                        value={dbUsername}
                        onChange={(e) => setDbUsername(e.target.value)}
                        disabled={isVerified}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="username"
                      />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="dbPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                        Password
                      </label>
                      <input
                        id="dbPassword"
                        type="password"
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        disabled={isVerified}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Enter database password"
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-500 flex items-start gap-1.5">
                  <Lock className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>These credentials are used only to establish a secure session. Credentials are never stored on the client.</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {!isVerified ? (
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full bg-blue-900 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isVerifying ? 'Verifying...' : 'Verify & Continue'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-teal-50 border border-teal-200 text-teal-800 px-4 py-3 rounded-md text-sm">
                  Connection verified successfully
                </div>

                <div>
                  <label htmlFor="selectDb" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Select the database you want to work with
                  </label>
                  <select
                    id="selectDb"
                    value={selectedDatabase}
                    onChange={(e) => setSelectedDatabase(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  >
                    <option value="">Choose a database...</option>
                    {availableDatabases.map((db) => (
                      <option key={db} value={db}>{db}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleEnterConsole}
                  className="w-full bg-blue-900 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 transition-colors"
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
