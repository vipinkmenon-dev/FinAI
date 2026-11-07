import React, { useState } from 'react';
import { X, Target, AlertCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const DEFAULT_CATEGORIES = [
  'Housing', 'Food & Dining', 'Groceries', 'Utilities',
  'Transportation', 'Entertainment', 'Shopping', 'Healthcare',
  'Subscriptions', 'Education', 'Travel', 'Personal Care', 'Miscellaneous'
];

export const BudgetModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentYear,
  currentMonth
}) => {
  const { currency } = useCurrency();
  const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [year, setYear] = useState(currentYear || new Date().getFullYear());
  const [month, setMonth] = useState(currentMonth || new Date().getMonth() + 1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid budget limit greater than zero.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        category,
        allocated_amount: parsedAmount,
        year: parseInt(year),
        month: parseInt(month)
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save budget limit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-navy-900 border border-slate-700/80 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Set Category Budget</h3>
              <p className="text-xs text-slate-400">Establish proactive spending limits</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Monthly Limit Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 8000"
                className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white font-bold placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((name, idx) => (
                  <option key={name} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Limit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
