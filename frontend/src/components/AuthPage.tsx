import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ConnectionInfo } from '../types';
import databaseIcon from "../assets/databaseIcon.png";
import ThemeToggle from './ThemeToggle';

interface AuthPageProps {
  onAuthenticated: (user: { userId: string; name: string }, database: string, connectionInfo: ConnectionInfo) => void;
}

export default function AuthPage({ onAuthenticated }: AuthPageProps) {
  // Auth state
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);

  // Database connection state
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
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [verifiedConnectionString, setVerifiedConnectionString] = useState('');

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        setAuthUser({ id: session.user.id, email: session.user.email || '' });
      }
    };
    checkSession();

    // Listen for auth changes (for OAuth redirects)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setAuthUser({ id: session.user.id, email: session.user.email || '' });
      } else {
        setIsAuthenticated(false);
        setAuthUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Email/Password Sign In
  const handleEmailSignIn = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password');
      return;
    }

    setIsAuthLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsAuthLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.user) {
      setIsAuthenticated(true);
      setAuthUser({ id: data.user.id, email: data.user.email || '' });
    }
  };

  // Email/Password Sign Up
  const handleEmailSignUp = async () => {
    setError('');
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsAuthLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsAuthLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    if (data.user) {
      if (data.user.identities?.length === 0) {
        setError('An account with this email already exists');
        return;
      }
      setIsAuthenticated(true);
      setAuthUser({ id: data.user.id, email: data.user.email || '' });
    }
  };

  // Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setError('');
    setIsAuthLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (authError) {
      setIsAuthLoading(false);
      setError(authError.message);
    }
  };

  // GitHub OAuth Sign In
  const handleGitHubSignIn = async () => {
    setError('');
    setIsAuthLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (authError) {
      setIsAuthLoading(false);
      setError(authError.message);
    }
  };

  // Sign Out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setAuthUser(null);
    setIsVerified(false);
    setSelectedDatabase('');
  };

  const handleVerify = async () => {
    setError('');

    if (useConnectionString && !connectionString) {
      setError('Please enter a connection string');
      return;
    }

    if (!useConnectionString && (!host || !port || !dbName || !dbUsername || !dbPassword)) {
      setError('Please fill in all database connection fields');
      return;
    }

    // Build connection string
    const finalConnectionString = useConnectionString
      ? connectionString
      : `${dbType}://${dbUsername}:${dbPassword}@${host}:${port}/${dbName}`;

    setIsVerifying(true);

    try {
      const response = await fetch('http://localhost:8000/api/verify-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_string: finalConnectionString,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsVerified(true);
        setAvailableDatabases(data.databases || []);
        setVerifiedConnectionString(finalConnectionString);
      } else {
        setError(data.message || 'Failed to verify connection');
      }
    } catch (err) {
      setError('Failed to connect to the server. Make sure the backend is running.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleEnterConsole = () => {
    if (!selectedDatabase) {
      setError('Please select a database');
      return;
    }

    const connectionInfo: ConnectionInfo = {
      connectionString: verifiedConnectionString,
      dbName: selectedDatabase
    };

    onAuthenticated(
      { userId: authUser?.id || '', name: authUser?.email || '' },
      selectedDatabase,
      connectionInfo
    );
  };

  // Render auth form if not authenticated
  if (!isAuthenticated) {
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
          <div className="w-full max-w-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 p-8 rounded-lg">
            <div className="space-y-6">
              {/* Auth Mode Toggle */}
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => { setAuthMode('signin'); setError(''); }}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors ${authMode === 'signin'
                    ? 'text-blue-900 dark:text-blue-400 border-b-2 border-blue-900 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setError(''); }}
                  className={`flex-1 pb-3 text-sm font-medium transition-colors ${authMode === 'signup'
                    ? 'text-blue-900 dark:text-blue-400 border-b-2 border-blue-900 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Email/Password Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="authPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <input
                    id="authPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                  />
                </div>

                {authMode === 'signup' && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm your password"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Email Auth Button */}
              <button
                onClick={authMode === 'signin' ? handleEmailSignIn : handleEmailSignUp}
                disabled={isAuthLoading}
                className="w-full bg-blue-900 dark:bg-blue-700 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-800 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAuthLoading ? 'Loading...' : authMode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Or continue with</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isAuthLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="text-sm font-medium">Google</span>
                </button>

                <button
                  onClick={handleGitHubSignIn}
                  disabled={isAuthLoading}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-900 dark:focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span className="text-sm font-medium">GitHub</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render database connection form after authentication

  // Render database connection form after authentication
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <header className="py-8 px-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Signed in as</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">{authUser?.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSignOut}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Sign Out
            </button>
            <ThemeToggle />
          </div>
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
        <div className="w-full max-w-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 p-8 rounded-lg">
          <div className="space-y-8">
            <div>
              <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 px-4 py-3 rounded-md text-sm mb-6">
                ✓ Authenticated successfully
              </div>

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
                {isVerifying ? 'Verifying...' : 'Verify Connection'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 px-4 py-3 rounded-md text-sm">
                  ✓ Database connection verified
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
