import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  ArrowRight,
  Target,
  Bot,
  ChevronRight,
  CreditCard,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight
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
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const Dashboard = ({ onOpenAddModal }) => {
  const { user } = useAuth();
  const { formatMoney, currency } = useCurrency();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const [ovRes, trendRes, catRes, budgetRes, txRes] = await Promise.all([
        api.getOverview(now.getFullYear(), now.getMonth() + 1),
        api.getMonthlyTrend(6),
        api.getCategoryBreakdown(now.getFullYear(), now.getMonth() + 1),
        api.getBudgets(now.getFullYear(), now.getMonth() + 1),
        api.getTransactions({ limit: 5 })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-neutral-500">Syncing personal ledger...</p>
        </div>
      </div>
    );
  }

  const curMonth = overview?.current_month || { income: 0, expense: 0, savings: 0, savings_rate: 0 };
  const totalBalance = overview?.total_balance ?? (curMonth.income - curMonth.expense);
  const allTimeTxCount = overview?.all_time?.total_transactions ?? recentTransactions.length;
  const isNewUser = allTimeTxCount === 0;

  // Monochrome chart palette
  const monochromePalette = ['#111111', '#333333', '#555555', '#777777', '#999999', '#BBBBBB'];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. NEW USER / EMPTY DASHBOARD STATE */}
      {isNewUser ? (
        <div className="p-10 md:p-14 rounded-2xl bg-neutral-50 border border-neutral-200 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mx-auto shadow-subtle">
            <span className="font-black text-2xl">F</span>
          </div>
          <div className="max-w-lg mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-950 tracking-tight">
              Welcome to FinAI!
            </h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Your financial journey starts here. Add your first transaction to understand and manage your money.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenAddModal}
              className="px-6 py-3 text-xs md:text-sm font-bold bg-black text-white rounded-lg hover:bg-neutral-800 transition-all shadow-subtle inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Transaction</span>
            </button>
          </div>
        </div>
      ) : (
        /* AI Insight Notification Strip */
        <div className="p-5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                FinAI Ledger Analysis
              </span>
              <p className="text-xs font-semibold text-neutral-900 mt-0.5">
                {curMonth.savings >= 0
                  ? `You have saved ${formatMoney(curMonth.savings)} (${curMonth.savings_rate}% of inflow) this month.`
                  : `Your expenses currently exceed income by ${formatMoney(Math.abs(curMonth.savings))}.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/ai-assistant"
              className="px-3.5 py-1.5 text-xs font-bold text-black bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1"
            >
              <span>Consult FinAI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. CORE FINANCIAL KPI SCORECARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Balance
          </p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-neutral-950 mt-1 tracking-tight">
            {formatMoney(totalBalance)}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-2">
            Net capital across all logged records
          </p>
        </div>

        {/* Total Income */}
        <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Income (This Month)
          </p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-neutral-950 mt-1 tracking-tight">
            {formatMoney(curMonth.income)}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-2">
            Total verified inflow
          </p>
        </div>

        {/* Total Expenses */}
        <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Expenses (This Month)
          </p>
          <h3 className="text-2xl md:text-3xl font-extrabold text-neutral-950 mt-1 tracking-tight">
            {formatMoney(curMonth.expense)}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-2">
            Burn rate: {formatMoney(curMonth.daily_avg_expense)}/day
          </p>
        </div>

        {/* Total Savings */}
        <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-subtle">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Total Savings (This Month)
          </p>
          <h3 className={`text-2xl md:text-3xl font-extrabold mt-1 tracking-tight ${curMonth.savings >= 0 ? 'text-neutral-950' : 'text-neutral-700'}`}>
            {formatMoney(curMonth.savings)}
          </h3>
          <p className="text-[11px] text-neutral-500 mt-2">
            Savings rate: {curMonth.savings_rate}%
          </p>
        </div>
      </div>

      {/* 3. CHARTS: CASH FLOW & CATEGORY SPENDING (Clean Monochrome Recharts) */}
      {!isNewUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trend Area Chart (2 Cols) */}
          <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-neutral-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-950">Monthly Financial Summary</h4>
                <p className="text-xs text-neutral-500">Inflow vs Outflow over past months</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-black" /> Income
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-400" /> Expenses
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {trend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                  Insufficient historical data for trend chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                    <XAxis dataKey="label" stroke="#888888" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#888888"
                      fontSize={10}
                      tickLine={false}
                      tickFormatter={(val) => `${currency}${(val / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#000000',
                        borderColor: '#222222',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '11px'
                      }}
                      formatter={(val) => [formatMoney(val)]}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#000000"
                      strokeWidth={2}
                      fillOpacity={0.1}
                      fill="#000000"
                      name="Income"
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      stroke="#888888"
                      strokeWidth={2}
                      fillOpacity={0.1}
                      fill="#888888"
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category Spending Overview Donut Chart (1 Col) */}
          <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-subtle flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-950">Spending Overview</h4>
              <p className="text-xs text-neutral-500 mb-2">Category distribution this month</p>

              <div className="h-44 w-full relative">
                {categoryBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                    No expense records this month.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={monochromePalette[index % monochromePalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#000000',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '11px'
                        }}
                        formatter={(val) => [formatMoney(val)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="space-y-1.5 mt-3 pt-3 border-t border-neutral-100">
              {categoryBreakdown.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 truncate">{c.name}</span>
                  <span className="font-bold text-neutral-900">{formatMoney(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. BUDGET PROGRESS & RECENT TRANSACTIONS */}
      {!isNewUser && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget Progress (1 Col) */}
          <div className="p-6 rounded-xl bg-white border border-neutral-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-950">Budget Progress</h4>
                <p className="text-xs text-neutral-500">Spending limits for active month</p>
              </div>
              <Link to="/budgets" className="text-xs font-semibold text-black hover:underline flex items-center">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {budgets.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No budget limits established yet.
                <div className="pt-2">
                  <Link to="/budgets" className="text-black font-bold underline">
                    Set a budget
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                {budgets.slice(0, 4).map((b) => (
                  <div key={b.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-900">{b.category}</span>
                      <span className="font-mono text-neutral-600 font-bold">
                        {formatMoney(b.spent_amount)} / {formatMoney(b.monthly_limit || b.allocated_amount)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full"
                        style={{ width: `${Math.min(b.percentage_used, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions (2 Cols) */}
          <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-neutral-200 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-neutral-950">Recent Transactions</h4>
                <p className="text-xs text-neutral-500">Latest ledger entries</p>
              </div>
              <Link to="/transactions" className="text-xs font-semibold text-black hover:underline flex items-center">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-100 text-neutral-500 uppercase text-[10px] font-bold">
                    <th className="pb-2.5 font-semibold">Title</th>
                    <th className="pb-2.5 font-semibold">Category</th>
                    <th className="pb-2.5 font-semibold">Date</th>
                    <th className="pb-2.5 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 font-semibold text-neutral-900 truncate max-w-[200px]">
                        {tx.description || tx.category}
                      </td>
                      <td className="py-3 text-neutral-600">{tx.category}</td>
                      <td className="py-3 text-neutral-500">{tx.transaction_date || tx.date}</td>
                      <td className="py-3 text-right font-bold text-neutral-900">
                        {tx.transaction_type === 'income' || tx.type === 'income' ? '+' : '-'}
                        {formatMoney(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
