import React, { useState } from 'react';
import {
  Menu,
  Plus,
  Bell,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

export const Navbar = ({
  title = 'Dashboard',
  setMobileOpen,
  onOpenAddModal,
  alerts = []
}) => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-20 px-6 md:px-8 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-neutral-600 hover:text-black rounded-lg hover:bg-neutral-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-neutral-950">
            {title}
          </h1>
          <p className="hidden sm:block text-xs text-neutral-500">
            Authenticated personal ledger for <strong className="text-neutral-900 font-semibold">{user?.full_name}</strong>
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Add Transaction Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-3.5 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-bold text-white bg-black hover:bg-neutral-800 rounded-lg shadow-subtle transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>

        {/* Currency Tag */}
        <div className="hidden md:flex items-center px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 border border-neutral-200 rounded-lg">
          Currency: <span className="ml-1 text-black font-bold">{currency}</span>
        </div>

        {/* Budget Alerts Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAlertMenu(!showAlertMenu)}
            className="relative p-2.5 text-neutral-600 hover:text-black bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors"
            title="Budget Alerts"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white bg-black rounded-full">
                {alerts.length}
              </span>
            )}
          </button>

          {showAlertMenu && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 p-4 rounded-xl bg-white border border-neutral-200 shadow-modal z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Budget Notifications ({alerts.length})
                </span>
                <button
                  onClick={() => setShowAlertMenu(false)}
                  className="text-neutral-400 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2 max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center text-neutral-500">
                    <CheckCircle2 className="w-7 h-7 text-black mb-1.5" />
                    <p className="text-xs font-medium">All category spending is well within limits.</p>
                  </div>
                ) : (
                  alerts.map((alert, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-neutral-900">
                        <span>{alert.category}</span>
                        <span className="text-black font-extrabold">{alert.percent}%</span>
                      </div>
                      <p className="text-neutral-600 text-[11px] leading-relaxed">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
