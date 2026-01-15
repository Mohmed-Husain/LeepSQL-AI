
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ConnectionInfo } from '../types';

interface LandingPageProps {
  onAuthenticated?: (user: { userId: string; name: string }, database: string, connectionInfo: ConnectionInfo) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuthenticated }) => {
  const [postgresUrl, setPostgresUrl] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [verifiedConnectionString, setVerifiedConnectionString] = useState<string>('');

  useEffect(() => {
    // Scroll reveal animation
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-reveal').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleVerifyConnection = async () => {
    setError('');
    const url = postgresUrl.trim();

    if (!url) {
      setError('Please enter your PostgreSQL URL');
      return;
    }

    if (!url.startsWith('postgresql://')) {
      setError('Invalid PostgreSQL URL format. It should start with postgresql://');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('https://leepsql-ai-agents-production.up.railway.app/api/verify-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connection_string: url,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsVerified(true);
        setAvailableDatabases(data.databases || []);
        setVerifiedConnectionString(url);
        setError('');
      } else {
        setError(data.message || 'Failed to verify connection');
      }
    } catch (err) {
      setError('Failed to connect to the server. Make sure the backend is running on http://localhost:8000');
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

    // If onAuthenticated prop is provided, use it to navigate to console
    if (onAuthenticated) {
      onAuthenticated(
        { userId: 'guest', name: 'Guest User' },
        selectedDatabase,
        connectionInfo
      );
    } else {
      // Otherwise, you can redirect or handle navigation differently
      localStorage.setItem('postgresUrl', verifiedConnectionString);
      localStorage.setItem('selectedDatabase', selectedDatabase);
      alert(`Database "${selectedDatabase}" connected! Launching LeepSQL...`);
      // window.location.href = '/console';
    }
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, targetId: string) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Space Mono', monospace;
          background: #0f172a;
          color: #e2e8f0;
          overflow-x: hidden;
        }

        .font-display {
          font-family: 'Syne', sans-serif;
        }

        /* Animated gradient background */
        .gradient-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
          background-size: 200% 200%;
          animation: gradientShift 15s ease infinite;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* Grid overlay */
        .grid-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        /* Glowing orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.15;
          animation: float 10s ease-in-out infinite;
        }

        .orb-1 {
          width: 400px;
          height: 400px;
          background: #3b82f6;
          top: 10%;
          left: -10%;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 350px;
          height: 350px;
          background: #1e40af;
          top: 60%;
          right: -5%;
          animation-delay: 3s;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: #06b6d4;
          bottom: 10%;
          left: 30%;
          animation-delay: 6s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* Feature cards */
        .feature-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(59, 130, 246, 0.2);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.1), transparent);
          transition: left 0.5s ease;
        }

        .feature-card:hover::before {
          left: 100%;
        }

        .feature-card:hover {
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
        }

        /* Architecture diagram */
        .arch-box {
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid rgba(59, 130, 246, 0.3);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .arch-box:hover {
          border-color: rgba(59, 130, 246, 0.6);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }

        .arch-arrow {
          stroke: rgba(59, 130, 246, 0.5);
          stroke-width: 2;
          fill: none;
          stroke-dasharray: 5, 5;
          animation: dash 20s linear infinite;
        }

        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }

        /* Button styles */
        .btn-primary {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          border: 2px solid rgba(59, 130, 246, 0.5);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .btn-primary::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          transform: translate(-50%, -50%);
          transition: width 0.6s ease, height 0.6s ease;
        }

        .btn-primary:hover::before {
          width: 300px;
          height: 300px;
        }

        .btn-primary:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 40px rgba(59, 130, 246, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Loading animation */
        .loading-spinner {
          border: 3px solid rgba(59, 130, 246, 0.3);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Steps accordion */
        .step-item {
          background: rgba(15, 23, 42, 0.6);
          border-left: 3px solid rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
        }

        .step-item:hover {
          border-left-color: #3b82f6;
          background: rgba(15, 23, 42, 0.8);
        }

        .code-block {
          background: #1e293b;
          border: 1px solid rgba(59, 130, 246, 0.2);
          font-family: 'Space Mono', monospace;
          overflow-x: auto;
        }

        /* Security badge */
        .security-badge {
          background: linear-gradient(135deg, rgba(30, 64, 175, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
          border: 2px solid rgba(59, 130, 246, 0.4);
          backdrop-filter: blur(10px);
          animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.5); }
        }

        /* Scroll reveal */
        .scroll-reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease;
        }

        .scroll-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Input field */
        .input-field {
          background: rgba(15, 23, 42, 0.8);
          border: 2px solid rgba(59, 130, 246, 0.3);
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
      `}</style>

      {/* Background elements */}
      <div className="gradient-bg"></div>
      <div className="grid-overlay"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6 py-20">
          <div className="max-w-6xl mx-auto text-center">
            {/* Security Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-block security-badge rounded-full px-6 py-2 mb-8"
            >
              <span className="text-blue-400 font-bold text-sm">🛡️ ENTERPRISE-GRADE SECURITY</span>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display font-bold text-6xl md:text-8xl mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
                LeepSQL-AI
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-display text-3xl md:text-5xl font-semibold mb-6 text-slate-200"
            >
              Natural Language to SQL
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-xl md:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed"
            >
              Query your database in plain English. AI generates SQL. Multiple security layers protect your data.
            </motion.p>

            {/* CTA Button */}
            <motion.a
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              href="#get-started"
              onClick={(e) => handleSmoothScroll(e, '#get-started')}
              className="btn-primary inline-block px-10 py-5 rounded-xl font-bold text-xl text-white relative z-10"
            >
              Get Started →
            </motion.a>
          </div>
        </section>

        {/* What is LeepSQL Section */}
        <section className="py-20 px-6 scroll-reveal">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-5xl font-bold mb-16 text-center">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                🎯 What is LeepSQL?
              </span>
            </h2>

            <p className="text-xl text-slate-300 mb-16 text-center max-w-4xl mx-auto leading-relaxed">
              LeepSQL-AI lets non-technical users query databases using natural language while maintaining enterprise security through multiple protection layers.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <div className="feature-card rounded-2xl p-8">
                <div className="text-5xl mb-4">🤖</div>
                <h3 className="font-display text-2xl font-bold mb-4 text-blue-300">AI-Powered SQL Generation</h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Type "Show me top 10 customers" and watch AI instantly generate optimized SQL queries. No technical knowledge required.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="feature-card rounded-2xl p-8">
                <div className="text-5xl mb-4">🛡️</div>
                <h3 className="font-display text-2xl font-bold mb-4 text-blue-300">5-Layer Security</h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  AI validation + Backend checks + Human approval. Every query passes through multiple security checkpoints before execution.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="feature-card rounded-2xl p-8">
                <div className="text-5xl mb-4">👁️</div>
                <h3 className="font-display text-2xl font-bold mb-4 text-blue-300">Human-in-the-Loop</h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Review and approve SQL queries before execution. You maintain complete control over what runs on your database.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="feature-card rounded-2xl p-8">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="font-display text-2xl font-bold mb-4 text-blue-300">Read-Only by Default</h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  No accidental data modifications. All queries are read-only unless explicitly authorized, protecting your data integrity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture Section */}
        <section className="py-20 px-6 scroll-reveal">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-5xl font-bold mb-16 text-center">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                🏗️ Architecture
              </span>
            </h2>

            {/* Architecture Diagram */}
            <div className="relative mb-12">
              {/* Desktop Layout */}
              <div className="hidden md:block">
                <div className="flex items-center justify-center gap-8 mb-8">
                  <div className="arch-box rounded-xl p-6 text-center w-48">
                    <div className="text-4xl mb-2">💻</div>
                    <div className="font-bold text-lg mb-1">Frontend</div>
                    <div className="text-sm text-slate-400">(React)</div>
                  </div>

                  <svg width="60" height="40" className="flex-shrink-0">
                    <path d="M 0 20 L 60 20" className="arch-arrow" markerEnd="url(#arrowhead)" />
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="rgba(59, 130, 246, 0.5)" />
                      </marker>
                    </defs>
                  </svg>

                  <div className="arch-box rounded-xl p-6 text-center w-48">
                    <div className="text-4xl mb-2">⚡</div>
                    <div className="font-bold text-lg mb-1">Backend</div>
                    <div className="text-sm text-slate-400">(FastAPI)</div>
                  </div>

                  <svg width="60" height="40" className="flex-shrink-0">
                    <path d="M 0 20 L 60 20" className="arch-arrow" markerEnd="url(#arrowhead2)" />
                    <defs>
                      <marker id="arrowhead2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                        <polygon points="0 0, 10 3, 0 6" fill="rgba(59, 130, 246, 0.5)" />
                      </marker>
                    </defs>
                  </svg>

                  <div className="arch-box rounded-xl p-6 text-center w-48">
                    <div className="text-4xl mb-2">🤖</div>
                    <div className="font-bold text-lg mb-1">AI Agents</div>
                    <div className="text-sm text-slate-400">(LangGraph)</div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="relative">
                    <svg width="2" height="80" className="mx-auto">
                      <path d="M 1 0 L 1 80" className="arch-arrow" markerEnd="url(#arrowhead3)" />
                      <defs>
                        <marker id="arrowhead3" markerWidth="10" markerHeight="10" refX="3" refY="9" orient="auto">
                          <polygon points="0 0, 6 10, 3 0" fill="rgba(59, 130, 246, 0.5)" />
                        </marker>
                      </defs>
                    </svg>

                    <div className="arch-box rounded-xl p-6 text-center w-64">
                      <div className="text-4xl mb-2">🗄️</div>
                      <div className="font-bold text-lg mb-1">Database</div>
                      <div className="text-sm text-slate-400">(PostgreSQL)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden flex flex-col items-center gap-6">
                <div className="arch-box rounded-xl p-6 text-center w-full max-w-xs">
                  <div className="text-4xl mb-2">💻</div>
                  <div className="font-bold text-lg mb-1">Frontend</div>
                  <div className="text-sm text-slate-400">(React)</div>
                </div>

                <div className="text-2xl text-blue-400">↓</div>

                <div className="arch-box rounded-xl p-6 text-center w-full max-w-xs">
                  <div className="text-4xl mb-2">⚡</div>
                  <div className="font-bold text-lg mb-1">Backend</div>
                  <div className="text-sm text-slate-400">(FastAPI)</div>
                </div>

                <div className="text-2xl text-blue-400">↓</div>

                <div className="arch-box rounded-xl p-6 text-center w-full max-w-xs">
                  <div className="text-4xl mb-2">🤖</div>
                  <div className="font-bold text-lg mb-1">AI Agents</div>
                  <div className="text-sm text-slate-400">(LangGraph)</div>
                </div>

                <div className="text-2xl text-blue-400">↓</div>

                <div className="arch-box rounded-xl p-6 text-center w-full max-w-xs">
                  <div className="text-4xl mb-2">🗄️</div>
                  <div className="font-bold text-lg mb-1">Database</div>
                  <div className="text-sm text-slate-400">(PostgreSQL)</div>
                </div>
              </div>
            </div>

            {/* Key Principle */}
            <div className="feature-card rounded-2xl p-8 text-center max-w-3xl mx-auto">
              <div className="text-3xl mb-4">🔐</div>
              <h3 className="font-display text-2xl font-bold mb-4 text-cyan-300">Key Security Principle</h3>
              <p className="text-slate-300 text-lg leading-relaxed">
                AI Agent <span className="text-red-400 font-bold">NEVER</span> accesses database directly.
                <span className="text-blue-400 font-bold"> Backend is the single control plane</span>, ensuring all queries are validated, monitored, and controlled.
              </p>
            </div>
          </div>
        </section>

        {/* Get Started Section */}
        <section id="get-started" className="py-20 px-6 scroll-reveal">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-5xl font-bold mb-16 text-center">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                🚀 Get Started
              </span>
            </h2>

            {/* Postgres URL Input Section */}
            <div className="feature-card rounded-2xl p-8 mb-12">
              <h3 className="font-display text-2xl font-bold mb-6 text-blue-300">Connect Your Database</h3>

              <label className="block text-slate-300 mb-3 text-lg">Enter your Supabase PostgreSQL URL:</label>
              <input
                type="text"
                value={postgresUrl}
                onChange={(e) => setPostgresUrl(e.target.value)}
                placeholder="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
                className="input-field w-full px-6 py-4 rounded-xl text-slate-200 text-lg mb-6"
                disabled={isVerified}
              />

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm mb-6">
                  {error}
                </div>
              )}

              {!isVerified ? (
                <button
                  onClick={handleVerifyConnection}
                  disabled={isVerifying}
                  className="btn-primary w-full px-8 py-5 rounded-xl font-bold text-xl text-white relative z-10"
                >
                  {isVerifying ? (
                    <div className="loading-spinner inline-block"></div>
                  ) : (
                    <span>Verify Connection 🔍</span>
                  )}
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 px-4 py-3 rounded-md text-sm">
                    ✓ Database connection verified successfully
                  </div>

                  <div>
                    <label htmlFor="selectDb" className="block text-slate-300 mb-3 text-lg">
                      Select the database you want to work with:
                    </label>
                    <select
                      id="selectDb"
                      value={selectedDatabase}
                      onChange={(e) => setSelectedDatabase(e.target.value)}
                      className="input-field w-full px-6 py-4 rounded-xl text-slate-200 text-lg mb-6"
                    >
                      <option value="">Choose a database...</option>
                      {availableDatabases.map((db) => (
                        <option key={db} value={db}>{db}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleEnterConsole}
                    className="btn-primary w-full px-8 py-5 rounded-xl font-bold text-xl text-white relative z-10"
                  >
                    Launch LeepSQL 🚀
                  </button>
                </div>
              )}
            </div>

            {/* Instructions Section */}
            <div className="feature-card rounded-2xl p-8">
              <h3 className="font-display text-2xl font-bold mb-6 text-cyan-300">📋 How to Get Your Supabase Postgres URL</h3>

              <div className="space-y-4">
                <div className="step-item rounded-lg p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <span className="text-blue-400 font-bold text-xl flex-shrink-0">1.</span>
                    <div>
                      <p className="text-slate-300 text-lg">
                        Go to <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">app.supabase.com</a> and log in.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="step-item rounded-lg p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <span className="text-blue-400 font-bold text-xl flex-shrink-0">2.</span>
                    <div>
                      <p className="text-slate-300 text-lg">Open your project from the dashboard.</p>
                    </div>
                  </div>
                </div>

                <div className="step-item rounded-lg p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <span className="text-blue-400 font-bold text-xl flex-shrink-0">3.</span>
                    <div>
                      <p className="text-slate-300 text-lg">
                        Click <span className="text-blue-400 font-bold">Project Settings</span> in the left sidebar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="step-item rounded-lg p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <span className="text-blue-400 font-bold text-xl flex-shrink-0">4.</span>
                    <div>
                      <p className="text-slate-300 text-lg">
                        Navigate to the <span className="text-blue-400 font-bold">Database</span> section.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="step-item rounded-lg p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <span className="text-blue-400 font-bold text-xl flex-shrink-0">5.</span>
                    <div>
                      <p className="text-slate-300 text-lg">
                        Find <span className="text-blue-400 font-bold">Connection string</span> or <span className="text-blue-400 font-bold">Connection info</span>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="step-item rounded-lg p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <span className="text-blue-400 font-bold text-xl flex-shrink-0">6.</span>
                    <div>
                      <p className="text-slate-300 text-lg">
                        Choose <span className="text-blue-400 font-bold">URI format</span>.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="step-item rounded-lg p-5 pl-6">
                  <div className="flex items-start gap-4">
                    <span className="text-blue-400 font-bold text-xl flex-shrink-0">7.</span>
                    <div>
                      <p className="text-slate-300 text-lg mb-3">Copy the PostgreSQL URL. It should look like this:</p>
                      <div className="code-block rounded-lg p-4">
                        <code className="text-cyan-400 text-sm">postgresql://USER:PASSWORD@HOST:PORT/DATABASE</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-slate-800">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-slate-500 text-lg">
              &copy; 2026 LeepSQL-AI. Enterprise-grade security for everyone.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;