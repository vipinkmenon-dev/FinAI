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
  AreaChart,
  Area
} from 'recharts';
import { BarChart3, Layers, Calendar } from 'lucide-react';
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

  const yearlyTotals = yearlyReport?.yearly_totals || { income: 0, expense: 0, savings: 0, savings_rate: 0 };
  const monthlyBreakdown = yearlyReport?.monthly_breakdown || [];
  const hasYearlyData = yearlyTotals.income > 0 || yearlyTotals.expense > 0;

  const monochromeColors = ['#111111', '#333333', '#555555', '#777777', '#999999', '#CCCCCC'];

  if (loading && !yearlyReport) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-neutral-500">Computing analytics aggregations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-neutral-200 shadow-subtle">
        <div>
          <h3 className="text-xl font-bold text-neutral-950">Analytics & Financial Reports</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Micro and macro auditing of cash inflows, category outflows, and savings velocity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-neutral-500">Auditing Year:</label>
          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-24 px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:border-black"
          />
        </div>
      </div>

      {/* When no transactions exist at all */}
      {!hasYearlyData ? (
        <div className="py-20 px-6 rounded-2xl bg-white border border-neutral-200 text-center space-y-3">
          <BarChart3 className="w-10 h-10 text-neutral-400 mx-auto" />
          <h4 className="text-base font-bold text-neutral-900">No Financial Records Found for {selectedYear}</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Analytics and charts are generated strictly from your logged transactions. No fabricated data is displayed.
          </p>
        </div>
      ) : (
        <>
          {/* Yearly KPI Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-subtle">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Annual Inflow</p>
              <h4 className="text-2xl font-extrabold text-neutral-950 mt-1">{formatMoney(yearlyTotals.income)}</h4>
              <p className="text-[11px] text-neutral-500 mt-1">Accumulated income in {selectedYear}</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-subtle">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Annual Outflow</p>
              <h4 className="text-2xl font-extrabold text-neutral-950 mt-1">{formatMoney(yearlyTotals.expense)}</h4>
              <p className="text-[11px] text-neutral-500 mt-1">Accumulated expenses in {selectedYear}</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-subtle">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Annual Saved</p>
              <h4 className="text-2xl font-extrabold text-neutral-950 mt-1">{formatMoney(yearlyTotals.savings)}</h4>
              <p className="text-[11px] text-neutral-500 mt-1">Net capital retention</p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-neutral-200 shadow-subtle">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Annual Savings Rate</p>
              <h4 className="text-2xl font-extrabold text-neutral-950 mt-1">{yearlyTotals.savings_rate}%</h4>
              <p className="text-[11px] text-neutral-500 mt-1">Savings-to-income efficiency</p>
            </div>
          </div>

          {/* 12-Month Inflow vs Outflow Bar Chart */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-subtle space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-neutral-950">Income versus Expenses ({selectedYear})</h4>
                <p className="text-xs text-neutral-500">Monthly side-by-side ledger comparison</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-neutral-800">
                  <span className="w-3 h-3 rounded bg-black" /> Income
                </span>
                <span className="flex items-center gap-1.5 text-neutral-600">
                  <span className="w-3 h-3 rounded bg-neutral-300" /> Expense
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyBreakdown} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" vertical={false} />
                  <XAxis dataKey="month" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => `${currency}${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#000000',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '11px'
                    }}
                    formatter={(val) => [formatMoney(val)]}
                  />
                  <Bar dataKey="income" fill="#000000" radius={[2, 2, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#D4D4D4" radius={[2, 2, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Two Column Grid: Category Breakdown & Payment Methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-subtle space-y-4">
              <div>
                <h4 className="text-sm font-bold text-neutral-950">Category-Wise Spending</h4>
                <p className="text-xs text-neutral-500">Outflow breakdown by expense sector</p>
              </div>

              <div className="h-56 w-full">
                {categoryBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                    No expense records for selected period.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={2}
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={monochromeColors[index % monochromeColors.length]} />
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

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100">
                {categoryBreakdown.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-neutral-50 border border-neutral-200">
                    <span className="text-neutral-700 font-medium truncate">{c.name}</span>
                    <span className="font-bold text-neutral-950">{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-subtle space-y-4">
              <div>
                <h4 className="text-sm font-bold text-neutral-950">Payment Instruments</h4>
                <p className="text-xs text-neutral-500">Distribution across banking & digital channels</p>
              </div>

              <div className="space-y-3.5 pt-2">
                {paymentMethods.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    No payment method data recorded.
                  </div>
                ) : (
                  paymentMethods.map((pm, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-900">{pm.name}</span>
                        <span className="font-bold text-neutral-950">{formatMoney(pm.amount)} ({pm.percentage}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full"
                          style={{ width: `${pm.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Month-by-Month Statement */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200 shadow-subtle space-y-4">
            <h4 className="text-sm font-bold text-neutral-950">Annual Month-by-Month Financial Ledger</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 uppercase text-[10px] font-bold">
                    <th className="py-2.5 px-4 font-semibold">Month</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Income</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Expenses</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Net Savings</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Savings Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {monthlyBreakdown.map((row) => (
                    <tr key={row.month} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-neutral-950">{row.month}</td>
                      <td className="py-2.5 px-4 text-right font-medium text-neutral-900">{formatMoney(row.income)}</td>
                      <td className="py-2.5 px-4 text-right font-medium text-neutral-900">{formatMoney(row.expense)}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-neutral-950">{formatMoney(row.savings)}</td>
                      <td className="py-2.5 px-4 text-right font-semibold text-neutral-700">{row.savings_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
