const API_BASE = '/api';

function getHeaders() {
  const token = localStorage.getItem('finai_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/')) {
      localStorage.removeItem('finai_token');
      localStorage.removeItem('finai_user');
      window.dispatchEvent(new Event('auth-expired'));
    }
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),

  // Transactions
  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/transactions${qs ? `?${qs}` : ''}`);
  },
  createTransaction: (data) => request('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
  getMeta: () => request('/transactions/meta'),

  // Budgets
  getBudgets: (year, month) => {
    const qs = new URLSearchParams({ ...(year && { year }), ...(month && { month }) }).toString();
    return request(`/budgets${qs ? `?${qs}` : ''}`);
  },
  setBudget: (data) => request('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),
  getAlerts: () => request('/budgets/alerts'),

  // Analytics
  getOverview: (year, month) => {
    const qs = new URLSearchParams({ ...(year && { year }), ...(month && { month }) }).toString();
    return request(`/analytics/overview${qs ? `?${qs}` : ''}`);
  },
  getMonthlyTrend: (months = 6) => request(`/analytics/monthly-trend?months=${months}`),
  getCategoryBreakdown: (year, month, type = 'expense') => {
    const qs = new URLSearchParams({ ...(year && { year }), ...(month && { month }), type }).toString();
    return request(`/analytics/category-breakdown${qs ? `?${qs}` : ''}`);
  },
  getPaymentMethods: (year, month) => {
    const qs = new URLSearchParams({ ...(year && { year }), ...(month && { month }) }).toString();
    return request(`/analytics/payment-methods${qs ? `?${qs}` : ''}`);
  },
  getYearlyReport: (year) => {
    const qs = new URLSearchParams({ ...(year && { year }) }).toString();
    return request(`/analytics/report${qs ? `?${qs}` : ''}`);
  },

  // AI Assistant
  askAI: (message) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  getAIMessages: (limit = 50) => request(`/ai/messages?limit=${limit}`),
  clearAIMessages: () => request('/ai/messages', { method: 'DELETE' }),

  // User & Settings
  getProfile: () => request('/user/profile'),
  updateProfile: (data) => request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (data) => request('/user/change-password', { method: 'PUT', body: JSON.stringify(data) }),
  resetDemoData: () => request('/user/reset-demo-data', { method: 'POST' }),
};
