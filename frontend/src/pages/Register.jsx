import React, { useState } from 'react';
import { Sparkles, Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CURRENCIES = [
  { symbol: '₹', name: '₹ Indian Rupee (INR)' },
  { symbol: '$', name: '$ US Dollar (USD)' },
  { symbol: '€', name: '€ Euro (EUR)' },
  { symbol: '£', name: '£ British Pound (GBP)' },
  { symbol: '¥', name: '¥ Japanese Yen (JPY)' }
];

export const Register = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, fullName, currency);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemoValues = () => {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    setFullName('Alex Finance Lead');
    setEmail(`alex.finai${randomSuffix}@gmail.com`);
    setPassword('finance2026');
    setCurrency('₹');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-navy-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-lg shadow-brand-500/30 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">Join FinAI</h2>
          <p className="text-xs text-brand-300 font-semibold mt-1">AI-Powered Personal Finance Tracker</p>
          <p className="text-xs text-slate-400 mt-1">Automatic sample ledger data will be created for immediate testing</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3.5 mb-5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-500/40">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Sharma"
                className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@finai.io"
                className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Preferred Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            >
              {CURRENCIES.map((c) => (
                <option key={c.symbol} value={c.symbol}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 mt-4 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Setting up ledger...' : 'Create Account & Seed Data'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-800 text-center space-y-2">
          <button
            type="button"
            onClick={handleFillDemoValues}
            className="text-xs text-brand-400 hover:underline"
          >
            ⚡ Auto-fill sample credentials
          </button>
          <div>
            <span className="text-xs text-slate-400">Already registered? </span>
            <button
              onClick={onSwitchToLogin}
              className="text-xs font-semibold text-white hover:underline ml-1"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
