import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Edit2,
  Trash2,
  Download,
  Calendar,
  Layers,
  CreditCard,
  RotateCcw
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

export const Transactions = ({
  onOpenAddModal,
  onOpenEditModal,
  refreshTrigger,
  onTransactionUpdated
}) => {
  const { formatMoney } = useCurrency();

  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Meta
  const [meta, setMeta] = useState({
    expense_categories: [],
    income_categories: [],
    payment_methods: []
  });

  // Delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [search, typeFilter, categoryFilter, paymentFilter, startDate, endDate, refreshTrigger]);

  const loadMeta = async () => {
    try {
      const res = await api.getMeta();
      setMeta(res);
    } catch (err) {
      console.error('Failed to load categories/payment methods:', err);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (paymentFilter) params.payment_method = paymentFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.getTransactions(params);
      setTransactions(res.transactions || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setPaymentFilter('');
    setStartDate('');
    setEndDate('');
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await api.deleteTransaction(id);
      setDeleteId(null);
      loadTransactions();
      if (onTransactionUpdated) onTransactionUpdated();
    } catch (err) {
      alert(err.message || 'Failed to delete transaction');
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    if (!transactions.length) return;
    const headers = ['ID', 'Date', 'Type', 'Category', 'Payment Method', 'Description', 'Amount'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.type,
      `"${t.category}"`,
      `"${t.payment_method}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinAI_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations for filtered items
  const filteredIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const filteredNet = filteredIncome - filteredExpense;

  const allCategories = Array.from(new Set([
    ...meta.expense_categories,
    ...meta.income_categories
  ]));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Quick Metrics for Filtered Set */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-navy-900/80 border border-slate-800">
          <p className="text-[11px] font-semibold uppercase text-slate-400">Ledger Entries</p>
          <p className="text-xl font-bold text-white mt-1">{totalCount} Transactions</p>
        </div>
        <div className="p-4 rounded-2xl bg-navy-900/80 border border-emerald-500/20">
          <p className="text-[11px] font-semibold uppercase text-emerald-400">Total Filtered Inflow</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">+{formatMoney(filteredIncome)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-navy-900/80 border border-rose-500/20">
          <p className="text-[11px] font-semibold uppercase text-rose-400">Total Filtered Outflow</p>
          <p className="text-xl font-bold text-rose-400 mt-1">-{formatMoney(filteredExpense)}</p>
        </div>
        <div className="p-4 rounded-2xl bg-navy-900/80 border border-brand-500/20">
          <p className="text-[11px] font-semibold uppercase text-brand-300">Net Ledger Cashflow</p>
          <p className={`text-xl font-bold mt-1 ${filteredNet >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatMoney(filteredNet)}
          </p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-5 rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, note, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={exportCSV}
              disabled={transactions.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition-colors disabled:opacity-40"
              title="Export filtered records to CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>
          </div>
        </div>

        {/* Detailed Filters Line */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-800/80">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-navy-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Types (Income & Expense)</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-navy-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-navy-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
          >
            <option value="">All Payment Methods</option>
            {meta.payment_methods.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-navy-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            title="Start Date"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-navy-950 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500"
            title="End Date"
          />

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="overflow-hidden rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-sm font-medium">Filtering records...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <Layers className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-300">No transactions found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Try adjusting your search query, clearing filters, or record a new transaction entry.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 rounded-xl"
            >
              Add First Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-navy-950/60 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Payment Method</th>
                  <th className="py-4 px-4">Date</th>
                  <th className="py-4 px-4 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Description & Type Icon */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${
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
                        <div>
                          <p className="font-bold text-white text-sm">
                            {tx.description || tx.category}
                          </p>
                          <p className="text-[10px] text-slate-400 capitalize">
                            {tx.type} transaction
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 text-xs font-semibold text-brand-300 bg-brand-950/60 border border-brand-500/20 rounded-lg">
                        {tx.category}
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="py-4 px-4 text-slate-300 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tx.payment_method}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{tx.date}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-4 px-4 text-right font-extrabold text-sm ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatMoney(tx.amount)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={() => onOpenEditModal(tx)}
                          title="Edit Transaction"
                          className="p-1.5 text-slate-400 hover:text-brand-300 hover:bg-brand-500/15 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(tx.id)}
                          title="Delete Transaction"
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-navy-900 border border-slate-700 shadow-2xl space-y-4">
            <h4 className="text-lg font-bold text-white">Delete Transaction?</h4>
            <p className="text-xs text-slate-300">
              This action cannot be undone. It will remove this record from your ledger and adjust historical analytics accordingly.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
