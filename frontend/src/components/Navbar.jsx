import React, { useState, useEffect } from 'react';
import {
  Menu,
  Plus,
  Bell,
  Sun,
  Moon,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

export const Navbar = ({
  activeTab,
  setMobileOpen,
  onOpenAddModal,
  alerts = [],
  onRefreshAlerts
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { currency } = useCurrency();
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  const titles = {
    dashboard: 'Financial Dashboard',
    transactions: 'Income & Expense Tracker',
    budgets: 'Budgets & Spending Limits',
    analytics: 'Analytics & Financial Reports',
    'ai-advisor': 'FinAI Smart Assistant',
    settings: 'Account & Preferences'
  };

  const dangerAlerts = alerts.filter(a => a.type === 'danger');
  const warningAlerts = alerts.filter(a => a.type === 'warning');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-4 md:px-8 bg-navy-950/80 backdrop-blur-md border-b border-slate-800/80">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            {titles[activeTab] || 'FinAI'}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400">
            Welcome back, <span className="text-brand-300 font-medium">{user?.full_name}</span>. Real-time ledger is synced.
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Add Transaction Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-brand-500/20 transition-all duration-150 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* Currency Tag */}
        <div className="hidden md:flex items-center px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/60 rounded-xl">
          Currency: <span className="ml-1 text-brand-300 font-bold">{currency}</span>
        </div>

        {/* Budget Alerts Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative p-2.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-colors"
            title="Budget Alerts"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full ${
                dangerAlerts.length > 0 ? 'bg-rose-500' : 'bg-amber-500'
              } animate-bounce`}>
                {alerts.length}
              </span>
            )}
          </button>

          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 p-4 rounded-2xl bg-navy-900 border border-slate-700/80 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-white">Budget Alerts ({alerts.length})</span>
                </div>
                <button
                  onClick={() => setShowAlertMenu(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-xs font-medium">All category spending is well within limits!</p>
                  </div>
                ) : (
                  alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-xs ${
                        alert.type === 'danger'
                          ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                          : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span>{alert.category}</span>
                        <span className={alert.type === 'danger' ? 'text-rose-400' : 'text-amber-400'}>
                          {alert.percent}%
                        </span>
                      </div>
                      <p className="text-slate-300">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2.5 text-slate-400 hover:text-brand-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 rounded-xl transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};
