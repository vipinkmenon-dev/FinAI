import React, { useState } from 'react';
import { Sparkles, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('lead.dev@finai.io');
    setPassword('finance2026');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950 relative overflow-hidden">
      {/* Background Glow Spheres */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-navy-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl">
        {/* Logo & Headline */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-lg shadow-brand-500/30 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">FinAI</h2>
          <p className="text-xs text-brand-300 font-semibold mt-1">Smart Personal Finance Assistant</p>
          <p className="text-xs text-slate-400 mt-2">Sign in to access your ledger intelligence and proactive AI advisor</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/40">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 mt-2 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to FinAI'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Track Button */}
        <div className="mt-5 pt-5 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-400 mb-3">Exploring or testing the system?</p>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="w-full py-2.5 text-xs font-semibold text-brand-300 bg-brand-950/60 hover:bg-brand-900 border border-brand-500/30 rounded-xl transition-all"
          >
            Create New Account with Sample Data
          </button>
        </div>
      </div>
    </div>
  );
};
