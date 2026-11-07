import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Trash2,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { api } from '../services/api';

const PROMPT_SUGGESTIONS = [
  'Where did I spend the most money?',
  'How much did I spend this month?',
  'How much income did I receive?',
  'What are my biggest expenses?',
  'How can I save ₹5,000 next month?',
  'Am I exceeding my monthly budget?',
  'Predict my next month\'s expenses based on my history'
];

export const AIChat = () => {
  const { user } = useAuth();
  const { formatMoney, currency } = useCurrency();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    try {
      const now = new Date();
      const [msgRes, ovRes] = await Promise.all([
        api.getAIMessages(50),
        api.getOverview(now.getFullYear(), now.getMonth() + 1)
      ]);

      if (msgRes.messages && msgRes.messages.length > 0) {
        setMessages(msgRes.messages);
      } else {
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: `### 👋 Welcome to FinAI Personal Copilot\n\nI am your dedicated AI financial assistant. I analyze only your authenticated ledger records to provide spending audits, budget adherence checks, and predictive expense forecasting.\n\n*Click any prompt chip below or type your question to begin.*`,
            created_at: new Date().toISOString()
          }
        ]);
      }
      setOverview(ovRes);
    } catch (err) {
      console.error('Failed to load chat history:', err);
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
        content: `⚠️ Error: Could not process query: ${err.message}. Please check connection.`,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear conversation history?')) return;
    try {
      await api.clearAIMessages();
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `### 🔄 History Cleared\n\nHow can I assist you with your ledger today?`,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (err) {
      alert(err.message || 'Failed to clear history');
    }
  };

  const renderContent = (content) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-2 text-xs md:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-bold text-neutral-950 pt-1 pb-1 border-b border-neutral-200">
                {line.replace('### ', '')}
              </h4>
            );
          }

          if (line.includes('[ACTUAL DATA') || line.includes('[ACTUAL DATA - Verified]')) {
            return (
              <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 my-1 rounded text-[10px] font-extrabold uppercase bg-black text-white">
                <CheckCircle2 className="w-3 h-3 text-white" />
                <span>[ACTUAL DATA - Verified]</span>
              </div>
            );
          }

          if (line.includes('[PROJECTED ESTIMATE') || line.includes('[PROJECTED ESTIMATE - Forecast]')) {
            return (
              <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 my-1 rounded text-[10px] font-extrabold uppercase bg-neutral-100 text-neutral-800 border border-neutral-300">
                <AlertCircle className="w-3 h-3 text-neutral-700" />
                <span>[PROJECTED ESTIMATE - Forecast]</span>
              </div>
            );
          }

          if (line.includes('[ACTION PLAN]')) {
            return (
              <div key={idx} className="inline-flex items-center gap-1.5 px-2 py-0.5 my-1 rounded text-[10px] font-extrabold uppercase bg-neutral-800 text-white">
                <TrendingUp className="w-3 h-3 text-white" />
                <span>[ACTION PLAN]</span>
              </div>
            );
          }

          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black mt-1.5 shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: parseMarkdown(line.substring(2)) }} />
              </div>
            );
          }

          if (/^\d+\.\s/.test(line)) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="font-bold text-black shrink-0">{line.match(/^\d+\./)[0]}</span>
                <span dangerouslySetInnerHTML={{ __html: parseMarkdown(line.replace(/^\d+\.\s/, '')) }} />
              </div>
            );
          }

          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: parseMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  const parseMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-black">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-neutral-700">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 rounded bg-neutral-100 text-neutral-900 text-xs font-mono">$1</code>');
  };

  const curMonth = overview?.current_month;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] rounded-2xl bg-white border border-neutral-200 shadow-subtle overflow-hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 px-6 border-b border-neutral-200 bg-neutral-50/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-black text-white flex items-center justify-center font-bold text-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-neutral-950">FinAI Personal Assistant</h3>
              <span className="px-2 py-0.5 text-[9px] font-bold text-neutral-600 bg-neutral-200 rounded">
                Grounded Mode
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">
              Only analyzes authenticated records for <strong className="text-neutral-900">{user?.full_name}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          title="Clear Conversation"
          className="p-1.5 text-neutral-500 hover:text-black rounded-lg hover:bg-neutral-200 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold ${
                  isUser ? 'bg-black text-white' : 'bg-neutral-100 border border-neutral-300 text-neutral-900'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-xl shadow-subtle ${
                  isUser
                    ? 'bg-black text-white text-xs md:text-sm'
                    : 'bg-white border border-neutral-200 text-neutral-900'
                }`}
              >
                {isUser ? <p className="whitespace-pre-wrap">{msg.content}</p> : renderContent(msg.content)}
                <div
                  className={`mt-1.5 text-[9px] text-right ${
                    isUser ? 'text-neutral-400' : 'text-neutral-400'
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-7 h-7 rounded-lg bg-neutral-100 border border-neutral-300 text-neutral-900 shrink-0 flex items-center justify-center">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-neutral-200 text-xs text-neutral-500 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <span>Analyzing ledger & computing actual metrics...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="p-3 px-6 bg-neutral-50 border-t border-neutral-200 overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(suggestion)}
              className="px-2.5 py-1 text-xs font-medium text-neutral-700 hover:text-black bg-white hover:bg-neutral-100 border border-neutral-300 rounded-md transition-all shrink-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-4 px-6 bg-white border-t border-neutral-200 flex items-center gap-3"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask FinAI: 'Where did I spend the most?', 'Can I save ₹5,000 next month?'..."
          className="flex-1 px-4 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs md:text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="px-4 py-2.5 text-xs font-bold bg-black text-white rounded-lg hover:bg-neutral-800 transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
