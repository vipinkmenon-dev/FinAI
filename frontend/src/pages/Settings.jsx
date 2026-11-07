import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, DollarSign, CheckCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

const CURRENCIES = [
  { symbol: '₹', name: '₹ Indian Rupee (INR)' },
  { symbol: '$', name: '$ US Dollar (USD)' },
  { symbol: '€', name: '€ Euro (EUR)' },
  { symbol: '£', name: '£ British Pound (GBP)' },
  { symbol: '¥', name: '¥ Japanese Yen (JPY)' }
];

export const Settings = () => {
  const { user, updateUser } = useAuth();
  const { currency, setCurrency } = useCurrency();

  const [alertThreshold, setAlertThreshold] = useState(user?.alert_threshold || 80);
  const [selectedCurrency, setSelectedCurrency] = useState(user?.currency || '₹');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg('');
    setSaving(true);

    try {
      const res = await api.updateProfile({
        alert_threshold: parseFloat(alertThreshold),
        currency: selectedCurrency,
        full_name: user?.full_name || 'Member'
      });
      updateUser(res.user);
      setCurrency(res.user.currency);
      setMsg('Settings saved successfully.');
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-200">
      <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-subtle">
        <h3 className="text-xl font-bold text-neutral-950">Settings & Alert Thresholds</h3>
        <p className="text-xs text-neutral-500 mt-0.5">
          Configure financial notifications and ledger display parameters
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-900 border border-neutral-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-black" />
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 md:p-8 rounded-2xl bg-white border border-neutral-200 shadow-subtle space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            Default Currency
          </label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="w-full max-w-xs px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-900 focus:outline-none focus:border-black"
          >
            {CURRENCIES.map((c) => (
              <option key={c.symbol} value={c.symbol}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-500 mt-1">
            Standard currency symbol utilized across charts, cards, and tables.
          </p>
        </div>

        <div className="pt-4 border-t border-neutral-100 space-y-2 max-w-lg">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Budget Alert Warning Threshold
            </label>
            <span className="text-xs font-bold text-black font-mono">
              {alertThreshold}%
            </span>
          </div>

          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(Number(e.target.value))}
            className="w-full accent-black cursor-pointer"
          />
          <p className="text-[11px] text-neutral-500">
            A notification is triggered whenever your category spending hits or exceeds this percentage of your allocated limit.
          </p>
        </div>

        <div className="pt-4 border-t border-neutral-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-xs font-bold bg-black text-white rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};
