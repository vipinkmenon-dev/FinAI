import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('finai_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('finai_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-expired', handleAuthExpired);

    if (token) {
      api.getProfile()
        .then((res) => {
          setUser(res.user);
          localStorage.setItem('finai_user', JSON.stringify(res.user));
        })
        .catch(() => {
          setUser(null);
          setToken(null);
          localStorage.removeItem('finai_token');
          localStorage.removeItem('finai_user');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem('finai_token', res.token);
    localStorage.setItem('finai_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (email, password, full_name, currency = '₹') => {
    const res = await api.register({ email, password, full_name, currency });
    localStorage.setItem('finai_token', res.token);
    localStorage.setItem('finai_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('finai_token');
    localStorage.removeItem('finai_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('finai_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
