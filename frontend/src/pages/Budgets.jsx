import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Trash2,
  Edit3,
  TrendingDown,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Budgets = ({ onOpenBudgetModal, refreshTrigger, onBudgetUpdated }) => {
  const { formatMoney, currency } = useCurrency();

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
      alert(err.message || 'Failed to delete budget');
    }
  };

  if (loading && !budgetData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading budget allocations...</p>
        </div>
      </div>
    );
  }

  const budgets = budgetData?.budgets || [];
  const totalAllocated = budgetData?.total_allocated || 0;
  const totalSpent = budgetData?.total_spent || 0;
  const remainingTotal = Math.max(0, totalAllocated - totalSpent);
  const overallPct = budgetData?.overall_percentage || 0;

  const exceededBudgets = budgets.filter((b) => b.status === 'exceeded');
  const warningBudgets = budgets.filter((b) => b.status === 'warning');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Month & Year Selection Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Monthly Budget Limits</h3>
            <p className="text-xs text-slate-400">Proactively control category spending and prevent overruns</p>
          </div>
        </div>

        {/* Date Selector & Add CTA */}
        <div className="flex items-center gap-2.5">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 bg-navy-950 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-brand-500"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-20 px-3 py-2 bg-navy-950 border border-slate-700/80 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-brand-500"
          />

          <button
            onClick={() => onOpenBudgetModal(selectedYear, selectedMonth)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Set Limit</span>
          </button>
        </div>
      </div>

      {/* Overview Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Budgeted */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Allocated Budget</p>
          <h4 className="text-2xl font-extrabold text-white mt-1">{formatMoney(totalAllocated)}</h4>
          <p className="text-[11px] text-slate-400 mt-2">Across {budgets.length} spending categories</p>
        </div>

        {/* Total Spent */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Spent in Categories</p>
          <h4 className="text-2xl font-extrabold text-slate-200 mt-1">{formatMoney(totalSpent)}</h4>
          <p className="text-[11px] text-slate-400 mt-2">{overallPct}% of allocated limits utilized</p>
        </div>

        {/* Remaining Headroom */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-emerald-500/20">
          <p className="text-xs font-semibold uppercase text-emerald-400">Remaining Budget Buffer</p>
          <h4 className="text-2xl font-extrabold text-emerald-400 mt-1">{formatMoney(remainingTotal)}</h4>
          <p className="text-[11px] text-emerald-400/80 mt-2">Available before limits are reached</p>
        </div>

        {/* Health Status */}
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-brand-500/20">
          <p className="text-xs font-semibold uppercase text-brand-300">Guardian Status</p>
          <div className="flex items-center gap-2 mt-2">
            {exceededBudgets.length > 0 ? (
              <>
                <AlertCircle className="w-5 h-5 text-rose-400" />
                <span className="text-base font-bold text-rose-400">
                  {exceededBudgets.length} Exceeded
                </span>
              </>
            ) : warningBudgets.length > 0 ? (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-base font-bold text-amber-400">
                  {warningBudgets.length} Nearing Limit
                </span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-base font-bold text-emerald-400">All Safe</span>
              </>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Alert threshold set at {budgetData?.threshold}%</p>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map((b) => {
          const isExceeded = b.status === 'exceeded';
          const isWarning = b.status === 'warning';

          return (
            <div
              key={b.id}
              className={`p-6 rounded-3xl bg-navy-900/80 backdrop-blur-md border transition-all duration-200 hover:-translate-y-1 shadow-lg ${
                isExceeded
                  ? 'border-rose-500/40 shadow-rose-950/20'
                  : isWarning
                  ? 'border-amber-500/40 shadow-amber-950/20'
                  : 'border-slate-800/80 hover:border-brand-500/30'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{b.category}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        isExceeded
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isExceeded ? 'EXCEEDED' : isWarning ? 'WARNING' : 'HEALTHY'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">{b.percentage_used}%</span>
                  </div>
                </div>

                <button
                  onClick={() => setDeleteId(b.id)}
                  title="Remove Limit"
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-5 space-y-2">
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isExceeded
                        ? 'bg-rose-500'
                        : isWarning
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-r from-brand-500 to-indigo-500'
                    }`}
                    style={{ width: `${Math.min(b.percentage_used, 100)}%` }}
                  />
                </div>

                {/* Amounts Breakdown */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400">
                    Spent: <strong className="text-white">{formatMoney(b.spent_amount)}</strong>
                  </span>
                  <span className="text-slate-400">
                    Cap: <strong className="text-white">{formatMoney(b.allocated_amount)}</strong>
                  </span>
                </div>

                {/* Remaining Info */}
                <div className="pt-2 text-[11px] text-right font-medium">
                  {b.remaining_amount >= 0 ? (
                    <span className="text-emerald-400">
                      +{formatMoney(b.remaining_amount)} buffer remaining
                    </span>
                  ) : (
                    <span className="text-rose-400">
                      -{formatMoney(Math.abs(b.remaining_amount))} over spending limit
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 rounded-3xl bg-navy-900/60 border border-slate-800">
          <Target className="w-12 h-12 text-slate-600 mb-3" />
          <h4 className="text-base font-bold text-white">No Budgets Defined for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Setting category budgets helps FinAI alert you when you approach dangerous spending thresholds.
          </p>
          <button
            onClick={() => onOpenBudgetModal(selectedYear, selectedMonth)}
            className="mt-4 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl"
          >
            Create First Budget
          </button>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-navy-900 border border-slate-700 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-white">Remove Budget Limit?</h4>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove this category budget limit?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBudget(deleteId)}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl"
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
