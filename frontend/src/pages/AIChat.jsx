import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Wallet,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

const PROMPT_SUGGESTIONS = [
  'Where did I spend the most money?',
  'How much did I save this month?',
  'Can I save ₹5,000 next month?',
  'Identify unnecessary spending',
  'Predict monthly expenses based on historical data'
];

export const AIChat = ({ initialPrompt = '' }) => {
  const { user } = useAuth();
  const { currency, formatMoney } = useCurrency();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatData();
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatData = async () => {
    try {
      const now = new Date();
      const [msgRes, ovRes] = await Promise.all([
        api.getAIMessages(50),
        api.getOverview(now.getFullYear(), now.getMonth() + 1)
      ]);

      if (msgRes.messages && msgRes.messages.length > 0) {
        setMessages(msgRes.messages);
      } else {
        // Welcome message
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `### 👋 Welcome to FinAI Assistant!\n\nI am your dedicated AI Financial Copilot. I analyze your real-time ledger entries, monitor category spending against your budgets, and provide predictive expense modeling.\n\n**[ACTUAL DATA - Verified]**\n- Your ledger is synced with current month transactions.\n- You can ask me specific questions or explore the prompt suggestions below.\n\n*Feel free to ask questions like:*\n- *"Where did I spend the most money?"*\n- *"How much did I save this month?"*\n- *"Can I save ₹5,000 next month?"*`,
            created_at: new Date().toISOString()
          }
        ]);
      }
      setOverview(ovRes);
    } catch (err) {
      console.error('Failed to load chat data:', err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await api.askAI(text);
      const assistantMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.response,
        metadata: res.metadata,
        created_at: res.timestamp || new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `⚠️ **Error:** Unable to process your query: ${err.message}. Please check backend connection.`,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your conversation history?')) return;
    try {
      await api.clearAIMessages();
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `### 🔄 History Cleared\n\nHow can I help you analyze your finances today? Try one of the suggested prompts below!`,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (err) {
      alert(err.message || 'Failed to clear history');
    }
  };

  // Helper to format assistant markdown text with glowing tags
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-2 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          // Check for headers
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-base font-bold text-white pt-2 pb-1 border-b border-slate-700/50">
                {line.replace('### ', '')}
              </h4>
            );
          }

          // Check for actual data tag
          if (line.includes('[ACTUAL DATA') || line.includes('[ACTUAL DATA - Verified]')) {
            return (
              <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 rounded-md text-xs font-extrabold text-emerald-300 bg-emerald-950/80 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{line.replace(/\*\*/g, '')}</span>
              </div>
            );
          }

          // Check for projected estimate tag
          if (line.includes('[PROJECTED ESTIMATE') || line.includes('[PROJECTED ESTIMATE - Forecast]')) {
            return (
              <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 rounded-md text-xs font-extrabold text-amber-300 bg-amber-950/80 border border-amber-500/40">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>{line.replace(/\*\*/g, '')}</span>
              </div>
            );
          }

          if (line.includes('[ACTION PLAN]')) {
            return (
              <div key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 my-1 rounded-md text-xs font-extrabold text-brand-300 bg-brand-950/80 border border-brand-500/40">
                <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
                <span>[ACTION PLAN]</span>
              </div>
            );
          }

          // Check for list items
          if (line.startsWith('- ') || line.startsWith('* ')) {
            const listText = line.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-2 shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: parseMarkdownInline(listText) }} />
              </div>
            );
          }

          // Numbered list item
          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="font-bold text-brand-400 shrink-0">{line.match(/^\d+\./)[0]}</span>
                <span dangerouslySetInnerHTML={{ __html: parseMarkdownInline(line.replace(/^\d+\.\s/, '')) }} />
              </div>
            );
          }

          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: parseMarkdownInline(line) }} />
          );
        })}
      </div>
    );
  };

  const parseMarkdownInline = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-brand-300 text-xs font-mono">$1</code>');
  };

  const curMonth = overview?.current_month;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-3xl bg-navy-900/80 backdrop-blur-md border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in duration-300">
      {/* Top Header & Live Context Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:px-6 border-b border-slate-800 bg-navy-950/70">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-lg shadow-brand-500/20">
            <Sparkles className="w-5 h-5 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-navy-950 rounded-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">FinAI Financial Copilot</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold text-brand-300 bg-brand-950/80 border border-brand-500/30 rounded-full">
                Ledger Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400">Contextual intelligence from your verified transactions</p>
          </div>
        </div>

        {/* Live Context Quick Stats */}
        <div className="flex items-center gap-2">
          {curMonth && (
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
              <span className="text-slate-400">
                Income: <strong className="text-emerald-400">{formatMoney(curMonth.income)}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                Expense: <strong className="text-rose-400">{formatMoney(curMonth.expense)}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">
                Savings: <strong className="text-white">{formatMoney(curMonth.savings)}</strong>
              </span>
            </div>
          )}

          <button
            onClick={handleClearHistory}
            title="Clear Chat History"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 mt-1 ${
                  isUser
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'bg-navy-800 border border-brand-500/30 text-brand-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 md:p-5 shadow-lg ${
                  isUser
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none font-medium text-sm'
                    : 'bg-navy-950/80 border border-slate-800 text-slate-200 rounded-tl-none w-full'
                }`}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  renderFormattedContent(msg.content)
                )}

                <div
                  className={`mt-2 text-[10px] flex items-center justify-end ${
                    isUser ? 'text-brand-200' : 'text-slate-400'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-2xl mr-auto">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-navy-800 border border-brand-500/30 text-brand-400 shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-4 rounded-2xl bg-navy-950/80 border border-slate-800 rounded-tl-none text-slate-400 text-xs flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="font-semibold text-slate-300">
                FinAI is analyzing your transaction ledger & computing projections...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 md:px-6 py-2.5 bg-navy-950/90 border-t border-slate-800/80 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand-400" /> Prompts:
          </span>
          {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(suggestion)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/70 hover:bg-brand-900/60 border border-slate-700/60 hover:border-brand-500/40 rounded-xl transition-all shrink-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 md:p-6 bg-navy-950 border-t border-slate-800 flex items-center gap-3"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask FinAI: 'Where did I spend the most?', 'Can I save ₹5,000 next month?'..."
          className="flex-1 px-4 py-3 bg-navy-900 border border-slate-700/80 rounded-2xl text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-brand-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
