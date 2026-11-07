import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { useCurrency } from './context/CurrencyContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Analytics } from './pages/Analytics';
import { AIChat } from './pages/AIChat';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { api } from './services/api';

export function App() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Modals
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetModalDate, setBudgetModalDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

  // Data refresh triggers
  const [refreshKey, setRefreshKey] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [initialAIPrompt, setInitialAIPrompt] = useState('');

  // Fetch alerts whenever user is authenticated or ledger updates
  useEffect(() => {
    if (user) {
      loadAlerts();
    }
  }, [user, refreshKey]);

  const loadAlerts = async () => {
    try {
      const res = await api.getAlerts();
      setAlerts(res.alerts || []);
    } catch (err) {
      console.error('Failed to load budget alerts:', err);
    }
  };

  const handleOpenAddTx = () => {
    setEditingTransaction(null);
    setTxModalOpen(true);
  };

  const handleOpenEditTx = (tx) => {
    setEditingTransaction(tx);
    setTxModalOpen(true);
  };

  const handleTxSubmit = async (txData) => {
    if (editingTransaction) {
      await api.updateTransaction(editingTransaction.id, txData);
    } else {
      await api.createTransaction(txData);
    }
    setRefreshKey((k) => k + 1);
  };

  const handleOpenBudgetModal = (year, month) => {
    setBudgetModalDate({ year, month });
    setBudgetModalOpen(true);
  };

  const handleBudgetSubmit = async (budgetData) => {
    await api.setBudget(budgetData);
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-brand-300">
            Initializing FinAI Platform...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Authentication views
  if (!user) {
    return authView === 'login' ? (
      <Login onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Navbar
          activeTab={activeTab}
          setMobileOpen={setMobileOpen}
          onOpenAddModal={handleOpenAddTx}
          alerts={alerts}
          onRefreshAlerts={loadAlerts}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              key={refreshKey}
              setActiveTab={setActiveTab}
              onOpenAddModal={handleOpenAddTx}
              setInitialAIPrompt={setInitialAIPrompt}
            />
          )}

          {activeTab === 'transactions' && (
            <Transactions
              key={refreshKey}
              onOpenAddModal={handleOpenAddTx}
              onOpenEditModal={handleOpenEditTx}
              refreshTrigger={refreshKey}
              onTransactionUpdated={() => setRefreshKey((k) => k + 1)}
            />
          )}

          {activeTab === 'budgets' && (
            <Budgets
              key={refreshKey}
              onOpenBudgetModal={handleOpenBudgetModal}
              refreshTrigger={refreshKey}
              onBudgetUpdated={() => setRefreshKey((k) => k + 1)}
            />
          )}

          {activeTab === 'analytics' && (
            <Analytics key={refreshKey} />
          )}

          {activeTab === 'ai-advisor' && (
            <AIChat initialPrompt={initialAIPrompt} />
          )}

          {activeTab === 'settings' && (
            <Settings onDataReloaded={() => setRefreshKey((k) => k + 1)} />
          )}
        </main>
      </div>

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSubmit={handleTxSubmit}
        initialData={editingTransaction}
      />

      {/* Budget Set Modal */}
      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onSubmit={handleBudgetSubmit}
        currentYear={budgetModalDate.year}
        currentMonth={budgetModalDate.month}
      />
    </div>
  );
}

export default App;
