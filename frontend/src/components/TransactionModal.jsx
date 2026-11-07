import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const INCOME_CATEGORIES = [
  'Salary', 'Freelancing', 'Business', 'Investments', 'Other income'
];

const EXPENSE_CATEGORIES = [
  'Food', 'Transportation', 'Shopping', 'Education',
  'Healthcare', 'Bills', 'Entertainment', 'Groceries',
  'Rent', 'Other expenses'
];

const PAYMENT_METHODS = [
  'UPI / Net Banking', 'Credit Card', 'Debit Card', 'Cash', 'Bank Transfer'
];

export const TransactionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null
}) => {
  const { currency } = useCurrency();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.transaction_type || initialData.type || 'expense');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setTitle(initialData.description || '');
      setCategory(initialData.category || EXPENSE_CATEGORIES[0]);
      setPaymentMethod(initialData.payment_method || PAYMENT_METHODS[0]);
      setDate(initialData.transaction_date || initialData.date || new Date().toISOString().split('T')[0]);
      setDescription(initialData.description || '');
    } else {
      setType('expense');
      setAmount('');
      setTitle('');
      setCategory(EXPENSE_CATEGORIES[0]);
      setPaymentMethod(PAYMENT_METHODS[0]);
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const currentCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }

    if (!category) {
      setError('Please select a category.');
      return;
    }

    if (!date) {
      setError('Please select a valid transaction date.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        transaction_type: type,
        type: type,
        amount: parsedAmount,
        category,
        payment_method: paymentMethod,
        transaction_date: date,
        date: date,
        description: (title || description || category).trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save transaction record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-neutral-200 shadow-modal overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div>
            <h3 className="text-lg font-bold text-neutral-950">
              {initialData ? 'Edit Transaction' : 'Record Transaction'}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Personal finance ledger entry
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-semibold text-neutral-900 bg-neutral-100 border border-neutral-300 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 text-neutral-800" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle: Expense vs Income (Monochrome) */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-neutral-100 border border-neutral-200">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory(EXPENSE_CATEGORIES[0]);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'expense'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Expense (-)
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory(INCOME_CATEGORIES[0]);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                type === 'income'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Income (+)
            </button>
          </div>

          {/* Title / Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Transaction Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Monthly Salary, Grocery run, Rent payment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Amount ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
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
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-base font-bold text-neutral-900 placeholder-neutral-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          {/* Category & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-black"
              >
                {currentCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-black"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm} value={pm}>
                    {pm}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Transaction Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs font-medium text-neutral-900 focus:outline-none focus:border-black"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold bg-black text-white rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialData ? 'Update Record' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
