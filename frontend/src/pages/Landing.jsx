import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Bot,
  PieChart,
  Target,
  Lock,
  Zap,
  CheckCircle,
  TrendingUp,
  BarChart3
} from 'lucide-react';

export const Landing = () => {
  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-900 selection:text-white flex flex-col">
      {/* Public Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-black text-white flex items-center justify-center font-black text-lg tracking-wider">
              F
            </div>
            <span className="font-extrabold text-xl tracking-tight text-neutral-900">
              FinAI
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <a href="#features" className="hover:text-black transition-colors">Features</a>
            <a href="#ai-assistant" className="hover:text-black transition-colors">AI Advisor</a>
            <a href="#security" className="hover:text-black transition-colors">Security</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-xs md:text-sm font-semibold text-neutral-700 hover:text-black transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2.5 text-xs md:text-sm font-bold bg-black text-white rounded-lg hover:bg-neutral-800 transition-all shadow-subtle flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="pt-20 pb-24 px-6 border-b border-neutral-200 bg-neutral-50/50">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-300 bg-white text-xs font-semibold text-neutral-700">
              <span className="w-2 h-2 rounded-full bg-black" />
              <span>Next-Generation Personal Finance Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-neutral-950 leading-[1.08]">
              Take Control of Your Money.
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
              An intelligent, privacy-focused personal finance copilot. Track your income, manage category budgets, and let grounded AI deliver personalized saving strategies.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/register"
                className="w-full sm:w-auto px-7 py-3.5 text-sm font-bold bg-black text-white rounded-xl hover:bg-neutral-800 transition-all shadow-card flex items-center justify-center gap-2"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-7 py-3.5 text-sm font-semibold bg-white text-neutral-900 border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-all"
              >
                Sign In to Ledger
              </Link>
            </div>

            <div className="pt-8 flex items-center justify-center gap-6 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-black" /> Complete Data Isolation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-black" /> Zero Cold-Start Demo Records
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-black" /> Bank-Grade Encryption
              </span>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
              Architecture & Features
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 tracking-tight">
              Built for Absolute Precision
            </h3>
            <p className="text-sm text-neutral-600 mt-3">
              Every feature is engineered to provide full transparency, strict user isolation, and actionable financial control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 transition-all shadow-subtle flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 mb-6">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-neutral-950 mb-2">Ledger & Transaction Engine</h4>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Fast, real-time logging for income and expenses across essential and discretionary categories. Filter by date, payment method, and export to CSV anytime.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-500">
                INR (₹) Standard Ledger
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-8 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 transition-all shadow-subtle flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 mb-6">
                  <Target className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-neutral-950 mb-2">Proactive Budget Guardian</h4>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Establish monthly category caps. FinAI calculates spending velocity in real time and alerts you before you reach dangerous spending thresholds.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-500">
                Real-Time Overage Alerts
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-8 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-400 transition-all shadow-subtle flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-900 mb-6">
                  <Bot className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-neutral-950 mb-2">Grounded AI Copilot</h4>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Ask natural language questions about your actual numbers. FinAI strictly grounds its reasoning in your verified transactions without fabricating data.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 text-xs font-semibold text-neutral-500">
                Strict Fact vs Estimate Labeling
              </div>
            </div>
          </div>
        </section>

        {/* AI Showcase Section */}
        <section id="ai-assistant" className="py-20 px-6 bg-neutral-100 border-y border-neutral-200">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                AI Financial Assistant
              </span>
              <h3 className="text-3xl md:text-4xl font-extrabold text-neutral-950 tracking-tight">
                An Advisor Grounded in Your True Numbers.
              </h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Generic advice is useless without context. FinAI analyzes your actual spending rate, discretionary habits, and cash reserves to answer questions directly:
              </p>
              <ul className="space-y-2 text-xs font-medium text-neutral-700 pt-2">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  "Where did I spend the most money this month?"
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  "Can I realistically save ₹5,000 next month?"
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black" />
                  "Predict my next month's burn rate based on history."
                </li>
              </ul>
            </div>

            {/* Chat Simulation Preview Card */}
            <div className="p-6 rounded-2xl bg-white border border-neutral-300 shadow-card space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="font-bold text-neutral-900">finai-advisor --session</span>
                <span className="px-2 py-0.5 rounded bg-neutral-100 text-[10px] text-neutral-600">Grounded Mode</span>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-800">
                &gt; "Can I save ₹5,000 next month?"
              </div>
              <div className="p-3.5 rounded-lg bg-neutral-900 text-white leading-relaxed space-y-1.5">
                <div className="inline-block px-1.5 py-0.5 rounded bg-white text-black font-bold text-[10px]">
                  [ACTUAL DATA - Verified]
                </div>
                <p>Current Net Savings: ₹4,000.00</p>
                <p>Discretionary Spending: ₹1,500.00 (Dining, Entertainment)</p>
                <div className="inline-block px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-200 font-bold text-[10px] mt-2">
                  [ACTION PLAN]
                </div>
                <p>Yes! Trimming 67% of discretionary spend will achieve your ₹5,000 reserve goal.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Security / Multi-User Isolation Section */}
        <section id="security" className="py-20 px-6 max-w-4xl mx-auto text-center space-y-6">
          <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-3xl font-extrabold text-neutral-950 tracking-tight">
            Independent, Private Accounts.
          </h3>
          <p className="text-sm text-neutral-600 max-w-xl mx-auto leading-relaxed">
            Every user receives an isolated personal environment. Server-side session verification ensures your transactions, budgets, and chat history are accessible only to you.
          </p>
          <div className="pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold bg-black text-white rounded-xl hover:bg-neutral-800 transition-all"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-10 px-6 bg-white text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-neutral-900 text-sm">FinAI</span>
            <span>— Smart Personal Finance Management Platform</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} FinAI. Production-ready, privacy-first personal finance.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
