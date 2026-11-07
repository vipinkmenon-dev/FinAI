import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight,
  Plus,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Dashboard = ({ setActiveTab, onOpenAddModal, setInitialAIPrompt }) => {
  const { user } = useAuth();
  const { formatMoney, currency } = useCurrency();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const [ovRes, trendRes, catRes, budgetRes, txRes] = await Promise.all([
        api.getOverview(now.getFullYear(), now.getMonth() + 1),
        api.getMonthlyTrend(6),
        api.getCategoryBreakdown(now.getFullYear(), now.getMonth() + 1),
        api.getBudgets(now.getFullYear(), now.getMonth() + 1),
        api.getTransactions({ limit: 6 })
      ]);

      setOverview(ovRes);
      setTrend(trendRes.trend || []);
      setCategoryBreakdown(catRes.categories || []);
      setBudgets(budgetRes.budgets || []);
      setRecentTransactions(txRes.transactions || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuickAI = (prompt) => {
    if (setInitialAIPrompt) {
      setInitialAIPrompt(prompt);
    }
    setActiveTab('ai-advisor');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading ledger intelligence...</p>
        </div>
      </div>
    );
  }

  const curMonth = overview?.current_month || { income: 0, expense: 0, savings: 0, savings_rate: 0 };
  const comparison = overview?.comparison || { income_change_pct: 0, expense_change_pct: 0 };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top AI Insight Banner */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-brand-900/60 via-indigo-900/40 to-navy-900 border border-brand-500/30 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/40 text-brand-300 shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-300">
                  FinAI Smart Financial Insight
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Real-time Data
                </span>
              </div>
              <p className="text-sm md:text-base font-semibold text-white mt-1">
                {curMonth.savings >= 0
                  ? `You have saved ${formatMoney(curMonth.savings)} (${curMonth.savings_rate}% of income) this month. Your cash flow is in great health!`
                  : `Your expenses exceed your income by ${formatMoney(Math.abs(curMonth.savings))}. Review non-essential spending to recover your buffer.`}
              </p>
              <p className="text-xs text-slate-300 mt-1">
                Average daily burn rate: <span className="text-white font-bold">{formatMoney(curMonth.daily_avg_expense)}/day</span>.
              </p>
            </div>
          </div>

          {/* Quick AI Prompt Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleAskQuickAI('Where did I spend the most money?')}
              className="px-3 py-1.5 text-xs font-medium text-brand-200 bg-brand-950/60 hover:bg-brand-900 border border-brand-500/30 rounded-xl transition-all"
            >
              "Where did I spend the most?"
            </button>
            <button
              onClick={() => handleAskQuickAI('Can I save ₹5,000 next month?')}
              className="px-3 py-1.5 text-xs font-medium text-brand-200 bg-brand-950/60 hover:bg-brand-900 border border-brand-500/30 rounded-xl transition-all"
            >
              "Can I save {currency}5,000?"
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Monthly Income"
          value={curMonth.income}
          changePct={comparison.income_change_pct}
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Monthly Expenses"
          value={curMonth.expense}
          changePct={comparison.expense_change_pct}
          icon={TrendingDown}
          variant="rose"
        />
        <StatCard
          title="Net Savings"
          value={curMonth.savings}
          subtitle={`Savings rate: ${curMonth.savings_rate}%`}
          icon={Wallet}
          variant="brand"
        />
        <StatCard
          title="Savings Rate"
          value={`${curMonth.savings_rate}%`}
          isCurrency={false}
          subtitle="Target benchmark: > 20%"
          icon={PiggyBank}
          variant="cyan"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Cash Flow & Savings Velocity</h3>
              <p className="text-xs text-slate-400">Income versus Expenses over the last 6 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-slate-300">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${currency}${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)'
                  }}
                  formatter={(val) => [formatMoney(val)]}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incomeGrad)"
                  name="Income"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGrad)"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut Chart (1 Col) */}
        <div className="p-6 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Expense Distribution</h3>
                <p className="text-xs text-slate-400">Current month spending by category</p>
              </div>
            </div>

            <div className="h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [formatMoney(val)]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] font-semibold uppercase text-slate-400">Total</span>
                <span className="text-sm font-extrabold text-white">
                  {formatMoney(curMonth.expense)}
                </span>
              </div>
            </div>
          </div>

          {/* Top 4 Categories List */}
          <div className="space-y-2 mt-4">
            {categoryBreakdown.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300 font-medium">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <span className="text-white">{formatMoney(cat.value)}</span>
                  <span className="text-slate-400 text-[10px]">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Budgets Overview & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budgets Progress (1 Col) */}
        <div className="p-6 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-white">Budget Guardians</h3>
              <p className="text-xs text-slate-400">Spending vs monthly limits</p>
            </div>
            <button
              onClick={() => setActiveTab('budgets')}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-0.5"
            >
              Manage <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {budgets.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No active budget limits configured for this month.
              </div>
            ) : (
              budgets.slice(0, 5).map((b) => {
                const isExceeded = b.percentage_used >= 100;
                const isWarning = b.percentage_used >= 80 && !isExceeded;

                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{b.category}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">
                          {formatMoney(b.spent_amount)} / {formatMoney(b.allocated_amount)}
                        </span>
                        <span
                          className={`font-bold ${
                            isExceeded
                              ? 'text-rose-400'
                              : isWarning
                              ? 'text-amber-400'
                              : 'text-brand-400'
                          }`}
                        >
                          {b.percentage_used}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
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
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Transactions (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-400">Latest entries in your financial ledger</p>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-0.5"
            >
              View Full Ledger <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3 font-semibold">Transaction</th>
                  <th className="pb-3 font-semibold">Category</th>
                  <th className="pb-3 font-semibold">Payment Method</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pr-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <span className="font-semibold text-white truncate max-w-[140px] sm:max-w-[180px]">
                          {tx.description || tx.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 pr-2 text-slate-300 font-medium">{tx.category}</td>
                    <td className="py-3.5 pr-2 text-slate-400">{tx.payment_method}</td>
                    <td className="py-3.5 pr-2 text-slate-400">{tx.date}</td>
                    <td
                      className={`py-3.5 text-right font-extrabold ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatMoney(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
