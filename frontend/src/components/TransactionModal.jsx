import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, PlusCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const DEFAULT_EXPENSE_CATS = [
  'Housing', 'Food & Dining', 'Groceries', 'Utilities',
  'Transportation', 'Entertainment', 'Shopping', 'Healthcare',
  'Subscriptions', 'Education', 'Travel', 'Personal Care', 'Miscellaneous'
];

const DEFAULT_INCOME_CATS = [
  'Salary', 'Freelance', 'Investment Returns', 'Bonus',
  'Rental Income', 'Business', 'Gifts', 'Other'
];

const PAYMENT_METHODS = [
  'UPI / Net Banking', 'Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Digital Wallet'
];

export const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  availableCategories = null
}) => {
  const { currency } = useCurrency();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [paymentMethod, setPaymentMethod] = useState('UPI / Net Banking');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type || 'expense');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setCategory(initialData.category || 'Food & Dining');
      setPaymentMethod(initialData.payment_method || 'UPI / Net Banking');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setDescription(initialData.description || '');
      setIsCustomCat(false);
      setCustomCategory('');
    } else {
      setType('expense');
      setAmount('');
      setCategory('Food & Dining');
      setPaymentMethod('UPI / Net Banking');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setIsCustomCat(false);
      setCustomCategory('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const currentCategoryList = type === 'expense'
    ? (availableCategories?.expense_categories || DEFAULT_EXPENSE_CATS)
    : (availableCategories?.income_categories || DEFAULT_INCOME_CATS);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    const finalCategory = isCustomCat ? customCategory.trim() : category;
    if (!finalCategory) {
      setError('Please specify a category.');
      return;
    }

    if (!date) {
      setError('Please select a valid date.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        type,
        amount: parsedAmount,
        category: finalCategory,
        payment_method: paymentMethod,
        date,
        description: description.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-navy-900 border border-slate-700/80 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white">
              {initialData ? 'Edit Transaction' : 'Record Transaction'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Keep your ledger balanced and financial insights updated
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Selector (Income vs Expense) */}
          <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-navy-950 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Food & Dining');
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Salary');
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                type === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Income (+)
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-lg font-bold placeholder-slate-600 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomCat(!isCustomCat)}
                  className="text-[11px] text-brand-400 hover:underline"
                >
                  {isCustomCat ? 'Choose standard' : '+ Custom'}
                </button>
              </div>

              {isCustomCat ? (
                <input
                  type="text"
                  placeholder="e.g. Gym, Pet Care"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
                >
                  {currentCategoryList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Note / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Dinner with team"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Update Transaction' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
