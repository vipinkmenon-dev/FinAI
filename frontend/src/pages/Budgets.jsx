import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Budgets = ({ onOpenBudgetModal, refreshTrigger, onBudgetUpdated }) => {
  const { formatMoney } = useCurrency();
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadBudgets();
  }, [selectedYear, selectedMonth, refreshTrigger]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.getBudgets(selectedYear, selectedMonth);
      setBudgetData(res);
    } catch (err) {
      console.error('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async (id) => {
    try {
      await api.deleteBudget(id);
      setDeleteId(null);
      loadBudgets();
      if (onBudgetUpdated) onBudgetUpdated();
    } catch (err) {
      alert(err.message || 'Failed to remove budget limit.');
    }
  };

  const budgets = budgetData?.budgets || [];
  const totalAllocated = budgetData?.total_allocated || 0;
  const totalSpent = budgetData?.total_spent || 0;
  const remainingTotal = Math.max(0, totalAllocated - totalSpent);
  const overallPct = budgetData?.overall_percentage || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-neutral-200 shadow-subtle">
        <div>
          <h3 className="text-xl font-bold text-neutral-950">Budget Management</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Establish monthly category spending caps to control personal expenses
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-800 focus:outline-none focus:border-black"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-20 px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-800 focus:outline-none focus:border-black"
          />

          <button
            onClick={() => onOpenBudgetModal(selectedYear, selectedMonth)}
            className="px-4 py-2 text-xs font-bold bg-black text-white rounded-lg hover:bg-neutral-800 shadow-subtle flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Set Limit</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Allocated Budget
          </p>
          <h4 className="text-2xl font-extrabold text-neutral-950 mt-1">{formatMoney(totalAllocated)}</h4>
          <p className="text-[11px] text-neutral-500 mt-1">Across {budgets.length} configured categories</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Actual Spent
          </p>
          <h4 className="text-2xl font-extrabold text-neutral-950 mt-1">{formatMoney(totalSpent)}</h4>
          <p className="text-[11px] text-neutral-500 mt-1">{overallPct}% of total monthly cap consumed</p>
        </div>

        <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Remaining Budget Buffer
          </p>
          <h4 className="text-2xl font-extrabold text-neutral-950 mt-1">{formatMoney(remainingTotal)}</h4>
          <p className="text-[11px] text-neutral-500 mt-1">Available before limits are exceeded</p>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-neutral-500">
          <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading limits...
        </div>
      ) : budgets.length === 0 ? (
        <div className="py-16 px-6 text-center space-y-3 rounded-2xl bg-white border border-neutral-200 shadow-subtle">
          <Target className="w-10 h-10 text-neutral-400 mx-auto" />
          <h4 className="text-base font-bold text-neutral-900">
            No Budgets Established for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Setting category limits allows FinAI to proactively monitor your spending and send overage notifications.
          </p>
          <button
            onClick={() => onOpenBudgetModal(selectedYear, selectedMonth)}
            className="px-4 py-2 text-xs font-bold bg-black text-white rounded-lg hover:bg-neutral-800"
          >
            Create Category Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => {
            const limit = b.monthly_limit || b.allocated_amount;
            const isExceeded = b.percentage_used >= 100;
            const isWarning = b.percentage_used >= (budgetData?.threshold || 80) && !isExceeded;

            return (
              <div
                key={b.id}
                className="p-5 rounded-xl bg-white border border-neutral-200 shadow-subtle space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="text-sm font-bold text-neutral-950">{b.category}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          isExceeded
                            ? 'bg-black text-white'
                            : isWarning
                            ? 'bg-neutral-200 text-neutral-900 font-bold'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {isExceeded ? 'EXCEEDED' : isWarning ? 'WARNING' : 'HEALTHY'}
                      </span>
                      <span className="text-xs font-mono font-bold text-neutral-800">
                        {b.percentage_used}%
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteId(b.id)}
                    className="p-1 text-neutral-400 hover:text-black rounded"
                    title="Remove limit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExceeded ? 'bg-black' : isWarning ? 'bg-neutral-700' : 'bg-neutral-900'
                      }`}
                      style={{ width: `${Math.min(b.percentage_used, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-600 font-medium">
                    <span>Spent: <strong className="text-black">{formatMoney(b.spent_amount)}</strong></span>
                    <span>Limit: <strong className="text-black">{formatMoney(limit)}</strong></span>
                  </div>

                  <div className="text-[10px] text-right font-medium">
                    {b.remaining_amount >= 0 ? (
                      <span className="text-neutral-600">+{formatMoney(b.remaining_amount)} buffer remaining</span>
                    ) : (
                      <span className="text-neutral-900 font-bold">-{formatMoney(Math.abs(b.remaining_amount))} over limit</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white border border-neutral-200 shadow-modal space-y-4">
            <h4 className="text-base font-bold text-neutral-950">Remove Budget Limit?</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Are you sure you want to remove this category budget limit?
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBudget(deleteId)}
                className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-neutral-800 rounded-lg"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
