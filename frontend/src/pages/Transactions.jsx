import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  ArrowUpDown,
  RotateCcw,
  Layers
} from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

const ALL_CATEGORIES = [
  'Salary', 'Freelancing', 'Business', 'Investments', 'Other income',
  'Food', 'Transportation', 'Shopping', 'Education', 'Healthcare',
  'Bills', 'Entertainment', 'Groceries', 'Rent', 'Other expenses'
];

const PAYMENT_METHODS = [
  'UPI / Net Banking', 'Credit Card', 'Debit Card', 'Cash', 'Bank Transfer'
];

export const Transactions = ({ onOpenAddModal, onOpenEditModal, refreshTrigger, onTransactionUpdated }) => {
  const { formatMoney } = useCurrency();

  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('desc');

  // Deletion modal
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [search, typeFilter, categoryFilter, paymentFilter, startDate, endDate, sortBy, order, refreshTrigger]);

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
      params.sort_by = sortBy;
      params.order = order;

      const res = await api.getTransactions(params);
      setTransactions(res.transactions || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setPaymentFilter('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setOrder('desc');
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await api.deleteTransaction(id);
      setDeleteId(null);
      loadTransactions();
      if (onTransactionUpdated) onTransactionUpdated();
    } catch (err) {
      alert(err.message || 'Failed to delete transaction.');
    } finally {
      setDeleting(false);
    }
  };

  const exportCSV = () => {
    if (!transactions.length) return;
    const headers = ['ID', 'Date', 'Type', 'Category', 'Payment Method', 'Description', 'Amount'];
    const rows = transactions.map((t) => [
      t.id,
      t.transaction_date || t.date,
      t.transaction_type || t.type,
      `"${t.category}"`,
      `"${t.payment_method}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinAI_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Primary Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-neutral-200 shadow-subtle">
        <div>
          <h3 className="text-xl font-bold text-neutral-950">Transaction Management</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            View, filter, sort, and export your personal income and expense records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportCSV}
            disabled={transactions.length === 0}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg shadow-subtle flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by title, description or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-neutral-300 rounded-lg text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black"
          />
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none focus:border-black"
          >
            <option value="">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none focus:border-black"
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Payment Method */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none focus:border-black"
          >
            <option value="">All Methods</option>
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>

          {/* Sort Field */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none focus:border-black"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>

          {/* Order */}
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="px-2.5 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none focus:border-black"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          {/* Reset */}
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 bg-white border border-neutral-300 rounded-lg text-neutral-600 hover:text-black hover:bg-neutral-100 flex items-center justify-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Transactions Table / Empty State */}
      <div className="rounded-xl bg-white border border-neutral-200 shadow-subtle overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-neutral-500">
            <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Updating records...
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <Layers className="w-10 h-10 text-neutral-400 mx-auto" />
            <h4 className="text-base font-bold text-neutral-900">No Transactions Found</h4>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              You haven't recorded any transactions matching your filters yet. Add an income or expense to begin.
            </p>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 text-xs font-bold bg-black text-white rounded-lg hover:bg-neutral-800"
            >
              Add First Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 uppercase text-[10px] font-bold">
                  <th className="py-3 px-6">Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transactions.map((tx) => {
                  const isIncome = tx.transaction_type === 'income' || tx.type === 'income';
                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="py-3 px-6 font-semibold text-neutral-950 max-w-[220px] truncate">
                        {tx.description || tx.category}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            isIncome
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                          }`}
                        >
                          {isIncome ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-700 font-medium">{tx.category}</td>
                      <td className="py-3 px-4 text-neutral-500">{tx.payment_method}</td>
                      <td className="py-3 px-4 text-neutral-500">{tx.transaction_date || tx.date}</td>
                      <td className="py-3 px-4 text-right font-bold text-neutral-950">
                        {isIncome ? '+' : '-'}
                        {formatMoney(tx.amount)}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenEditModal(tx)}
                            title="Edit"
                            className="p-1 text-neutral-500 hover:text-black rounded hover:bg-neutral-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(tx.id)}
                            title="Delete"
                            className="p-1 text-neutral-500 hover:text-black rounded hover:bg-neutral-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 rounded-2xl bg-white border border-neutral-200 shadow-modal space-y-4">
            <h4 className="text-base font-bold text-neutral-950">Delete Transaction?</h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              This transaction will be permanently removed from your ledger. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold bg-black text-white hover:bg-neutral-800 rounded-lg disabled:opacity-50"
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
