import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  User,
  DollarSign,
  Bell,
  Sun,
  Moon,
  Lock,
  Database,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

const CURRENCIES = [
  { symbol: '₹', code: 'INR', name: 'Indian Rupee (₹)' },
  { symbol: '$', code: 'USD', name: 'US Dollar ($)' },
  { symbol: '€', code: 'EUR', name: 'Euro (€)' },
  { symbol: '£', code: 'GBP', name: 'British Pound (£)' },
  { symbol: '¥', code: 'JPY', name: 'Japanese Yen (¥)' },
  { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar (C$)' },
  { symbol: 'A$', code: 'AUD', name: 'Australian Dollar (A$)' }
];

export const Settings = ({ onDataReloaded }) => {
  const { user, updateUser } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();

  // Profile Form
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || '₹');
  const [alertThreshold, setAlertThreshold] = useState(user?.alert_threshold || 80);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [savingPw, setSavingPw] = useState(false);

  // Demo Reset
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });
    setSavingProfile(true);

    try {
      const res = await api.updateProfile({
        full_name: fullName.trim(),
        currency: selectedCurrency,
        alert_threshold: parseFloat(alertThreshold)
      });
      updateUser(res.user);
      setCurrency(res.user.currency);
      setProfileMsg({ type: 'success', text: 'Profile preferences updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setSavingPw(true);
    try {
      await api.changePassword({
        old_password: oldPassword,
        new_password: newPassword
      });
      setPwMsg({ type: 'success', text: 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setSavingPw(false);
    }
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('This will reload sample transactions and budgets for testing. Proceed?')) return;
    setResetting(true);
    setResetMsg('');
    try {
      const res = await api.resetDemoData();
      setResetMsg('Sample ledger data reloaded successfully!');
      if (onDataReloaded) onDataReloaded();
    } catch (err) {
      alert(err.message || 'Failed to reload demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">System Settings & Preferences</h3>
            <p className="text-xs text-slate-400">Configure ledger currency, budget alerts, and security</p>
          </div>
        </div>

        {/* Theme pill */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-xs font-semibold text-slate-300 transition-colors"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          <span className="capitalize">{theme} Theme</span>
        </button>
      </div>

      {/* Profile & Currency Preferences Form */}
      <div className="p-6 md:p-8 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
        <h4 className="text-lg font-bold text-white mb-1">User Profile & Currency Preference</h4>
        <p className="text-xs text-slate-400 mb-6">Manage how amounts and alerts are displayed across the application</p>

        {profileMsg.text && (
          <div
            className={`flex items-center gap-2 p-3 mb-5 rounded-xl text-xs font-semibold ${
              profileMsg.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
            }`}
          >
            {profileMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-4 py-2.5 bg-navy-950/50 border border-slate-800 rounded-xl text-slate-400 text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Currency Symbol
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.symbol}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Budget Warning Alert Threshold: <strong className="text-brand-300 font-bold">{alertThreshold}%</strong>
              </label>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(Number(e.target.value))}
                  className="flex-1 accent-brand-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-300 w-12 text-right">{alertThreshold}%</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Triggers notification banner when category spending hits this limit.</p>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/20 disabled:opacity-50 transition-all"
            >
              {savingProfile ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password */}
      <div className="p-6 md:p-8 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
        <h4 className="text-lg font-bold text-white mb-1">Security & Authentication</h4>
        <p className="text-xs text-slate-400 mb-6">Update your account password</p>

        {pwMsg.text && (
          <div
            className={`flex items-center gap-2 p-3 mb-5 rounded-xl text-xs font-semibold ${
              pwMsg.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
            }`}
          >
            {pwMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{pwMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingPw}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {savingPw ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Demo Data Management */}
      <div className="p-6 md:p-8 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-bold text-white">Testing & Demo Data</h4>
            <p className="text-xs text-slate-400 mt-1">
              Reset your ledger with realistic sample transactions, category budgets, and multi-month trends.
            </p>
          </div>

          <button
            onClick={handleResetDemoData}
            disabled={resetting}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-brand-300 bg-brand-950/80 hover:bg-brand-900 border border-brand-500/40 rounded-xl transition-all disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Reloading...' : 'Reload Sample Data'}</span>
          </button>
        </div>

        {resetMsg && (
          <div className="flex items-center gap-2 p-3 mt-4 rounded-xl text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
            <Check className="w-4 h-4" />
            <span>{resetMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
