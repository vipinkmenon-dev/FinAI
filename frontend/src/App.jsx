import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Analytics } from './pages/Analytics';
import { AIChat } from './pages/AIChat';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { api } from './services/api';

// Route Guard for Authenticated Users
const ProtectedLayout = ({ children, activeTitle }) => {
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetDate, setBudgetDate] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });
  const [refreshKey, setRefreshKey] = useState(0);
  const [alerts, setAlerts] = useState([]);

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
    setBudgetDate({ year, month });
    setBudgetModalOpen(true);
  };

  const handleBudgetSubmit = async (data) => {
    await api.setBudget(data);
    setRefreshKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-neutral-900">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-600">
            Initializing FinAI...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex">
      {/* Strict #000000 Pure Black Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Navbar
          title={activeTitle}
          setMobileOpen={setMobileOpen}
          onOpenAddModal={handleOpenAddTx}
          alerts={alerts}
        />

        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {React.cloneElement(children, {
            onOpenAddModal: handleOpenAddTx,
            onOpenEditModal: handleOpenEditTx,
            onOpenBudgetModal: handleOpenBudgetModal,
            refreshTrigger: refreshKey,
            onTransactionUpdated: () => setRefreshKey((k) => k + 1),
            onBudgetUpdated: () => setRefreshKey((k) => k + 1),
          })}
        </main>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={txModalOpen}
        onClose={() => setTxModalOpen(false)}
        onSubmit={handleTxSubmit}
        initialData={editingTransaction}
      />

      {/* Budget Limit Modal */}
      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        onSubmit={handleBudgetSubmit}
        currentYear={budgetDate.year}
        currentMonth={budgetDate.month}
      />
    </div>
  );
};

export function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={!loading && user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={!loading && user ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout activeTitle="Dashboard">
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedLayout activeTitle="Transactions">
            <Transactions />
          </ProtectedLayout>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedLayout activeTitle="Budgets & Limits">
            <Budgets />
          </ProtectedLayout>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedLayout activeTitle="Analytics & Reports">
            <Analytics />
          </ProtectedLayout>
        }
      />
      <Route
        path="/ai-assistant"
        element={
          <ProtectedLayout activeTitle="FinAI Assistant">
            <AIChat />
          </ProtectedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedLayout activeTitle="Account Profile">
            <Profile />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout activeTitle="Settings">
            <Settings />
          </ProtectedLayout>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
