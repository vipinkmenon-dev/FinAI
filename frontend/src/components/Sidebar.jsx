import React from 'react';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  BarChart3,
  Sparkles,
  Settings,
  LogOut,
  X,
  CreditCard,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets & Limits', icon: PiggyBank },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { id: 'ai-advisor', label: 'FinAI Assistant', icon: Sparkles, badge: 'AI' },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const { currency } = useCurrency();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-72 bg-navy-900 border-r border-slate-800/80 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-lg shadow-brand-500/25">
              <Sparkles className="w-6 h-6 text-white" />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-navy-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white">FinAI</span>
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold tracking-wider text-brand-300 bg-brand-900/60 border border-brand-500/30 rounded">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">Smart Finance Copilot</p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Core Modules
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`relative flex items-center justify-between w-full px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600/20 to-indigo-600/10 text-brand-300 border border-brand-500/30 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-brand-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-brand-500 to-purple-600 rounded-full shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}

                {isActive && (
                  <span className="absolute left-0 w-1 h-6 bg-brand-500 rounded-r-full -translate-y-1/2 top-1/2" />
                )}
              </button>
            );
          })}
        </nav>

        {/* AI Quick Callout Card */}
        <div className="p-4 mx-4 mb-4 rounded-2xl bg-gradient-to-br from-brand-900/40 via-indigo-950/40 to-navy-850 border border-brand-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-brand-300">Live AI Assistant</span>
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Ask about spending habits, savings forecasts & budget checks in real-time.
          </p>
          <button
            onClick={() => {
              setActiveTab('ai-advisor');
              setMobileOpen(false);
            }}
            className="w-full py-2 text-xs font-semibold text-center text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-colors shadow-md shadow-brand-600/30"
          >
            Open FinAI Chat
          </button>
        </div>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-navy-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center justify-center w-10 h-10 font-bold text-white rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-700">
                {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user?.full_name || 'FinAI Member'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'user@finai.io'}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
