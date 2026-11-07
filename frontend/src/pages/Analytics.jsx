import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  PieChart as PieIcon,
  Download,
  ShieldCheck
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

export const Analytics = () => {
  const { formatMoney, currency } = useCurrency();
  const now = new Date();

  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);

  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [yearlyReport, setYearlyReport] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [selectedYear, selectedMonth]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [trendRes, catRes, pmRes, repRes] = await Promise.all([
        api.getMonthlyTrend(12),
        api.getCategoryBreakdown(selectedYear, selectedMonth),
        api.getPaymentMethods(selectedYear, selectedMonth),
        api.getYearlyReport(selectedYear)
      ]);

      setMonthlyTrend(trendRes.trend || []);
      setCategoryBreakdown(catRes.categories || []);
      setPaymentMethods(pmRes.methods || []);
      setYearlyReport(repRes);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !yearlyReport) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Computing analytics aggregations...</p>
        </div>
      </div>
    );
  }

  const yearlyTotals = yearlyReport?.yearly_totals || { income: 0, expense: 0, savings: 0, savings_rate: 0 };
  const monthlyBreakdown = yearlyReport?.monthly_breakdown || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 text-brand-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Financial Analytics & Yearly Audits</h3>
            <p className="text-xs text-slate-400">Macro and micro analysis of cash inflows, outflows & savings velocity</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400">Year:</label>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-24 px-3 py-2 bg-navy-950 border border-slate-700/80 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Yearly High-level KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-navy-900/80 border border-emerald-500/20">
          <p className="text-xs font-semibold uppercase text-emerald-400">Total Year Inflow</p>
          <h4 className="text-2xl font-extrabold text-emerald-400 mt-1">{formatMoney(yearlyTotals.income)}</h4>
          <p className="text-[11px] text-slate-400 mt-1">Accumulated income for {selectedYear}</p>
        </div>

        <div className="p-5 rounded-2xl bg-navy-900/80 border border-rose-500/20">
          <p className="text-xs font-semibold uppercase text-rose-400">Total Year Outflow</p>
          <h4 className="text-2xl font-extrabold text-rose-400 mt-1">{formatMoney(yearlyTotals.expense)}</h4>
          <p className="text-[11px] text-slate-400 mt-1">Accumulated expenditure for {selectedYear}</p>
        </div>

        <div className="p-5 rounded-2xl bg-navy-900/80 border border-brand-500/20">
          <p className="text-xs font-semibold uppercase text-brand-300">Total Net Saved</p>
          <h4 className={`text-2xl font-extrabold mt-1 ${yearlyTotals.savings >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatMoney(yearlyTotals.savings)}
          </h4>
          <p className="text-[11px] text-slate-400 mt-1">Net capital retention</p>
        </div>

        <div className="p-5 rounded-2xl bg-navy-900/80 border border-cyan-500/20">
          <p className="text-xs font-semibold uppercase text-cyan-400">Yearly Savings Rate</p>
          <h4 className="text-2xl font-extrabold text-cyan-400 mt-1">{yearlyTotals.savings_rate}%</h4>
          <p className="text-[11px] text-slate-400 mt-1">Healthy target: 20-30%</p>
        </div>
      </div>

      {/* Main Charts: 12-Month Inflow vs Outflow Bar Chart */}
      <div className="p-6 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Monthly Cash Flow Comparison</h3>
            <p className="text-xs text-slate-400">Comparison of Income and Expenses across the calendar year</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-slate-300">Income</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-slate-300">Expense</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyBreakdown} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
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
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Grid: Category Breakdown & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Category Distribution</h3>
              <p className="text-xs text-slate-400">Total spending across categories</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={50}
                  paddingAngle={2}
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
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {categoryBreakdown.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-navy-950/60 border border-slate-800">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-300 truncate">{c.name}</span>
                </div>
                <span className="font-bold text-white shrink-0 ml-1">{c.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-6 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Payment Method Analysis</h3>
              <p className="text-xs text-slate-400">Distribution by instruments and channels</p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            {paymentMethods.map((pm, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-3.5 h-3.5 text-brand-400" />
                    <span className="font-semibold text-white">{pm.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({pm.count} txns)</span>
                  </div>
                  <div className="flex items-center gap-2 font-bold">
                    <span className="text-white">{formatMoney(pm.amount)}</span>
                    <span className="text-brand-300 text-[11px]">{pm.percentage}%</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pm.percentage}%`,
                      backgroundColor: pm.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month-by-Month Yearly Ledger Audit Table */}
      <div className="p-6 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
        <h3 className="text-lg font-bold text-white mb-1">Annual Ledger Breakdown</h3>
        <p className="text-xs text-slate-400 mb-5">Month-by-month financial statement for {selectedYear}</p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-bold">
                <th className="pb-3 px-4">Month</th>
                <th className="pb-3 px-4 text-right">Income</th>
                <th className="pb-3 px-4 text-right">Expenses</th>
                <th className="pb-3 px-4 text-right">Net Savings</th>
                <th className="pb-3 px-4 text-right">Savings Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {monthlyBreakdown.map((row) => (
                <tr key={row.month} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{row.month}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{formatMoney(row.income)}</td>
                  <td className="py-3 px-4 text-right text-rose-400 font-semibold">{formatMoney(row.expense)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${row.savings >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    {formatMoney(row.savings)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                      row.savings_rate >= 20 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {row.savings_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
